import { createRouteClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status = 'dolazim' } = await request.json().catch(() => ({}))

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
