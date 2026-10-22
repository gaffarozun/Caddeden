// Powered by OnSpace.AI
import React, { useMemo } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BusinessCard, MainCategoryTabs, SearchBar, SubCategoryBar } from '@/components';
import { useDiscoveryFeed } from '@/hooks/useDiscoveryFeed';
import { useTheme } from '@/hooks/useTheme';
import { DiscoveryRatingSort, discoveryRatingSorts } from '@/services/discoveryRatingService';
import { FeedbackChips } from '@/components/feature/FeedbackControls';
import { CampaignBanner } from '@/components/feature/CampaignBanner';
import { fontSize, fontWeight, radius, spacing, ThemeColors } from '@/constants/theme';

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const { query, setQuery, main, sub, setSub, onlyOpen, setOnlyOpen, ratingSort, setRatingSort,
    businesses, counts, activeMain, handleMain, refreshing, refresh } = useDiscoveryFeed();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
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
                accessibilityRole="button"
                accessibilityLabel="Sadece açık işletmeleri göster"
                accessibilityState={{ selected: onlyOpen }}
                style={({ pressed }) => [styles.openFilter, onlyOpen ? styles.openFilterActive : null, pressed ? styles.pressed : null]}
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
              <FeedbackChips label="İşletme sıralaması" hideLabel compact items={discoveryRatingSorts} selected={ratingSort} onSelect={value => setRatingSort(value as DiscoveryRatingSort)} />
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
  pressed: { opacity: 0.72 },
  openFilterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  openFilterText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSubtle },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.md },
  emptyText: { fontSize: fontSize.md, color: colors.textSubtle },
});
