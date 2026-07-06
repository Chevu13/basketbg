import { createRouteClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = createRouteClient()
  const { searchParams } = new URL(request.url)
  const courtId = searchParams.get('court_id')
  const today = searchParams.get('today')

  let query = supabase
    .from('gatherings')
    .select(`
      *,
      creator:profiles!created_by(id, username, full_name, avatar_url),
      court:courts(id, name, address, lat, lng, image_url, is_outdoor),
      attendees:gathering_attendees(id, user_id, status,
        profile:profiles(id, username, avatar_url)
      )
    `)
    .eq('is_active', true)
    .order('gathering_time', { ascending: true })

  if (courtId) query = query.eq('court_id', courtId)

  if (today === '1') {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const end = new Date(); end.setHours(23, 59, 59, 999)
    query = query.gte('gathering_time', start.toISOString()).lte('gathering_time', end.toISOString())
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const enriched = (data ?? []).map((g: any) => ({
    ...g,
    attendees_count: g.attendees?.filter((a: any) => a.status === 'dolazim').length ?? 0,
  }))

  return NextResponse.json({ data: enriched })
}

export async function POST(request: NextRequest) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { court_id, title, description, gathering_time, max_players, game_type, level } = body

  if (!court_id || !title || !gathering_time)
    return NextResponse.json({ error: 'Nedostaju polja' }, { status: 400 })

  if (new Date(gathering_time) < new Date(Date.now() - 5 * 60 * 1000))
    return NextResponse.json({ error: 'Vreme okupljanja je već prošlo' }, { status: 400 })

  // Kreator se automatski prijavljuje kao "dolazim" na svoju igru — proveri preklapanje
  // sa drugim igrama na koje je već potvrdio dolazak (isti fiksni 2h prozor kao u UI-ju).
  const GATHERING_DURATION_MS = 2 * 60 * 60 * 1000
  const newStart = new Date(gathering_time).getTime()
  const newEnd = newStart + GATHERING_DURATION_MS

  const { data: myConfirmed } = await supabase
    .from('gathering_attendees')
    .select('gathering:gatherings(id, title, gathering_time, court:courts(name))')
    .eq('user_id', session.user.id)
    .eq('status', 'dolazim')

  const conflict = (myConfirmed ?? []).find((row: any) => {
    const g = row.gathering
    if (!g) return false
    const otherStart = new Date(g.gathering_time).getTime()
    const otherEnd = otherStart + GATHERING_DURATION_MS
    return newStart < otherEnd && otherStart < newEnd
  })

  if (conflict) {
    const g = (conflict as any).gathering
    const time = new Date(g.gathering_time).toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' })
    return NextResponse.json(
      { error: `Već ideš na "${g.title}" (${g.court?.name ?? 'teren'}, ${time}) u ovom terminu. Otkaži tu igru prvo ako želiš da zakažeš ovu.` },
      { status: 409 }
    )
  }

  const { data: gathering, error } = await supabase
    .from('gatherings')
    .insert({
      court_id, title, description,
      gathering_time, max_players, game_type, level,
      created_by: session.user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await supabase.from('gathering_attendees').insert({
    gathering_id: gathering.id,
    user_id: session.user.id,
    status: 'dolazim',
  })

  await supabase.rpc('increment_gatherings_created', { uid: session.user.id })
  await supabase.rpc('increment_arrivals', { uid: session.user.id })

  return NextResponse.json({ data: gathering }, { status: 201 })
}
