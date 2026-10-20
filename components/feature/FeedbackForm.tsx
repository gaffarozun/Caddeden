import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { useBusinessFeedback } from '@/hooks/useBusinessFeedback';
import { complaintTopics, feedbackTopics, suggestionTopics } from '@/services/feedbackService';
import { createFeedbackStyles } from '@/constants/feedbackStyles';
import { FeedbackButton, FeedbackChips, FeedbackInput, FeedbackStars } from './FeedbackControls';

interface FeedbackFormProps { model: ReturnType<typeof useBusinessFeedback> }
export const FeedbackForm = memo(function FeedbackForm({ model: m }: FeedbackFormProps) {
  const { colors } = useTheme(); const styles = useMemo(() => createFeedbackStyles(colors), [colors]);
  if (!m.formOpen || !m.canCustomer) return null;
  return <View style={styles.card}>
    <Text style={styles.heading}>{m.tab === 'review' ? 'Deneyiminizi değerlendirin' : m.tab === 'suggestion' ? 'Bu işletme nasıl daha iyi olabilir?' : m.target.type === 'business' ? 'İşletme şikâyeti' : 'İçerik / cevap bildirimi'}</Text>
    {m.tab === 'review' ? <><FeedbackStars rating={m.rating} onChange={m.setRating} disabled={m.busy} /><FeedbackChips label="Değerlendirdiğiniz özellik" items={feedbackTopics} selected={m.topic} onSelect={m.setTopic} disabled={m.busy} /><FeedbackInput label="Yorumunuz (isteğe bağlı)" value={m.comment} onChange={m.setComment} disabled={m.busy} /><Text style={styles.subtle}>Her işletme için tek aktif puanınız bulunur. Düzenlediğiniz puan ve yorum yeniden incelenir.</Text></> : null}
    {m.tab === 'suggestion' ? <><FeedbackChips label="Öneri konusu" items={suggestionTopics} selected={m.suggestionTopic} onSelect={m.setSuggestionTopic} disabled={m.busy} /><FeedbackInput label="İyileştirme öneriniz" value={m.description} onChange={m.setDescription} maxLength={1500} disabled={m.busy} /><Text style={styles.subtle}>Öneriler standart konuya göre birleştirilir. Yayımlanmış aynı konuyu seçerseniz o öneriye bir kez destek eklenir.</Text></> : null}
    {m.tab === 'complaint' ? <><FeedbackChips label="Şikâyet kategorisi" items={m.target.type === 'business' ? complaintTopics.slice(0, 7) : complaintTopics.slice(7)} selected={m.category} onSelect={m.setCategory} disabled={m.busy} /><FeedbackInput label="Açıklama (en az 10 karakter)" value={m.description} onChange={m.setDescription} disabled={m.busy} /><Text style={styles.subtle}>Şikâyet açıklaması, kimliğiniz ve kanıtınız kamuya açık değildir. Bildirim, iddianın doğrulandığı anlamına gelmez.</Text><FeedbackButton secondary label={m.evidence ? 'Kanıt fotoğrafını değiştir' : 'Kanıt fotoğrafı ekle (isteğe bağlı)'} icon="camera-outline" onPress={() => { void m.pickEvidence(); }} disabled={m.busy} />{m.evidence ? <><Image source={{ uri: m.evidence.uri }} style={styles.evidence} contentFit="cover" transition={200} /><FeedbackButton secondary label="Kanıt fotoğrafını kaldır" onPress={() => m.setEvidence(null)} disabled={m.busy} /></> : null}</> : null}
    <Text style={styles.subtle}>Hakaret, kişisel iletişim bilgisi, yanıltıcı bilgi ve spam paylaşmayın. Yeni içerikler moderasyona alınır.</Text>
    <FeedbackButton label={m.tab === 'review' ? 'Değerlendirmeyi gönder' : m.tab === 'suggestion' ? 'Öneriyi gönder' : 'Şikâyeti gönder'} icon="send-outline" onPress={() => { void m.submit(); }} busy={m.busy} />
    <FeedbackButton secondary label="Vazgeç" onPress={() => m.setFormOpen(false)} disabled={m.busy} />
  </View>;
});
