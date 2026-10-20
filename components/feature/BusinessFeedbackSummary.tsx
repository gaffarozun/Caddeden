import React, { memo, useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useBusinessFeedback } from '@/hooks/useBusinessFeedback';
import { BusinessFeedback, feedbackTopicLabel } from '@/services/feedbackService';
import { createFeedbackStyles } from '@/constants/feedbackStyles';
import { FeedbackError } from './FeedbackControls';

interface FeedbackHighlightsProps { data: BusinessFeedback }
export const FeedbackHighlights = memo(function FeedbackHighlights({ data }: FeedbackHighlightsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createFeedbackStyles(colors), [colors]);
  return <View style={styles.compactHighlights}>
    {data.positive ? <View style={styles.compactHighlight}><MaterialCommunityIcons name="star-outline" size={18} color={colors.primaryDark} /><Text style={styles.compactHighlightText}>En beğenilen: {feedbackTopicLabel(data.positive.topic)} · {data.positive.count} müşteri</Text></View> : null}
    {data.reported ? <View style={styles.compactHighlight}><MaterialCommunityIcons name="flag-outline" size={18} color={colors.textSubtle} /><Text style={styles.compactHighlightText}>En çok bildirilen: {feedbackTopicLabel(data.reported.topic)} · {data.reported.count} kişi. Doğrulanmış bulgu değildir.</Text></View> : null}
    {data.requested ? <View style={styles.compactHighlight}><MaterialCommunityIcons name="lightbulb-outline" size={18} color={colors.primaryDark} /><Text style={styles.compactHighlightText}>En çok talep edilen: {feedbackTopicLabel(data.requested.topic)} · {data.requested.count} destek</Text></View> : null}
    {!data.positive && !data.reported && !data.requested ? <Text style={styles.subtle}>Öne çıkanlar, aynı konuda en az 3 farklı müşterinin katkısıyla oluşur.</Text> : null}
  </View>;
});

interface BusinessFeedbackSummaryProps { businessId: string; isDemo?: boolean; onRatingsChange?: (rating: number, count: number) => void }
export const BusinessFeedbackSummary = memo(function BusinessFeedbackSummary({ businessId, isDemo = false, onRatingsChange }: BusinessFeedbackSummaryProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createFeedbackStyles(colors), [colors]);
  const { data, loading, error } = useBusinessFeedback(businessId, !isDemo);
  const rating = data?.ratings?.rating;
  const count = data?.ratings?.count;
  useEffect(() => {
    if (rating !== undefined && count !== undefined) onRatingsChange?.(Number(rating), Number(count));
  }, [rating, count, onRatingsChange]);
  if (isDemo) return null;
  return <View style={styles.section}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Müşteri deneyimleri, ${count ?? 0} değerlendirme. Yorumları ve önerileri aç`} onPress={() => router.push(`/business/feedback/${businessId}`)} style={({ pressed }) => [styles.compactSummary, pressed ? styles.pressed : null]}>
      <View style={styles.compactRow}>
        <MaterialCommunityIcons name="comment-text-outline" size={20} color={colors.primaryDark} />
        <View style={styles.compactInfo}><Text style={styles.compactTitle}>Müşteri deneyimleri</Text><Text style={styles.subtle}>{count ?? 0} değerlendirme</Text></View>
        {loading && !data ? <ActivityIndicator color={colors.primaryDark} /> : <><MaterialCommunityIcons name="star-outline" size={18} color={colors.primaryDark} /><Text style={styles.compactRating}>{Number(rating ?? 0).toFixed(1)}</Text></>}
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSubtle} />
      </View>
      <Text style={styles.compactLink}>Yorumları gör, değerlendir veya öneri paylaş</Text>
    </Pressable>
    <FeedbackError message={error} />
  </View>;
});
