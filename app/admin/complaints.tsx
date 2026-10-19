// Powered by OnSpace.AI
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AdminEmpty, AdminLoading, SmallButton, StatusPill } from '@/components/admin/ui';
import { adminApi } from '@/services/adminService';
import { useAlert } from '@/template';
import { colors, fontSize, fontWeight, radius, spacing } from '@/constants/theme';

interface Complaint {
  id: string;
  target_type: string;
  target_id?: string | null;
  reason: string;
  description?: string | null;
  status: string;
  created_at: string;
}

export default function AdminComplaints() {
  const { showAlert } = useAlert();
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await adminApi.listComplaints();
    if (error) showAlert('Hata', error, [{ text: 'Tamam' }]);
    else setItems((data?.complaints as Complaint[]) ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (promise: Promise<{ error: string | null }>) => {
    const { error } = await promise;
    if (error) showAlert('Hata', error, [{ text: 'Tamam' }]);
    else load();
  };

  const targetLabel = (t: string) => (t === 'business' ? 'İşletme' : t === 'user' ? 'Kullanıcı' : t === 'post' ? 'Gönderi' : t === 'reel' ? 'Reel' : t);

  const renderItem = ({ item }: { item: Complaint }) => {
    const tone = item.status === 'resolved' ? 'success' : item.status === 'dismissed' ? 'neutral' : item.status === 'reviewing' ? 'info' : 'warning';
    const label = item.status === 'resolved' ? 'Çözüldü' : item.status === 'dismissed' ? 'Yoksayıldı' : item.status === 'reviewing' ? 'İnceleniyor' : 'Açık';
    return (
      <View style={styles.card}>
        <View style={styles.rowTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reason} numberOfLines={1}>{item.reason}</Text>
            <Text style={styles.meta}>{targetLabel(item.target_type)} · {(item.target_id ?? '').slice(0, 8)}</Text>
          </View>
          <StatusPill label={label} tone={tone} />
        </View>
        {item.description ? <Text style={styles.desc} numberOfLines={3}>{item.description}</Text> : null}
        <View style={styles.actions}>
          <SmallButton label="İncele" icon="eye-outline" tone="info" outline onPress={() => run(adminApi.updateComplaint(item.id, 'reviewing'))} />
          <SmallButton label="Çözüldü" icon="check" tone="success" onPress={() => run(adminApi.updateComplaint(item.id, 'resolved'))} />
          <SmallButton label="Yoksay" icon="close" tone="neutral" outline onPress={() => run(adminApi.updateComplaint(item.id, 'dismissed'))} />
        </View>
      </View>
    );
  };

  if (loading) return <AdminLoading />;

  return (
    <FlatList
      style={styles.screen}
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      ListEmptyComponent={<AdminEmpty icon="flag-outline" text="Şikâyet bulunmuyor." />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reason: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textSubtle, marginTop: 2 },
  desc: { fontSize: fontSize.sm, color: colors.textSubtle, lineHeight: fontSize.sm * 1.5 },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
