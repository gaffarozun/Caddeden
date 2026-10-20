import { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, Share } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAlert } from '@/template';
import { useAuth } from './useAuth';
import { useApp } from './useApp';
import { useRatings } from './useRatings';
import { BusinessProfileData, businessMapsUrl, loadBusinessProfile } from '@/services/businessProfileService';
import { getOpenStatus } from '@/services/businessStatus';
import { getSubCategory } from '@/services/categories';
import { distanceMeters } from '@/services/geo';
import { getBusinessCapabilities } from '@/services/businessCapabilitiesService';
export function useBusinessProfile(id: string) {
  const { authUser } = useAuth(); const { showAlert } = useAlert(); const router = useRouter();
  const { savedBusinessIds, toggleSaveBusiness } = useApp(); const { states } = useRatings();
  const [data, setData] = useState<BusinessProfileData | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false); const [tab, setTab] = useState('about');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const generation = useRef(0);
  useFocusEffect(useCallback(() => {
    let active = true; generation.current += 1; setLoading(true); setError(''); setData(null);
    loadBusinessProfile(id).then(value => { if (active) setData(value); }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Profil yüklenemedi.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; generation.current += 1; };
  }, [id, authUser?.id]));
  const refresh = useCallback(async () => {
    const version = generation.current;
    setRefreshing(true); setError('');
    try { const value = await loadBusinessProfile(id); if (version === generation.current) setData(value); } catch (reason) { if (version === generation.current) setError(reason instanceof Error ? reason.message : 'Profil yüklenemedi.'); }
    finally { if (version === generation.current) setRefreshing(false); }
  }, [id]);
  const business = useMemo(() => {
    if (!data) return null;
    const stars = states[id]; const b = data.business;
    const distanceKm = authUser?.lat != null && authUser?.lng != null && b.lat != null && b.lng != null
      ? distanceMeters(authUser.lat, authUser.lng, b.lat, b.lng) / 1000 : b.distanceKm;
    return stars && !data.isDemo ? { ...b, rating: stars.rating, reviewCount: stars.count, distanceKm } : { ...b, distanceKm };
  }, [data, id, states, authUser?.lat, authUser?.lng]);
  const isOwner = !!authUser && data?.ownerId === authUser.id;
  const customer = !authUser || (authUser.role === 'user' && !isOwner);
  const sub = business ? getSubCategory(business.category) : undefined;
  const capabilities = getBusinessCapabilities(business);
  const orderingEnabled = capabilities.orders;
  const canOrder = orderingEnabled && customer && !data?.isDemo;
  const canReserve = capabilities.bookings && customer;
  const openLink = useCallback((url: string) => { void Linking.openURL(url).catch(() => showAlert('Bağlantı açılamadı', 'Bu bağlantıyı cihazınızda açamadık.')); }, [showAlert]);
  const call = useCallback(() => {
    if (!business?.phone) { showAlert('Telefon eklenmemiş', 'İşletme henüz telefon numarası eklememiş.'); return; }
    showAlert('İşletmeyi ara', business.phone, [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Ara', onPress: () => openLink(`tel:${business.phone.replace(/[^+\d]/g, '')}`) }]);
  }, [business, openLink, showAlert]);
  const maps = useCallback(() => { if (business) openLink(businessMapsUrl(business)); }, [business, openLink]);
  const share = useCallback(async () => {
    if (!business) return;
    try { await Share.share({ message: `${business.name}\n${business.address}\nonspaceapp://business/${business.id}\n${businessMapsUrl(business)}` }); }
    catch { showAlert('Paylaşılamadı', 'Cihazınızda paylaşım işlemi açılamadı.'); }
  }, [business, showAlert]);
  const history = useCallback((mode: 'active' | 'past' | 'all') => router.push({ pathname: '/history', params: {
    businessId: id,
    mode,
    section: orderingEnabled ? 'orders' : 'reservations',
    scope: mode === 'all' ? capabilities.historyScope : 'orders',
    bookingType: capabilities.bookingType,
  } }), [id, router, orderingEnabled, capabilities.historyScope, capabilities.bookingType]);
  return { id, data, business, loading, error, refreshing, refresh, tab, setTab, photoUri, setPhotoUri,
    status: business ? getOpenStatus(business) : null, sub, isOwner, customer, canOrder, orderingEnabled, canReserve,
    historyLabel: capabilities.historyLabel,
    saved: savedBusinessIds.includes(id), toggleSave: () => toggleSaveBusiness(id), call, maps, share, history, router, authUser };
}
