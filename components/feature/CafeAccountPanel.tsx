import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCafeAccountPanel } from '@/hooks/useCafeAccountPanel';
import { useCafePresence } from '@/hooks/useCafePresence';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createCafeStyles } from '@/constants/cafeStyles';
import { CafeArrivalStatusCard } from './CafeArrivalStatusCard';
import { CafeParticipationCard } from './CafeParticipationCard';
import { CafeSocialRequestsCard } from './CafeSocialRequestsCard';
import { VenueProfilePrivacySetting } from './VenueProfilePrivacySetting';
interface CafeAccountPanelProps {}
export const CafeAccountPanel = memo(function CafeAccountPanel({}: CafeAccountPanelProps) {
  const m = useCafeAccountPanel(); const presence = useCafePresence(); const { colors: c, styles: s } = useThemeStyles(createCafeStyles);
  if (!m.customer) return null;
  return <View style={s.accountSection}>
    <Pressable accessibilityRole="button" accessibilityLabel="Mekândakiler, profiller ve istekler" accessibilityState={{ expanded: m.expanded }} onPress={m.toggle} style={({ pressed }) => [s.venueButton, m.expanded ? s.venueButtonOpen : null, pressed ? s.pressed : null]}>
      <MaterialCommunityIcons name="account-group-outline" size={26} color={c.primaryDark} />
      <View style={s.info}><Text style={s.label}>Doluluk, mekândakiler ve istekler</Text><Text style={s.text}>{presence.visit ? presence.visit.business_name : 'Konum onayı, görünürlük ve Instagram istekleri'}</Text></View>
      <MaterialCommunityIcons name={m.expanded ? 'chevron-up' : 'chevron-down'} size={24} color={c.primaryDark} />
    </Pressable>
    {m.expanded ? <View style={s.panel}>
      <CafeArrivalStatusCard />
      <VenueProfilePrivacySetting />
      {presence.visit ? <CafeParticipationCard businessId={presence.visit.business_id} embedded showRequests={false} /> : <Text style={s.text}>Henüz bir mekânda katılımınızı doğrulamadınız. Katılımı açan işletmelerde yakınlık bulutundan veya işletmenin Mekândakiler bölümünden “Buradayım” diyerek onaylayın. Profiliniz varsayılan olarak gizli kalır.</Text>}
      <CafeSocialRequestsCard showEmpty />
    </View> : null}
  </View>;
});
