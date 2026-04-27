// config/env.js
export const ENV = {
  // Firebase (NÃO PRECISA no frontend, mas mantemos para referência)
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  
  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // Mercado Pago (quando tiver a chave real)
  MERCADO_PAGO_PUBLIC_KEY: import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  
  // API Backend (quando tiver)
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  
  // PIX
  PIX_KEY: import.meta.env.VITE_PIX_KEY || 'foodexpress@seudominio.com.br',
  
  // Ambiente
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  
  // Helper para verificar se Mercado Pago está configurado
  isMercadoPagoConfigured() {
    return this.MERCADO_PAGO_PUBLIC_KEY && 
           !this.MERCADO_PAGO_PUBLIC_KEY.includes('sua-chave') &&
           !this.MERCADO_PAGO_PUBLIC_KEY.includes('TEST-xxxx');
  }
};