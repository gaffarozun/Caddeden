import React, { memo, useCallback, useMemo } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient as SvgGradient, Polygon, Stop } from 'react-native-svg';
import Animated from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { useUniversity } from '@/hooks/useUniversity';
import { useUniversityMarquee } from '@/hooks/useUniversityMarquee';
import { universityColors as led } from '@/constants/universityTheme';
import { fontSize, fontWeight, spacing } from '@/constants/theme';
import { UniversityPublicMessage } from '@/services/universityService';

interface LedRailProps { width: number; lower?: boolean }
// Only the decorative light rows are clipped from the supplied image; all visible words are live, accessible Text.
const LedRail = memo(function LedRail({ width, lower = false }: LedRailProps) {
  const artworkWidth = Math.max(960, width);
  const scale = artworkWidth / 2072;
  return <View style={styles.rail} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Image source={require('@/assets/images/university-reference.png')} contentFit="fill" transition={0}
      style={{ position: 'absolute', width: artworkWidth, height: 759 * scale, top: -(lower ? 329 : 211) * scale, left: -(artworkWidth - width) / 2 }} />
  </View>;
});

export const UniversityNeonHeader = memo(function UniversityNeonHeader() {
  return <View style={styles.header}>
    <View style={styles.headerLine} />
    <MaterialCommunityIcons name="chevron-double-left" size={32} color={led.pink} style={styles.leftArrow} />
    <MaterialCommunityIcons name="chevron-double-left" size={32} color={led.cyan} style={styles.rightArrow} />
    <View style={styles.titleFrame}>
      <Svg width="100%" height="100%" viewBox="0 0 360 68" preserveAspectRatio="none" style={StyleSheet.absoluteFillObject}>
        <Defs><SvgGradient id="university-frame" x1="0%" y1="0%" x2="100%" y2="0%"><Stop offset="0" stopColor={led.violet} /><Stop offset="0.3" stopColor={led.pink} /><Stop offset="0.65" stopColor={led.orange} /><Stop offset="1" stopColor={led.violet} /></SvgGradient></Defs>
        <Polygon points="4,34 24,4 336,4 356,34 336,64 24,64" fill={led.panelGlow} stroke={led.violet} strokeWidth="8" opacity={0.28} />
        <Polygon points="4,34 24,4 336,4 356,34 336,64 24,64" fill={led.panel} stroke="url(#university-frame)" strokeWidth="3" />
        <Polygon points="13,34 31,11 329,11 347,34 329,57 31,57" fill={led.panel} stroke={led.pink} strokeWidth="1.4" />
        <Polygon points="23,34 38,17 322,17 337,34 322,51 38,51" fill={led.panel} stroke={led.orange} strokeWidth="0.6" opacity={0.65} />
      </Svg>
      <View style={styles.titleIcons} pointerEvents="none"><MaterialCommunityIcons name="crown-outline" size={23} color={led.gold} /><MaterialCommunityIcons name="school-outline" size={25} color={led.violet} /></View>
      <Text accessibilityRole="header" adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.title}>ÜNİVERSİTEDEN</Text>
    </View>
  </View>;
});

