// Powered by OnSpace.AI
import React, { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getSupabaseClient, useAlert } from '@/template';
import { AuthProfile, RegisterMeta, fetchProfile, sendEmailOtp, signInWithPassword, signOut as svcSignOut, verifyOtpAndRegister } from '@/services/authService';
export interface AuthContextType {
  authUser: AuthProfile | null; loading: boolean; operationLoading: boolean; profileError: string;
  isAdmin: boolean; isBusiness: boolean;
  signIn: (email: string, password: string, account?: 'user' | 'business') => Promise<{ error: string | null }>;
  sendOtp: (email: string, meta?: RegisterMeta) => Promise<{ error: string | null }>;
  registerWithOtp: (email: string, otp: string, password: string, meta: RegisterMeta) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>; refreshProfile: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const client = getSupabaseClient(); const { showAlert } = useAlert();
  const [authUser, setAuthUser] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true); const [operationLoading, setOperationLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const epoch = useRef(0); const alive = useRef(true); const operation = useRef(false);
  const refreshProfile = useCallback(async () => {
    const version = ++epoch.current;
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      const session = data.session;
      const profile = session?.user ? await fetchProfile(session.user.id, session.user.email ?? '') : null;
      if (alive.current && version === epoch.current) { setAuthUser(profile); setProfileError(''); }
    } catch (reason) {
      if (alive.current && version === epoch.current) { setAuthUser(null); setProfileError(reason instanceof Error ? reason.message : 'Hesap doğrulanamadı.'); }
    } finally { if (alive.current && version === epoch.current) setLoading(false); }
  }, [client]);
  useEffect(() => {
    alive.current = true; void refreshProfile();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    // Never await database calls inside the auth callback (avoids Supabase lock deadlocks).
    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) { epoch.current += 1; setAuthUser(null); setProfileError(''); setLoading(false); return; }
      const timer = setTimeout(() => { timers.delete(timer); if (!operation.current && alive.current) void refreshProfile(); }, 0);
      timers.add(timer);
    });
    const timer = setInterval(() => { if (!operation.current && AppState.currentState === 'active') void refreshProfile(); }, 30000);
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') { client.auth.startAutoRefresh(); if (!operation.current) void refreshProfile(); }
      else client.auth.stopAutoRefresh();
    });
    client.auth.startAutoRefresh();
    return () => { alive.current = false; epoch.current += 1; sub.subscription.unsubscribe(); clearInterval(timer); timers.forEach(clearTimeout); appState.remove(); client.auth.stopAutoRefresh(); };
  }, [client, refreshProfile]);
  const run = useCallback(async (task: () => Promise<{ error: string | null }>, refresh: boolean) => {
    if (operation.current) return { error: 'İşlem devam ediyor.' };
    operation.current = true; setOperationLoading(true);
    try { const result = await task(); if (refresh) await refreshProfile(); return result; }
    catch (reason) { if (refresh) await refreshProfile(); return { error: reason instanceof Error ? reason.message : 'Giriş işlemi tamamlanamadı.' }; }
    finally { operation.current = false; if (alive.current) setOperationLoading(false); }
  }, [refreshProfile]);
  const signIn = useCallback((email: string, password: string, account?: 'user' | 'business') => run(() => signInWithPassword(email, password, account), true), [run]);
  const sendOtp = useCallback((email: string, meta?: RegisterMeta) => run(() => sendEmailOtp(email, meta), false), [run]);
  const registerWithOtp = useCallback((email: string, otp: string, password: string, meta: RegisterMeta) => run(() => verifyOtpAndRegister(email, otp, password, meta), true), [run]);
  const signOut = useCallback(async () => {
    try { await svcSignOut(); epoch.current += 1; setAuthUser(null); setProfileError(''); }
    catch (reason) { showAlert('Çıkış yapılamadı', reason instanceof Error ? reason.message : 'Tekrar deneyin.'); }
  }, [showAlert]);
  const value = useMemo<AuthContextType>(() => ({ authUser, loading, operationLoading, profileError, isAdmin: authUser?.role === 'admin', isBusiness: authUser?.role === 'business', signIn, sendOtp, registerWithOtp, signOut, refreshProfile }), [authUser, loading, operationLoading, profileError, signIn, sendOtp, registerWithOtp, signOut, refreshProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
