import { createClient } from '@supabase/supabase-js'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '')
let rawKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim()

// Auto-correct truncated publishable keys (e.g. "b_publishable_..." -> "sb_publishable_...")
if (rawKey.startsWith('b_publishable_')) {
  rawKey = 's' + rawKey
}

const supabaseUrl = rawUrl || 'https://placeholder-assessment-platform.supabase.co'
const supabasePublishableKey = rawKey || 'placeholder-anon-key'

export const isSupabaseConfigured = Boolean(
  rawUrl && rawKey && rawKey !== 'placeholder-anon-key'
)

if (!isSupabaseConfigured) {
  console.warn(
    'Notice: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are not configured in environment. The platform will operate in demo/preview mode.'
  )
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
