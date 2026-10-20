import React, { memo, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { createFeedbackStyles } from '@/constants/feedbackStyles';

interface FeedbackButtonProps { label: string; onPress: () => void; disabled?: boolean; busy?: boolean; secondary?: boolean; danger?: boolean; icon?: keyof typeof MaterialCommunityIcons.glyphMap }
export const FeedbackButton = memo(function FeedbackButton({ label, onPress, disabled, busy, secondary, danger, icon }: FeedbackButtonProps) {
  const { colors } = useTheme(); const styles = useMemo(() => createFeedbackStyles(colors), [colors]);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled || !!busy }} disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [styles.button, secondary ? styles.secondary : null, danger ? styles.danger : null, disabled || busy ? styles.disabled : null, pressed ? styles.pressed : null]}>
    {busy ? <ActivityIndicator color={colors.text} /> : icon ? <MaterialCommunityIcons name={icon} size={20} color={secondary || danger ? colors.text : colors.primaryDark} /> : null}
    <Text style={[styles.buttonText, secondary || danger ? styles.secondaryText : null]}>{label}</Text>
  </Pressable>;
});
interface FeedbackChipsProps { items: readonly { id: string; label: string }[]; selected: string; onSelect: (id: string) => void; label: string; disabled?: boolean }
export const FeedbackChips = memo(function FeedbackChips({ items, selected, onSelect, label, disabled }: FeedbackChipsProps) {
  const { colors } = useTheme(); const styles = useMemo(() => createFeedbackStyles(colors), [colors]);
  return <View style={styles.section}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.chipOuter}><FlatList horizontal data={items} keyExtractor={item => item.id} contentContainerStyle={styles.chipRow} showsHorizontalScrollIndicator={false} renderItem={({ item }) => <Pressable disabled={disabled} accessibilityRole="button" accessibilityState={{ selected: item.id === selected }} onPress={() => onSelect(item.id)} style={({ pressed }) => [styles.chip, item.id === selected ? styles.chipActive : null, pressed ? styles.pressed : null]}><Text style={[styles.chipText, item.id === selected ? styles.chipTextActive : null]}>{item.label}</Text></Pressable>} /></View>
  </View>;
});
interface FeedbackInputProps { label: string; value: string; onChange: (value: string) => void; maxLength?: number; secure?: boolean; multiline?: boolean; disabled?: boolean }
export const FeedbackInput = memo(function FeedbackInput({ label, value, onChange, maxLength = 2000, secure, multiline = true, disabled }: FeedbackInputProps) {
  const { colors } = useTheme(); const styles = useMemo(() => createFeedbackStyles(colors), [colors]);
  return <View style={styles.section}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} maxLength={maxLength} secureTextEntry={secure} multiline={multiline} editable={!disabled} autoCapitalize={secure ? 'none' : 'sentences'} autoCorrect={!secure} style={[styles.input, multiline ? styles.multiline : null]} placeholderTextColor={colors.textSubtle} />{multiline ? <Text style={styles.subtle}>{value.length} / {maxLength}</Text> : null}</View>;
});
export const FeedbackError = memo(function FeedbackError({ message }: { message: string }) {
  const { colors } = useTheme(); const styles = useMemo(() => createFeedbackStyles(colors), [colors]);
  if (!message) return null;
  return <View style={styles.error} accessibilityRole="alert"><MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.text} /><Text style={styles.errorText}>{message}</Text></View>;
});
interface FeedbackStarsProps { rating: number; onChange: (rating: number) => void; disabled?: boolean }
export const FeedbackStars = memo(function FeedbackStars({ rating, onChange, disabled }: FeedbackStarsProps) {
  const { colors } = useTheme(); const styles = useMemo(() => createFeedbackStyles(colors), [colors]);
  return <View style={styles.section}><Text style={styles.label}>Puanınız · {rating ? `${rating} / 5` : 'Yıldız seçin'}</Text><View style={styles.row}>{[1, 2, 3, 4, 5].map(value => <Pressable key={value} disabled={disabled} accessibilityRole="button" accessibilityLabel={`${value} yıldız`} accessibilityState={{ selected: rating === value }} onPress={() => onChange(value)} style={({ pressed }) => [styles.starButton, pressed ? styles.pressed : null]}><MaterialCommunityIcons name={value <= rating ? 'star' : 'star-outline'} size={32} color={value <= rating ? colors.primaryDark : colors.textSubtle} /></Pressable>)}</View></View>;
});
