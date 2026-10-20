import React, { memo, useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { useUniversity } from '@/hooks/useUniversity';
import { useUniversityMarquee } from '@/hooks/useUniversityMarquee';
import { universityColors as neon, universityLayout } from '@/constants/universityTheme';
import { fontSize, fontWeight, radius, spacing } from '@/constants/theme';
import { UniversityPublicMessage } from '@/services/universityService';

interface UniversityNeonHeaderProps {}
export const UniversityNeonHeader = memo(function UniversityNeonHeader(_: UniversityNeonHeaderProps) {
  return <View style={styles.header}>
    <LinearGradient colors={[neon.violet, neon.pink, neon.gold, neon.pink, neon.violet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerLine} />
    <View style={styles.titleFrame}>
      <MaterialCommunityIcons name="crown-outline" size={18} color={neon.gold} />
      <Text accessibilityRole="header" style={styles.headerTitle}>ÜNİVERSİTEDEN</Text>
      <MaterialCommunityIcons name="school-outline" size={18} color={neon.violet} />
    </View>
  </View>;
});

interface LightRailProps { bottom?: boolean }
const LightRail = memo(function LightRail({ bottom = false }: LightRailProps) {
  return <View style={[styles.lightRail, bottom ? styles.bottomRail : styles.topRail]}>
    <LinearGradient colors={[neon.violet, neon.pink, neon.gold, neon.cyan, neon.pink, neon.violet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
    <View style={styles.ledDots} />
  </View>;
});

interface MessageCycleProps {
  messages: UniversityPublicMessage[];
  minWidth: number;
  onLayout?: ReturnType<typeof useUniversityMarquee>['measureCycle'];
  duplicate?: boolean;
}
const MessageCycle = memo(function MessageCycle({ messages, minWidth, onLayout, duplicate = false }: MessageCycleProps) {
  const textColors = [neon.pink, neon.cyan, neon.gold, neon.violet];
  return <View onLayout={onLayout} style={[styles.cycle, { minWidth }]} accessibilityElementsHidden={duplicate} importantForAccessibility={duplicate ? 'no-hide-descendants' : 'auto'}>
    {messages.map((item, index) => {
      const color = textColors[index % textColors.length];
      return <View key={item.id} style={styles.message}>
        <MaterialCommunityIcons name={index % 2 === 0 ? 'heart-outline' : 'star-outline'} size={20} color={color} />
        <Text style={[styles.messageText, { color, textShadowColor: color }]} numberOfLines={1}>{item.text.toLocaleUpperCase('tr-TR')}</Text>
        <View style={styles.signature}>
          <MaterialCommunityIcons name="crown-outline" size={17} color={neon.gold} />
          <Text style={styles.signatureText}>CADDEDEN</Text>
        </View>
        <MaterialCommunityIcons name="star-outline" size={18} color={neon.violet} />
      </View>;
    })}
  </View>;
});

interface UniversityBannerProps { compact?: boolean }
export const UniversityBanner = memo(function UniversityBanner({ compact = false }: UniversityBannerProps) {
  const { messages, loading, error, refresh } = useUniversity();
  const router = useRouter();
  const visible = useMemo<UniversityPublicMessage[]>(() => messages.length ? messages : [{
    id: 'university-empty', published_at: '', text: error ? 'Yazılar yüklenemedi · Yeniden dene' : loading ? 'Kampüsten sesler hazırlanıyor' : 'İlk söz senin · Yazını gönder, onaylanınca burada aksın',
  }], [messages, loading, error]);
  const contentKey = useMemo(() => visible.map(item => `${item.id}:${item.text}`).join('|'), [visible]);
  const motion = useUniversityMarquee(contentKey);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const open = useCallback(() => router.push('/university'), [router]);
  return <View style={[styles.banner, compact ? styles.compact : null]}>
    <Pressable onPress={open} hitSlop={{ top: spacing.sm, bottom: spacing.sm }} accessibilityRole="button" accessibilityLabel="Üniversiteden · Yazı gönder" style={({ pressed }) => [styles.headerButton, pressed ? styles.pressed : null]}>
      <UniversityNeonHeader />
    </Pressable>
    <View style={styles.ticker}>
      <View onLayout={motion.measureViewport} style={styles.marquee} accessibilityLabel={motion.reduced ? undefined : `Üniversiteden. ${visible.map(item => item.text).join('. ')}`} accessible={!motion.reduced}>
        {motion.reduced ? <FlatList horizontal data={visible} keyExtractor={item => item.id} showsHorizontalScrollIndicator={false} style={styles.reducedList} contentContainerStyle={styles.accessibleMessages} renderItem={({ item }) => <Text style={styles.accessibleMessage}>{item.text}</Text>} /> : <Animated.View style={[styles.track, motion.trackStyle]}>
          <MessageCycle messages={visible} minWidth={motion.viewport} onLayout={motion.measureCycle} />
          <MessageCycle messages={visible} minWidth={motion.viewport} duplicate />
        </Animated.View>}
      </View>
      {error ? <Pressable onPress={() => void refresh()} accessibilityRole="button" accessibilityLabel="Yazıları yeniden yükle" style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialCommunityIcons name="refresh" size={18} color={neon.cyan} /></Pressable> : !motion.reduced ? <Pressable onPress={motion.toggle} accessibilityRole="button" accessibilityLabel={motion.paused ? 'Kayan yazıyı oynat' : 'Kayan yazıyı duraklat'} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialCommunityIcons name={motion.paused ? 'play-outline' : 'pause'} size={18} color={neon.violet} /></Pressable> : null}
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel="Üniversiteden için yazı gönder" style={({ pressed }) => [styles.iconButton, styles.writeButton, pressed ? styles.pressed : null]}><MaterialCommunityIcons name="pencil-outline" size={18} color={neon.pink} /></Pressable>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, motion.glowStyle]}><LightRail /><LightRail bottom /></Animated.View>
    </View>
  </View>;
});

const styles = StyleSheet.create({
  banner: { backgroundColor: neon.background, marginVertical: spacing.sm, overflow: 'hidden' },
  compact: { marginTop: 0 },
  headerButton: { height: universityLayout.headerHeight },
  header: { height: universityLayout.headerHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: neon.background },
  headerLine: { position: 'absolute', left: 0, right: 0, height: 2 },
  titleFrame: { height: universityLayout.headerHeight - spacing.xs, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: neon.surfaceTint, borderWidth: 1, borderColor: neon.violet, borderRadius: radius.sm, shadowColor: neon.pink, shadowRadius: spacing.sm, shadowOpacity: 0.85, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  headerTitle: { color: neon.gold, fontSize: fontSize.md, fontWeight: fontWeight.bold, includeFontPadding: false, letterSpacing: 1, textShadowColor: neon.pink, textShadowRadius: spacing.xs, textShadowOffset: { width: 0, height: 0 } },
  ticker: { height: universityLayout.height, flexDirection: 'row', alignItems: 'center', backgroundColor: neon.surface, borderLeftWidth: 2, borderLeftColor: neon.pink, borderRightWidth: 2, borderRightColor: neon.violet },
  lightRail: { position: 'absolute', left: 0, right: 0, height: universityLayout.railHeight, overflow: 'hidden' },
  topRail: { top: 0 },
  bottomRail: { bottom: 0 },
  ledDots: { ...StyleSheet.absoluteFillObject, borderTopWidth: 2, borderStyle: 'dotted', borderColor: neon.white },
  marquee: { flex: 1, minWidth: 1, height: universityLayout.height, overflow: 'hidden' },
  track: { position: 'absolute', left: 0, top: 0, height: universityLayout.height, flexDirection: 'row', alignItems: 'center' },
  cycle: { height: universityLayout.height, flexShrink: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  message: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginRight: spacing.lg, flexShrink: 0 },
  messageText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, includeFontPadding: false, textShadowRadius: spacing.xs, textShadowOffset: { width: 0, height: 0 } },
  signature: { alignItems: 'center', justifyContent: 'center', gap: 0, marginHorizontal: spacing.xs },
  signatureText: { color: neon.white, fontSize: fontSize.xs, fontWeight: fontWeight.bold, includeFontPadding: false },
  iconButton: { width: universityLayout.height, height: universityLayout.height, alignItems: 'center', justifyContent: 'center', backgroundColor: neon.surface },
  writeButton: { backgroundColor: neon.surfaceTint, borderLeftWidth: 1, borderLeftColor: neon.violet },
  pressed: { opacity: 0.65, transform: [{ scale: 0.97 }] },
  reducedList: { height: universityLayout.height },
  accessibleMessages: { paddingHorizontal: spacing.md, gap: spacing.xl, alignItems: 'center' },
  accessibleMessage: { color: neon.cyan, fontSize: fontSize.md, fontWeight: fontWeight.semibold, includeFontPadding: false },
});
