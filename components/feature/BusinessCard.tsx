// Powered by OnSpace.AI
import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Business } from '@/services/types';
import { getSubCategory } from '@/services/categories';
import { getOpenStatus } from '@/services/businessStatus';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { Badge } from '@/components/ui/Badge';
import { fontSize, fontWeight, radius, shadow, spacing, ThemeColors } from '@/constants/theme';

interface BusinessCardProps {
  business: Business;
}

export const BusinessCard = memo(function BusinessCard({ business }: BusinessCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, savedBusinessIds, toggleSaveBusiness } = useApp();
  const isBusiness = user.type === 'business';
  const saved = savedBusinessIds.includes(business.id);
  const cat = getSubCategory(business.category);
  const status = getOpenStatus(business);
  const closed = !status.open;
  const isDemo = !/^[0-9a-f-]{36}$/i.test(business.id);

  return (
    <Pressable
      onPress={() => router.push(`/business/${business.id}`)}
      style={({ pressed }) => [styles.card, closed && styles.cardClosed, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: business.cover }}
          style={[styles.image, closed && styles.imageClosed]}
          contentFit="cover"
          transition={200}
        />
        {closed ? <View style={styles.imageGray} /> : null}
        {closed ? (
          <View style={styles.closedTag}>
            <Text style={styles.closedTagText}>Kapalı</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.name, closed && styles.nameClosed]} numberOfLines={1}>
            {business.name}
          </Text>
          {!isBusiness ? (
            <Pressable hitSlop={10} onPress={() => toggleSaveBusiness(business.id)}>
              <MaterialCommunityIcons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={saved ? colors.primary : colors.textFaint}
              />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons
            name={(cat?.icon ?? 'store') as keyof typeof MaterialCommunityIcons.glyphMap}
            size={14}
            color={colors.textSubtle}
          />
          <Text style={styles.meta}>{cat?.label}</Text>
          <Text style={styles.dot}>·</Text>
          <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
          <Text style={styles.meta}>{isDemo ? `${business.rating.toFixed(1)} · Demo` : business.reviewCount ? `${business.rating.toFixed(1)} (${business.reviewCount})` : 'Henüz puan yok'}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{business.distanceKm} km</Text>
        </View>

        <View style={styles.bottomRow}>
          {business.campaign ? <Badge label={business.campaign} tone="primary" /> : <View />}
          <Badge label={status.label} tone={status.open ? 'success' : 'neutral'} />
        </View>
      </View>
    </Pressable>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      gap: spacing.md,
      ...(shadow.sm as object),
    },
    cardClosed: { backgroundColor: colors.surfaceAlt },
    imageWrap: {
      width: 92,
      height: 92,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surfaceTint,
    },
    image: { width: '100%', height: '100%' },
    imageClosed: { opacity: 0.5 },
    imageGray: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(125,125,125,0.5)',
    },
    closedTag: {
      position: 'absolute',
      bottom: 6,
      left: 6,
      backgroundColor: 'rgba(20,18,16,0.72)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
    },
    closedTagText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
    body: { flex: 1, justifyContent: 'space-between', paddingVertical: 2 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    name: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, marginRight: spacing.sm },
    nameClosed: { color: colors.textSubtle },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginVertical: 4 },
    meta: { fontSize: fontSize.xs, color: colors.textSubtle, fontWeight: fontWeight.medium },
    dot: { color: colors.textFaint, marginHorizontal: 2 },
    bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  });
