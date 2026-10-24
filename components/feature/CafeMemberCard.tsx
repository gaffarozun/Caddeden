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
 if (m.blocked) return null;
 return <View style={s.peerCard}>
  <CafePhoto path={member.photo_path} name={member.name} />
  <Text style={s.label} numberOfLines={1}>{member.name}</Text>
  <Text style={s.peerHint}>{m.canOpen ? 'Erişim izni verildi' : m.status === 'pending' ? 'Onay bekleniyor' : 'Instagram gizli'}</Text>
  {m.canOpen ? <FeedbackButton secondary busy={m.social.busy} label="Instagramı aç" icon="open-in-new" onPress={() => { void m.open(); }} /> : member.has_instagram ? <FeedbackButton secondary busy={m.social.busy} disabled={m.status === 'pending'} label={m.status === 'pending' ? 'İstek gönderildi' : 'Görme isteği gönder'} icon="account-plus-outline" onPress={() => { void m.send(); }} /> : <Text style={s.peerHint}>Kullanıcı adı eklenmemiş</Text>}
 </View>;
});
