import React, { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { fetchUniversityPublicMessages, UniversityPublicMessage } from '@/services/universityService';
import { useAuth } from '@/hooks/useAuth';

interface UniversityContextValue {
  messages: UniversityPublicMessage[]; loading: boolean; error: string; revision: number;
  refresh: () => Promise<void>; invalidate: () => void;
}
export const UniversityContext = createContext<UniversityContextValue | undefined>(undefined);
export function UniversityProvider({ children }: { children: ReactNode }) {
  const { authUser } = useAuth();
  const [messages, setMessages] = useState<UniversityPublicMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const alive = useRef(true);
  const pending = useRef<Promise<void> | null>(null);
  const refresh = useCallback((): Promise<void> => {
    if (pending.current) return pending.current;
    const task = (async () => {
      try {
        const result = await fetchUniversityPublicMessages();
        if (!alive.current) return;
        setMessages(previous => JSON.stringify(previous) === JSON.stringify(result) ? previous : result);
        setError('');
      } catch (reason) {
        if (alive.current) setError(reason instanceof Error ? reason.message : 'Yazılar yüklenemedi.');
      } finally { if (alive.current) setLoading(false); }
    })();
    pending.current = task;
    void task.finally(() => { if (pending.current === task) pending.current = null; });
    return task;
  }, []);
  const invalidate = useCallback(() => { setRevision(value => value + 1); }, []);
  useEffect(() => {
    alive.current = true;
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 30000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { alive.current = false; clearInterval(timer); subscription.remove(); };
  }, [refresh]);
  useEffect(() => { void refresh(); }, [refresh, revision, authUser?.id, authUser?.status]);
  const value = useMemo(() => ({ messages, loading, error, revision, refresh, invalidate }), [messages, loading, error, revision, refresh, invalidate]);
  return <UniversityContext.Provider value={value}>{children}</UniversityContext.Provider>;
}
