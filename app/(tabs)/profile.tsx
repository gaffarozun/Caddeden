// Powered by OnSpace.AI
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Avatar, BusinessCard, Button, ContentViewer } from '@/components';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useAlert } from '@/template';
import { getSupabaseClient } from '@/template';
import { fetchBusinessesByIds } from '@/services/businessService';
import { categoryLabel } from '@/services/categories';
import { Business, SavedMedia } from '@/services/types';
import {
  OrderRow,
  ReservationRow,
  listMyOrders,
  listMyReservations,
} from '@/services/businessRequestService';
import { fontSize, fontWeight, radius, spacing, ThemeColors } from '@/constants/theme';

interface OwnedBusiness {
  id: string;
  name: string;
  category: string;
  approval_status: string;
  is_published: boolean;
}

const THEME_OPTIONS = [
  { id: 'light', label: 'Açık', icon: 'weather-sunny' },
  { id: 'dark', label: 'Koyu', icon: 'weather-night' },
  { id: 'system', label: 'Sistem', icon: 'theme-light-dark' },
] as const;

const SAVED_TABS = [
  { id: 'business', label: 'İşletme', icon: 'storefront-outline' },
  { id: 'post', label: 'Gönderi', icon: 'image-outline' },
  { id: 'reel', label: 'Reels', icon: 'play-box-outline' },
  { id: 'campaign', label: 'Kampanya', icon: 'sale' },
] as const;

type SavedTab = (typeof SAVED_TABS)[number]['id'];

