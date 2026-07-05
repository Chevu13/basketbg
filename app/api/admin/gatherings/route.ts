import { createRouteClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function requireAdmin(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
  return data?.is_admin ? session : null
}

export async function DELETE(request: NextRequest) {
  const supabase = createRouteClient()
  const session = await requireAdmin(supabase)
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Nedostaje id' }, { status: 400 })

  const { error } = await supabase.from('gatherings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
