import React, { memo, useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { useUniversity } from '@/hooks/useUniversity';
import { useUniversityMarquee } from '@/hooks/useUniversityMarquee';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { universityLayout } from '@/constants/universityTheme';
import { fontSize, fontWeight, spacing, ThemeColors } from '@/constants/theme';
import { UniversityPublicMessage } from '@/services/universityService';

interface UniversityNeonHeaderProps {}
export const UniversityNeonHeader = memo(function UniversityNeonHeader(_: UniversityNeonHeaderProps) {
  const { colors, styles } = useThemeStyles(createStyles);
  return <View style={styles.header}>
    <MaterialCommunityIcons name="school-outline" size={20} color={colors.primary} />
    <Text accessibilityRole="header" style={styles.headerTitle}>ÜNİVERSİTEDEN</Text>
  </View>;
});

interface MessageCycleProps {
  messages: UniversityPublicMessage[];
  minWidth: number;
  onLayout?: ReturnType<typeof useUniversityMarquee>['measureCycle'];
  duplicate?: boolean;
}
const MessageCycle = memo(function MessageCycle({ messages, minWidth, onLayout, duplicate = false }: MessageCycleProps) {
  const { colors, styles } = useThemeStyles(createStyles);
  const textColors = [colors.primary, colors.info, colors.success, colors.primaryDark];
  return <View onLayout={onLayout} style={[styles.cycle, { minWidth }]} accessibilityElementsHidden={duplicate} importantForAccessibility={duplicate ? 'no-hide-descendants' : 'auto'}>
    {messages.map((item, index) => {
      const color = textColors[index % textColors.length];
      return <View key={item.id} style={styles.message}>
        <MaterialCommunityIcons name={index % 2 === 0 ? 'heart-outline' : 'star-outline'} size={16} color={color} />
        <Text style={[styles.messageText, { color, textShadowColor: color }]} numberOfLines={1}>{item.text.toLocaleUpperCase('tr-TR')}</Text>
        <MaterialCommunityIcons name="star-four-points-outline" size={14} color={colors.brand} />
      </View>;
    })}
  </View>;
});

interface UniversityBannerProps { compact?: boolean }
export const UniversityBanner = memo(function UniversityBanner({ compact = false }: UniversityBannerProps) {
  const { messages, loading, error, refresh } = useUniversity();
  const { colors, styles } = useThemeStyles(createStyles);
  const router = useRouter();
  const visible = useMemo<UniversityPublicMessage[]>(() => messages.length ? messages : [{
    id: 'university-empty', published_at: '', text: error ? 'Yazılar yüklenemedi · Yeniden dene' : loading ? 'Kampüsten sesler hazırlanıyor' : 'İlk söz senin · Yazını gönder, onaylanınca burada aksın',
  }], [messages, loading, error]);
  const contentKey = useMemo(() => visible.map(item => `${item.id}:${item.text}`).join('|'), [visible]);
  const motion = useUniversityMarquee(contentKey);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const open = useCallback(() => router.push('/university'), [router]);
  return <View style={[styles.banner, compact ? styles.compact : null]}>
    <Animated.View style={[styles.lightRail, styles.topRail, motion.glowStyle]} pointerEvents="none" />
    <Animated.View style={[styles.lightRail, styles.bottomRail, motion.glowStyle]} pointerEvents="none" />
    <Pressable onPress={open} accessibilityRole="button" accessibilityLabel="Üniversiteden · Yazı gönder" style={({ pressed }) => [styles.labelButton, pressed ? styles.pressed : null]}>
      <MaterialCommunityIcons name="school-outline" size={16} color={colors.primary} />
      <Text style={styles.labelText} numberOfLines={1}>Üniversiteden</Text>
    </Pressable>
    <View onLayout={motion.measureViewport} style={styles.marquee} accessibilityLabel={motion.reduced ? undefined : `Üniversiteden. ${visible.map(item => item.text).join('. ')}`} accessible={!motion.reduced}>
      {motion.reduced ? <FlatList horizontal data={visible} keyExtractor={item => item.id} showsHorizontalScrollIndicator={false} style={styles.reducedList} contentContainerStyle={styles.accessibleMessages} renderItem={({ item }) => <Text style={styles.accessibleMessage}>{item.text}</Text>} /> : <Animated.View style={[styles.track, motion.trackStyle]}>
        <MessageCycle messages={visible} minWidth={motion.viewport} onLayout={motion.measureCycle} />
        <MessageCycle messages={visible} minWidth={motion.viewport} duplicate />
      </Animated.View>}
    </View>
    {error ? <Pressable onPress={() => void refresh()} accessibilityRole="button" accessibilityLabel="Yazıları yeniden yükle" style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialCommunityIcons name="refresh" size={18} color={colors.primary} /></Pressable> : !motion.reduced ? <Pressable onPress={motion.toggle} accessibilityRole="button" accessibilityLabel={motion.paused ? 'Kayan yazıyı oynat' : 'Kayan yazıyı duraklat'} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialCommunityIcons name={motion.paused ? 'play-outline' : 'pause'} size={18} color={colors.textSubtle} /></Pressable> : null}
    <Pressable onPress={open} accessibilityRole="button" accessibilityLabel="Üniversiteden için yazı gönder" style={({ pressed }) => [styles.iconButton, styles.writeButton, pressed ? styles.pressed : null]}><MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} /></Pressable>
  </View>;
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  banner: { height: universityLayout.height, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginTop: spacing.sm, marginBottom: spacing.sm, overflow: 'hidden' },
  compact: { marginTop: 0 },
  lightRail: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.brand, zIndex: 1, shadowColor: colors.brand, shadowRadius: spacing.xs, shadowOpacity: 0.6, shadowOffset: { width: 0, height: 0 } },
  topRail: { top: 0 },
  bottomRail: { bottom: 0 },
  header: { height: universityLayout.height, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primarySoft },
  headerTitle: { color: colors.primary, fontSize: fontSize.md, fontWeight: fontWeight.bold, includeFontPadding: false, textShadowColor: colors.brand, textShadowRadius: 2, textShadowOffset: { width: 0, height: 0 } },
  labelButton: { width: universityLayout.labelWidth, height: universityLayout.height, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs, backgroundColor: colors.primarySoft, borderRightWidth: 1, borderRightColor: colors.border },
  labelText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.bold, includeFontPadding: false },
  marquee: { flex: 1, minWidth: 1, height: universityLayout.height, overflow: 'hidden', backgroundColor: colors.surface },
  track: { position: 'absolute', left: 0, top: 0, height: universityLayout.height, flexDirection: 'row', alignItems: 'center' },
  cycle: { height: universityLayout.height, flexShrink: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  message: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginRight: spacing.xl, flexShrink: 0 },
  messageText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, includeFontPadding: false, textShadowRadius: 2, textShadowOffset: { width: 0, height: 0 } },
  iconButton: { width: universityLayout.height, height: universityLayout.height, alignItems: 'center', justifyContent: 'center' },
  writeButton: { backgroundColor: colors.primarySoft, borderLeftWidth: 1, borderLeftColor: colors.border },
  pressed: { opacity: 0.65, transform: [{ scale: 0.97 }] },
  reducedList: { height: universityLayout.height },
  accessibleMessages: { paddingHorizontal: spacing.md, gap: spacing.xl, alignItems: 'center' },
  accessibleMessage: { color: colors.primary, fontSize: fontSize.md, fontWeight: fontWeight.semibold, includeFontPadding: false },
});
