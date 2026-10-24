import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCafePresence } from '@/hooks/useCafePresence';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createCafeStyles } from '@/constants/cafeStyles';
import { FeedbackButton, FeedbackError } from './FeedbackControls';
interface CafeVisitPrivacyCardProps { businessId?: string }
export const CafeVisitPrivacyCard = memo(function CafeVisitPrivacyCard({ businessId }: CafeVisitPrivacyCardProps) {
  const m = useCafePresence(); const { colors: c, styles: s } = useThemeStyles(createCafeStyles);
  if (!m.visit || (businessId && m.visit.business_id !== businessId)) return null;
  const visit = m.visit;
  return <View style={s.card}>
    <View style={s.row}><MaterialCommunityIcons name="coffee-outline" size={28} color={c.primaryDark} /><View style={s.info}><Text style={s.title}>{visit.business_name}</Text><Text style={s.text}>{visit.social_enabled === false ? 'Konum doğrulandı · Masa düzeni açık' : 'Bu girişteki fotoğraf görünürlüğünüz'}</Text></View></View>
    {visit.social_enabled !== false ? <><View style={s.badge}><Text style={s.badgeText}>{visit.photo_visible ? 'Fotoğrafım gösteriliyor' : 'Fotoğrafım gizli'}</Text></View>
    <Text style={s.text}>İçerideyken tercihinizi değiştirebilirsiniz. Gizleme, diğer kişilerin fotoğrafı yeniden yüklemesini engeller; daha önce görülen bir fotoğraf geri alınamaz.</Text>
    <FeedbackButton busy={m.busy} icon={visit.photo_visible ? 'eye-off-outline' : 'eye-outline'} label={visit.photo_visible ? 'Fotoğrafımı gizle' : 'Fotoğrafımı göster'} onPress={() => { void m.setVisible(!visit.photo_visible); }} />
    </> : <Text style={s.text}>İşletme sosyal katılımı kapalı tutuyor. Fotoğrafınız ve Instagram profiliniz paylaşılmaz.</Text>}
    <Text style={s.text}>Katılım 5 dakika sonra biter. Kafedeyseniz konumunuzla yenileyebilirsiniz. Yeni katılımda görünürlük tekrar sorulur.</Text>
    <FeedbackButton secondary busy={m.busy} icon="crosshairs-gps" label="Kafedeyim · Katılımı yenile" onPress={() => { void m.join(visit.business_id, visit.photo_visible); }} />
    <FeedbackButton secondary busy={m.busy} icon="logout" label="Kafeden ayrıl" onPress={() => { void m.leave(); }} />
    <FeedbackError message={m.error} />
    {m.notice ? <Text style={s.text} accessibilityLiveRegion="polite">{m.notice}</Text> : null}
  </View>;
});
