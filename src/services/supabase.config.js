
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://sdrkqhqcmgzkxrorkjef.supabase.co'
const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcmtxaHFjbWd6a3hyb3JramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNTAwMjEsImV4cCI6MjA2MDkyNjAyMX0.BXm0rr62EtRaexc8-Av-xXIELxkFj_Ljb_ggGV-QRME'
export const supabase = createClient(supabaseUrl, SUPABASE_KEY)

