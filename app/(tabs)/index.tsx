// Powered by OnSpace.AI
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { BusinessCard, CampaignCard, MainCategoryTabs, SearchBar, SubCategoryBar } from '@/components';
import {
  countMainIn,
  fetchApprovedBusinesses,
  filterBusinessList,
  getCampaignBusinesses,
  mergeBusinesses,
} from '@/services/businessService';
import { DiscoverCampaign, fetchDiscoverCampaigns } from '@/services/campaignService';
import { BUSINESSES } from '@/services/mockData';
import { Business } from '@/services/types';
import { MainCategoryId, getMainCategory, getSubCategory } from '@/services/categories';
import { getOpenStatus } from '@/services/businessStatus';
import { useTheme } from '@/hooks/useTheme';
import { fontSize, fontWeight, radius, spacing, ThemeColors } from '@/constants/theme';

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [main, setMain] = useState<MainCategoryId>('yeme_icme');
  const [sub, setSub] = useState<string>('all');
  const [allBusinesses, setAllBusinesses] = useState<Business[]>(BUSINESSES);
  const [realCampaigns, setRealCampaigns] = useState<DiscoverCampaign[]>([]);
  const [onlyOpen, setOnlyOpen] = useState(false);

  // Load approved+published businesses and approved campaigns from the database
  // on each focus, then merge with demo data so real listings appear instantly.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [real, camps] = await Promise.all([fetchApprovedBusinesses(), fetchDiscoverCampaigns()]);
        if (!active) return;
        setAllBusinesses(mergeBusinesses(real, BUSINESSES));
        setRealCampaigns(camps);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const businesses = useMemo(() => {
    const base = filterBusinessList(allBusinesses, main, sub, query);
    const withOpen = base.map((b) => ({ b, open: getOpenStatus(b).open }));
    const visible = onlyOpen ? withOpen.filter((x) => x.open) : withOpen;
    visible.sort((a, z) => Number(z.open) - Number(a.open));
    return visible.map((x) => x.b);
  }, [allBusinesses, main, sub, query, onlyOpen]);

  const campaigns = useMemo(() => {
    const mockItems: DiscoverCampaign[] = getCampaignBusinesses().map((b) => ({
      id: `mock-${b.id}`,
      businessId: b.id,
      title: b.campaign ?? 'Kampanya',
      name: b.name,
      category: b.category,
      cover: b.cover,
      main: getSubCategory(b.category)?.main,
    }));
    return [...realCampaigns, ...mockItems].filter((c) => c.main === main);
  }, [realCampaigns, main]);

  const counts = useMemo(
    () => ({
      yeme_icme: countMainIn(allBusinesses, 'yeme_icme'),
      guzellik_bakim: countMainIn(allBusinesses, 'guzellik_bakim'),
    }),
    [allBusinesses]
  );
  const activeMain = getMainCategory(main);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleMain = (id: MainCategoryId) => {
    setMain(id);
    setSub('all');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Caddeden</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} />
      </View>

      <FlatList
        data={businesses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BusinessCard business={item} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.pickTitle}>Ne keşfetmek istersin?</Text>
            <View style={styles.bleed}>
              <MainCategoryTabs selected={main} onSelect={handleMain} counts={counts} />
            </View>

            {campaigns.length > 0 ? (
              <View style={styles.bleed}>
                <View style={styles.sectionHeadPad}>
                  <Text style={styles.sectionTitle}>Güncel Kampanyalar</Text>
                  <MaterialCommunityIcons name="fire" size={18} color={colors.primary} />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.campaignRow}
                >
                  {campaigns.map((c) => (
                    <CampaignCard
                      key={c.id}
                      id={c.id}
                      businessId={c.businessId}
                      title={c.title}
                      name={c.name}
                      category={c.category}
                      cover={c.cover}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.bleed}>
              <SubCategoryBar main={main} selected={sub} onSelect={setSub} />
            </View>

            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionTitle}>{activeMain?.label ?? 'İşletmeler'}</Text>
                <Text style={styles.count}>{businesses.length} işletme</Text>
              </View>
              <Pressable
                onPress={() => setOnlyOpen((v) => !v)}
                style={[styles.openFilter, onlyOpen && styles.openFilterActive]}
              >
                <MaterialCommunityIcons
                  name={onlyOpen ? 'door-open' : 'door-closed'}
                  size={15}
                  color={onlyOpen ? colors.white : colors.textSubtle}
                />
                <Text style={[styles.openFilterText, onlyOpen && { color: colors.white }]}>Sadece Açık</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="store-search-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>Bu kategoride henüz işletme bulunamadı.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  brand: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, letterSpacing: -0.5 },
  searchWrap: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  bleed: { marginHorizontal: -spacing.lg },
  pickTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionHeadPad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  count: { fontSize: fontSize.sm, color: colors.textSubtle },
  openFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  openFilterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  openFilterText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSubtle },
  campaignRow: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.md },
  emptyText: { fontSize: fontSize.md, color: colors.textSubtle },
});
