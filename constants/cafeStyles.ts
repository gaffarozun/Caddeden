import { StyleSheet } from 'react-native';
import { fontSize, fontWeight, radius, spacing, ThemeColors } from './theme';
export const createCafeStyles = (c: ThemeColors) => StyleSheet.create({
  card: { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', flexWrap: 'wrap' },
  info: { flex: 1, minWidth: spacing.xxxl * 2, gap: spacing.xs },
  title: { color: c.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold, includeFontPadding: false },
  label: { color: c.text, fontSize: fontSize.md, fontWeight: fontWeight.semibold, includeFontPadding: false },
  text: { color: c.textSubtle, fontSize: fontSize.md, lineHeight: fontSize.md * 1.6 },
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: c.primarySoft },
  badgeText: { color: c.primaryDark, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  choiceRow: { flexDirection: 'row', gap: spacing.sm },
  choice: { flex: 1, minHeight: spacing.xxxl, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: c.surfaceAlt, borderColor: c.borderStrong, borderWidth: 1, borderRadius: radius.md },
  selected: { backgroundColor: c.primarySoft, borderColor: c.primaryDark },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  members: { gap: spacing.md, paddingVertical: spacing.sm },
  member: { width: spacing.xxxl * 2, alignItems: 'center', gap: spacing.sm },
  memberName: { color: c.text, fontSize: fontSize.md, textAlign: 'center' },
  notice: { backgroundColor: c.successSoft, padding: spacing.md, borderRadius: radius.md },
  photo: { overflow: 'hidden', backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border },
});
