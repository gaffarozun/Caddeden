import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useUniversity } from '@/hooks/useUniversity';
import { fetchAdminUniversityMessages, moderateUniversityMessage, UniversityAdminMessage, UniversityMessageStatus } from '@/services/universityService';

export function useUniversityAdmin() {
  const { invalidate } = useUniversity();
  const [status, setStatus] = useState<UniversityMessageStatus>('pending');
  const [items, setItems] = useState<UniversityAdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<UniversityAdminMessage | null>(null);
  const [reason, setReason] = useState('');
  const lock = useRef(false);
  const mounted = useRef(true);
  const sequence = useRef(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; sequence.current += 1; }; }, []);
  const load = useCallback(async (isRefresh = false) => {
    const request = ++sequence.current;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const rows = await fetchAdminUniversityMessages(status);
      if (mounted.current && request === sequence.current) { setItems(rows); setError(''); }
    } catch (reason) { if (mounted.current && request === sequence.current) setError(reason instanceof Error ? reason.message : 'Yazılar yüklenemedi.'); }
    finally { if (mounted.current && request === sequence.current) { setLoading(false); setRefreshing(false); } }
  }, [status]);
  useFocusEffect(useCallback(() => { void load(); return () => { sequence.current += 1; }; }, [load]));
  const changeStatus = useCallback((value: UniversityMessageStatus) => {
    if (lock.current) return;
    sequence.current += 1; setStatus(value); setItems([]); setSelected(null); setReason(''); setError('');
  }, []);
  const decide = useCallback(async (item: UniversityAdminMessage, decision: 'approved' | 'rejected', explanation = '') => {
    if (lock.current) return;
    lock.current = true; setBusyId(item.id); setError('');
    try {
      await moderateUniversityMessage(item, decision, explanation);
      invalidate();
      if (!mounted.current) return;
      setSelected(null); setReason('');
      setItems(previous => previous.filter(value => value.id !== item.id));
    } catch (reason) { if (mounted.current) setError(reason instanceof Error ? reason.message : 'Karar kaydedilemedi. Listeyi yenileyin.'); }
    finally { lock.current = false; if (mounted.current) setBusyId(''); }
  }, [invalidate]);
  const openRejection = useCallback((item: UniversityAdminMessage) => { setSelected(item); setReason(''); }, []);
  const closeRejection = useCallback(() => { if (!lock.current) setSelected(null); }, []);
  const reject = useCallback(() => { if (selected) void decide(selected, 'rejected', reason); }, [selected, reason, decide]);
  const refresh = useCallback(() => load(true), [load]);
  return { status, changeStatus, items, loading, refreshing, busyId, error, selected, reason, setReason, decide, openRejection, closeRejection, reject, refresh };
}
