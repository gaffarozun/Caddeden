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
    <View style={s.row}><MaterialCommunityIcons name="coffee-outline" color={c.primaryDark} size={28} /><View style={s.info}><Text style={s.title}>İsteğe bağlı kafe katılımı</Text><Text style={s.text}>Müşteriler fotoğrafını her girişte gösterme veya gizleme seçimini yapabilir.</Text></View>{m.room ? <Switch accessibilityLabel="Kafe katılımını aç" disabled={m.busy} value={m.room.enabled} onValueChange={value => { void m.toggleEnabled(value); }} trackColor={{ true: c.primary, false: c.border }} thumbColor={c.onPrimary} /> : <ActivityIndicator color={c.primary} />}</View>
    <Text style={s.text}>Önce işletme konumunu kaydedin. Kapatınca fotoğraflar ve Instagram erişimi kapanır, mevcut katılımlar sona erer. Masa planı ve tahmini doluluk gösterimini aşağıdan ayrıca yönetebilirsiniz. Yayındaki kafeler için geçerlidir.</Text>
    <FeedbackError message={m.error} />
  </View>;
});
