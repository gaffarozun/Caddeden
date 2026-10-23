import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useCafePresence } from '@/hooks/useCafePresence';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createCafeStyles } from '@/constants/cafeStyles';
import { OwnCafePhoto } from './CafePhoto';
import { FeedbackButton, FeedbackError } from './FeedbackControls';
interface CafeProfilePhotoCardProps { compact?: boolean }
export const CafeProfilePhotoCard = memo(function CafeProfilePhotoCard({ compact = false }: CafeProfilePhotoCardProps) {
  const { authUser } = useAuth(); const m = useCafePresence(); const { colors: c, styles: s } = useThemeStyles(createCafeStyles);
  if (!authUser) return null;
  return <View style={s.card}>
    <View style={s.row}><OwnCafePhoto name={authUser.first_name ?? 'Profil'} /><View style={s.info}><Text style={s.title}>Profil fotoğrafım</Text><Text style={s.text}>Kafeye her katılımda göster veya gizle seçimini siz yaparsınız.</Text></View><MaterialCommunityIcons name="shield-account-outline" color={c.primaryDark} size={24} /></View>
    {!compact ? <Text style={s.text}>Fotoğrafınız herkese açık bir bağlantıyla paylaşılmaz. Gizliyken kafedeki diğer katılımcılara gösterilmez; kendi profilinizde görmeye devam edersiniz.</Text> : null}
    <FeedbackButton secondary busy={m.busy} label={m.photoPath ? 'Profil fotoğrafını değiştir' : 'Profil fotoğrafı ekle'} icon="camera-outline" onPress={() => { void m.upload(); }} />
    <FeedbackError message={m.error} />
    {m.notice ? <Text style={s.text} accessibilityLiveRegion="polite">{m.notice}</Text> : null}
  </View>;
});
