// Powered by OnSpace.AI
// Customer history: past orders (with amounts + notes) and reservations/
// appointments. Reached from the profile via "Geçmiş Siparişler & Randevular".
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import {
  OrderRow,
  ReservationRow,
  listMyOrders,
  listMyReservations,
  requestStatusMeta,
} from '@/services/businessRequestService';
import { timeAgo } from '@/services/contentService';
import { fontSize, fontWeight, radius, spacing, ThemeColors } from '@/constants/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { authUser } = useAuth();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!authUser) return;
    const [o, r] = await Promise.all([listMyOrders(authUser.id), listMyReservations(authUser.id)]);
    setOrders(o.data);
    setReservations(r.data);
    setRefreshing(false);
  }, [authUser]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!authUser) {
    return (
      <View style={styles.guard}>
        <MaterialCommunityIcons name="account-lock-outline" size={48} color={colors.textFaint} />
        <Text style={styles.guardText}>Geçmişini görmek için giriş yapmalısın.</Text>
        <Button label="Giriş Yap" icon="login" onPress={() => router.replace('/auth')} />
      </View>
    );
  }

  const totalSpent = orders
    .filter((o) => o.status !== 'rejected')
    .reduce((sum, o) => sum + Number(o.total ?? 0), 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
      }
    >
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{orders.length}</Text>
          <Text style={styles.summaryLabel}>Sipariş</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalSpent.toLocaleString('tr-TR')} ₺</Text>
          <Text style={styles.summaryLabel}>Toplam Tutar</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{reservations.length}</Text>
          <Text style={styles.summaryLabel}>Randevu</Text>
        </View>
      </View>

      <View style={styles.sectionHead}>
        <MaterialCommunityIcons name="receipt" size={18} color={colors.text} />
        <Text style={styles.sectionTitle}>Geçmiş Siparişlerim</Text>
      </View>
      {orders.length === 0 ? (
        <Text style={styles.empty}>Henüz siparişin yok.</Text>
      ) : (
        orders.map((o) => {
          const meta = requestStatusMeta(o.status);
          return (
            <View key={o.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>{o.businesses?.name ?? 'İşletme'}</Text>
                <Pill meta={meta} />
              </View>
              <Text style={styles.cardSub} numberOfLines={2}>
                {(o.items ?? []).map((it) => `${it.qty > 1 ? `${it.qty}x ` : ''}${it.name}`).join(', ') || 'Sipariş'}
              </Text>
              {o.note ? <Text style={styles.cardNote}>Not: {o.note}</Text> : null}
              <View style={styles.cardBottom}>
                <Text style={styles.cardTime}>{timeAgo(o.created_at)}</Text>
                <Text style={styles.cardTotal}>{Number(o.total).toLocaleString('tr-TR')} ₺</Text>
              </View>
            </View>
          );
        })
      )}

      <View style={styles.sectionHead}>
        <MaterialCommunityIcons name="calendar-check" size={18} color={colors.text} />
        <Text style={styles.sectionTitle}>Geçmiş Randevu / Rezervasyonlarım</Text>
      </View>
      {reservations.length === 0 ? (
        <Text style={styles.empty}>Henüz randevun yok.</Text>
      ) : (
        reservations.map((r) => {
          const meta = requestStatusMeta(r.status);
          const isApp = r.type === 'appointment';
          return (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>{r.businesses?.name ?? 'İşletme'}</Text>
                <Pill meta={meta} />
              </View>
              <Text style={styles.cardSub}>
                {isApp ? 'Randevu' : 'Rezervasyon'} · {r.date} · {r.time}
                {isApp ? '' : ` · ${r.guests} kişi`}
              </Text>
              <View style={styles.cardBottom}>
                <Text style={styles.cardTime}>{timeAgo(r.created_at)}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function Pill({ meta }: { meta: { label: string; tone: 'success' | 'warning' | 'danger' } }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tone =
    meta.tone === 'success'
      ? { bg: colors.successSoft, fg: colors.success }
      : meta.tone === 'danger'
      ? { bg: colors.dangerSoft, fg: colors.danger }
      : { bg: colors.warningSoft, fg: colors.warning };
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <Text style={[styles.pillText, { color: tone.fg }]}>{meta.label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
    guard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
    guardText: { fontSize: fontSize.md, color: colors.textSubtle, textAlign: 'center' },
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.md,
    },
    summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
    summaryValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary },
    summaryLabel: { fontSize: fontSize.xs, color: colors.textSubtle },
    summaryDivider: { width: 1, height: 32, backgroundColor: colors.border },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
    sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
    empty: { fontSize: fontSize.sm, color: colors.textSubtle, paddingVertical: spacing.sm },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 6 },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    cardTitle: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
    cardSub: { fontSize: fontSize.sm, color: colors.textSubtle, lineHeight: fontSize.sm * 1.4 },
    cardNote: { fontSize: fontSize.xs, color: colors.textSubtle, fontStyle: 'italic' },
    cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
    cardTime: { fontSize: fontSize.xs, color: colors.textFaint },
    cardTotal: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
    pill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
    pillText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  });
