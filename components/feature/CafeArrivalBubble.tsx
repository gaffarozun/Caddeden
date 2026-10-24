import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CafeArrivalModel } from '@/hooks/useCafeArrival';
import { useBubbleViewport } from '@/hooks/useBubbleViewport';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { fontSize, fontWeight, radius, shadow, spacing, ThemeColors } from '@/constants/theme';
import { FeedbackButton, FeedbackError } from './FeedbackControls';
interface CafeArrivalBubbleProps { arrival: CafeArrivalModel; hidden?: boolean }
export const CafeArrivalBubble = memo(function CafeArrivalBubble({ arrival: m, hidden = false }: CafeArrivalBubbleProps) {
  const { colors: c, styles: s } = useThemeStyles(createStyles); const viewport = useBubbleViewport();
  if (hidden || !m.cafe) return null;
  return <View pointerEvents="box-none" style={[s.overlay, { top: viewport.top }]}>
    <View style={[s.bubble, { height: Math.min(viewport.availableHeight, spacing.xxxl * 11) }]} accessibilityLiveRegion="polite">
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.row}>
          <View style={s.icon}><MaterialCommunityIcons name="coffee-outline" size={28} color={c.primaryDark} /></View>
          <View style={s.copy}><Text style={s.eyebrow}>YAKININDA BİR KAFE VAR</Text><Text style={s.title}>{m.cafe.business_name}</Text></View>
          <Pressable disabled={m.busy} accessibilityRole="button" accessibilityLabel="Kafe önerisini kapat" onPress={m.dismiss} style={({ pressed }) => [s.close, pressed ? s.pressed : null]}><MaterialCommunityIcons name="close" size={24} color={c.textSubtle} /></Pressable>
        </View>
        <Text style={s.question}>Bu kafede misiniz?</Text>
        <Text style={s.text}>Kayıtlı konuma 20 metreden yakınsınız. Yalnızca onaylarsanız katılımcı sayısına dahil olursunuz.</Text>
        {m.cafe.social_enabled ? <>
          <Text style={s.label}>Bu girişte profil fotoğrafınız</Text>
          <View style={s.row}>
            <Pressable disabled={m.busy} accessibilityRole="radio" accessibilityLabel="Profil fotoğrafımı gizle" accessibilityState={{ checked: !m.visible, disabled: m.busy }} onPress={() => m.choose(false)} style={({ pressed }) => [s.choice, !m.visible ? s.selected : null, pressed ? s.pressed : null]}><MaterialCommunityIcons name="eye-off-outline" size={22} color={c.primaryDark} /><Text style={s.label}>Gizle</Text></Pressable>
            <Pressable disabled={m.busy} accessibilityRole="radio" accessibilityLabel="Profil fotoğrafımı göster" accessibilityState={{ checked: m.visible, disabled: m.busy }} onPress={() => m.choose(true)} style={({ pressed }) => [s.choice, m.visible ? s.selected : null, pressed ? s.pressed : null]}><MaterialCommunityIcons name="eye-outline" size={22} color={c.primaryDark} /><Text style={s.label}>Göster</Text></Pressable>
          </View>
          <Text style={s.text}>Fotoğrafınız gizli kalsa da dolulukta sayılırsınız ve görünür profilleri görebilirsiniz. Instagram erişimi ayrıca izin gerektirir.</Text>
        </> : <Text style={s.text}>İşletme profil paylaşımını kapalı tutuyor; fotoğrafınız paylaşılmaz.</Text>}
        <FeedbackError message={m.error} />
        <FeedbackButton busy={m.busy} label="Evet, buradayım" icon="check-circle-outline" onPress={() => { void m.confirm(); }} />
        <FeedbackButton secondary disabled={m.busy} label="Hayır / Şimdi değil" onPress={m.dismiss} />
        <Pressable disabled={m.busy} accessibilityRole="button" onPress={m.openVenue} style={({ pressed }) => [s.link, pressed ? s.pressed : null]}><Text style={s.linkText}>İşletme sayfasını aç</Text><MaterialCommunityIcons name="chevron-right" color={c.primaryDark} size={22} /></Pressable>
        <Text style={s.hint}>Bulut gelmezse veya reddederseniz işletme sayfasındaki “Buradayım · Konumla doğrula” alanını kullanabilirsiniz. Katılım 5 dakika sürer; mekândaysanız sayfadan yenileyebilirsiniz.</Text>
      </ScrollView>
    </View>
  </View>;
});
const createStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center', zIndex: 110 },
  bubble: { width: '100%', maxWidth: 600, backgroundColor: c.surface, borderColor: c.brand, borderWidth: 1, borderRadius: radius.xxl, overflow: 'hidden', ...shadow.lg },
  scroll: { flex: 1 }, content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, copy: { flex: 1, gap: spacing.xs },
  icon: { width: spacing.xxxl, height: spacing.xxxl, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primarySoft },
  close: { width: spacing.xxxl, height: spacing.xxxl, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: c.primaryDark, fontSize: fontSize.xs, fontWeight: fontWeight.bold, includeFontPadding: false },
  title: { color: c.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold, includeFontPadding: false },
  question: { color: c.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold, includeFontPadding: false },
  text: { color: c.textSubtle, fontSize: fontSize.md, lineHeight: fontSize.md * 1.6 },
  label: { color: c.text, fontSize: fontSize.md, fontWeight: fontWeight.semibold, includeFontPadding: false },
  choice: { flex: 1, minHeight: spacing.xxxl, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: c.borderStrong, backgroundColor: c.surfaceAlt },
  selected: { backgroundColor: c.primarySoft, borderColor: c.primaryDark },
  link: { minHeight: spacing.xxxl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  linkText: { color: c.primaryDark, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  hint: { color: c.textSubtle, fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.6 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
