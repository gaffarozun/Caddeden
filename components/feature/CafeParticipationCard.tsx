import React, { memo } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCafeParticipation } from '@/hooks/useCafeParticipation';
import { useCafeSocial } from '@/hooks/useCafeSocial';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createCafeStyles } from '@/constants/cafeStyles';
import { CafeVisitPrivacyCard } from './CafeVisitPrivacyCard';
import { CafeOccupancyCard } from './CafeOccupancyCard';
import { CafeMemberCard } from './CafeMemberCard';
import { CafeSocialRequestsCard } from './CafeSocialRequestsCard';
import { FeedbackButton, FeedbackError } from './FeedbackControls';
interface CafeParticipationCardProps { businessId: string; canManage?: boolean }
export const CafeParticipationCard = memo(function CafeParticipationCard({ businessId, canManage = false }: CafeParticipationCardProps) {
  const m = useCafeParticipation(businessId, canManage);
  const social = useCafeSocial(); const router = useRouter();
  const { colors: c, styles: s } = useThemeStyles(createCafeStyles);
  if (!m.room) return m.error ? <FeedbackError message={m.error} /> : <View style={s.card}><ActivityIndicator color={c.primary} accessibilityLabel="Mekân katılımı yükleniyor" /></View>;
  if (!m.room.enabled && !m.room.occupancy_enabled) return null;
  return <View style={s.venueSection}>
    <View style={s.row}>
      <View style={s.venueIcon}><MaterialCommunityIcons name="coffee-outline" color={c.primaryDark} size={28} /></View>
      <View style={s.info}><Text style={s.title}>Mekândakiler</Text><Text style={s.text}>Doluluk, masa düzeni ve bu mekândaki profiller</Text></View>
    </View>
    <CafeOccupancyCard room={m.room} estimate={m.estimate} />
    {canManage ? <Text style={s.text}>İşletmenizin masa düzenini burada önizleyebilirsiniz. Müşteri profilleri ve Instagram istekleri yalnızca aynı mekânda konumla katılan müşterilere açıktır.</Text> : m.active ? <>
      <View style={s.badge}><Text style={s.badgeText}>Konum doğrulandı · Bu mekâna katıldınız</Text></View>
      <CafeVisitPrivacyCard businessId={businessId} />
      {m.room.enabled ? <View style={s.card}>
        <View style={s.row}><MaterialCommunityIcons name="account-group-outline" size={26} color={c.primaryDark} /><Text style={s.title}>Bu mekândaki profiller</Text></View>
        <Text style={s.text}>{m.room.count} aktif katılımcı. Yalnızca fotoğrafını göstermeyi seçen kişiler görünür; gizleyenler doluluk tahminine yine dahildir.</Text>
        <Text style={s.text}>Instagram profili için görme isteği gönderin. Bağlantı ancak karşı taraf izin verirse açılır. Reddedilirse fotoğrafı size 3 gün gösterilmez.</Text>
        <View style={s.peerRail}><FlatList horizontal data={m.members} keyExtractor={item => item.user_id} contentContainerStyle={s.members} showsHorizontalScrollIndicator={false} renderItem={({ item }) => <CafeMemberCard member={item} />} ListEmptyComponent={<Text style={s.text}>Bu mekânda şu anda fotoğrafını paylaşan başka katılımcı yok.</Text>} /></View>
        <FeedbackError message={social.error} />
        {social.notice ? <Text style={s.text} accessibilityLiveRegion="polite">{social.notice}</Text> : null}
        <CafeSocialRequestsCard localOnly showEmpty />
      </View> : null}
    </> : m.room.participation_enabled ? <View style={s.card}>
      <Text style={s.title}>{m.room.enabled ? 'Mekândayım · Katıl' : 'Masa düzenini aç'}</Text>
      <Text style={s.text}>Masa düzeni ve katılımcı profilleri yalnızca mekânın yakınında konumla katıldıktan sonra açılır. Konumunuz sunucuda 100 m yakınlık kontrolü için kullanılır, kaydedilmez.</Text>
      {m.customer ? <>
        {m.room.enabled ? <>
          <Text style={s.label}>Bu girişte fotoğrafınız nasıl görünsün?</Text>
          <View style={s.choiceRow}>{[false, true].map(visible => <Pressable key={String(visible)} accessibilityRole="radio" accessibilityLabel={visible ? 'Fotoğrafımı göster' : 'Fotoğrafımı gizle'} accessibilityState={{ checked: m.choice === visible, disabled: m.presence.busy }} disabled={m.presence.busy} onPress={() => m.choose(visible)} style={({ pressed }) => [s.choice, m.choice === visible ? s.selected : null, pressed ? s.pressed : null]}><MaterialCommunityIcons name={visible ? 'eye-outline' : 'eye-off-outline'} color={c.primaryDark} size={24} /><Text style={s.label}>{visible ? 'Göster' : 'Gizle'}</Text></Pressable>)}</View>
          {!m.presence.photoPath ? <FeedbackButton secondary label="Profil fotoğrafı ekle" icon="camera-outline" onPress={() => router.push('/profile-edit')} /> : null}
        </> : <Text style={s.text}>İşletme sosyal katılımı kapalı tutuyor. Yalnızca masa düzeni açılır; fotoğraf veya Instagram paylaşılmaz.</Text>}
        {m.presence.visit ? <Text style={s.text}>{m.presence.visit.business_name} katılımınız sonlandırılıp bu mekâna geçilecektir.</Text> : null}
        <FeedbackButton disabled={m.room.enabled && m.choice === null} busy={m.presence.busy} label="Konumla mekâna katıl" icon="crosshairs-gps" onPress={() => { void m.join(); }} />
        <Text style={s.text}>Katılım 5 dakika sürer. Süre bitince masa düzeni ve profiller gizlenir; mekândaysanız konumla yeniden katılabilirsiniz.</Text>
        <FeedbackError message={m.presence.error} />
      </> : !m.signedIn ? <FeedbackButton secondary label="Katılmak için giriş yap" icon="login" onPress={() => router.push('/auth')} /> : <Text style={s.text}>Konumla katılım müşteri hesaplarına açıktır.</Text>}
    </View> : <Text style={s.text}>Konumla katılım şu anda açık değil. İşletmenin konumunu ve katılım ayarını tamamlaması gerekir.</Text>}
    <FeedbackError message={m.error} />
  </View>;
});
