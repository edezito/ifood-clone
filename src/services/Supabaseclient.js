// ============================================================
// SERVICE: supabaseClient
// Responsabilidade: instância única do cliente Supabase
// ============================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zusjxzywbcaezqqmoyfq.supabase.co';
const supabaseAnonKey = 'sb_publishable_nhTVhyXWdVFiiJAH3S07Gw_R-JfYPBF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);