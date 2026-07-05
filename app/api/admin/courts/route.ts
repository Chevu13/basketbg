import { createRouteClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function requireAdmin(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
  return data?.is_admin ? session : null
}

export async function POST(request: NextRequest) {
  const supabase = createRouteClient()
  const session = await requireAdmin(supabase)
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  if (!body.name || !body.address || body.lat === undefined || body.lng === undefined || Number.isNaN(body.lat) || Number.isNaN(body.lng))
    return NextResponse.json({ error: 'Nedostaju ili su nevalidna polja (naziv, adresa, koordinate)' }, { status: 400 })

  const { data, error } = await supabase.from('courts').insert({ ...body, is_approved: true }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = createRouteClient()
  const session = await requireAdmin(supabase)
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  const { error } = await supabase.from('courts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
