// Powered by OnSpace.AI
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { BusinessCard, MainCategoryTabs, SearchBar, SubCategoryBar } from '@/components';
import {
  countMainIn,
  fetchApprovedBusinesses,
  filterBusinessList,
  mergeBusinesses,
} from '@/services/businessService';
import { BUSINESSES } from '@/services/mockData';
import { Business } from '@/services/types';
import { MainCategoryId, getMainCategory } from '@/services/categories';
import { getOpenStatus } from '@/services/businessStatus';
import { useTheme } from '@/hooks/useTheme';
import { useRatings } from '@/hooks/useRatings';
import { DiscoveryRatingSort, discoveryRatingSorts, sortDiscoveryBusinesses } from '@/services/discoveryRatingService';
import { FeedbackChips } from '@/components/feature/FeedbackControls';
import { CampaignBanner } from '@/components/feature/CampaignBanner';
import { fontSize, fontWeight, radius, spacing, ThemeColors } from '@/constants/theme';

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [main, setMain] = useState<MainCategoryId>('yeme_icme');
  const [sub, setSub] = useState<string>('all');
  const [allBusinesses, setAllBusinesses] = useState<Business[]>(BUSINESSES);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [ratingSort, setRatingSort] = useState<DiscoveryRatingSort>('recommended');
  const { revision } = useRatings();

  // Business discovery preserves existing demo listings; paid campaigns are loaded
  // separately through the shared campaign hook and never merged with demo offers.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const real = await fetchApprovedBusinesses();
        if (!active) return;
        setAllBusinesses(mergeBusinesses(real, BUSINESSES));
      })();
      return () => {
        active = false;
      };
    }, [revision])
  );

  const businesses = useMemo(() => {
    const base = filterBusinessList(allBusinesses, main, sub, query);
    const withOpen = base.map((b) => ({ b, open: getOpenStatus(b).open }));
    const visible = onlyOpen ? withOpen.filter((x) => x.open) : withOpen;
    return sortDiscoveryBusinesses(visible.map((x) => x.b), ratingSort);
  }, [allBusinesses, main, sub, query, onlyOpen, ratingSort]);

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
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Caddeden</Text>
          <Text style={styles.brandSub}>İşletmeler, lezzetler ve sana özel keşifler</Text>
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
            <View style={styles.bleed}>
              <CampaignBanner main={main} />
            </View>
            <Text style={styles.pickTitle}>Ne keşfetmek istersin?</Text>
            <View style={styles.bleed}>
              <MainCategoryTabs selected={main} onSelect={handleMain} counts={counts} />
            </View>

            <View style={styles.bleed}>
              <SubCategoryBar main={main} selected={sub} onSelect={setSub} />
            </View>

            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionTitle}>{activeMain?.label ?? 'İşletmeler'}</Text>
                <Text style={styles.count}>{businesses.length} işletme · {discoveryRatingSorts.find(item => item.id === ratingSort)?.label}</Text>
              </View>
              <Pressable
                onPress={() => setOnlyOpen((v) => !v)}
                style={[styles.openFilter, onlyOpen && styles.openFilterActive]}
              >
                <MaterialCommunityIcons
                  name={onlyOpen ? 'door-open' : 'door-closed'}
                  size={15}
                  color={onlyOpen ? colors.onPrimary : colors.textSubtle}
                />
                <Text style={[styles.openFilterText, onlyOpen && { color: colors.onPrimary }]}>Sadece Açık</Text>
              </Pressable>
            </View>
            <View style={styles.ratingSort}>
              <FeedbackChips label="Müşteri puanına göre sırala" items={discoveryRatingSorts} selected={ratingSort} onSelect={value => setRatingSort(value as DiscoveryRatingSort)} />
              {ratingSort !== 'recommended' ? <Text style={styles.count}>Puanı olmayan işletmeler ve demo içerikler sonda gösterilir.</Text> : null}
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
      </KeyboardAvoidingView>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.primarySoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand,
  },
  brandSub: { fontSize: fontSize.sm, color: colors.textSubtle, marginTop: spacing.xs },
  brand: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.primaryDark, letterSpacing: -0.5 },
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
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  count: { fontSize: fontSize.sm, color: colors.textSubtle },
  ratingSort: { marginBottom: spacing.lg, gap: spacing.sm },
  openFilter: {
    minHeight: spacing.xxxl,
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
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.md },
  emptyText: { fontSize: fontSize.md, color: colors.textSubtle },
});
