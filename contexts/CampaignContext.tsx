import { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { DiscoverCampaign, fetchDiscoverCampaigns } from '@/services/campaignService';
import { useAuth } from '@/hooks/useAuth';

interface CampaignContextValue {
  campaigns: DiscoverCampaign[]; loading: boolean; error: string; revision: number;
  refresh: () => Promise<void>; invalidate: () => void;
}
export const CampaignContext = createContext<CampaignContextValue | undefined>(undefined);
export function CampaignProvider({ children }: { children: ReactNode }) {
  const { authUser } = useAuth();
  const [campaigns, setCampaigns] = useState<DiscoverCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const alive = useRef(true);
  const pending = useRef<Promise<void> | null>(null);
  const refresh = useCallback((): Promise<void> => {
    if (pending.current) return pending.current;
    const task = (async () => {
      try {
        const result = await fetchDiscoverCampaigns();
        if (alive.current) { setCampaigns(previous => JSON.stringify(previous) === JSON.stringify(result) ? previous : result); setError(''); }
      } catch (reason) {
        if (alive.current) { setCampaigns([]); setError(reason instanceof Error ? reason.message : 'Kampanyalar yüklenemedi.'); }
      } finally { if (alive.current) setLoading(false); }
    })();
    pending.current = task;
    void task.finally(() => { if (pending.current === task) pending.current = null; });
    return task;
  }, []);
  const invalidate = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    alive.current = true;
    const timer = setInterval(() => { if (AppState.currentState !== 'background' && AppState.currentState !== 'inactive') void refresh(); }, 30000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { alive.current = false; clearInterval(timer); subscription.remove(); };
  }, [refresh]);
  useEffect(() => { void refresh(); }, [refresh, revision, authUser?.id, authUser?.status]);
  const value = useMemo(() => ({ campaigns, loading, error, revision, refresh, invalidate }), [campaigns, loading, error, revision, refresh, invalidate]);
  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}
