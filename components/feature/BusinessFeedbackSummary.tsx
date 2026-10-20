import React, { memo, useEffect, useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useBusinessFeedback } from '@/hooks/useBusinessFeedback';
import { BusinessFeedback, feedbackTopicLabel } from '@/services/feedbackService';
import { createFeedbackStyles } from '@/constants/feedbackStyles';
import { FeedbackButton, FeedbackError } from './FeedbackControls';

interface FeedbackHighlightsProps { data: BusinessFeedback }
export const FeedbackHighlights = memo(function FeedbackHighlights({ data }: FeedbackHighlightsProps) {
  const { colors } = useTheme(); const styles = useMemo(() => createFeedbackStyles(colors), [colors]);
  return <View style={styles.section}><View style={styles.row}>
    <View style={styles.highlight}><Text style={styles.heading}>En beğenilen özellik</Text><Text style={styles.text}>{data.positive ? feedbackTopicLabel(data.positive.topic) : 'Henüz yeterli veri yok'}</Text>{data.positive ? <Text style={styles.subtle}>{data.positive.count} farklı olumlu değerlendirme</Text> : null}</View>
    <View style={styles.highlight}><Text style={styles.heading}>En çok şikâyet edilen konu</Text><Text style={styles.text}>{data.reported ? feedbackTopicLabel(data.reported.topic) : 'Henüz yeterli veri yok'}</Text>{data.reported ? <Text style={styles.subtle}>{data.reported.count} farklı bildiren kullanıcı · doğrulanmış bulgu değildir</Text> : null}</View>
    <View style={styles.highlight}><Text style={styles.heading}>En çok talep edilen değişiklik</Text><Text style={styles.text}>{data.requested ? feedbackTopicLabel(data.requested.topic) : 'Henüz yeterli veri yok'}</Text>{data.requested ? <Text style={styles.subtle}>{data.requested.count} farklı kullanıcı desteği</Text> : null}</View>
  </View><Text style={styles.subtle}>Öne çıkanlar için konu başına en az 3 farklı kullanıcı gerekir. Şikâyetler doğrulanmış gerçek olarak sunulmaz.</Text></View>;
});
interface BusinessFeedbackSummaryProps { businessId: string; isDemo?: boolean; onRatingsChange?: (rating: number, count: number) => void }
export const BusinessFeedbackSummary = memo(function BusinessFeedbackSummary({ businessId, isDemo = false, onRatingsChange }: BusinessFeedbackSummaryProps) {
  const router = useRouter(); const { colors } = useTheme(); const styles = useMemo(() => createFeedbackStyles(colors), [colors]);
  const { data, loading, error } = useBusinessFeedback(businessId, !isDemo);
  const rating = data?.ratings?.rating;
  const count = data?.ratings?.count;
  useEffect(() => {
    if (rating !== undefined && count !== undefined) onRatingsChange?.(Number(rating), Number(count));
  }, [rating, count, onRatingsChange]);
  if (isDemo) return null;
  return <View style={styles.card}><Text style={styles.heading}>Müşteri deneyimleri</Text>
    {loading && !data ? <ActivityIndicator color={colors.primaryDark} /> : null}
    <FeedbackError message={error} />
    {data ? <><Text style={styles.big}>{Number(data.ratings?.rating ?? 0).toFixed(1)} / 5</Text><Text style={styles.subtle}>{data.ratings?.count ?? 0} yayımlanmış değerlendirme</Text><FeedbackHighlights data={data} /></> : null}
    <FeedbackButton secondary label="Değerlendirmeler, şikâyetler ve öneriler" icon="comment-text-outline" onPress={() => router.push(`/business/feedback/${businessId}`)} />
  </View>;
});
