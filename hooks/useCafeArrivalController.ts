import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './useAuth';
import { useCafePresence } from './useCafePresence';
import { cafeArrivalPollMilliseconds } from '@/services/cafeLocationRules';
import { fetchNearbyCafes, getGrantedCafePosition, NearbyCafe } from '@/services/cafePresenceService';

interface ArrivalPrompt { cafe: NearbyCafe; visible: boolean; attempted: boolean }
export function useCafeArrivalController(enabled: boolean) {
  const { authUser, loading, operationLoading, passwordRecovery, profileError } = useAuth();
  const presence = useCafePresence(); const router = useRouter();
  const actor = !loading && !operationLoading && !passwordRecovery && !profileError && authUser?.role === 'user' && authUser.status === 'active' ? authUser.id : '';
  const [prompt, setPrompt] = useState<ArrivalPrompt | null>(null);
  const [status, setStatus] = useState('Konumu kontrol ederek yakın işletme önerilerini açabilirsiniz.');
  const [checking, setChecking] = useState(false);
  const [scanRevision, setScanRevision] = useState(0);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const suppressed = useRef(new Map<string, number>()); const confirming = useRef(false);
  const explicitScan = useRef(false); const identity = useRef(0); const latestPresence = useRef(presence);
  latestPresence.current = presence;
  useEffect(() => {
    identity.current++; suppressed.current.clear(); confirming.current = false; explicitScan.current = false;
    setPrompt(null); setCheckedAt(null); setChecking(false);
    setStatus('Konumu kontrol ederek yakın işletme önerilerini açabilirsiniz.');
    return () => { identity.current++; };
  }, [actor]);
  useEffect(() => {
    let alive = true; let fetching = false;
    setPrompt(null); setChecking(false);
    if (!enabled || !actor || presence.visit) return;
    const active = () => AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
    const check = async () => {
      if (!alive || fetching || confirming.current || latestPresence.current.busy || latestPresence.current.visit || !active()) return;
      fetching = true;
      const manual = explicitScan.current; explicitScan.current = false;
      if (manual) setChecking(true);
      try {
        const position = await getGrantedCafePosition(manual);
        if (!alive || !active() || confirming.current) return;
        if (!position) {
          setPrompt(null); setCheckedAt(Date.now());
          setStatus('Uygulamaya konum izni verilmemiş. Cihaz konumunun açık olması tek başına yeterli değildir. Konumu kontrol et düğmesiyle izin verin; izin reddedilmişse cihaz ayarlarından açın.');
          return;
        }
        const cafes = await fetchNearbyCafes(position);
        if (!alive || !active() || confirming.current || latestPresence.current.busy || latestPresence.current.visit) return;
        // Re-entering a venue after leaving its radius can show the suggestion again.
        for (const id of suppressed.current.keys()) if (!cafes.some(cafe => cafe.business_id === id)) suppressed.current.delete(id);
        const next = cafes.find(cafe => (suppressed.current.get(cafe.business_id) ?? 0) <= Date.now());
        setCheckedAt(Date.now());
        setStatus(next ? `${next.business_name} için “Bu mekânda mısınız?” onayı hazır. Katılım yalnızca onayınızla başlar.` : cafes.length > 0 ? 'Yakın işletme önerisi daha önce kapatılmış. Konumu kontrol et ile yeniden gösterin veya işletme sayfasından burada olduğunuzu doğrulayın.' : '40 metreden yakın, konumu kayıtlı ve katılımı açık bir işletme bulunamadı. İşletme onaylı ve yayında olmalı; mekân katılımını veya masa planını kendi tercihiyle açmalıdır.');
        setPrompt(previous => next ? previous?.cafe.business_id === next.business_id ? { ...previous, cafe: next } : { cafe: next, visible: false, attempted: false } : null);
      } catch (reason) {
        if (alive && !confirming.current) {
          setPrompt(null); setCheckedAt(Date.now());
          setStatus(reason instanceof Error ? reason.message : 'Yakınlık kontrolü tamamlanamadı. Bağlantı ve konum ayarlarını kontrol edin.');
        }
      } finally { fetching = false; if (alive) setChecking(false); }
    };
    void check();
    const timer = setInterval(() => { void check(); }, cafeArrivalPollMilliseconds);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void check(); else { setPrompt(null); setChecking(false); }
    });
    return () => { alive = false; clearInterval(timer); subscription.remove(); };
  }, [enabled, actor, presence.visit?.business_id, scanRevision]);
  const scan = useCallback(() => {
    if (confirming.current || latestPresence.current.busy || checking) return;
    if (!actor) { setStatus('Yakın işletme onayı için aktif bir müşteri hesabıyla giriş yapın.'); return; }
    if (latestPresence.current.visit) { setStatus('Zaten bir mekânda aktif katılımcısınız. Mekân bölümünden katılımınızı yenileyebilir veya ayrılabilirsiniz.'); return; }
    if (!enabled) { setStatus('Bu ekrandan çıkıp uygulama açıkken yeniden kontrol edin.'); return; }
    suppressed.current.clear(); explicitScan.current = true; setScanRevision(value => value + 1);
  }, [actor, enabled, checking]);
  const openSettings = useCallback(async () => {
    if (Platform.OS === 'web') {
      setStatus('Tarayıcının site izinlerinden konuma izin verin. Gerçek 40 m yakınlık ve yerel konum izinleri için uygulamayı telefonda test edin.');
      return;
    }
    try { await Linking.openSettings(); }
    catch { setStatus('Cihaz ayarlarından Caddeden → İzinler → Konum bölümünü açın ve hassas konuma izin verin.'); }
  }, []);
  const choose = useCallback((visible: boolean) => {
    if (!confirming.current) setPrompt(previous => previous ? { ...previous, visible, attempted: false } : null);
  }, []);
  const dismiss = useCallback(() => {
    if (!prompt || confirming.current) return;
    suppressed.current.set(prompt.cafe.business_id, Date.now() + 30 * 60000); setPrompt(null);
    setStatus('Öneri kapatıldı. İşletme sayfasından doğrulayabilir veya Konumu kontrol et ile bulutu yeniden açabilirsiniz.');
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
      const joined = await presence.join(businessId, prompt.cafe.social_enabled && presence.profileEnabled && prompt.visible);
      if (version !== identity.current) return;
      if (joined) {
        suppressed.current.set(businessId, Date.now() + 30 * 60000); setPrompt(null);
        setStatus('Konum onaylandı. Doluluk, masa düzeni ve kullanıcılar Mekândakiler bölümünde.');
        router.push(`/business/${businessId}`);
      }
    } finally { if (version === identity.current) confirming.current = false; }
  }, [prompt, actor, presence.busy, presence.join, router]);
  return { cafe: enabled && actor && !presence.visit ? prompt?.cafe ?? null : null, visible: prompt?.visible ?? false,
    profileEnabled: presence.profileEnabled, busy: presence.busy, error: prompt?.attempted ? presence.error : '', checking, status, checkedAt, scan, openSettings, choose, dismiss, openVenue, confirm };
}
export type CafeArrivalController = ReturnType<typeof useCafeArrivalController>;
