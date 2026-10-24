import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { CafeMember } from '@/services/cafePresenceService';
import { useCafeMember } from '@/hooks/useCafeMember';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createCafeStyles } from '@/constants/cafeStyles';
import { CafePhoto } from './CafePhoto';
import { FeedbackButton } from './FeedbackControls';
interface CafeMemberCardProps { member: CafeMember }
export const CafeMemberCard = memo(function CafeMemberCard({ member }: CafeMemberCardProps) {
 const m = useCafeMember(member); const { styles: s } = useThemeStyles(createCafeStyles);
 const name = m.anonymous ? 'Kullanıcı' : member.name;
 return <View style={s.peerCard}>
  <CafePhoto path={m.anonymous ? null : member.photo_path} name={name} />
  <Text style={s.label} numberOfLines={1}>{name}</Text>
  <Text style={s.peerHint}>{m.anonymous ? 'Profil gizli' : m.canOpen ? 'Karşılıklı izin' : m.incomingPending ? 'Gelen istek' : m.status === 'pending' ? 'Onay bekleniyor' : 'Instagram gizli'}</Text>
  {m.anonymous ? null : m.canOpen ? <FeedbackButton secondary busy={m.social.busy} label="Instagramı aç" icon="open-in-new" onPress={() => { void m.open(); }} /> : !m.hasHandle ? <Text style={s.peerHint}>Önce Instagram ekleyin</Text> : m.incomingPending ? <Text style={s.peerHint}>Aşağıdan onaylayın</Text> : m.status === 'accepted' ? <Text style={s.peerHint}>Erişim şu an kapalı</Text> : member.has_instagram ? <FeedbackButton secondary busy={m.social.busy} disabled={!m.canSend} label={m.status === 'pending' ? 'İstek gönderildi' : 'İstek gönder'} icon="account-plus-outline" onPress={() => { void m.send(); }} /> : <Text style={s.peerHint}>Instagram eklenmemiş</Text>}
 </View>;
});
