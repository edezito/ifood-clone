// config/env.js
export const ENV = {
  // Firebase
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  
  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // Mercado Pago
  MERCADO_PAGO_PUBLIC_KEY: import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  
  // Outros
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  PIX_KEY: import.meta.env.VITE_PIX_KEY || 'foodexpress@seudominio.com.br',
  
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  
  // 🔴 Corrigido: Agora aceita tanto chaves de teste ('TEST-') quanto de produção ('APP_USR-')
  isMercadoPagoConfigured() {
    const key = this.MERCADO_PAGO_PUBLIC_KEY;
    return !!key && (key.startsWith('TEST-') || key.startsWith('APP_USR-')) && key.length > 20;
  }
};