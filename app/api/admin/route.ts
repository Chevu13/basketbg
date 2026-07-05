import { createRouteClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function requireAdmin(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
  return data?.is_admin ? session : null
}

export async function GET(request: NextRequest) {
  const supabase = createRouteClient()
  const session = await requireAdmin(supabase)
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [
    { data: users },
    { data: courts },
    { data: gatherings },
    { data: suggestions },
  ] = await Promise.all([
    supabase.from('profiles').select('*, reputation:user_reputation(*)').order('created_at', { ascending: false }).limit(100),
    supabase.from('courts').select('*').order('created_at', { ascending: false }),
    supabase.from('gatherings').select('*, creator:profiles!created_by(username), court:courts(name)').order('created_at', { ascending: false }).limit(50),
    supabase.from('court_suggestions').select('*, profile:profiles(username)').order('created_at', { ascending: false }),
  ])

  return NextResponse.json({ users, courts, gatherings, suggestions })
}
