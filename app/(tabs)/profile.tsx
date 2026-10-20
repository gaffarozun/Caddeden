// Powered by OnSpace.AI
import React, { memo } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Avatar, Button } from '@/components';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useProfileOverview } from '@/hooks/useProfileOverview';
import { AppearanceSettings } from '@/components/feature/AppearanceSettings';
import { useAlert } from '@/template';
import { categoryLabel } from '@/services/categories';
import { OwnedBusiness } from '@/services/profileOverviewService';
import { fontSize, fontWeight, radius, spacing, ThemeColors } from '@/constants/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function ProfileScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { colors, styles } = useThemeStyles(createStyles);
  const { authUser, isAdmin, isBusiness } = useAuth();
  const { user, savedBusinessIds, savedPosts, savedReels, savedCampaigns, notificationsEnabled, setNotificationsEnabled, logout } = useApp();
  const { owned, myReservations, myOrders, error } = useProfileOverview();
  const isGuest = user.type === 'guest';
  const showBusinessView = isBusiness || owned.length > 0;
  const publishedCount = owned.filter(item => item.approval_status === 'approved' && item.is_published).length;
  const pendingCount = owned.filter(item => item.approval_status === 'pending').length;
  const savedCount = savedBusinessIds.length + savedPosts.length + savedReels.length + savedCampaigns.length;

  const handleLogout = () => showAlert('Çıkış yap', 'Hesabından çıkmak istiyor musun?', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout() },
  ]);

  return <SafeAreaView style={styles.screen} edges={['top']}>
    <FlatList<OwnedBusiness>
      style={styles.screen}
      data={showBusinessView ? owned : []}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <OwnedBusinessRow business={item} />}
      ItemSeparatorComponent={ProfileSeparator}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={<View style={styles.blocks}>
        <View style={styles.headerCard}>
          <Avatar name={user.name} size={60} />
          <View style={styles.info}><Text style={styles.name}>{user.name}</Text><Text style={styles.type}>{isAdmin ? 'Yönetici Hesabı' : isBusiness ? 'İşletme Hesabı' : isGuest ? 'Misafir olarak geziniyorsun' : authUser?.email ?? 'Üye'}</Text></View>
          {isGuest ? <Pressable accessibilityRole="button" style={({ pressed }) => [styles.loginBtn, pressed ? styles.pressed : null]} onPress={() => router.push('/auth')}><Text style={styles.loginBtnText}>Giriş</Text></Pressable> : null}
        </View>

        {isAdmin ? <Pressable accessibilityRole="button" style={({ pressed }) => [styles.adminBanner, pressed ? styles.pressed : null]} onPress={() => router.push('/admin')}>
          <View style={styles.adminIcon}><MaterialCommunityIcons name="shield-crown-outline" size={24} color={colors.onPrimary} /></View>
          <View style={styles.info}><Text style={styles.adminTitle}>Yönetici Paneli</Text><Text style={styles.adminSub}>İstatistikler, onaylar, reklam ve gelir yönetimi</Text></View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
        </Pressable> : null}

        <View style={styles.stats}>{showBusinessView ? <>
          <Stat icon="storefront-outline" label="İşletmem" value={owned.length} />
          <Stat icon="check-decagram-outline" label="Yayında" value={publishedCount} />
          <Stat icon="clock-outline" label="Onayda" value={pendingCount} />
        </> : <>
          <Stat icon="calendar-check-outline" label="Randevu" value={myReservations.length} />
          <Stat icon="receipt-text-outline" label="Sipariş" value={myOrders.length} />
          <Stat icon="bookmark-outline" label="Kayıtlı" value={savedCount} />
        </>}</View>

        {error ? <View style={styles.errorRow} accessibilityLiveRegion="polite"><MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View> : null}

        {isGuest ? <View style={styles.ctaCard}><Text style={styles.ctaTitle}>Hesabını oluştur</Text><Text style={styles.ctaText}>Sipariş ver, rezervasyon yap ve favori işletmelerini kaydet.</Text><Button label="Giriş Yap / Kayıt Ol" icon="login" onPress={() => router.push('/auth')} /></View> : null}

        {showBusinessView ? <Section title="İşletmelerim" icon="storefront-outline">
          {owned.length === 0 ? <View style={styles.ownedEmpty}><Text style={styles.ownedEmptyText}>{isGuest ? 'İşletme eklemek için giriş yap.' : 'Henüz işletmen yok. İşletmeni ekle, yönetici onayından sonra yayınlansın.'}</Text><Button label="İşletme Ekle" icon="plus" variant="secondary" onPress={() => router.push(isGuest ? '/auth' : '/business/register')} /></View> : <><Text style={styles.ownedHint}>Profilini, fiyat listesini ve konumunu düzenlemek için işletmene dokun.</Text><Button label="Gelen Talepler (Sipariş & Rezervasyon)" icon="bell-ring-outline" onPress={() => router.push('/business/requests')} /></>}
        </Section> : <>
          <Section title="Kayıtlılarım" icon="bookmark-multiple-outline">
            <Pressable accessibilityRole="button" accessibilityLabel={`Tüm kayıtlarım, ${savedCount} kayıt`} style={({ pressed }) => [styles.savedLink, pressed ? styles.pressed : null]} onPress={() => router.push('/saved')}>
              <View style={styles.savedIcon}><MaterialCommunityIcons name="bookmark-multiple-outline" size={24} color={colors.primary} /></View>
              <View style={styles.info}><Text style={styles.savedTitle}>Tüm kayıtlarım</Text><Text style={styles.savedSubtitle}>{savedCount} kayıt · İşletme, gönderi, Reels ve kampanya</Text></View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
            </Pressable>
          </Section>
          <Section title="Hesabım" icon="account-circle-outline"><Button label="Geçmiş Siparişler & Randevular" icon="history" variant="secondary" onPress={() => router.push('/history')} /></Section>
        </>}
      </View>}
      ListFooterComponent={<View style={styles.blocks}>
        {showBusinessView && owned.length > 0 ? <View style={styles.businessLinks}>
          <Button label="Yeni İşletme Ekle" icon="plus" variant="secondary" onPress={() => router.push('/business/register')} />
          <Button label="Reels / Gönderi Paylaş" icon="image-plus" variant="secondary" onPress={() => router.push('/business/posts')} />
          <Button label="Kampanya Ekle" icon="sale" variant="secondary" onPress={() => router.push('/business/campaigns')} />
          <Button label="Reklam Ver / Başvurularım" icon="bullhorn-outline" variant="secondary" onPress={() => router.push('/business/ads')} />
        </View> : null}
        <Section title="Ayarlar" icon="cog-outline">
          <AppearanceSettings />
          <View style={styles.settingRow}><View style={styles.settingLeft}><MaterialCommunityIcons name="bell-outline" size={20} color={colors.textSubtle} /><Text style={styles.settingText}>Bildirimler</Text></View><Switch accessibilityLabel="Bildirimler" value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ true: colors.primary, false: colors.border }} thumbColor={colors.onPrimary} /></View>
          {!isGuest ? <SettingLink icon="account-edit-outline" label="Hesap Bilgilerim" onPress={() => router.push('/profile-edit')} /> : null}
          <SettingLink icon="shield-account-outline" label="Yönetici" onPress={() => router.push(isAdmin ? '/admin' : '/admin-setup')} />
          {!isGuest && !isAdmin ? <SettingLink icon="account-remove-outline" label="Hesabımı Sil" danger onPress={() => router.push('/account-delete')} /> : null}
          {!isGuest ? <SettingLink icon="logout" label="Çıkış Yap" danger onPress={handleLogout} /> : null}
        </Section>
        <Text style={styles.footer}>Caddeden · Sürüm 1.1</Text>
      </View>}
    />
  </SafeAreaView>;
}

