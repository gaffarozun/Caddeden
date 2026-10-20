import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { businessProfileColors as c, spacing } from '@/constants/theme';
import { businessStyles as s } from '@/constants/businessProfileStyles';
import { useOrderHistory, HistoryItem } from '@/hooks/useOrderHistory';
import { money } from '@/services/businessProfileService';
import { requestStatusMeta } from '@/services/businessRequestService';
import { BusinessChips, BusinessError, BusinessHeader, BusinessPrimary } from '@/components/feature/BusinessProfileControls';
import { timeAgo } from '@/services/contentService';
export default function HistoryScreen() {
  const router = useRouter(); const params = useLocalSearchParams<{ businessId?: string; mode?: string; section?: string }>();
  const m = useOrderHistory(params.businessId ?? '', params.mode ?? 'all', params.section ?? 'orders');
  const renderItem = ({ item }: { item: HistoryItem }) => {
    const row = item.kind === 'order' ? item.order : item.reservation; const status = requestStatusMeta(row.status);
    return <View style={s.card}><View style={s.meta}><Text style={[s.heading, s.info]}>{row.businesses?.name ?? 'İşletme'}</Text><Text style={[s.subtle, { color: status.tone === 'success' ? c.success : status.tone === 'danger' ? c.danger : c.primary }]}>{status.label}</Text></View>
      {item.kind === 'order' ? <><Text style={s.text}>{item.order.items.map(value => `${value.qty} × ${value.name}`).join(', ')}</Text><Text style={s.price}>{money(Number(item.order.total))}</Text>{item.order.note ? <Text style={s.subtle}>Not: {item.order.note}</Text> : null}{['pending', 'approved', 'delivered'].includes(row.status) ? <View style={s.actions}>{['Onay bekliyor', 'Hazırlanıyor', 'Teslim edildi'].map((label, index) => { const current = row.status === 'delivered' ? 2 : row.status === 'approved' ? 1 : 0; return <View key={label} style={[s.info, { borderTopWidth: 3, paddingTop: spacing.sm, borderTopColor: index <= current ? c.primary : c.border }]}><Text style={s.small}>{label}</Text></View>; })}</View> : null}</> : <Text style={s.text}>{item.reservation.type === 'appointment' ? 'Randevu' : 'Rezervasyon'} · {item.reservation.date} · {item.reservation.time}{item.reservation.type !== 'appointment' ? ` · ${item.reservation.guests} kişi` : ''}</Text>}
      <Text style={s.small}>{timeAgo(row.created_at)} · #{row.id.slice(0, 8)}</Text>
    </View>;
  };
  return <SafeAreaView style={s.screen} edges={['top', 'bottom']}><StatusBar style="light" /><View style={s.frame}><BusinessHeader title={m.section === 'reservations' ? 'Rezervasyonlarım' : m.mode === 'active' ? 'Aktif siparişlerim' : m.mode === 'past' ? 'Geçmiş siparişlerim' : 'Siparişler ve rezervasyonlar'} onBack={() => router.back()} />
    {!m.authUser ? <View style={s.center}><Text style={s.text}>Sipariş ve rezervasyonlarınızı görmek için giriş yapın.</Text><BusinessPrimary label="Giriş yap" onPress={() => router.push('/auth')} /></View> : <FlatList<HistoryItem> style={s.screen} data={m.items} keyExtractor={item => `${item.kind}-${item.id}`} renderItem={renderItem} contentContainerStyle={s.body} ItemSeparatorComponent={() => <View style={s.separator} />} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={m.refreshing} onRefresh={m.refresh} tintColor={c.primary} />}
      ListHeaderComponent={<View style={s.menuRows}><View style={s.campaign}><View style={s.info}><Text style={s.heading}>{m.activeCount} aktif sipariş</Text><Text style={s.subtle}>İşletme onayı ve teslimat durumu 15 saniyede bir güncellenir.</Text></View></View><BusinessChips label="İşlem türü" items={[{ id: 'orders', label: 'Siparişler' }, { id: 'reservations', label: 'Rezervasyonlar' }]} selected={m.section} onSelect={m.setSection} />{m.section === 'orders' ? <BusinessChips label="Sipariş durumu" items={[{ id: 'active', label: 'Aktif siparişler' }, { id: 'past', label: 'Geçmiş siparişler' }, { id: 'all', label: 'Tümü' }]} selected={m.mode} onSelect={m.setMode} /> : null}<BusinessError message={m.error} />{m.loading ? <ActivityIndicator color={c.primary} /> : null}</View>}
      ListEmptyComponent={!m.loading ? <Text style={s.text}>{m.section === 'reservations' ? 'Henüz rezervasyon veya randevu bulunmuyor.' : 'Bu alanda sipariş bulunmuyor.'}</Text> : null} />}
  </View></SafeAreaView>;
}
