import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CafeRoom } from '@/services/cafePresenceService';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createCafeStyles } from '@/constants/cafeStyles';
import { CafeTablePlan } from './CafeTablePlan';
interface CafeOccupancyCardProps { room: CafeRoom; estimate: number | null }
export const CafeOccupancyCard = memo(function CafeOccupancyCard({ room, estimate }: CafeOccupancyCardProps) {
 const { colors: c, styles: s } = useThemeStyles(createCafeStyles);
 if (!room.occupancy_enabled) return null;
 return <View style={s.card}>
  <View style={s.row}><MaterialCommunityIcons name="table-chair" size={28} color={c.primaryDark} /><Text style={s.title}>Kafenin oturma düzeni</Text></View>
  <View style={s.occupancy}><View style={s.row}><Text style={s.percentage}>{estimate === null ? '—' : `%${estimate}`}</Text><View style={s.info}><Text style={s.label}>Tahmini doluluk</Text><Text style={s.text}>{room.count} aktif katılımcı / {room.capacity ?? 0} kişilik kapasite</Text></View></View>
   {estimate !== null ? <View style={s.progressTrack} accessibilityRole="progressbar" accessibilityLabel="Katılımcılara göre tahmini doluluk" accessibilityValue={{ min: 0, max: 100, now: estimate }}><View style={[s.progressFill, { width: `${estimate}%` }]} /></View> : <Text style={s.text}>Tahmin için işletmenin konumla katılımı açması gerekir.</Text>}
  </View>
  <CafeTablePlan tables={room.tables ?? []} />
  <Text style={s.text}>İşletmenin paylaştığı masa planı · Bilgi 10 saniyede bir güncellenir. Yalnızca konumla katılan uygulama kullanıcıları sayılır; fotoğrafı gizli kişiler de sayıya dahildir. Gerçek doluluk ve tek tek masaların doluluğu ölçülmez.</Text>
 </View>;
});
