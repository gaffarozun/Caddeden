import { memo } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { CafeMember } from '@/services/cafePresenceService';
import { educationLabel } from '@/services/educationService';
import { useCafeMember } from '@/hooks/useCafeMember';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createCafeStyles } from '@/constants/cafeStyles';
import { CafePhoto } from './CafePhoto';
import { FeedbackButton } from './FeedbackControls';
interface CafeMemberCardProps { member: CafeMember }
export const CafeMemberCard=memo(function CafeMemberCard({member}:CafeMemberCardProps){
 const m=useCafeMember(member); const {colors:c,styles:s}=useThemeStyles(createCafeStyles); const name=m.anonymous?'Kullanıcı':member.name;
 return <View style={s.peerCard}>
  <Pressable accessibilityRole="button" accessibilityLabel={`${name} profil fotoğrafını büyüt`} disabled={!m.photoUri || m.anonymous} onPress={m.showPhoto} style={({pressed})=>pressed?s.pressed:null}>
   <CafePhoto path={m.anonymous?null:member.photo_path} name={name}/>
   <Text style={s.label} numberOfLines={1}>{name}</Text>
  </Pressable>
  {!m.anonymous?<><Text style={s.peerHint}>{educationLabel(member.education_status)}</Text>{member.school_name?<Text style={s.peerHint} numberOfLines={2}>{member.school_name}</Text>:null}</>:null}
  <Text style={s.peerHint}>{m.anonymous?'Profil gizli':m.canOpen?'Karşılıklı izin':m.incomingPending?'Gelen istek':m.status==='pending'?'Onay bekleniyor':'Instagram gizli'}</Text>
  {m.anonymous?null:m.canOpen?<FeedbackButton secondary busy={m.social.busy} label="Instagramı aç" icon="open-in-new" onPress={()=>{void m.open();}}/>:!m.hasHandle?<Text style={s.peerHint}>Önce Instagram ekleyin</Text>:m.incomingPending?<Text style={s.peerHint}>Aşağıdan onaylayın</Text>:m.status==='accepted'?<Text style={s.peerHint}>Erişim şu an kapalı</Text>:member.has_instagram?<FeedbackButton secondary busy={m.social.busy} disabled={!m.canSend} label={m.status==='pending'?'İstek gönderildi':'İstek gönder'} icon="account-plus-outline" onPress={()=>{void m.send();}}/>:<Text style={s.peerHint}>Instagram eklenmemiş</Text>}
  {m.status==='accepted'?<FeedbackButton secondary busy={m.social.busy} label="İzni kaldır" icon="account-minus-outline" onPress={()=>{void m.revoke();}}/>:null}
  <Modal visible={m.photoOpen} animationType="fade" onRequestClose={m.closePhoto}>
   <SafeAreaView style={s.photoOverlay} edges={['top','bottom']}><View style={s.photoHeader}><Text style={s.photoTitle}>{name}</Text><Pressable accessibilityRole="button" accessibilityLabel="Fotoğrafı kapat" onPress={m.closePhoto} style={({pressed})=>[s.photoClose,pressed?s.pressed:null]}><MaterialCommunityIcons name="close" size={28} color={c.white}/></Pressable></View>
    {m.photoUri?<Image source={{uri:m.photoUri}} contentFit="contain" cachePolicy="none" transition={0} style={s.photoFull} accessibilityLabel={`${name} profil fotoğrafı`}/>:null}
   </SafeAreaView>
  </Modal>
 </View>;
});
