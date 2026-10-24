import React, { memo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCafeSocial } from '@/hooks/useCafeSocial';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createCafeStyles } from '@/constants/cafeStyles';
import { CafePhoto } from './CafePhoto';
import { FeedbackButton, FeedbackError } from './FeedbackControls';
interface CafeSocialRequestsCardProps { showEmpty?: boolean; localOnly?: boolean }
export const CafeSocialRequestsCard = memo(function CafeSocialRequestsCard({ showEmpty = false, localOnly = false }: CafeSocialRequestsCardProps) {
 const m = useCafeSocial(localOnly); const { colors: c, styles: s } = useThemeStyles(createCafeStyles);
 if (!showEmpty && m.incoming.length === 0 && m.sentRecipientCount === 0) return null;
 return <View style={s.card}>
  <View style={s.row}><MaterialCommunityIcons name="account-check-outline" size={28} color={c.primaryDark} /><Text style={s.title}>Instagram görme istekleri</Text></View>
  <Text style={s.text}>İzin vermeden Instagram açılmaz. Reddederseniz, isminiz ve fotoğrafınız istek gönderen kişiye 1 hafta gösterilmez; aynı mekânda yalnızca Kullanıcı olarak görünürsünüz.</Text>
  <View style={s.badge}><Text style={s.badgeText}>İstek gönderdiğiniz kişi sayısı: {m.sentRecipientCount}</Text></View>
  <Text style={s.text}>Farklı kişi sayısıdır; aynı kişiye tekrar gönderim sayıyı artırmaz. Bu sayı istek gönderdiğiniz kişiye de gösterilir.</Text>
  <View style={s.requestRail}><FlatList horizontal data={m.incoming} keyExtractor={item => item.id} contentContainerStyle={s.members} showsHorizontalScrollIndicator={false} ListEmptyComponent={<Text style={s.text}>Henüz istek yok.</Text>} renderItem={({ item }) => <View style={s.requestCard}>
   <View style={s.row}><CafePhoto path={item.photo_path ?? null} name={item.name ?? 'Katılımcı'} size={48} /><Text style={s.label}>{item.name ?? 'Kullanıcı'}</Text></View>
   <Text style={s.text}>Bu kullanıcı {Number(item.requester_sent_count ?? 0)} farklı kişiye Instagram görme isteği gönderdi.</Text>
   <Text style={s.text}>{item.status === 'accepted' ? 'İzin verildi' : 'Instagram profilinizi görmek istiyor'}</Text>
   {item.status === 'pending' ? <><FeedbackButton busy={m.busy} disabled={!item.can_accept || !m.handle} label="İzin ver" icon="check" onPress={() => { void m.decide(item.id, true); }} />{!item.can_accept ? <Text style={s.text}>Onay için ikiniz de aynı mekâna katılmalısınız.</Text> : !m.handle ? <Text style={s.text}>Önce Hesap Bilgilerim bölümünden Instagram kullanıcı adınızı ekleyin.</Text> : null}</> : null}
   <FeedbackButton secondary busy={m.busy} label={item.status === 'accepted' ? 'İzni kaldır' : 'Reddet'} icon="close" onPress={() => { void m.decide(item.id, false); }} />
  </View>} /></View>
  <FeedbackError message={m.error} />{m.notice ? <Text style={s.text} accessibilityLiveRegion="polite">{m.notice}</Text> : null}
 </View>;
});
