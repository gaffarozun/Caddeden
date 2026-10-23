import React, { memo } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCafeParticipation } from '@/hooks/useCafeParticipation';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createCafeStyles } from '@/constants/cafeStyles';
import { CafePhoto } from './CafePhoto';
import { CafeVisitPrivacyCard } from './CafeVisitPrivacyCard';
import { FeedbackButton, FeedbackError } from './FeedbackControls';
interface CafeParticipationCardProps { businessId: string }
export const CafeParticipationCard = memo(function CafeParticipationCard({ businessId }: CafeParticipationCardProps) {
  const m = useCafeParticipation(businessId); const router = useRouter(); const { colors: c, styles: s } = useThemeStyles(createCafeStyles);
  if (!m.room?.enabled) return null;
  return <View style={s.card}>
    <View style={s.row}><MaterialCommunityIcons name="coffee-outline" color={c.primaryDark} size={28} /><View style={s.info}><Text style={s.title}>Kafedeyim</Text><Text style={s.text}>{m.room.count} gönüllü katılımcı · Gerçek doluluk değildir</Text></View></View>
    {m.active ? <>
      <CafeVisitPrivacyCard businessId={businessId} />
      <Text style={s.label}>Fotoğrafını paylaşan katılımcılar</Text>
      <View><FlatList horizontal data={m.members} keyExtractor={item => item.user_id} contentContainerStyle={s.members} showsHorizontalScrollIndicator={false} renderItem={({ item }) => <View style={s.member}><CafePhoto path={item.photo_path} name={item.name} /><Text style={s.memberName} numberOfLines={1}>{item.name}</Text></View>} ListEmptyComponent={<Text style={s.text}>Şu anda görünür fotoğraf yok.</Text>} /></View>
    </> : m.customer ? <>
      <Text style={s.text}>Katılım isteğe bağlıdır. Konumunuz yalnızca kafenin yakınında olduğunuzu kontrol etmek için kullanılır; kaydedilmez. Bu girişte fotoğrafınız nasıl görünsün?</Text>
      <View style={s.choiceRow}>{[false, true].map(visible => <Pressable key={String(visible)} accessibilityRole="radio" accessibilityLabel={visible ? 'Fotoğrafımı göster' : 'Fotoğrafımı gizle'} accessibilityState={{ checked: m.choice === visible, disabled: m.presence.busy }} disabled={m.presence.busy} onPress={() => m.choose(visible)} style={({ pressed }) => [s.choice, m.choice === visible ? s.selected : null, pressed ? s.pressed : null]}><MaterialCommunityIcons name={visible ? 'eye-outline' : 'eye-off-outline'} color={c.primaryDark} size={24} /><Text style={s.label}>{visible ? 'Göster' : 'Gizle'}</Text></Pressable>)}</View>
      <Text style={s.text}>Instagram bağlantısı burada paylaşılmaz. Katılım 5 dakika sürer; içerideyken yenileyebilirsiniz.</Text>
      {m.presence.visit ? <Text style={s.text}>{m.presence.visit.business_name} katılımınız sonlandırılıp bu kafeye geçilecektir.</Text> : null}
      {!m.presence.photoPath ? <FeedbackButton secondary label="Önce profil fotoğrafı ekle" icon="camera-outline" onPress={() => router.push('/profile-edit')} /> : null}
      <FeedbackButton disabled={m.choice === null} busy={m.presence.busy} label="Konumla kafeye katıl" icon="crosshairs-gps" onPress={() => { void m.join(); }} />
      <FeedbackError message={m.presence.error} />
    </> : !m.signedIn ? <FeedbackButton secondary label="Katılmak için giriş yap" icon="login" onPress={() => router.push('/auth')} /> : <Text style={s.text}>Kafe katılımı müşteri hesaplarına açıktır.</Text>}
    <FeedbackError message={m.error} />
  </View>;
});
