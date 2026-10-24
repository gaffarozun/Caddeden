import React, { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useCafePresence } from '@/hooks/useCafePresence';
import { cafePollMilliseconds } from '@/services/cafePresenceService';
import { CafeSocialData, CafeSocialRequest, decideCafeInstagram, fetchCafeSocialState, fetchOwnInstagram, openCafeInstagram, requestCafeInstagram, saveCafeInstagram } from '@/services/cafeSocialService';
export interface CafeSocialState {
 incoming: CafeSocialRequest[]; outgoing: CafeSocialRequest[]; handle: string; ready: boolean; busy: boolean; error: string; notice: string; revision: number;
 saveHandle: (value: string) => Promise<boolean>; request: (targetId: string) => Promise<boolean>; decide: (requestId: string, accept: boolean) => Promise<boolean>; open: (requestId: string) => Promise<boolean>;
}
export const CafeSocialContext = createContext<CafeSocialState | undefined>(undefined);
const empty: CafeSocialData = { incoming: [], outgoing: [] };
export function CafeSocialProvider({ children }: { children: ReactNode }) {
 const { authUser, loading, passwordRecovery, profileError } = useAuth(); const presence = useCafePresence();
 const uid = !loading && !passwordRecovery && !profileError && authUser?.role === 'user' && authUser.status === 'active' ? authUser.id : '';
 const [owner, setOwner] = useState(''); const [data, setData] = useState<CafeSocialData>(empty); const [handle, setHandle] = useState('');
 const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [revision, setRevision] = useState(0);
 const epoch = useRef(0); const lock = useRef(false); const sequence = useRef(0);
 useEffect(() => {
  let alive = true; let fetching = false; const version = ++epoch.current;
  setOwner(uid); setData(empty); setHandle(''); setReady(false); setError(''); setNotice(''); setBusy(false); lock.current = false;
  if (!uid) return;
  void fetchOwnInstagram(uid).then(value => { if (alive && epoch.current === version) { setHandle(value); setReady(true); } }).catch(reason => { if (alive && epoch.current === version) setError(reason instanceof Error ? reason.message : 'Instagram bilgisi alınamadı.'); });
  const load = async () => {
   if (!alive || fetching || lock.current || AppState.currentState !== 'active') return;
   fetching = true; const ticket = sequence.current;
   try {
    const [next, savedHandle] = await Promise.all([fetchCafeSocialState(), fetchOwnInstagram(uid)]);
    if (alive && version === epoch.current && ticket === sequence.current) { setData(next); setHandle(savedHandle); setReady(true); }
   }
   catch { if (alive && version === epoch.current && ticket === sequence.current) setData(empty); }
   finally { fetching = false; }
  };
  void load(); const timer = setInterval(() => { void load(); }, cafePollMilliseconds);
  const sub = AppState.addEventListener('change', state => { if (state === 'active') void load(); else setData(empty); });
  return () => { alive = false; epoch.current++; clearInterval(timer); sub.remove(); };
 }, [uid]);
 // Local visit changes must not leave an actionable peer/photo snapshot from a previous cafe.
 useEffect(() => { setData(empty); sequence.current++; if (!uid) return; const version = epoch.current; const ticket = sequence.current;
  void fetchCafeSocialState().then(next => { if (version === epoch.current && ticket === sequence.current) setData(next); }).catch(() => {});
 }, [uid, presence.revision, presence.visit?.business_id]);
 const run = useCallback(async (task: () => Promise<void>, message: string) => {
  if (!uid || lock.current) return false;
  lock.current = true; const version = epoch.current; sequence.current++; setBusy(true); setError(''); setNotice('');
  try {
   await task(); if (version !== epoch.current) return false;
   setRevision(value => value + 1); setNotice(message);
   try { const next = await fetchCafeSocialState(); if (version === epoch.current) setData(next); } catch { if (version === epoch.current) setData(empty); }
   return true;
  } catch (reason) { if (version === epoch.current) setError(reason instanceof Error ? reason.message : 'İşlem tamamlanamadı.'); return false; }
  finally { if (version === epoch.current) { lock.current = false; setBusy(false); } }
 }, [uid]);
 const saveHandle = useCallback((value: string) => run(async () => { const version = epoch.current; const next = await saveCafeInstagram(value); if (version === epoch.current) { setHandle(next); setReady(true); } }, 'Instagram kullanıcı adınız özel olarak kaydedildi.'), [run]);
 const request = useCallback((targetId: string) => run(async () => { await requestCafeInstagram(targetId); }, 'Instagram görme isteğiniz gönderildi.'), [run]);
 const decide = useCallback((id: string, accept: boolean) => run(async () => { await decideCafeInstagram(id, accept); }, accept ? 'İzin verildi. Instagram yalnızca aynı kafede aktif katılım varken açılabilir.' : 'İzin kaldırıldı. Bu kişi fotoğrafınızı 3 gün göremez.'), [run]);
 const open = useCallback((id: string) => run(() => openCafeInstagram(id), ''), [run]);
 const current = owner === uid && !!uid;
 const value = useMemo<CafeSocialState>(() => ({ incoming: current ? data.incoming : [], outgoing: current ? data.outgoing : [], handle: current ? handle : '', ready: current && ready, busy, error, notice, revision, saveHandle, request, decide, open }), [current,data,handle,ready,busy,error,notice,revision,saveHandle,request,decide,open]);
 return <CafeSocialContext.Provider value={value}>{children}</CafeSocialContext.Provider>;
}
