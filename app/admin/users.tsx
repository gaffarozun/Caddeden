// Powered by OnSpace.AI
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AdminEmpty, AdminLoading, SmallButton, StatusPill } from '@/components/admin/ui';
import { adminApi } from '@/services/adminService';
import { useAlert } from '@/template';
import { fontSize, fontWeight, radius, spacing, ThemeColors } from '@/constants/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';

interface UserRow {
  id: string;
  username?: string | null;
  email?: string | null;
  role: string;
  status: string;
  restricted_until?: string | null;
}

const plusDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

export default function AdminUsers() {
  const { colors, styles } = useThemeStyles(createStyles);
  const { showAlert } = useAlert();
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await adminApi.listUsers();
    if (error) showAlert('Hata', error, [{ text: 'Tamam' }]);
    else setItems((data?.users as UserRow[]) ?? []);
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

  const renderItem = ({ item }: { item: UserRow }) => {
    const roleTone = item.role === 'admin' ? 'primary' : 'neutral';
    const roleLabel = item.role === 'admin' ? 'Yönetici' : item.role === 'business' ? 'İşletme' : 'Kullanıcı';
    const statusTone = item.status === 'active' ? 'success' : item.status === 'restricted' ? 'warning' : 'danger';
    const statusLabel = item.status === 'active' ? 'Aktif' : item.status === 'restricted' ? 'Kısıtlı' : 'Yasaklı';
    const isAdmin = item.role === 'admin';
    return (
      <View style={styles.card}>
        <View style={styles.rowTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{item.username || item.email || 'Kullanıcı'}</Text>
            <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
          </View>
          <View style={styles.pills}>
            <StatusPill label={roleLabel} tone={roleTone} />
            <StatusPill label={statusLabel} tone={statusTone} />
          </View>
        </View>

        {isAdmin ? (
          <Text style={styles.note}>Yönetici hesapları kısıtlanamaz.</Text>
        ) : (
          <View style={styles.actions}>
            {item.status === 'active' ? (
              <>
                <SmallButton label="3 gün kısıtla" icon="clock-outline" tone="warning" outline onPress={() => run(adminApi.restrictUser(item.id, 'restricted', plusDays(3)))} />
                <SmallButton label="Yasakla" icon="block-helper" tone="danger" outline onPress={() => run(adminApi.restrictUser(item.id, 'banned', null))} />
              </>
            ) : (
              <SmallButton label="Aktifleştir" icon="check" tone="success" onPress={() => run(adminApi.restrictUser(item.id, 'active', null))} />
            )}
          </View>
        )}
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
      ListEmptyComponent={<AdminEmpty icon="account-group-outline" text="Henüz kullanıcı yok." />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  email: { fontSize: fontSize.xs, color: colors.textSubtle, marginTop: 2 },
  pills: { gap: 4, alignItems: 'flex-end' },
  note: { fontSize: fontSize.xs, color: colors.textFaint, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
