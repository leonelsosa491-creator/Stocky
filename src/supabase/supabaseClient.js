import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nmqcmybqevigvvsgybed.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcWNteWJxZXZpZ3Z2c2d5YmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNjk1NDMsImV4cCI6MjEwNjY0NTU0M30.PKI5aDx-lGk-nZE9eGaAY6SFgPRXQYaksEUI7y6JA3M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)