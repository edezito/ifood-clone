// ============================================================
// MODEL: Auth
// Responsabilidade: autenticação via Supabase (OTP) e Firebase
// ============================================================
import { supabase } from '../services/Supabaseclient';
import { auth, googleProvider } from '../services/Firebaseclient';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

export const AuthModel = {
  // ---- Firebase (Admin) ----
  async loginComEmail(email, senha) {
    const { user } = await signInWithEmailAndPassword(auth, email, senha);
    return user;
  },

  async cadastrarComEmail(email, senha) {
    const { user } = await createUserWithEmailAndPassword(auth, email, senha);
    return user;
  },

  async loginComGoogle() {
    const { user } = await signInWithPopup(auth, googleProvider);
    return user;
  },

  async logout() {
    await signOut(auth);
  },

  // ---- Supabase OTP (Cliente) ----
  async enviarOtpEmail(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  },

  async enviarOtpSms(telefone) {
    const { error } = await supabase.auth.signInWithOtp({
      phone: telefone,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  },

  async verificarOtpEmail(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'magiclink',
    });
    if (error) throw error;
    return data;
  },

  async verificarOtpSms(telefone, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: telefone,
      token,
      type: 'sms',
    });
    if (error) throw error;
    return data;
  },

  async obterSessao() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
};