import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder_service_key'

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)