interface StatProps { icon: IconName; label: string; value: number }
const Stat = memo(function Stat({ icon, label, value }: StatProps) {
  const { colors, styles } = useThemeStyles(createStyles);
  return <View style={styles.statItem}><MaterialCommunityIcons name={icon} size={22} color={colors.primary} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
});

interface SectionProps { title: string; icon: IconName; children: React.ReactNode }
function Section({ title, icon, children }: SectionProps) {
  const { colors, styles } = useThemeStyles(createStyles);
  return <View style={styles.section}><View style={styles.sectionHead}><MaterialCommunityIcons name={icon} size={18} color={colors.text} /><Text style={styles.sectionTitle}>{title}</Text></View>{children}</View>;
}

interface OwnedBusinessRowProps { business: OwnedBusiness }
const OwnedBusinessRow = memo(function OwnedBusinessRow({ business: b }: OwnedBusinessRowProps) {
  const router = useRouter();
  const { colors, styles } = useThemeStyles(createStyles);
  const tone = b.approval_status === 'approved' ? 'success' : b.approval_status === 'rejected' ? 'danger' : 'warning';
  const label = b.approval_status === 'approved' ? b.is_published ? 'Yayında' : 'Onaylı' : b.approval_status === 'rejected' ? 'Reddedildi' : 'Onay bekliyor';
  const bg = tone === 'success' ? colors.successSoft : tone === 'danger' ? colors.dangerSoft : colors.warningSoft;
  return <Pressable accessibilityRole="button" style={({ pressed }) => [styles.ownedRow, pressed ? styles.pressed : null]} onPress={() => router.push(`/business/manage/${b.id}`)}>
    <View style={styles.ownedIcon}><MaterialCommunityIcons name="storefront-outline" size={20} color={colors.primary} /></View>
    <View style={styles.info}><Text style={styles.ownedName} numberOfLines={1}>{b.name}</Text><Text style={styles.ownedCat}>{categoryLabel(b.category)}</Text></View>
    <View style={[styles.statusTag, { backgroundColor: bg }]}><Text style={[styles.statusTagText, { color: colors[tone] }]}>{label}</Text></View>
    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textFaint} />
  </Pressable>;
});

