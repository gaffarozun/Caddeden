import { useCallback, useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from './useAuth';
import { useFeedback } from './useFeedback';
import { BusinessFeedback, removeUnusedEvidence, uploadFeedbackEvidence } from '@/services/feedbackService';

export type FeedbackTab = 'review' | 'suggestion' | 'complaint';
export function useBusinessFeedback(id: string, enabled = true) {
  const { authUser } = useAuth();
  const { read, mutate, revision, invalidate } = useFeedback();
  const [data, setData] = useState<BusinessFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sort, setSort] = useState('newest');
  const [offset, setOffset] = useState(0);
  const [tab, setTab] = useState<FeedbackTab>('review');
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [topic, setTopic] = useState('service');
  const [suggestionTopic, setSuggestionTopic] = useState('student_discount');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('price');
  const [target, setTarget] = useState({ type: 'business', id });
  const [evidence, setEvidence] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const epoch = useRef(0);
  const mounted = useRef(true);
  const lastMine = useRef('');
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    lastMine.current = ''; setData(null); setFormOpen(false); setTarget({ type: 'business', id }); setOffset(0); setError(''); setEvidence(null);
  }, [id, authUser?.id]);
  useEffect(() => {
    let active = true;
    const generation = ++epoch.current;
    if (!enabled || !id) { setLoading(false); return; }
    setLoading(true);
    read(id, sort, offset).then(result => {
      if (!active || generation !== epoch.current) return;
      setData(result); setError('');
      const mineKey = `${result.mine?.id ?? ''}:${result.mine?.updated_at ?? ''}`;
      if (mineKey !== lastMine.current) {
        lastMine.current = mineKey;
        setRating(result.mine?.rating ?? 0); setComment(result.mine?.comment ?? ''); setTopic(result.mine?.topic ?? 'service');
      }
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Veriler alınamadı.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [enabled, id, read, sort, offset, revision]);
  const canCustomer = !!authUser && authUser.role === 'user' && authUser.status === 'active' && !data?.owner;
  const run = useCallback(async (action: string, params: Record<string, unknown>) => {
    if (busy) return false;
    setBusy(true); setError(''); setNotice('');
    try {
      await mutate(action, params);
      if (mounted.current) setNotice(action === 'delete_review' ? 'Değerlendirmeniz kaldırıldı.' : action === 'support' ? 'Destek tercihiniz güncellendi.' : 'Kaydınız alındı. İçerik ve cevaplar yönetici incelemesinden sonra yayımlanır.');
      return true;
    } catch (reason) {
      if (mounted.current) setError(reason instanceof Error ? reason.message : 'İşlem tamamlanamadı.');
      return false;
    } finally { if (mounted.current) setBusy(false); }
  }, [busy, mutate]);
  const pickEvidence = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError('Kanıt seçmek için galeri izni gerekli.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) setEvidence(result.assets[0]);
  }, []);
  const submit = useCallback(async () => {
    if (!canCustomer || busy) return;
    if (tab === 'review') {
      if (rating < 1 || rating > 5) { setError('1–5 arasında yıldız seçin.'); return; }
      const ok = await run('review', { business_id: id, rating, comment, topic });
      if (ok) setFormOpen(false);
    } else if (tab === 'suggestion') {
      if (description.trim().length < 5) { setError('Öneri açıklaması en az 5 karakter olmalı.'); return; }
      const ok = await run('suggest', { business_id: id, description, topic: suggestionTopic });
      if (ok) { setFormOpen(false); setDescription(''); }
    } else {
      if (description.trim().length < 10) { setError('Şikâyet açıklaması en az 10 karakter olmalı.'); return; }
      setBusy(true); setError(''); let path: string | null = null;
      try {
        if (evidence) path = await uploadFeedbackEvidence(evidence);
        await mutate('complaint', { target_type: target.type, target_id: target.id, category, description, evidence_path: path });
        if (mounted.current) { setNotice('Şikâyetiniz yöneticiye iletildi. Bildirim, iddianın doğrulandığı anlamına gelmez.'); setDescription(''); setEvidence(null); setFormOpen(false); setTarget({ type: 'business', id }); }
      } catch (reason) {
        if (path) await removeUnusedEvidence(path).catch(() => {});
        if (mounted.current) setError(reason instanceof Error ? reason.message : 'Şikâyet gönderilemedi.');
      } finally { if (mounted.current) setBusy(false); }
    }
  }, [canCustomer, busy, tab, rating, run, id, comment, topic, description, suggestionTopic, evidence, mutate, target, category]);
  const report = useCallback((type: string, itemId: string) => {
    setTarget({ type, id: itemId }); setTab('complaint'); setCategory('abuse'); setDescription(''); setFormOpen(true); setNotice('');
  }, []);
  const changeTab = useCallback((next: FeedbackTab) => { setTab(next); setFormOpen(false); setDescription(''); setTarget({ type: 'business', id }); setNotice(''); }, [id]);
  const changeSort = useCallback((next: string) => { setOffset(0); setSort(next); }, []);
  return { data, loading, busy, error, notice, sort, setSort: changeSort, offset, setOffset, tab, setTab: changeTab, formOpen, setFormOpen,
    rating, setRating, comment, setComment, topic, setTopic, suggestionTopic, setSuggestionTopic, description, setDescription, category, setCategory,
    target, evidence, setEvidence, pickEvidence, submit, report, run, canCustomer, signedIn: !!authUser, refresh: invalidate };
}
