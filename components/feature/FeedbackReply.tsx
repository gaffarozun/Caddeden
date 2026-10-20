import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useFeedbackReply } from '@/hooks/useFeedbackReply';
import { feedbackStatusLabel } from '@/services/feedbackService';
import { createFeedbackStyles } from '@/constants/feedbackStyles';
import { FeedbackButton, FeedbackError, FeedbackInput } from './FeedbackControls';

interface FeedbackReplyProps { id: string; kind: 'review' | 'suggestion'; owner: boolean; reply?: string | null; replyStatus?: string; canReport: boolean; onReport: () => void }
export const FeedbackReply = memo(function FeedbackReply({ id, kind, owner, reply, replyStatus, canReport, onReport }: FeedbackReplyProps) {
  const { colors } = useTheme(); const styles = useMemo(() => createFeedbackStyles(colors), [colors]);
  const form = useFeedbackReply(id, kind, reply ?? '');
  return <View style={styles.section}>
    {reply ? <View style={styles.reply}><Text style={styles.heading}>İşletmenin cevabı</Text><Text style={styles.text}>{reply}</Text>{owner && replyStatus ? <Text style={styles.subtle}>{feedbackStatusLabel(replyStatus)}</Text> : null}{canReport ? <FeedbackButton secondary label="Cevabı bildir" icon="flag-outline" onPress={onReport} /> : null}</View> : null}
    {owner ? <><FeedbackButton secondary label={form.open ? 'Cevap alanını kapat' : reply ? 'Cevabı düzenle' : 'İşletme olarak cevapla'} icon="reply-outline" onPress={() => { form.setText(reply ?? ''); form.setOpen(!form.open); }} disabled={form.busy} />
      {form.open ? <><FeedbackInput label="İşletme cevabı" value={form.text} onChange={form.setText} maxLength={1500} disabled={form.busy} /><Text style={styles.subtle}>Cevaplar yönetici incelemesinden sonra yayımlanır.</Text><FeedbackError message={form.error} /><FeedbackButton label="Cevabı incelemeye gönder" onPress={() => { void form.submit(); }} busy={form.busy} /></> : null}
    </> : null}
  </View>;
});
