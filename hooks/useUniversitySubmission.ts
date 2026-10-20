import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useAccountAccess } from '@/hooks/useAccountAccess';
import { useUniversity } from '@/hooks/useUniversity';
import { fetchOwnUniversityMessages, normalizeUniversityText, submitUniversityMessage, UniversityMessage } from '@/services/universityService';

export function useUniversitySubmission() {
  const { authUser, loading: authLoading, operationLoading } = useAuth();
  const { customer } = useAccountAccess();
  const { revision, invalidate } = useUniversity();
  const router = useRouter();
  const [text, setText] = useState('');
  const [items, setItems] = useState<UniversityMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const mounted = useRef(true);
  const submitting = useRef(false);
  const version = useRef(0);
  const userId = authUser?.id;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; version.current += 1; }; }, []);
  const load = useCallback(async (isRefresh = false) => {
    const current = ++version.current;
    if (!userId) { setItems([]); setLoading(false); return; }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const result = await fetchOwnUniversityMessages(userId);
      if (mounted.current && current === version.current) { setItems(result); setError(''); }
    } catch (reason) { if (mounted.current && current === version.current) setError(reason instanceof Error ? reason.message : 'İstekler yüklenemedi.'); }
    finally { if (mounted.current && current === version.current) { setLoading(false); setRefreshing(false); } }
  }, [userId]);
  useFocusEffect(useCallback(() => { void load(); return () => { version.current += 1; }; }, [load, revision]));
  useEffect(() => { setText(''); setItems([]); setSuccess(false); setError(''); }, [userId]);
  const changeText = useCallback((value: string) => { setText(value); setSuccess(false); setError(''); }, []);
  const submit = useCallback(async () => {
    if (submitting.current || !customer || operationLoading) return;
    submitting.current = true; setBusy(true); setError(''); setSuccess(false);
    try {
      await submitUniversityMessage(text);
      if (!mounted.current) { invalidate(); return; }
      setText(''); setSuccess(true); invalidate();
    } catch (reason) { if (mounted.current) setError(reason instanceof Error ? reason.message : 'Yazı gönderilemedi.'); }
    finally { submitting.current = false; if (mounted.current) setBusy(false); }
  }, [customer, operationLoading, text, invalidate]);
  const refresh = useCallback(() => load(true), [load]);
  const login = useCallback(() => router.push('/auth'), [router]);
  const count = Array.from(normalizeUniversityText(text)).length;
  return { text, changeText, items, loading, refreshing, busy, error, success, submit, refresh, login,
    customer, guest: !authUser, authLoading, operationLoading, valid: count >= 4 && count <= 160, count };
}
