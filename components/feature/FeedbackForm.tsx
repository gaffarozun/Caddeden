import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { useBusinessFeedback } from '@/hooks/useBusinessFeedback';
import { complaintTopics, feedbackTopics, suggestionTopics } from '@/services/feedbackService';
import { FeedbackCriteriaInput } from './FeedbackCriteria';
import { createFeedbackStyles } from '@/constants/feedbackStyles';
import { FeedbackButton, FeedbackChips, FeedbackInput } from './FeedbackControls';

interface FeedbackFormProps { model: ReturnType<typeof useBusinessFeedback> }
export const FeedbackForm = memo(function FeedbackForm({ model: m }: FeedbackFormProps) {
  const { colors } = useTheme(); const styles = useMemo(() => createFeedbackStyles(colors), [colors]);
  if (!m.formOpen || !m.canCustomer) return null;
  return <View style={styles.card}>
    <Text style={styles.heading}>{m.tab === 'review' ? 'Deneyiminizi değerlendirin' : m.tab === 'suggestion' ? 'Bu işletme nasıl daha iyi olabilir?' : m.target.type === 'business' ? 'İşletme şikâyeti' : 'İçerik / cevap bildirimi'}</Text>
    {m.tab === 'review' ? <><FeedbackCriteriaInput scores={m.criteriaRatings} selected={m.criteriaSummary.selected} average={m.criteriaSummary.average} onChange={m.setCriteriaRating} disabled={m.busy} /><FeedbackInput label="Yorumunuz (isteğe bağlı, herkese görünür)" value={m.comment} onChange={m.setComment} disabled={m.busy} /><Text style={styles.subtle}>Altı özelliğin ortalaması genel puanınızdır. Her işletme için tek değerlendirmeniz bulunur; puanlarınızı ve yorumunuzu birlikte güncelleyebilirsiniz.</Text></> : null}
    {m.tab === 'suggestion' ? <><FeedbackChips label="Öneri konusu" items={suggestionTopics} selected={m.suggestionTopic} onSelect={m.setSuggestionTopic} disabled={m.busy} /><FeedbackInput label="İyileştirme öneriniz" value={m.description} onChange={m.setDescription} maxLength={1500} disabled={m.busy} /><Text style={styles.subtle}>Öneriler standart konuya göre birleştirilir. Yayımlanmış aynı konuyu seçerseniz o öneriye bir kez destek eklenir.</Text></> : null}
    {m.tab === 'complaint' ? <><FeedbackChips label="Şikâyet kategorisi" items={m.target.type === 'business' ? complaintTopics.slice(0, 7) : complaintTopics.slice(7)} selected={m.category} onSelect={m.setCategory} disabled={m.busy} /><FeedbackInput label="Açıklama (en az 10 karakter)" value={m.description} onChange={m.setDescription} disabled={m.busy} /><Text style={styles.subtle}>Şikâyet açıklaması, kimliğiniz ve kanıtınız kamuya açık değildir. Bildirim, iddianın doğrulandığı anlamına gelmez.</Text><FeedbackButton secondary label={m.evidence ? 'Kanıt fotoğrafını değiştir' : 'Kanıt fotoğrafı ekle (isteğe bağlı)'} icon="camera-outline" onPress={() => { void m.pickEvidence(); }} disabled={m.busy} />{m.evidence ? <><Image source={{ uri: m.evidence.uri }} style={styles.evidence} contentFit="cover" transition={200} /><FeedbackButton secondary label="Kanıt fotoğrafını kaldır" onPress={() => m.setEvidence(null)} disabled={m.busy} /></> : null}</> : null}
    <Text style={styles.subtle}>{m.tab === 'review' ? 'Yorumunuz doğrudan görünür, işletme cevap verebilir. Yönetici tarafından gizlenen yorumların güncellemeleri yeniden incelenir. ' : 'Öneriler yönetici tarafından incelenir. '}Hakaret, kişisel iletişim bilgisi, yanıltıcı bilgi ve spam paylaşmayın.</Text>
    <FeedbackButton label={m.tab === 'review' ? 'Değerlendirmeyi gönder' : m.tab === 'suggestion' ? 'Öneriyi gönder' : 'Şikâyeti gönder'} icon="send-outline" onPress={() => { void m.submit(); }} busy={m.busy} disabled={m.tab === 'review' && m.criteriaSummary.selected !== feedbackTopics.length} />
    <FeedbackButton secondary label="Vazgeç" onPress={() => m.setFormOpen(false)} disabled={m.busy} />
  </View>;
});
