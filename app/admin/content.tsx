// Powered by OnSpace.AI
// Admin content approval: posts/reels and campaigns. All reads/writes go through
// the server-verified admin-api edge function (service role).
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AdminEmpty, AdminLoading, FilterTabs, SmallButton, StatusPill } from '@/components/admin/ui';
import { adminApi } from '@/services/adminService';
import { categoryLabel } from '@/services/categories';
import { timeAgo } from '@/services/contentService';
import { useAlert } from '@/template';
import { colors, fontSize, fontWeight, radius, spacing } from '@/constants/theme';

type Section = 'content' | 'campaign';
type Tone = 'success' | 'warning' | 'danger';

interface Row {
  id: string;
  kind?: string;
  title?: string | null;
  caption?: string | null;
  image_url: string | null;
  status: string;
  price?: number;
  payment_status?: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  businesses?: { name?: string; category?: string } | null;
}

const STATUS_TABS = [
  { id: 'pending', label: 'Bekleyen' },
  { id: 'approved', label: 'Onaylı' },
  { id: 'rejected', label: 'Red' },
  { id: 'all', label: 'Tümü' },
];

export default function AdminContent() {
  const { showAlert } = useAlert();
  const [section, setSection] = useState<Section>('content');
  const [filter, setFilter] = useState('pending');
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const status = filter === 'all' ? undefined : filter;
    const res = section === 'content' ? await adminApi.listContent(status) : await adminApi.listCampaigns(status);
    if (res.error) showAlert('Hata', res.error, [{ text: 'Tamam' }]);
    else setItems(((section === 'content' ? res.data?.content : res.data?.campaigns) as Row[]) ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [section, filter, showAlert]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const run = async (promise: Promise<{ error: string | null }>, msg?: string) => {
    const { error } = await promise;
    if (error) {
      showAlert('Hata', error, [{ text: 'Tamam' }]);
      return;
    }
    if (msg) showAlert('Başarılı', msg, [{ text: 'Tamam' }]);
    load();
  };

  const approve = (r: Row) =>
    run(
      section === 'content'
        ? adminApi.updateContentStatus(r.id, 'approved')
        : adminApi.updateCampaignStatus(r.id, 'approved'),
      'Onaylandı ve yayına alındı.'
    );

  const reject = (r: Row) =>
    showAlert('Reddet', 'Bu içerik reddedilsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Reddet',
        style: 'destructive',
        onPress: () =>
          run(
            section === 'content'
              ? adminApi.updateContentStatus(r.id, 'rejected', 'Yönetici tarafından reddedildi')
              : adminApi.updateCampaignStatus(r.id, 'rejected', 'Yönetici tarafından reddedildi'),
            'Reddedildi.'
          ),
      },
    ]);

  const markPaid = (r: Row) => {
    const paid = r.payment_status === 'paid';
    run(
      section === 'content'
        ? adminApi.setContentPaid(r.id, paid ? 'unpaid' : 'paid')
        : adminApi.setCampaignPaid(r.id, paid ? 'unpaid' : 'paid')
    );
  };

  const statusMeta = (status: string): { label: string; tone: Tone } =>
    status === 'approved'
      ? { label: 'Onaylı', tone: 'success' }
      : status === 'rejected'
      ? { label: 'Reddedildi', tone: 'danger' }
      : { label: 'Bekliyor', tone: 'warning' };

  const renderItem = ({ item }: { item: Row }) => {
    const st = statusMeta(item.status);
    const typeLabel = section === 'content' ? (item.kind === 'reel' ? 'Reels' : 'Gönderi') : 'Kampanya';
    const typeTone = section === 'content' ? (item.kind === 'reel' ? 'primary' : 'info') : 'primary';
    const text = section === 'content' ? item.caption : item.title;
    return (
      <View style={styles.card}>
        <View style={styles.rowTop}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.thumb} contentFit="cover" transition={150} />
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]}>
              <MaterialCommunityIcons name={section === 'content' ? 'image-outline' : 'sale'} size={22} color={colors.textFaint} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View style={styles.badges}>
              <StatusPill label={typeLabel} tone={typeTone} />
              <StatusPill label={st.label} tone={st.tone} />
            </View>
            <Text style={styles.biz} numberOfLines={1}>{item.businesses?.name ?? 'İşletme'}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {categoryLabel(item.businesses?.category)} · {timeAgo(item.created_at)}
            </Text>
          </View>
        </View>
        {text ? <Text style={styles.caption} numberOfLines={3}>{text}</Text> : null}
        <View style={styles.payRow}>
          <Text style={styles.price}>{Number(item.price ?? 0).toLocaleString('tr-TR')} ₺</Text>
          <StatusPill label={item.payment_status === 'paid' ? 'Ödendi' : 'Ödenmedi'} tone={item.payment_status === 'paid' ? 'success' : 'warning'} />
        </View>
        {item.end_date ? <Text style={styles.dates}>Yayın: {item.start_date ?? '-'} → {item.end_date}</Text> : null}
        <View style={styles.actions}>
          {item.status !== 'approved' ? (
            <SmallButton label="Onayla" icon="check" tone="success" onPress={() => approve(item)} />
          ) : null}
          {item.status !== 'rejected' ? (
            <SmallButton label="Reddet" icon="close" tone="danger" outline onPress={() => reject(item)} />
          ) : null}
          <SmallButton
            label={item.payment_status === 'paid' ? 'Ödemeyi geri al' : 'Ödendi işaretle'}
            icon="cash"
            tone={item.payment_status === 'paid' ? 'neutral' : 'primary'}
            outline
            onPress={() => markPaid(item)}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.segment}>
        <Pressable onPress={() => setSection('content')} style={[styles.segBtn, section === 'content' && styles.segBtnActive]}>
          <MaterialCommunityIcons name="image-multiple-outline" size={16} color={section === 'content' ? colors.white : colors.textSubtle} />
          <Text style={[styles.segText, section === 'content' && { color: colors.white }]}>Gönderi & Reels</Text>
        </Pressable>
        <Pressable onPress={() => setSection('campaign')} style={[styles.segBtn, section === 'campaign' && styles.segBtnActive]}>
          <MaterialCommunityIcons name="sale" size={16} color={section === 'campaign' ? colors.white : colors.textSubtle} />
          <Text style={[styles.segText, section === 'campaign' && { color: colors.white }]}>Kampanyalar</Text>
        </Pressable>
      </View>
      <View style={styles.tabsWrap}>
        <FilterTabs options={STATUS_TABS} value={filter} onChange={setFilter} />
      </View>
      {loading ? (
        <AdminLoading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={<AdminEmpty icon="image-check-outline" text="Bu durumda içerik yok." />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  segment: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  segBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSubtle },
  tabsWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, paddingTop: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  rowTop: { flexDirection: 'row', gap: spacing.md },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceTint },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: 4 },
  biz: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textSubtle, marginTop: 2 },
  caption: { fontSize: fontSize.sm, color: colors.text },
  payRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  dates: { fontSize: fontSize.xs, color: colors.textSubtle },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