export default function ProfileScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { authUser, isAdmin, isBusiness } = useAuth();
  const {
    user,
    savedBusinessIds,
    savedPosts,
    savedReels,
    savedCampaigns,
    notificationsEnabled,
    setNotificationsEnabled,
    logout,
  } = useApp();

  const [owned, setOwned] = useState<OwnedBusiness[]>([]);
  const [savedBusinesses, setSavedBusinesses] = useState<Business[]>([]);
  const [myReservations, setMyReservations] = useState<ReservationRow[]>([]);
  const [myOrders, setMyOrders] = useState<OrderRow[]>([]);
  const [savedTab, setSavedTab] = useState<SavedTab>('business');
  const [viewerMedia, setViewerMedia] = useState<SavedMedia | null>(null);
  const [viewerKind, setViewerKind] = useState<'reel' | 'post' | 'campaign'>('post');
  const isGuest = user.type === 'guest';

  const openViewer = (media: SavedMedia, kind: 'reel' | 'post' | 'campaign') => {
    setViewerKind(kind);
    setViewerMedia(media);
  };
  const publishedCount = owned.filter((b) => b.approval_status === 'approved' && b.is_published).length;
  const pendingCount = owned.filter((b) => b.approval_status === 'pending').length;
  // Business accounts (or legacy owners who already have businesses) get the
  // business management view; everyone else gets the customer view.
  const showBusinessView = isBusiness || owned.length > 0;

  const loadOwned = useCallback(async () => {
    if (!authUser) {
      setOwned([]);
      setMyReservations([]);
      setMyOrders([]);
      return;
    }
    const { data } = await getSupabaseClient()
      .from('businesses')
      .select('id, name, category, approval_status, is_published')
      .eq('owner_id', authUser.id)
      .order('created_at', { ascending: false });
    setOwned((data as OwnedBusiness[]) ?? []);
    const [res, ord] = await Promise.all([
      listMyReservations(authUser.id),
      listMyOrders(authUser.id),
    ]);
    setMyReservations(res.data);
    setMyOrders(ord.data);
  }, [authUser]);

  useFocusEffect(
    useCallback(() => {
      loadOwned();
    }, [loadOwned])
  );

  // Keep the saved list in sync with saved ids (real DB + mock). Updates
  // immediately when a business is saved or removed anywhere in the app.
  useEffect(() => {
    let active = true;
    (async () => {
      const list = await fetchBusinessesByIds(savedBusinessIds);
      if (active) setSavedBusinesses(list);
    })();
    return () => {
      active = false;
    };
  }, [savedBusinessIds]);

  const handleLogout = () => {
    showAlert('Çıkış yap', 'Hesabından çıkmak istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const statusTone = (b: OwnedBusiness): 'success' | 'danger' | 'warning' =>
    b.approval_status === 'approved' ? 'success' : b.approval_status === 'rejected' ? 'danger' : 'warning';
  const statusLabel = (b: OwnedBusiness) =>
    b.approval_status === 'approved' ? (b.is_published ? 'Yayında' : 'Onaylı') : b.approval_status === 'rejected' ? 'Reddedildi' : 'Onay bekliyor';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Avatar name={user.name} size={60} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.type}>
              {isAdmin
                ? 'Yönetici Hesabı'
                : isBusiness
                ? 'İşletme Hesabı'
                : isGuest
                ? 'Misafir olarak geziniyorsun'
                : authUser?.email ?? 'Üye'}
            </Text>
          </View>
          {isGuest ? (
            <Pressable style={styles.loginBtn} onPress={() => router.push('/auth')}>
              <Text style={styles.loginBtnText}>Giriş</Text>
            </Pressable>
          ) : null}
        </View>

        {isAdmin ? (
          <Pressable style={styles.adminBanner} onPress={() => router.push('/admin')}>
            <View style={styles.adminIcon}>
              <MaterialCommunityIcons name="shield-crown-outline" size={24} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminTitle}>Yönetici Paneli</Text>
              <Text style={styles.adminSub}>İstatistikler, onaylar, reklam ve gelir yönetimi</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.white} />
          </Pressable>
        ) : null}

        <View style={styles.stats}>
          {showBusinessView ? (
            <>
              <Stat icon="storefront-outline" label="İşletmem" value={owned.length} />
              <Stat icon="check-decagram-outline" label="Yayında" value={publishedCount} />
              <Stat icon="clock-outline" label="Onayda" value={pendingCount} />
            </>
          ) : (
            <>
              <Stat icon="calendar-check" label="Randevu" value={myReservations.length} />
              <Stat icon="receipt" label="Sipariş" value={myOrders.length} />
              <Stat icon="bookmark" label="Kayıtlı" value={savedBusinesses.length + savedPosts.length + savedReels.length + savedCampaigns.length} />
            </>
          )}
        </View>

        {isGuest ? (
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Hesabını oluştur</Text>
            <Text style={styles.ctaText}>Sipariş ver, rezervasyon yap ve favori işletmelerini kaydet.</Text>
            <Button label="Giriş Yap / Kayıt Ol" icon="login" onPress={() => router.push('/auth')} />
          </View>
        ) : null}

        {showBusinessView ? (
          <Section title="İşletmelerim" icon="storefront-outline">
          {owned.length === 0 ? (
            <View style={styles.ownedEmpty}>
              <Text style={styles.ownedEmptyText}>
                {isGuest ? 'İşletme eklemek için giriş yap.' : 'Henüz işletmen yok. İşletmeni ekle, yönetici onayından sonra yayınlansın.'}
              </Text>
              <Button
                label="İşletme Ekle"
                icon="plus"
                variant="secondary"
                onPress={() => (isGuest ? router.push('/auth') : router.push('/business/register'))}
              />
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              <Text style={styles.ownedHint}>Profilini, fiyat listesini ve konumunu düzenlemek için işletmene dokun.</Text>
              <Button label="Gelen Talepler (Sipariş & Rezervasyon)" icon="bell-ring-outline" onPress={() => router.push('/business/requests')} />
              {owned.map((b) => (
                <Pressable key={b.id} style={styles.ownedRow} onPress={() => router.push(`/business/manage/${b.id}`)}>
                  <View style={styles.ownedIcon}>
                    <MaterialCommunityIcons name="storefront-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ownedName} numberOfLines={1}>{b.name}</Text>
                    <Text style={styles.ownedCat}>{categoryLabel(b.category)}</Text>
                  </View>
                  <Pill label={statusLabel(b)} tone={statusTone(b)} />
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textFaint} />
                </Pressable>
              ))}
              <Button label="Yeni İşletme Ekle" icon="plus" variant="secondary" onPress={() => router.push('/business/register')} />
              <Button label="Reels / Gönderi Paylaş" icon="image-plus" variant="secondary" onPress={() => router.push('/business/posts')} />
              <Button label="Kampanya Ekle" icon="sale" variant="secondary" onPress={() => router.push('/business/campaigns')} />
              <Button label="Reklam Ver / Başvurularım" icon="bullhorn-outline" variant="secondary" onPress={() => router.push('/business/ads')} />
            </View>
          )}
        </Section>
        ) : null}

        {!showBusinessView ? (
          <Section title="Kayıtlılarım" icon="bookmark-multiple-outline">
            <View style={styles.savedTabs}>
              {SAVED_TABS.map((t) => {
                const active = savedTab === t.id;
                const count =
                  t.id === 'business'
                    ? savedBusinesses.length
                    : t.id === 'post'
                    ? savedPosts.length
                    : t.id === 'reel'
                    ? savedReels.length
                    : savedCampaigns.length;
                return (
                  <Pressable key={t.id} onPress={() => setSavedTab(t.id)} style={[styles.savedTab, active && styles.savedTabActive]}>
                    <MaterialCommunityIcons
                      name={t.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={16}
                      color={active ? colors.white : colors.textSubtle}
                    />
                    <Text style={[styles.savedTabText, active && { color: colors.white }]} numberOfLines={1}>{t.label}</Text>
                    <View style={[styles.savedTabBadge, active && styles.savedTabBadgeActive]}>
                      <Text style={[styles.savedTabBadgeText, active && { color: colors.white }]}>{count}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {savedTab === 'business' ? (
              savedBusinesses.length > 0 ? (
                <View style={{ gap: spacing.md }}>
                  {savedBusinesses.map((b) => (
                    <BusinessCard key={b.id} business={b} />
                  ))}
                </View>
              ) : (
                <SavedEmpty text="Henüz kayıtlı işletmen yok. İşletme kartındaki yer imi simgesine dokunarak kaydet." />
              )
            ) : null}

            {savedTab === 'post' ? (
              savedPosts.length > 0 ? (
                <View style={styles.mediaGrid}>
                  {savedPosts.map((m) => (
                    <SavedMediaCard key={m.id} media={m} onPress={() => openViewer(m, 'post')} />
                  ))}
                </View>
              ) : (
                <SavedEmpty text="Henüz kayıtlı gönderin yok. Gönderilerdeki Kaydet simgesine dokunarak gönderiyi kaydet." />
              )
            ) : null}

            {savedTab === 'reel' ? (
              savedReels.length > 0 ? (
                <View style={styles.mediaGrid}>
                  {savedReels.map((m) => (
                    <SavedMediaCard key={m.id} media={m} onPress={() => openViewer(m, 'reel')} />
                  ))}
                </View>
              ) : (
                <SavedEmpty text="Henüz kayıtlı Reels yok. Reels ekranındaki Kaydet butonuna dokunarak Reels'i kaydet." />
              )
            ) : null}

            {savedTab === 'campaign' ? (
              savedCampaigns.length > 0 ? (
                <View style={styles.mediaGrid}>
                  {savedCampaigns.map((m) => (
                    <SavedMediaCard key={m.id} media={m} onPress={() => openViewer(m, 'campaign')} />
                  ))}
                </View>
              ) : (
                <SavedEmpty text="Henüz kayıtlı kampanyan yok. Keşfet'teki kampanya kartındaki Kaydet simgesine dokunarak kampanyayı kaydet." />
              )
            ) : null}
          </Section>
        ) : null}

        {!showBusinessView ? (
          <Section title="Hesabım" icon="account-circle-outline">
            <Button
              label="Geçmiş Siparişler & Randevular"
              icon="history"
              variant="secondary"
              onPress={() => router.push('/history')}
            />
          </Section>
        ) : null}

        <Section title="Ayarlar" icon="cog">
          <View style={styles.themeCard}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="palette-outline" size={20} color={colors.textSubtle} />
              <Text style={styles.settingText}>Tema</Text>
            </View>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((opt) => {
                const active = mode === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setMode(opt.id)}
                    style={[styles.themeBtn, active && styles.themeBtnActive]}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={16}
                      color={active ? colors.white : colors.textSubtle}
                    />
                    <Text style={[styles.themeBtnText, active && { color: colors.white }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="bell-outline" size={20} color={colors.textSubtle} />
              <Text style={styles.settingText}>Bildirimler</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.white}
            />
          </View>

          {!isGuest ? (
            <Pressable style={styles.linkRow} onPress={() => router.push('/profile-edit')}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="account-edit-outline" size={20} color={colors.textSubtle} />
                <Text style={styles.settingText}>Hesap Bilgilerim</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />
            </Pressable>
          ) : null}

          <Pressable style={styles.linkRow} onPress={() => router.push(isAdmin ? '/admin' : '/admin-setup')}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="shield-account-outline" size={20} color={colors.textSubtle} />
              <Text style={styles.settingText}>Yönetici</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />
          </Pressable>

          {!isGuest ? (
            <Pressable style={styles.linkRow} onPress={handleLogout}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
                <Text style={[styles.settingText, { color: colors.danger }]}>Çıkış Yap</Text>
              </View>
            </Pressable>
          ) : null}
        </Section>

        <Text style={styles.footer}>Caddeden · Sürüm 1.1</Text>
      </ScrollView>

      <ContentViewer
        visible={!!viewerMedia}
        media={viewerMedia}
        kind={viewerKind}
        onClose={() => setViewerMedia(null)}
        onOpenBusiness={(businessId) => {
          setViewerMedia(null);
          router.push(`/business/${businessId}`);
        }}
      />
    </SafeAreaView>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.statItem}>
      <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={18} color={colors.text} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function SavedMediaCard({ media, onPress }: { media: SavedMedia; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable style={styles.mediaCard} onPress={onPress}>
      <Image source={{ uri: media.image }} style={styles.mediaImg} contentFit="cover" transition={150} />
      <Text style={styles.mediaName} numberOfLines={1}>{media.businessName}</Text>
    </Pressable>
  );
}

function SavedEmpty({ text }: { text: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.savedEmpty}>
      <Text style={styles.savedEmptyText}>{text}</Text>
    </View>
  );
}

function Pill({ label, tone }: { label: string; tone: 'success' | 'danger' | 'warning' }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const map = {
    success: { bg: colors.successSoft, fg: colors.success },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    warning: { bg: colors.warningSoft, fg: colors.warning },
  } as const;
  const t = map[tone];
  return (
    <View style={[styles.statusTag, { backgroundColor: t.bg }]}>
      <Text style={[styles.statusTagText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
    headerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
    type: { fontSize: fontSize.sm, color: colors.textSubtle, marginTop: 2 },
    loginBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill },
    loginBtnText: { color: colors.white, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
    adminBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.text,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    adminIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    adminTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.surface },
    adminSub: { fontSize: fontSize.xs, color: colors.surface, opacity: 0.75, marginTop: 2 },
    stats: { flexDirection: 'row', gap: spacing.md },
    statItem: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      paddingVertical: spacing.md,
      gap: 2,
    },
    statValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
    statLabel: { fontSize: fontSize.xs, color: colors.textSubtle },
    ctaCard: { backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
    ctaTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primaryDark },
    ctaText: { fontSize: fontSize.sm, color: colors.text, marginBottom: spacing.sm },
    section: { gap: spacing.md },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
    ownedEmpty: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    ownedEmptyText: { fontSize: fontSize.sm, color: colors.textSubtle, lineHeight: fontSize.sm * 1.5 },
    ownedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.md,
    },
    ownedHint: { fontSize: fontSize.xs, color: colors.textSubtle, lineHeight: fontSize.xs * 1.5, marginBottom: spacing.xs },
    ownedIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    ownedName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
    ownedCat: { fontSize: fontSize.xs, color: colors.textSubtle, marginTop: 2 },
    emptyCoupon: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
    emptyImg: { width: 120, height: 120 },
    emptyText: { fontSize: fontSize.sm, color: colors.textSubtle, textAlign: 'center' },
    themeCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.md,
    },
    themeRow: { flexDirection: 'row', gap: spacing.sm },
    themeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    themeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    themeBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSubtle },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    settingText: { fontSize: fontSize.md, color: colors.text },
    statusTag: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
    statusTagText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
    savedTabs: { flexDirection: 'row', gap: spacing.sm },
    savedTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    savedTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    savedTabText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSubtle },
    savedTabBadge: { minWidth: 18, paddingHorizontal: 5, paddingVertical: 1, borderRadius: radius.pill, backgroundColor: colors.surfaceTint, alignItems: 'center' },
    savedTabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
    savedTabBadgeText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.textSubtle },
    mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    mediaCard: { width: 104, gap: 4 },
    mediaImg: { width: 104, height: 104, borderRadius: radius.md, backgroundColor: colors.surfaceTint },
    mediaName: { fontSize: fontSize.xs, color: colors.text, fontWeight: fontWeight.medium },
    savedEmpty: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
    savedEmptyText: { fontSize: fontSize.sm, color: colors.textSubtle, lineHeight: fontSize.sm * 1.5 },
    footer: { textAlign: 'center', fontSize: fontSize.xs, color: colors.textFaint, marginTop: spacing.md },
  });
