import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './useAuth';
import { useCafePresence } from './useCafePresence';
import { cafeArrivalPollMilliseconds } from '@/services/cafeLocationRules';
import { fetchNearbyCafes, getGrantedCafePosition, NearbyCafe } from '@/services/cafePresenceService';

interface ArrivalPrompt { cafe: NearbyCafe; visible: boolean; attempted: boolean }
export function useCafeArrival(enabled: boolean) {
  const { authUser, loading, operationLoading, passwordRecovery, profileError } = useAuth();
  const presence = useCafePresence(); const router = useRouter();
  const actor = !loading && !operationLoading && !passwordRecovery && !profileError && authUser?.role === 'user' && authUser.status === 'active' ? authUser.id : '';
  const [prompt, setPrompt] = useState<ArrivalPrompt | null>(null);
  const suppressed = useRef(new Map<string, number>()); const confirming = useRef(false);
  const identity = useRef(0); const latestPresence = useRef(presence);
  useEffect(() => { latestPresence.current = presence; }, [presence]);
  useEffect(() => {
    identity.current++; suppressed.current.clear(); confirming.current = false; setPrompt(null);
    return () => { identity.current++; };
  }, [actor]);
  useEffect(() => {
    let alive = true; let fetching = false;
    setPrompt(null);
    if (presence.visit) suppressed.current.set(presence.visit.business_id, Date.now() + 30 * 60000);
    if (!enabled || !actor || presence.visit) return;
    const active = () => AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
    const check = async () => {
      if (!alive || fetching || confirming.current || latestPresence.current.busy || latestPresence.current.visit || !active()) return;
      fetching = true;
      try {
        // Does not request permissions. A passive suggestion can never create a visit.
        const position = await getGrantedCafePosition();
        if (!alive || !active() || confirming.current) return;
        const cafes = position ? await fetchNearbyCafes(position) : [];
        if (!alive || !active() || confirming.current || latestPresence.current.busy || latestPresence.current.visit) return;
        const next = cafes.find(cafe => (suppressed.current.get(cafe.business_id) ?? 0) <= Date.now());
        setPrompt(previous => next ? previous?.cafe.business_id === next.business_id ? { ...previous, cafe: next } : { cafe: next, visible: false, attempted: false } : null);
      } catch {
        // GPS disabled, imprecise fix or no connection: keep manual entry available, hide stale suggestions.
        if (alive && !confirming.current) setPrompt(null);
      } finally { fetching = false; }
    };
    void check();
    const timer = setInterval(() => { void check(); }, cafeArrivalPollMilliseconds);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void check(); else setPrompt(null);
    });
    return () => { alive = false; clearInterval(timer); subscription.remove(); };
  }, [enabled, actor, presence.visit?.business_id]);
  const choose = useCallback((visible: boolean) => {
    if (!confirming.current) setPrompt(previous => previous ? { ...previous, visible, attempted: false } : null);
  }, []);
  const dismiss = useCallback(() => {
    if (!prompt || confirming.current) return;
    suppressed.current.set(prompt.cafe.business_id, Date.now() + 30 * 60000); setPrompt(null);
  }, [prompt]);
  const openVenue = useCallback(() => {
    if (!prompt || confirming.current) return;
    const businessId = prompt.cafe.business_id; dismiss(); router.push(`/business/${businessId}`);
  }, [prompt, dismiss, router]);
  const confirm = useCallback(async () => {
    if (!prompt || confirming.current || presence.busy || !actor) return;
    confirming.current = true; const version = identity.current; const businessId = prompt.cafe.business_id;
    setPrompt(previous => previous ? { ...previous, attempted: true } : null);
    try {
      // Confirmation takes a fresh GPS fix; stale bubble coordinates are not reused.
      const joined = await presence.join(businessId, prompt.cafe.social_enabled && prompt.visible);
      if (version !== identity.current) return;
      if (joined) {
        suppressed.current.set(businessId, Date.now() + 30 * 60000); setPrompt(null);
        router.push(`/business/${businessId}`);
      }
    } finally { if (version === identity.current) confirming.current = false; }
  }, [prompt, actor, presence.busy, presence.join, router]);
  return { cafe: enabled && actor && !presence.visit ? prompt?.cafe ?? null : null, visible: prompt?.visible ?? false,
    busy: presence.busy, error: prompt?.attempted ? presence.error : '', choose, dismiss, openVenue, confirm };
}
export type CafeArrivalModel = ReturnType<typeof useCafeArrival>;
