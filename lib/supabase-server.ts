import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Server Components only
export const createServerClient = () =>
  createServerComponentClient({ cookies })

// Route Handlers only
export const createRouteClient = () =>
  createRouteHandlerClient({ cookies })
