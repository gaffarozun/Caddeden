// Powered by OnSpace.AI
// Business "Gelen Talepler": incoming orders & reservations for the owner's
// businesses. The owner approves/rejects; the status syncs to the customer via
// RLS (customer sees it on the business page and in their profile).
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components';
import { AdminEmpty, AdminLoading, FilterTabs, SmallButton, StatusPill } from '@/components/admin/ui';
import { useAuth } from '@/hooks/useAuth';
import {
  OrderRow,
  ReservationRow,
  listIncomingOrders,
  listIncomingReservations,
  requestStatusMeta,
  updateOrderStatus,
  updateReservationStatus,
} from '@/services/businessRequestService';
import { timeAgo } from '@/services/contentService';
import { useAlert } from '@/template';
import { colors, fontSize, fontWeight, radius, spacing } from '@/constants/theme';

type Section = 'orders' | 'reservations';

const STATUS_TABS = [
  { id: 'pending', label: 'Bekleyen' },
  { id: 'approved', label: 'Onaylı' },
  { id: 'rejected', label: 'Red' },
  { id: 'all', label: 'Tümü' },
];

export default function BusinessRequests() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { authUser } = useAuth();

  const [section, setSection] = useState<Section>('orders');
  const [filter, setFilter] = useState('pending');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!authUser) {
      setLoading(false);
      return;
    }
    const [o, r] = await Promise.all([listIncomingOrders(authUser.id), listIncomingReservations(authUser.id)]);
    setOrders(o.data);
    setReservations(r.data);
    setLoading(false);
    setRefreshing(false);
  }, [authUser]);

  useEffect(() => {
    load();
  }, [load]);

  if (!authUser) {
    return (
      <View style={styles.guard}>
        <MaterialCommunityIcons name="account-lock-outline" size={48} color={colors.textFaint} />
        <Text style={styles.guardText}>Talepleri görmek için giriş yapmalısın.</Text>
        <Button label="Giriş Yap" icon="login" onPress={() => router.replace('/auth')} />
      </View>
    );
  }

  if (loading) return <AdminLoading />;

  const run = async (p: Promise<{ error: string | null }>, msg: string) => {
    const { error } = await p;
    if (error) {
      showAlert('Hata', error, [{ text: 'Tamam' }]);
      return;
    }
    showAlert('Tamam', msg, [{ text: 'Tamam' }]);
    load();
  };

  const callPhone = (phone?: string | null) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  const openMap = (o: OrderRow) => {
    const q = o.lat != null && o.lng != null ? `${o.lat},${o.lng}` : encodeURIComponent(o.address ?? '');
    if (!q) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(() => {});
  };

  const byFilter = <T extends { status: string }>(list: T[]): T[] =>
    filter === 'all' ? list : list.filter((x) => x.status === filter);

  const renderOrder = ({ item }: { item: OrderRow }) => {
    const meta = requestStatusMeta(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.rowTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.biz} numberOfLines={1}>{item.businesses?.name ?? 'İşletmem'}</Text>
            <Text style={styles.meta}>{timeAgo(item.created_at)}</Text>
          </View>
          <StatusPill label={meta.label} tone={meta.tone} />
        </View>

        <View style={styles.customerRow}>
          <MaterialCommunityIcons name="account-circle-outline" size={16} color={colors.textSubtle} />
          <Text style={styles.customerText} numberOfLines={1}>{item.customer_name ?? 'Müşteri'}</Text>
        </View>

        <View style={styles.items}>
          {(item.items ?? []).map((it, i) => (
            <View key={`${it.menu_item_id}-${i}`} style={styles.itemLine}>
              <Text style={styles.itemName} numberOfLines={1}>{it.qty > 1 ? `${it.qty}x ` : ''}{it.name}</Text>
              <Text style={styles.itemPrice}>{Number(it.price).toLocaleString('tr-TR')} ₺</Text>
            </View>
          ))}
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Toplam</Text>
            <Text style={styles.totalValue}>{Number(item.total).toLocaleString('tr-TR')} ₺</Text>
          </View>
        </View>

        {item.note ? (
          <View style={styles.noteBox}>
            <MaterialCommunityIcons name="message-text-outline" size={15} color={colors.textSubtle} />
            <Text style={styles.noteText}>{item.note}</Text>
          </View>
        ) : null}

        <Pressable style={styles.contactRow} onPress={() => callPhone(item.phone)}>
          <MaterialCommunityIcons name="phone-outline" size={16} color={colors.primary} />
          <Text style={styles.contactText}>{item.phone ?? 'Telefon yok'}</Text>
          {item.phone ? <MaterialCommunityIcons name="phone" size={14} color={colors.primary} /> : null}
        </Pressable>
        <Pressable style={styles.contactRow} onPress={() => openMap(item)}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.primary} />
          <Text style={styles.contactText} numberOfLines={2}>{item.address ?? 'Adres yok'}</Text>
          {item.address || item.lat != null ? <MaterialCommunityIcons name="directions" size={14} color={colors.primary} /> : null}
        </Pressable>

        <View style={styles.actions}>
          {item.status === 'delivered' ? (
            <View style={styles.doneRow}>
              <MaterialCommunityIcons name="check-all" size={16} color={colors.success} />
              <Text style={styles.doneText}>Teslim edildi</Text>
            </View>
          ) : (
            <>
              {item.status === 'pending' || item.status === 'rejected' ? (
                <SmallButton label="Onayla" icon="check" tone="success" onPress={() => run(updateOrderStatus(item.id, 'approved'), 'Sipariş onaylandı.')} />
              ) : null}
              {item.status === 'approved' ? (
                <SmallButton label="Teslim Edildi" icon="check-all" tone="success" onPress={() => run(updateOrderStatus(item.id, 'delivered'), 'Sipariş teslim edildi olarak işaretlendi.')} />
              ) : null}
              {item.status !== 'rejected' ? (
                <SmallButton label="Reddet" icon="close" tone="danger" outline onPress={() => run(updateOrderStatus(item.id, 'rejected'), 'Sipariş reddedildi.')} />
              ) : null}
            </>
          )}
        </View>
      </View>
    );
  };

  const renderReservation = ({ item }: { item: ReservationRow }) => {
    const meta = requestStatusMeta(item.status);
    const isApp = item.type === 'appointment';
    return (
      <View style={styles.card}>
        <View style={styles.rowTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.biz} numberOfLines={1}>{item.businesses?.name ?? 'İşletmem'}</Text>
            <Text style={styles.meta}>{isApp ? 'Randevu' : 'Rezervasyon'} · {timeAgo(item.created_at)}</Text>
          </View>
          <StatusPill label={meta.label} tone={meta.tone} />
        </View>

        <View style={styles.customerRow}>
          <MaterialCommunityIcons name="account-circle-outline" size={16} color={colors.textSubtle} />
          <Text style={styles.customerText} numberOfLines={1}>{item.customer_name ?? 'Müşteri'}</Text>
        </View>

        <View style={styles.resInfo}>
          <InfoChip icon="calendar-outline" text={item.date} />
          <InfoChip icon="clock-outline" text={item.time} />
          {!isApp ? <InfoChip icon="account-group-outline" text={`${item.guests} kişi`} /> : null}
        </View>

        <Pressable style={styles.contactRow} onPress={() => callPhone(item.phone)}>
          <MaterialCommunityIcons name="phone-outline" size={16} color={colors.primary} />
          <Text style={styles.contactText}>{item.phone ?? 'Telefon yok'}</Text>
          {item.phone ? <MaterialCommunityIcons name="phone" size={14} color={colors.primary} /> : null}
        </Pressable>

        <View style={styles.actions}>
          {item.status !== 'approved' ? (
            <SmallButton label="Onayla" icon="check" tone="success" onPress={() => run(updateReservationStatus(item.id, 'approved'), 'Talep onaylandı.')} />
          ) : null}
          {item.status !== 'rejected' ? (
            <SmallButton label="Reddet" icon="close" tone="danger" outline onPress={() => run(updateReservationStatus(item.id, 'rejected'), 'Talep reddedildi.')} />
          ) : null}
        </View>
      </View>
    );
  };

  const data = section === 'orders' ? byFilter(orders) : byFilter(reservations);

  return (
    <View style={styles.screen}>
      <View style={styles.segment}>
        <Pressable onPress={() => setSection('orders')} style={[styles.segBtn, section === 'orders' && styles.segBtnActive]}>
          <MaterialCommunityIcons name="receipt" size={16} color={section === 'orders' ? colors.white : colors.textSubtle} />
          <Text style={[styles.segText, section === 'orders' && { color: colors.white }]}>Siparişler</Text>
        </Pressable>
        <Pressable onPress={() => setSection('reservations')} style={[styles.segBtn, section === 'reservations' && styles.segBtnActive]}>
          <MaterialCommunityIcons name="calendar-check" size={16} color={section === 'reservations' ? colors.white : colors.textSubtle} />
          <Text style={[styles.segText, section === 'reservations' && { color: colors.white }]}>Rezervasyon</Text>
        </Pressable>
      </View>

      <View style={styles.tabsWrap}>
        <FilterTabs options={STATUS_TABS} value={filter} onChange={setFilter} />
      </View>

      <FlatList
        data={data as (OrderRow | ReservationRow)[]}
        keyExtractor={(i) => i.id}
        renderItem={section === 'orders' ? (renderOrder as any) : (renderReservation as any)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={<AdminEmpty icon="bell-outline" text="Bu durumda talep yok." />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function InfoChip({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.infoChip}>
      <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={14} color={colors.textSubtle} />
      <Text style={styles.infoChipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  guard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  guardText: { fontSize: fontSize.md, color: colors.textSubtle, textAlign: 'center' },
  segment: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  segBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSubtle },
  tabsWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, paddingTop: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  biz: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textSubtle, marginTop: 2 },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  customerText: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.semibold },
  items: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm, gap: 4 },
  itemLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  itemName: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  itemPrice: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  totalLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4, paddingTop: 6 },
  totalLabel: { fontSize: fontSize.sm, color: colors.textSubtle, fontWeight: fontWeight.medium },
  totalValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  contactText: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  resInfo: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  infoChipText: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  noteBox: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm },
  noteText: { flex: 1, fontSize: fontSize.sm, color: colors.text, lineHeight: fontSize.sm * 1.4 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  doneText: { fontSize: fontSize.sm, color: colors.success, fontWeight: fontWeight.semibold },
});
