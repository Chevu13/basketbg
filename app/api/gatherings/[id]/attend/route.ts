import { createRouteClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Ista pretpostavka trajanja igre kao u UI-ju (GatheringCard): fiksno 2h.
const GATHERING_DURATION_MS = 2 * 60 * 60 * 1000

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status = 'dolazim' } = await request.json().catch(() => ({}))

  // Provera preklapanja termina — samo za status "dolazim".
  // "Možda" i dalje može na više igara istovremeno.
  if (status === 'dolazim') {
    const { data: target } = await supabase
      .from('gatherings')
      .select('gathering_time')
      .eq('id', params.id)
      .single()

    if (target) {
      const targetStart = new Date(target.gathering_time).getTime()
      const targetEnd = targetStart + GATHERING_DURATION_MS

      const { data: myOtherConfirmed } = await supabase
        .from('gathering_attendees')
        .select('gathering_id, gathering:gatherings(id, title, gathering_time, court:courts(name))')
        .eq('user_id', session.user.id)
        .eq('status', 'dolazim')
        .neq('gathering_id', params.id)

      const conflict = (myOtherConfirmed ?? []).find((row: any) => {
        const g = row.gathering
        if (!g) return false
        const otherStart = new Date(g.gathering_time).getTime()
        const otherEnd = otherStart + GATHERING_DURATION_MS
        return targetStart < otherEnd && otherStart < targetEnd
      })

      if (conflict) {
        const g = (conflict as any).gathering
        const time = new Date(g.gathering_time).toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' })
        return NextResponse.json(
          { error: `Već ideš na "${g.title}" (${g.court?.name ?? 'teren'}, ${time}) u ovom terminu. Otkaži tu igru prvo ako želiš da promeniš.` },
          { status: 409 }
        )
      }
    }
  }

  const { data, error } = await supabase
    .from('gathering_attendees')
    .upsert({ gathering_id: params.id, user_id: session.user.id, status }, { onConflict: 'gathering_id,user_id' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (status === 'dolazim') await supabase.rpc('increment_arrivals', { uid: session.user.id })
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('gathering_attendees')
    .delete()
    .eq('gathering_id', params.id)
    .eq('user_id', session.user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