interface SettingLinkProps { label: string; icon: IconName; onPress: () => void; danger?: boolean }
const SettingLink = memo(function SettingLink({ label, icon, onPress, danger = false }: SettingLinkProps) {
  const { colors, styles } = useThemeStyles(createStyles);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.linkRow, pressed ? styles.pressed : null]} onPress={onPress}><View style={styles.settingLeft}><MaterialCommunityIcons name={icon} size={20} color={danger ? colors.danger : colors.textSubtle} /><Text style={[styles.settingText, danger ? { color: colors.danger } : null]}>{label}</Text></View><MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} /></Pressable>;
});
const ProfileSeparator = memo(function ProfileSeparator() { return <View style={separatorStyles.space} />; });
const separatorStyles = StyleSheet.create({ space: { height: spacing.sm } });

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, width: '100%', maxWidth: 960, alignSelf: 'center' },
  blocks: { gap: spacing.lg, paddingVertical: spacing.sm },
  info: { flex: 1, minWidth: 0, gap: spacing.xs },
  headerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.brand },
  name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, includeFontPadding: false },
  type: { fontSize: fontSize.sm, color: colors.textSubtle },
  loginBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, minHeight: spacing.xxxl, justifyContent: 'center', borderRadius: radius.pill },
  loginBtnText: { color: colors.onPrimary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  adminBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.brand, borderRadius: radius.lg, padding: spacing.md },
  adminIcon: { width: spacing.xxxl, height: spacing.xxxl, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  adminTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  adminSub: { fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.6, color: colors.textSubtle },
  stats: { flexDirection: 'row', gap: spacing.md },
  statItem: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
  statValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textSubtle },
  ctaCard: { backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  ctaTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primaryDark },
  ctaText: { fontSize: fontSize.md, lineHeight: fontSize.md * 1.6, color: colors.text, marginBottom: spacing.sm },
  section: { gap: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  ownedEmpty: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md },
  ownedEmptyText: { fontSize: fontSize.md, color: colors.textSubtle, lineHeight: fontSize.md * 1.6 },
  ownedRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md },
  ownedHint: { fontSize: fontSize.sm, color: colors.textSubtle, lineHeight: fontSize.sm * 1.6 },
  ownedIcon: { width: spacing.xxxl, height: spacing.xxxl, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  ownedName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  ownedCat: { fontSize: fontSize.xs, color: colors.textSubtle },
  businessLinks: { gap: spacing.sm },
  savedLink: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.brand, backgroundColor: colors.surface },
  savedIcon: { width: spacing.xxxl, height: spacing.xxxl, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  savedTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text, includeFontPadding: false },
  savedSubtitle: { fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.6, color: colors.textSubtle },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: spacing.xxxl },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, minHeight: spacing.xxxl },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  settingText: { fontSize: fontSize.md, color: colors.text },
  statusTag: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill },
  statusTagText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  errorRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerSoft },
  errorText: { flex: 1, fontSize: fontSize.md, lineHeight: fontSize.md * 1.6, color: colors.danger },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  footer: { textAlign: 'center', fontSize: fontSize.xs, color: colors.textFaint, marginTop: spacing.md },
});
