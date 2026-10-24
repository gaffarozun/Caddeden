import React, { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { CafeVisit, fetchMyCafeVisit, isCafeVisitLive, joinCafe, leaveCafe, setCafePhotoVisibility, cafePollMilliseconds } from '@/services/cafePresenceService';
import { fetchMyCafePhotoPath, pickAndUploadCafePhoto } from '@/services/cafePhotoService';
export interface CafePresenceState {
  visit: CafeVisit | null; photoPath: string | null; busy: boolean; error: string; notice: string; revision: number;
  join: (businessId: string, visible: boolean) => Promise<boolean>;
  setVisible: (visible: boolean) => Promise<boolean>; leave: () => Promise<boolean>; upload: () => Promise<boolean>;
  invalidateRoom: () => void;
}
export const CafePresenceContext = createContext<CafePresenceState | undefined>(undefined);
export function CafePresenceProvider({ children }: { children: ReactNode }) {
  const { authUser, loading, passwordRecovery, profileError } = useAuth();
  const userId = !loading && !passwordRecovery && !profileError && authUser?.status === 'active' ? authUser.id : '';
  const customer = authUser?.role === 'user';
  const [visit, setVisit] = useState<CafeVisit | null>(null);
  const [owner, setOwner] = useState(''); const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0); const [now, setNow] = useState(Date.now());
  const epoch = useRef(0); const locked = useRef(false);
  const applyVisit = useCallback((next: CafeVisit | null) => { setVisit(next); }, []);
  useEffect(() => {
    let alive = true; let fetching = false; const version = ++epoch.current;
    locked.current = false; setOwner(userId); applyVisit(null); setPhotoPath(null); setBusy(false); setError(''); setNotice('');
    if (!userId) return;
    void fetchMyCafePhotoPath(userId).then(path => { if (alive && version === epoch.current) setPhotoPath(path); }).catch(() => {});
    const load = async () => {
      setNow(Date.now());
      if (!alive || locked.current || fetching || AppState.currentState !== 'active' || !customer) return;
      fetching = true; const snapshot = epoch.current;
      try { const next = await fetchMyCafeVisit(); if (alive && snapshot === epoch.current) applyVisit(next); }
      catch { if (alive && snapshot === epoch.current) applyVisit(null); }
      finally { fetching = false; }
    };
    void load(); const timer = setInterval(() => { void load(); }, cafePollMilliseconds);
    const sub = AppState.addEventListener('change', state => { if (state === 'active') void load(); });
    return () => { alive = false; epoch.current++; clearInterval(timer); sub.remove(); };
  }, [userId, customer, applyVisit]);
  const run = useCallback(async (task: () => Promise<void | boolean>, message: string) => {
    if (!userId || locked.current) return false;
    locked.current = true; const version = ++epoch.current; setBusy(true); setError(''); setNotice('');
    try {
      const result = await task(); if (version !== epoch.current || result === false) return false;
      setNow(Date.now()); setRevision(value => value + 1); setNotice(message); return true;
    } catch (reason) {
      if (version === epoch.current) setError(reason instanceof Error ? reason.message : 'İşlem tamamlanamadı.');
      return false;
    } finally { if (version === epoch.current) { locked.current = false; setBusy(false); } }
  }, [userId]);
  const join = useCallback((businessId: string, visible: boolean) => run(async () => {
    const version = epoch.current; const next = await joinCafe(businessId, visible);
    if (version === epoch.current) applyVisit(next);
  }, visible ? 'Kafeye katıldınız. Fotoğrafınız bu kafedeki katılımcılara açık.' : 'Kafeye katıldınız. Fotoğrafınız diğer katılımcılara gizli.'), [run, applyVisit]);
  const setVisible = useCallback((visible: boolean) => run(async () => {
    const version = epoch.current;
    const next = await setCafePhotoVisibility(visible);
    if (version === epoch.current) applyVisit(next);
  }, visible ? 'Fotoğrafınız bu kafedeki katılımcılara gösteriliyor.' : 'Fotoğrafınız diğer katılımcılardan gizlendi.'), [run, applyVisit]);
  const leave = useCallback(() => run(async () => {
    const version = epoch.current; await leaveCafe(); if (version === epoch.current) applyVisit(null);
  }, 'Kafe katılımınız sonlandırıldı.'), [run, applyVisit]);
  const upload = useCallback(() => run(async () => {
    const version = epoch.current; const path = await pickAndUploadCafePhoto(userId);
    if (!path) return false;
    if (version === epoch.current) setPhotoPath(path);
  }, 'Profil fotoğrafınız kaydedildi.'), [run, userId]);
  const invalidateRoom = useCallback(() => { setRevision(value => value + 1); }, []);
  const current = owner === userId && isCafeVisitLive(visit, now) ? visit : null;
  const value = useMemo<CafePresenceState>(() => ({ visit: current, photoPath: owner === userId ? photoPath : null, busy, error, notice, revision, join, setVisible, leave, upload, invalidateRoom }), [current, photoPath, owner, userId, busy, error, notice, revision, join, setVisible, leave, upload, invalidateRoom]);
  return <CafePresenceContext.Provider value={value}>{children}</CafePresenceContext.Provider>;
}