interface MessageCycleProps { messages: UniversityPublicMessage[]; minWidth: number; onLayout?: ReturnType<typeof useUniversityMarquee>['measureCycle']; duplicate?: boolean }
const textColors = [led.pink, led.cyan, led.gold, led.violet];
const MessageCycle = memo(function MessageCycle({ messages, minWidth, onLayout, duplicate = false }: MessageCycleProps) {
  return <View onLayout={onLayout} style={[styles.cycle, { minWidth }]} accessibilityElementsHidden={duplicate} importantForAccessibility={duplicate ? 'no-hide-descendants' : 'auto'}>
    {messages.map((item, index) => {
      const color = textColors[index % textColors.length];
      return <View key={item.id} style={styles.message}>
        <MaterialCommunityIcons name={index % 2 === 0 ? 'heart-outline' : 'star-outline'} size={27} color={color} />
        <Text style={[styles.messageText, { color, textShadowColor: color }]} numberOfLines={1}>{item.text.toLocaleUpperCase('tr-TR')}</Text>
        <View style={styles.signature} accessible={false}><MaterialCommunityIcons name="crown-outline" size={22} color={led.gold} /><Text style={styles.signatureText}>CADDEDEN</Text></View>
        <MaterialCommunityIcons name="star-four-points-outline" size={19} color={led.orange} />
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
  return <View style={[styles.banner, compact ? styles.compact : null]} onLayout={motion.measureViewport}>
    <UniversityNeonHeader />
    <Animated.View style={motion.glowStyle} pointerEvents="none"><LedRail width={motion.viewport} /></Animated.View>
    <View style={styles.marquee} accessibilityLabel={`Üniversiteden. ${visible.map(item => item.text).join('. ')}`} accessible>
      <Animated.View style={[styles.track, motion.trackStyle]}>
        <MessageCycle messages={visible} minWidth={motion.viewport} onLayout={motion.measureCycle} />
        <MessageCycle messages={visible} minWidth={motion.viewport} duplicate />
      </Animated.View>
      <View style={styles.edgeMark} pointerEvents="none"><MaterialCommunityIcons name="chevron-left" size={37} color={led.pink} /></View>
    </View>
    <Animated.View style={motion.glowStyle} pointerEvents="none"><LedRail width={motion.viewport} lower /></Animated.View>
    {motion.reduced ? <FlatList horizontal data={visible} keyExtractor={item => item.id} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accessibleMessages} renderItem={({ item }) => <Text style={styles.accessibleMessage}>{item.text}</Text>} /> : null}
    <View style={styles.footer}>
      <Text style={styles.footerNote} numberOfLines={1}>Kampüsün sesi · Yönetici onaylı</Text>
      {error ? <Pressable onPress={() => void refresh()} accessibilityRole="button" accessibilityLabel="Yazıları yeniden yükle" style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialCommunityIcons name="refresh" size={20} color={led.gold} /></Pressable> : null}
      {!motion.reduced ? <Pressable onPress={motion.toggle} accessibilityRole="button" accessibilityLabel={motion.paused ? 'Kayan yazıyı oynat' : 'Kayan yazıyı duraklat'} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialCommunityIcons name={motion.paused ? 'play-outline' : 'pause'} size={20} color={led.muted} /></Pressable> : null}
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel="Üniversiteden için yazı gönder" style={({ pressed }) => [styles.writeButton, pressed ? styles.pressed : null]}><MaterialCommunityIcons name="pencil-outline" size={17} color={led.pink} /><Text style={styles.writeText}>Yazı gönder</Text></Pressable>
    </View>
  </View>;
});

const styles = StyleSheet.create({
  banner: { backgroundColor: led.background, marginTop: spacing.lg, marginBottom: spacing.sm, overflow: 'hidden', paddingTop: spacing.sm },
  compact: { marginTop: 0 },
  header: { height: 66, justifyContent: 'center', alignItems: 'center' },
  headerLine: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: led.pink, opacity: 0.5, shadowColor: led.pink, shadowRadius: 8, shadowOpacity: 1, shadowOffset: { width: 0, height: 0 } },
  leftArrow: { position: 'absolute', left: spacing.xs }, rightArrow: { position: 'absolute', right: spacing.xs },
  titleFrame: { width: '82%', maxWidth: 480, height: 58, alignItems: 'center', justifyContent: 'center' },
  titleIcons: { position: 'absolute', top: -9, flexDirection: 'row', gap: spacing.xxl },
  title: { color: led.gold, fontSize: fontSize.xl, fontWeight: fontWeight.bold, letterSpacing: 0.9, textShadowColor: led.orange, textShadowRadius: 9, textShadowOffset: { width: 0, height: 0 }, paddingHorizontal: spacing.lg, includeFontPadding: false },
  rail: { height: 11, overflow: 'hidden', backgroundColor: led.background },
  marquee: { height: 62, overflow: 'hidden', backgroundColor: led.panel, borderLeftWidth: 2, borderLeftColor: led.pink },
  track: { position: 'absolute', left: 0, top: 0, height: 62, flexDirection: 'row', alignItems: 'center' },
  cycle: { height: 62, flexShrink: 0, flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.xl, paddingRight: spacing.xl },
  message: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginRight: spacing.xxl, flexShrink: 0 },
  messageText: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, letterSpacing: 0.5, includeFontPadding: false, textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 }, ...(Platform.OS === 'android' ? { fontFamily: 'sans-serif-condensed' } : {}) },
  signature: { alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing.xs },
  signatureText: { color: led.white, fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: -0.3, textShadowColor: led.cyan, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
  edgeMark: { position: 'absolute', left: -12, top: 12 },
  footer: { minHeight: spacing.xxxl, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  footerNote: { flex: 1, color: led.muted, fontSize: fontSize.xs, includeFontPadding: false },
  iconButton: { width: spacing.xxxl, height: spacing.xxxl, alignItems: 'center', justifyContent: 'center' },
  writeButton: { minHeight: spacing.xxxl, flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  writeText: { color: led.pink, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  pressed: { opacity: 0.65, transform: [{ scale: 0.97 }] },
  accessibleMessages: { padding: spacing.md, gap: spacing.lg },
  accessibleMessage: { color: led.white, fontSize: fontSize.md, maxWidth: 280, lineHeight: fontSize.md * 1.6 },
});
