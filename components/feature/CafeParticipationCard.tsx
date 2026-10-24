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
import { CafeArrivalStatusCard } from './CafeArrivalStatusCard';
import { FeedbackButton, FeedbackError } from './FeedbackControls';
interface CafeParticipationCardProps { businessId: string; canManage?: boolean; embedded?: boolean; showRequests?: boolean; hasLocation?: boolean }
export const CafeParticipationCard = memo(function CafeParticipationCard({ businessId, canManage = false, embedded = false, showRequests = true, hasLocation }: CafeParticipationCardProps) {
  const m = useCafeParticipation(businessId, canManage);
  const social = useCafeSocial(); const router = useRouter();
  const { colors: c, styles: s } = useThemeStyles(createCafeStyles);
  const expanded = embedded || m.expanded;
  return <View style={s.accountSection}>
    {!embedded ? <Pressable accessibilityRole="button" accessibilityLabel="Mekân doluluğu ve kullanıcı profillerini göster" accessibilityState={{ expanded }} onPress={m.toggleExpanded} style={({ pressed }) => [s.venueButton, expanded ? s.venueButtonOpen : null, pressed ? s.pressed : null]}>
      <MaterialCommunityIcons name="table-chair" color={c.primaryDark} size={28} />
      <View style={s.info}><Text style={s.label}>Doluluk ve mekândakiler</Text><Text style={s.text}>Masa düzeni, kullanıcı profilleri ve istekler</Text></View>
      <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} color={c.primaryDark} size={24} />
    </Pressable> : null}
    {expanded ? <View style={s.venueSection}>
      {!m.room ? m.error ? <FeedbackError message={m.error} /> : <ActivityIndicator color={c.primary} accessibilityLabel="Mekân katılımı yükleniyor" /> : !m.room.enabled && !m.room.occupancy_enabled ? <View style={s.card}>
        <Text style={s.title}>İşletme katılımı henüz açmamış</Text>
        <Text style={s.text}>{hasLocation === false ? 'İşletmenin kayıtlı konumu eksik. Konum ile masa/doluluk veya sosyal katılım ayarı tamamlanmadan onay bulutu gelmez.' : 'Onay bulutunun gelmesi ve katılımcıların sayılması için işletme masa/doluluk veya sosyal katılımı açmalıdır. Kapalı özellikler için doluluk ve profiller paylaşılmaz.'}</Text>
        {canManage ? <FeedbackButton secondary label="Konum ve katılım ayarlarını düzenle" icon="store-cog-outline" onPress={() => router.push(`/business/manage/${businessId}`)} /> : <CafeArrivalStatusCard compact />}
      </View> : <>
        <CafeOccupancyCard room={m.room} estimate={m.estimate} />
        {canManage ? <Text style={s.text}>Masa düzeninizi burada önizleyebilirsiniz. Müşteri profilleri ve Instagram istekleri yalnızca aynı mekânda konumla katılan müşterilere açıktır.</Text> : m.active ? <>
          <View style={s.badge}><Text style={s.badgeText}>Konum doğrulandı · Dolulukta sayılıyorsunuz</Text></View>
          <CafeVisitPrivacyCard businessId={businessId} />
          {m.room.enabled ? <View style={s.card}>
            <View style={s.row}><MaterialCommunityIcons name="account-group-outline" size={26} color={c.primaryDark} /><Text style={s.title}>Bu mekândaki profiller</Text></View>
            <Text style={s.text}>{m.room.count} aktif katılımcı. Yalnızca fotoğrafını göstermeyi seçen kişiler görünür; gizleyenler de dolulukta sayılır.</Text>
            <Text style={s.text}>Instagram için görme isteği gönderin. Bağlantı karşı tarafın izniyle açılır. Reddedilirse fotoğrafı size 3 gün gösterilmez.</Text>
            <View style={s.peerRail}><FlatList horizontal data={m.members} keyExtractor={item => item.user_id} contentContainerStyle={s.members} showsHorizontalScrollIndicator={false} renderItem={({ item }) => <CafeMemberCard member={item} />} ListEmptyComponent={<Text style={s.text}>Şu anda fotoğrafını paylaşan başka katılımcı yok.</Text>} /></View>
            <FeedbackError message={social.error} />
            {social.notice ? <Text style={s.text} accessibilityLiveRegion="polite">{social.notice}</Text> : null}
            {showRequests ? <CafeSocialRequestsCard localOnly showEmpty /> : null}
          </View> : null}
        </> : m.room.participation_enabled ? <View style={s.card}>
          <Text style={s.title}>Buradayım · Konumla doğrula</Text>
          <Text style={s.text}>Bulut gelmediyse veya reddettiyseniz buradan onaylayın. Kayıtlı konuma 20 metreden yakın olmalısınız. Onayla dolulukta sayılır, masa düzeni ve görünür profilleri açarsınız.</Text>
          {m.customer ? <>
            {m.room.enabled ? <>
              <Text style={s.label}>Bu girişte profil fotoğrafınız</Text>
              <Text style={s.text}>Gizli kalsanız da dolulukta sayılır ve görünür profilleri görebilirsiniz.</Text>
              <View style={s.choiceRow}>{[false, true].map(visible => <Pressable key={String(visible)} accessibilityRole="radio" accessibilityLabel={visible ? 'Fotoğrafımı göster' : 'Fotoğrafımı gizle'} accessibilityState={{ checked: m.choice === visible, disabled: m.presence.busy }} disabled={m.presence.busy} onPress={() => m.choose(visible)} style={({ pressed }) => [s.choice, m.choice === visible ? s.selected : null, pressed ? s.pressed : null]}><MaterialCommunityIcons name={visible ? 'eye-outline' : 'eye-off-outline'} color={c.primaryDark} size={24} /><Text style={s.label}>{visible ? 'Göster' : 'Gizle'}</Text></Pressable>)}</View>
              {!m.presence.photoPath ? <FeedbackButton secondary label="Profil fotoğrafı ekle" icon="camera-outline" onPress={() => router.push('/profile-edit')} /> : null}
            </> : <Text style={s.text}>Sosyal katılım kapalı. Yalnızca masa düzeni açılır; fotoğraf veya Instagram paylaşılmaz.</Text>}
            {m.presence.visit ? <Text style={s.text}>{m.presence.visit.business_name} katılımınız sonlandırılıp bu mekâna geçilecektir.</Text> : null}
            <FeedbackButton busy={m.presence.busy} label="Buradayım · Konumla doğrula" icon="crosshairs-gps" onPress={() => { void m.join(); }} />
            <FeedbackError message={m.presence.error} />
            <CafeArrivalStatusCard compact />
          </> : !m.signedIn ? <FeedbackButton secondary label="Katılmak için giriş yap" icon="login" onPress={() => router.push('/auth')} /> : <Text style={s.text}>Konumla katılım müşteri hesaplarına açıktır.</Text>}
        </View> : <Text style={s.text}>İşletme konumu eksik veya katılım açık değil. Konum ve katılım ayarları tamamlanmadan bulut gelmez.</Text>}
        <FeedbackError message={m.error} />
      </>}
    </View> : null}
  </View>;
});
