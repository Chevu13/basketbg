import { createRouteClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, address, lat, lng, description, is_outdoor, surface } = body

  if (!name || !address || !lat || !lng)
    return NextResponse.json({ error: 'Nedostaju polja' }, { status: 400 })

  const { data, error } = await supabase
    .from('court_suggestions')
    .insert({
      name, address, lat, lng, description,
      is_outdoor: is_outdoor ?? true,
      surface: surface ?? 'asfalt',
      submitted_by: session.user.id,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}
