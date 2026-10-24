import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CafeRoom } from '@/services/cafePresenceService';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createCafeStyles } from '@/constants/cafeStyles';
import { CafeTablePlan } from './CafeTablePlan';
interface CafeOccupancyCardProps { room: CafeRoom }
// Existing export retained for compatibility; this card now shows the optional plan only.
export const CafeOccupancyCard = memo(function CafeOccupancyCard({ room }: CafeOccupancyCardProps) {
 const { colors: c, styles: s } = useThemeStyles(createCafeStyles);
 if (!room.occupancy_enabled) return null;
 return <View style={s.card}>
  <View style={s.row}><MaterialCommunityIcons name="table-chair" size={28} color={c.primaryDark} /><Text style={s.title}>Masa düzeni</Text></View>
  {room.plan_visible ? <CafeTablePlan tables={room.tables ?? []} /> : <View style={s.badge}><Text style={s.badgeText}>Masa düzeni için mekânda konumla katılın</Text></View>}
  <Text style={s.text}>İşletmenin paylaştığı masa planıdır. Doluluk oranı veya masaların dolu/boş durumu gösterilmez.</Text>
 </View>;
});
