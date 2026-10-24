import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CafeArrivalModel } from '@/hooks/useCafeArrival';
import { useBubbleViewport } from '@/hooks/useBubbleViewport';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { fontSize, fontWeight, radius, shadow, spacing, ThemeColors } from '@/constants/theme';
import { FeedbackButton, FeedbackError } from './FeedbackControls';
import { VenueProfileChoice } from './VenueProfileChoice';
interface CafeArrivalBubbleProps { arrival: CafeArrivalModel; hidden?: boolean }
export const CafeArrivalBubble = memo(function CafeArrivalBubble({ arrival: m, hidden = false }: CafeArrivalBubbleProps) {
 const { colors: c, styles: s } = useThemeStyles(createStyles); const viewport = useBubbleViewport();
 if (hidden || !m.cafe) return null;
 return <View pointerEvents="box-none" style={[s.overlay, { top: viewport.top }]}>
  <View style={[s.bubble, { height: Math.max(1, Math.min(viewport.availableHeight, spacing.xxxl * 12)) }]} accessibilityLiveRegion="polite">
   <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
    <View style={s.row}>
     <View style={s.icon}><MaterialCommunityIcons name="storefront-outline" size={28} color={c.primaryDark} /></View>
     <View style={s.copy}><Text style={s.eyebrow}>YAKININDA BİR İŞLETME VAR</Text><Text style={s.title}>{m.cafe.business_name}</Text></View>
     <Pressable disabled={m.busy} accessibilityRole="button" accessibilityLabel="İşletme önerisini kapat" onPress={m.dismiss} style={({ pressed }) => [s.close, pressed ? s.pressed : null]}><MaterialCommunityIcons name="close" size={24} color={c.textSubtle} /></Pressable>
    </View>
    <View style={s.questionBlock}><Text style={s.question}>Bu işletmede misiniz?</Text><Text style={s.text}>Kayıtlı konuma 40 metreden yakınsınız. Yalnızca onaylarsanız katılımcı sayısına dahil olursunuz.</Text></View>
    {m.cafe.social_enabled ? <VenueProfileChoice value={m.visible} enabled={m.profileEnabled} busy={m.busy} onChange={m.choose} /> : <Text style={s.text}>İşletme profil paylaşımını kapalı tutuyor; adınız ve fotoğrafınız paylaşılmaz.</Text>}
    <FeedbackError message={m.error} />
    <View style={s.actions}>
     <FeedbackButton busy={m.busy} label="Evet, buradayım" icon="check-circle-outline" onPress={() => { void m.confirm(); }} />
     <FeedbackButton secondary disabled={m.busy} label="Hayır / Şimdi değil" onPress={m.dismiss} />
     <Pressable disabled={m.busy} accessibilityRole="button" onPress={m.openVenue} style={({ pressed }) => [s.link, pressed ? s.pressed : null]}><Text style={s.linkText}>İşletme sayfasını aç</Text><MaterialCommunityIcons name="chevron-right" color={c.primaryDark} size={22} /></Pressable>
    </View>
    <Text style={s.hint}>Bulut gelmezse veya reddederseniz işletme sayfasındaki “Doluluk ve Mekândakiler” düğmesinden burada olduğunuzu doğrulayabilirsiniz. Katılım 5 dakika sürer; mekândaysanız güncel konumla yenileyebilirsiniz.</Text>
   </ScrollView>
  </View>
 </View>;
});
const createStyles = (c: ThemeColors) => StyleSheet.create({
 overlay: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center', zIndex: 110 },
 bubble: { width: '100%', maxWidth: 600, backgroundColor: c.surface, borderColor: c.brand, borderWidth: 1, borderRadius: radius.xxl, overflow: 'hidden', ...shadow.lg },
 scroll: { flex: 1 }, content: { padding: spacing.lg, gap: spacing.lg },
 row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, copy: { flex: 1, gap: spacing.xs },
 icon: { width: spacing.xxxl, height: spacing.xxxl, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primarySoft },
 close: { width: spacing.xxxl, height: spacing.xxxl, alignItems: 'center', justifyContent: 'center' },
 eyebrow: { color: c.primaryDark, fontSize: fontSize.xs, fontWeight: fontWeight.bold, includeFontPadding: false },
 title: { color: c.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold, includeFontPadding: false },
 questionBlock: { padding: spacing.lg, gap: spacing.sm, borderRadius: radius.lg, backgroundColor: c.primarySoft },
 question: { color: c.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold, includeFontPadding: false },
 text: { color: c.textSubtle, fontSize: fontSize.md, lineHeight: fontSize.md * 1.6 },
 actions: { gap: spacing.sm },
 link: { minHeight: spacing.xxxl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
 linkText: { color: c.primaryDark, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
 hint: { color: c.textSubtle, fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.6 },
 pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
