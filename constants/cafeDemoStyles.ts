import { StyleSheet } from 'react-native';
import { createCafeStyles } from './cafeStyles';
import { businessProfileLayout, fontSize, fontWeight, radius, spacing, ThemeColors } from './theme';
export const createCafeDemoStyles = (c: ThemeColors) => ({
  ...createCafeStyles(c),
  ...StyleSheet.create({
    demoStrip: { marginVertical: spacing.lg, padding: spacing.lg, gap: spacing.md, borderRadius: radius.lg, backgroundColor: c.primarySoft, borderWidth: 1, borderColor: c.brand },
    demoRail: { height: spacing.xxxl * 5 },
    demoVenue: { width: spacing.xxxl * 5, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderStrong, overflow: 'hidden', backgroundColor: c.surface },
    demoCover: { width: '100%', height: spacing.xxxl * 2 },
    demoVenueBody: { padding: spacing.md, gap: spacing.sm },
    demoCaption: { fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.6, color: c.textSubtle, includeFontPadding: false },
    demoPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: c.primaryDark, alignSelf: 'flex-start' },
    demoPillText: { color: c.onPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.bold, includeFontPadding: false },
    demoAvatar: { width: spacing.xxxl + spacing.xl, height: spacing.xxxl + spacing.xl, borderRadius: radius.pill, backgroundColor: c.surfaceTint },
    demoAvatarSmall: { width: spacing.xxxl, height: spacing.xxxl, borderRadius: radius.pill, backgroundColor: c.surfaceTint },
    demoPeers: { minHeight: spacing.xxxl * 6, paddingVertical: spacing.sm },
    demoPerson: { width: spacing.xxxl * 5, minHeight: spacing.xxxl * 5, padding: spacing.md, gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderStrong, backgroundColor: c.surfaceAlt },
    demoHidden: { width: spacing.xxxl + spacing.xl, height: spacing.xxxl + spacing.xl, borderRadius: radius.pill, backgroundColor: c.surfaceTint, alignItems: 'center', justifyContent: 'center' },
    demoDecision: { gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: c.border },
    demoModal: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: c.overlayStrong },
    demoModalCard: { width: '100%', maxWidth: businessProfileLayout.maxWidth / 2, padding: spacing.xl, gap: spacing.lg, backgroundColor: c.surface, borderRadius: radius.xl },
  }),
});
