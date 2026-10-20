import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useBusinessFeedback } from '@/hooks/useBusinessFeedback';
import { BusinessFeedback, feedbackTopicLabel } from '@/services/feedbackService';
import { createFeedbackStyles } from '@/constants/feedbackStyles';
import { FeedbackError } from './FeedbackControls';
import { FeedbackCommentPreview } from './FeedbackCommentPreview';

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
  const { data, commentPreview, loading, error, canCustomer, signedIn } = useBusinessFeedback(businessId, !isDemo);
  const openComments = useCallback(() => router.push(`/business/feedback/${businessId}`), [router, businessId]);
  const openComposer = useCallback(() => router.push({ pathname: '/business/feedback/[id]', params: { id: businessId, compose: '1' } }), [router, businessId]);
  const rating = data?.ratings?.rating;
  const count = data?.ratings?.count;
  useEffect(() => {
    if (rating !== undefined && count !== undefined) onRatingsChange?.(Number(rating), Number(count));
  }, [rating, count, onRatingsChange]);
  if (isDemo) return null;
  return <View style={styles.section}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Müşteri deneyimleri, ${count ?? 0} değerlendirme. Yorumları ve önerileri aç`} onPress={openComments} style={({ pressed }) => [styles.compactSummary, pressed ? styles.pressed : null]}>
      <View style={styles.compactRow}>
        <MaterialCommunityIcons name="comment-text-outline" size={20} color={colors.primaryDark} />
        <View style={styles.compactInfo}><Text style={styles.compactTitle}>Müşteri deneyimleri</Text><Text style={styles.subtle}>{count ?? 0} değerlendirme</Text></View>
        {loading && !data ? <ActivityIndicator color={colors.primaryDark} /> : <><MaterialCommunityIcons name="star-outline" size={18} color={colors.primaryDark} /><Text style={styles.compactRating}>{Number(rating ?? 0).toFixed(1)}</Text></>}
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSubtle} />
      </View>
      <Text style={styles.compactLink}>Tüm yorumlar, puanlar ve öneriler</Text>
    </Pressable>
    <View style={styles.commentsHeader}>
      <Text style={styles.compactTitle}>Yayımlanan yorumlar</Text>
      {canCustomer || !signedIn ? <Pressable accessibilityRole="button" accessibilityLabel="Yorum yazma ekranını aç" onPress={openComposer} style={({ pressed }) => [styles.commentAction, pressed ? styles.pressed : null]}><MaterialCommunityIcons name="comment-edit-outline" size={18} color={colors.primaryDark} /><Text style={styles.commentActionText}>{data?.mine ? 'Yorumunu düzenle' : 'Yorum yaz'}</Text></Pressable> : null}
    </View>
    <FlatList data={commentPreview} scrollEnabled={false} removeClippedSubviews={false} showsVerticalScrollIndicator={false} keyExtractor={review => review.id} renderItem={({ item }) => <FeedbackCommentPreview review={item} onOpen={openComments} />} ListEmptyComponent={!loading && !error ? <View style={styles.commentEmpty}><Text style={styles.subtle}>Henüz yayımlanmış yorum yok.</Text><Text style={styles.subtle}>{canCustomer ? 'Yorum yaz butonuyla ilk deneyimi paylaşabilirsiniz.' : 'Müşterilerin yorumları ve işletme cevapları burada görünür.'}</Text></View> : null} />
    {commentPreview.length > 0 ? <Pressable accessibilityRole="button" onPress={openComments} style={({ pressed }) => [styles.commentAction, pressed ? styles.pressed : null]}><Text style={styles.commentActionText}>Tüm yorumları ve cevapları gör</Text><MaterialCommunityIcons name="chevron-right" size={18} color={colors.primaryDark} /></Pressable> : null}
    <FeedbackError message={error} />
  </View>;
});
