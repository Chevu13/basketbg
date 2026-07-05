import { createRouteClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: gathering } = await supabase
    .from('gatherings')
    .select('created_by, gathering_time, court_id')
    .eq('id', params.id)
    .single()

  if (!gathering) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (gathering.created_by !== session.user.id)
    return NextResponse.json({ error: 'Samo organizator može označiti no-show' }, { status: 403 })
  if (new Date(gathering.gathering_time) > new Date())
    return NextResponse.json({ error: 'Igra još nije završena' }, { status: 400 })

  const { user_ids }: { user_ids: string[] } = await request.json()
  if (!user_ids?.length) return NextResponse.json({ error: 'No users' }, { status: 400 })

  for (const uid of user_ids) {
    await supabase.from('gathering_attendees')
      .update({ status: 'no_show' })
      .eq('gathering_id', params.id).eq('user_id', uid)
    await supabase.rpc('penalize_no_show', { uid })
    await supabase.from('notifications').insert({
      user_id: uid, type: 'no_show',
      title: 'Zabeležen no-show',
      body: 'Nisi se pojavio na igri. Reputacija -15.',
      related_gathering_id: params.id,
      related_court_id: gathering.court_id, // FIX: was missing, made notification link dead-end
    })
  }

  return NextResponse.json({ success: true, marked: user_ids.length })
}
