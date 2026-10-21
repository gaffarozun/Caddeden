import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Share } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchCaddeTvChannels } from '@/services/caddeTvService';
import { MAIN_CATEGORIES, mainCategoryOf, MainCategoryId } from '@/services/categories';
import { Reel } from '@/services/types';
import { useApp } from '@/hooks/useApp';
import { useUniversity } from '@/hooks/useUniversity';
import { useUniversityMarquee } from '@/hooks/useUniversityMarquee';
import { useAlert } from '@/template';

export function useCaddeTv() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const app = useApp();
  const university = useUniversity();
  const [channels, setChannels] = useState<Reel[]>([]);
  const [main, setMain] = useState<'all' | MainCategoryId>('all');
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const alive = useRef(true);
  const generation = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; generation.current += 1; }; }, []);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const result = await fetchCaddeTvChannels();
      if (alive.current && request === generation.current) { setChannels(result); setError(''); }
    } catch (reason) {
      if (alive.current && request === generation.current) { setChannels([]); setError(reason instanceof Error ? reason.message : 'Yayınlar yüklenemedi.'); }
    } finally { if (alive.current && request === generation.current) setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => {
    void refresh(); void university.refresh();
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 30000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { generation.current += 1; clearInterval(timer); subscription.remove(); };
  }, [refresh, university.refresh]));
  const visible = useMemo(() => channels.filter(item => main === 'all' || mainCategoryOf(item.category) === main), [channels, main]);
  const index = Math.max(0, visible.findIndex(item => item.id === selectedId));
  const current = visible[index] ?? null;
  const changeChannel = useCallback((direction = 1) => {
    if (!visible.length) return;
    setSelectedId(visible[(index + direction + visible.length) % visible.length].id);
  }, [visible, index]);
  const next = useCallback(() => changeChannel(1), [changeChannel]);
  const previous = useCallback(() => changeChannel(-1), [changeChannel]);
  const selectMain = useCallback((value: string) => { setMain(value as 'all' | MainCategoryId); setSelectedId(''); }, []);
  const categories = useMemo(() => [{ id: 'all', label: 'Tüm yayınlar' }, ...MAIN_CATEGORIES], []);
  const subtitleText = useMemo(() => university.messages.length
    ? university.messages.map(item => item.text).join('   ◆   ') + '   ◆   '
    : university.error ? 'Yazı akışı yüklenemedi. Kumandadan yenileyebilirsin.'
    : university.loading ? 'Kampüsün sesi hazırlanıyor…'
    : 'İlk söz senin. Kumandadan yazını gönder; yönetici onayıyla burada aksın.   ◆   ', [university.messages, university.error, university.loading]);
  const motion = useUniversityMarquee(subtitleText);
  const write = useCallback(() => router.push('/university'), [router]);
  const openBusiness = useCallback(() => { if (current) router.push(`/business/${current.businessId}`); }, [router, current]);
  const liked = !!current && app.likedReelIds.includes(current.id);
  const saved = !!current && app.isSavedReel(current.id);
  const toggleLike = useCallback(() => { if (current) app.toggleLikeReel(current.id); }, [current, app.toggleLikeReel]);
  const toggleSave = useCallback(() => { if (current) app.toggleSaveReel({ id: current.id, businessId: current.businessId, businessName: current.businessName, image: current.image, caption: current.caption }); }, [current, app.toggleSaveReel]);
  const share = useCallback(async () => {
    if (!current) return;
    try { await Share.share({ message: `${current.businessName} · ${current.caption}\nhttps://caddeden.app/isletme/${current.businessId}` }); }
    catch { showAlert('Paylaşılamadı', 'Paylaşım açılamadı. Tekrar deneyin.'); }
  }, [current, showAlert]);
  const retry = useCallback(() => { void refresh(); void university.refresh(); }, [refresh, university.refresh]);
  return { current, total: visible.length, index, main, categories, selectMain, loading, error, next, previous,
    subtitleText, motion, write, openBusiness, liked, saved, toggleLike, toggleSave, share, retry,
    canInteract: app.user.type !== 'business', subtitleError: university.error };
}
