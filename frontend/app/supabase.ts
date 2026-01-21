import { createClient } from '@supabase/supabase-js';

// REPLACE THESE WITH YOUR ACTUAL KEYS FROM SUPABASE DASHBOARD
const supabaseUrl = 'https://ulupkirxyozzdqwdykxu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsdXBraXJ4eW96emRxd2R5a3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTUzMjMsImV4cCI6MjA4NDE3MTMyM30.ssyFFYJw5x_Fr8auv5CgIFNDZlGbrp6aULOYYKnz8_4E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);