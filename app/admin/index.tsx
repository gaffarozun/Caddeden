// Powered by OnSpace.AI
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AdminLoading, AdminStat, LinkRow } from '@/components/admin/ui';
import { adminApi } from '@/services/adminService';
import { useAlert } from '@/template';
import { colors, fontSize, fontWeight, radius, spacing } from '@/constants/theme';

interface Overview {
  users: number;
  businesses: number;
  pendingBusinesses: number;
  activeAds: number;
  pendingAds: number;
  openComplaints: number;
  unreadAlerts: number;
  pendingContent: number;
  pendingCampaigns: number;
  pendingNotificationRequests: number;
  revenue: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [stats, setStats] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await adminApi.overview();
    if (error) showAlert('Hata', error, [{ text: 'Tamam' }]);
    else setStats(data as Overview);
    setLoading(false);
    setRefreshing(false);
  }, [showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <AdminLoading />;

  const s = stats ?? {
    users: 0, businesses: 0, pendingBusinesses: 0, activeAds: 0, pendingAds: 0, openComplaints: 0, unreadAlerts: 0, pendingContent: 0, pendingCampaigns: 0, pendingNotificationRequests: 0, revenue: 0,
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <Text style={styles.heading}>Genel Bakış</Text>

      <View style={styles.grid}>
        <AdminStat icon="account-group" label="Kullanıcı" value={s.users} tone="info" />
        <AdminStat icon="storefront" label="İşletme" value={s.businesses} tone="primary" />
        <AdminStat icon="clock-alert-outline" label="Bekleyen İşletme" value={s.pendingBusinesses} tone="warning" />
        <AdminStat icon="bullhorn" label="Aktif Reklam" value={s.activeAds} tone="success" />
        <AdminStat icon="timer-sand" label="Bekleyen Reklam" value={s.pendingAds} tone="warning" />
        <AdminStat icon="image-multiple-outline" label="Bekleyen İçerik" value={s.pendingContent + s.pendingCampaigns} tone="warning" />
        <AdminStat icon="alert-octagon-outline" label="Açık Şikâyet" value={s.openComplaints} tone="danger" />
      </View>

      <View style={styles.revenueCard}>
        <View style={styles.revenueHead}>
          <MaterialCommunityIcons name="cash-multiple" size={22} color={colors.white} />
          <Text style={styles.revenueLabel}>Toplam Gelir (tahsil edilen)</Text>
        </View>
        <Text style={styles.revenueValue}>{s.revenue.toLocaleString('tr-TR')} ₺</Text>
        <View style={styles.revenueNote}>
          <MaterialCommunityIcons name="information-outline" size={14} color="rgba(255,255,255,0.8)" />
          <Text style={styles.revenueNoteText}>
            Gerçek ödeme entegrasyonu (Stripe) henüz kurulmadı. Tutarlar manuel takip içindir.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Yönetim</Text>
      <View style={{ gap: spacing.sm }}>
        <LinkRow icon="bell-badge-outline" title="Başvuru Bildirimleri" subtitle="Yeni işletme ve reklam başvuruları" badge={s.unreadAlerts} tone="danger" onPress={() => router.push('/admin/alerts')} />
        <LinkRow icon="storefront-outline" title="İşletme Yönetimi" subtitle="Onay, yayın ve öne çıkarma" badge={s.pendingBusinesses} onPress={() => router.push('/admin/businesses')} />
        <LinkRow icon="image-check-outline" title="İçerik Onayı" subtitle="Gönderi, Reels ve kampanya onayı" badge={s.pendingContent + s.pendingCampaigns} tone="warning" onPress={() => router.push('/admin/content')} />
        <LinkRow icon="bell-plus-outline" title="Bildirim Talepleri" subtitle="İşletme bildirim gönderim talepleri" badge={s.pendingNotificationRequests} tone="warning" onPress={() => router.push('/admin/notification-requests')} />
        <LinkRow icon="bullhorn-outline" title="Reklam Yönetimi" subtitle="Başvuru, yayın ve ücretlendirme" badge={s.pendingAds} tone="success" onPress={() => router.push('/admin/ads')} />
        <LinkRow icon="tag-multiple-outline" title="Fiyatlandırma" subtitle="Reklam, içerik ve bildirim ücretleri" tone="success" onPress={() => router.push('/admin/packages')} />
        <LinkRow icon="bell-ring-outline" title="Bildirim Merkezi" subtitle="Duyuru ve kampanya gönder" tone="info" onPress={() => router.push('/admin/notifications')} />
        <LinkRow icon="account-cog-outline" title="Kullanıcı Yönetimi" subtitle="Hesap durumu ve kısıtlama" tone="info" onPress={() => router.push('/admin/users')} />
        <LinkRow icon="chart-line" title="Gelir Yönetimi" subtitle="Ödemeler ve raporlar" tone="success" onPress={() => router.push('/admin/revenue')} />
        <LinkRow icon="comment-text-multiple-outline" title="Müşteri Deneyimleri" subtitle="Deneyim alanını onayla/aç, yorum ve önerileri denetle" tone="primary" onPress={() => router.push('/admin/feedback')} />
        <LinkRow icon="flag-outline" title="Şikâyet ve Denetim" subtitle="İçerik ve kullanıcı şikâyetleri" badge={s.openComplaints} tone="danger" onPress={() => router.push('/admin/complaints')} />
        <LinkRow icon="history" title="İşlem Kayıtları" subtitle="Yönetici işlem geçmişi" tone="neutral" onPress={() => router.push('/admin/logs')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  heading: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  revenueCard: { backgroundColor: colors.text, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm, marginTop: spacing.sm },
  revenueHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  revenueLabel: { color: 'rgba(255,255,255,0.85)', fontSize: fontSize.sm },
  revenueValue: { color: colors.white, fontSize: fontSize.xxxl, fontWeight: fontWeight.bold, letterSpacing: -1 },
  revenueNote: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 4 },
  revenueNoteText: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: fontSize.xs, lineHeight: fontSize.xs * 1.5 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
});
