// Powered by OnSpace.AI
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { categoryLabel } from '@/services/categories';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { fontSize, fontWeight, radius, shadow, spacing, ThemeColors } from '@/constants/theme';

interface CampaignCardProps {
  id: string;
  businessId: string;
  title: string;
  name: string;
  category: string;
  cover: string;
}

export function CampaignCard({ id, businessId, title, name, category, cover }: CampaignCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, isSavedCampaign, toggleSaveCampaign } = useApp();
  const isBusiness = user.type === 'business';
  const saved = isSavedCampaign(id);

  return (
    <Pressable
      onPress={() => router.push(`/business/${businessId}`)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
    >
      <Image source={{ uri: cover }} style={styles.image} contentFit="cover" transition={200} />
      <LinearGradient colors={['transparent', 'rgba(15,12,10,0.85)']} style={styles.overlay} />
      <View style={styles.tag}>
        <Text style={styles.tagText} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {!isBusiness ? (
        <Pressable
          style={styles.saveBtn}
          hitSlop={8}
          onPress={() =>
            toggleSaveCampaign({ id, businessId, businessName: name, image: cover, caption: title })
          }
        >
          <MaterialCommunityIcons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? colors.primary : colors.white}
          />
        </Pressable>
      ) : null}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.cat}>{categoryLabel(category)}</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      width: 240,
      height: 150,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surfaceTint,
      ...(shadow.sm as object),
    },
    image: { ...StyleSheet.absoluteFillObject },
    overlay: { ...StyleSheet.absoluteFillObject },
    tag: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.md,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      maxWidth: 160,
    },
    tagText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
    saveBtn: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md },
    name: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
    cat: { color: 'rgba(255,255,255,0.85)', fontSize: fontSize.sm, marginTop: 2 },
  });
