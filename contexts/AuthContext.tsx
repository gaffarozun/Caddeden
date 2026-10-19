// Powered by OnSpace.AI
import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getSupabaseClient } from '@/template';
import {
  AuthProfile,
  RegisterMeta,
  fetchProfile,
  sendEmailOtp,
  signInWithPassword,
  signOut as svcSignOut,
  verifyOtpAndRegister,
} from '@/services/authService';

export interface AuthContextType {
  authUser: AuthProfile | null;
  loading: boolean;
  operationLoading: boolean;
  isAdmin: boolean;
  isBusiness: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  sendOtp: (email: string) => Promise<{ error: string | null }>;
  registerWithOtp: (
    email: string,
    otp: string,
    password: string,
    meta: RegisterMeta
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = getSupabaseClient();
  const [authUser, setAuthUser] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);

  const load = useCallback(async (userId: string, email: string) => {
    const profile = await fetchProfile(userId, email);
    setAuthUser(profile);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await client.auth.getSession();
        if (!mounted) return;
        if (data.session?.user) {
          await load(data.session.user.id, data.session.user.email ?? '');
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = client.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await load(session.user.id, session.user.email ?? '');
      } else {
        setAuthUser(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [client, load]);

  const signIn = useCallback(async (email: string, password: string) => {
    setOperationLoading(true);
    const r = await signInWithPassword(email, password);
    setOperationLoading(false);
    return r;
  }, []);

  const sendOtp = useCallback(async (email: string) => {
    setOperationLoading(true);
    const r = await sendEmailOtp(email);
    setOperationLoading(false);
    return r;
  }, []);

  const registerWithOtp = useCallback(
    async (email: string, otp: string, password: string, meta: RegisterMeta) => {
      setOperationLoading(true);
      const r = await verifyOtpAndRegister(email, otp, password, meta);
      setOperationLoading(false);
      return r;
    },
    []
  );

  const signOut = useCallback(async () => {
    await svcSignOut();
    setAuthUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await client.auth.getSession();
    if (data.session?.user) {
      await load(data.session.user.id, data.session.user.email ?? '');
    }
  }, [client, load]);

  const value = useMemo<AuthContextType>(
    () => ({
      authUser,
      loading,
      operationLoading,
      isAdmin: authUser?.role === 'admin',
      isBusiness: authUser?.role === 'business',
      signIn,
      sendOtp,
      registerWithOtp,
      signOut,
      refreshProfile,
    }),
    [authUser, loading, operationLoading, signIn, sendOtp, registerWithOtp, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
