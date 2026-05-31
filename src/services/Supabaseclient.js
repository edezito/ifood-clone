import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/env'; // Verifique se o caminho está correto

// Validação de segurança para te ajudar no console se algo sumir
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.error(
    "🚨 Erro: SUPABASE_URL ou SUPABASE_ANON_KEY não definidos no arquivo .env ou no ENV.js"
  );
}

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);