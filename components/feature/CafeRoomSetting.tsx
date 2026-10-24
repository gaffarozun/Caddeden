import React, { memo } from 'react';
import { ActivityIndicator, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCafeRoom } from '@/hooks/useCafeRoom';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createCafeStyles } from '@/constants/cafeStyles';
import { FeedbackError } from './FeedbackControls';
interface CafeRoomSettingProps { businessId: string }
export const CafeRoomSetting = memo(function CafeRoomSetting({ businessId }: CafeRoomSettingProps) {
  const m = useCafeRoom(businessId, true); const { colors: c, styles: s } = useThemeStyles(createCafeStyles);
  return <View style={s.card}>
    <View style={s.row}><MaterialCommunityIcons name="storefront-outline" color={c.primaryDark} size={28} /><View style={s.info}><Text style={s.title}>İsteğe bağlı mekân katılımı</Text><Text style={s.text}>Müşteriler adını ve fotoğrafını her girişte gösterme veya gizleme seçimini yapabilir.</Text></View>{m.room ? <Switch accessibilityLabel="Mekân katılımını ve kullanıcı profillerini aç" disabled={m.busy} value={m.room.enabled} onValueChange={value => { void m.toggleEnabled(value); }} trackColor={{ true: c.primary, false: c.border }} thumbColor={c.onPrimary} /> : <ActivityIndicator color={c.primary} />}</View>
    <Text style={s.text}>Tüm işletme kategorilerinde kullanılabilir; açmak tamamen sizin tercihinizdir. Önce işletme konumunu kaydedin. Açınca 40 metreden yakın müşteriler onayla katılabilir; fotoğraf görünürlüğünü kendileri seçer. Kapatınca fotoğraflar ve Instagram erişimi kapanır, mevcut katılımlar sona erer. Masa planını aşağıdan ayrıca yönetebilirsiniz. Masa planını açınca onaylı katılımcılara göre tahmini doluluk da gösterilir; katılım yalnızca onaylı ve yayındaki işletmelerde açılır.</Text>
    <FeedbackError message={m.error} />
  </View>;
});
