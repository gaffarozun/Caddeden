import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CafeRoom } from '@/services/cafePresenceService';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createCafeStyles } from '@/constants/cafeStyles';
import { CafeTablePlan } from './CafeTablePlan';
interface CafeOccupancyCardProps { room: CafeRoom; estimate: number | null; demo?: boolean }
export const CafeOccupancyCard = memo(function CafeOccupancyCard({ room, estimate, demo = false }: CafeOccupancyCardProps) {
 const { colors: c, styles: s } = useThemeStyles(createCafeStyles);
 if (!room.occupancy_enabled) return null;
 return <View style={s.card}>
  <View style={s.row}><MaterialCommunityIcons name="table-chair" size={28} color={c.primaryDark} /><Text style={s.title}>Mekânın doluluğu</Text></View>
  <View style={s.occupancy}><View style={s.row}><Text style={s.percentage}>{estimate === null ? '—' : `%${estimate}`}</Text><View style={s.info}><Text style={s.label}>Tahmini doluluk</Text><Text style={s.text}>{room.count} {demo ? 'örnek' : 'aktif'} katılımcı / {room.capacity ?? 0} kişilik kapasite</Text></View></View>
   {estimate !== null ? <View style={s.progressTrack} accessibilityRole="progressbar" accessibilityLabel="Katılımcılara göre tahmini doluluk" accessibilityValue={{ min: 0, max: 100, now: estimate }}><View style={[s.progressFill, { width: `${estimate}%` }]} /></View> : <Text style={s.text}>Tahmin için işletme konumu ve masa kapasitesi kaydedilmelidir.</Text>}
  </View>
  {room.plan_visible ? <><Text style={s.label}>Masa düzeni</Text><CafeTablePlan tables={room.tables ?? []} /></> : <View style={s.badge}><Text style={s.badgeText}>Masa düzeni için mekânda konumla katılın</Text></View>}
  <Text style={s.text}>{demo ? 'Sabit demo verisi; gerçek doluluk değildir. Gerçek mekânda konumla katılanlar sayılır, fotoğrafını gizleyenler de tahmine dahildir.' : 'Bilgi 10 saniyede bir güncellenir. Konumla katılan kullanıcılar sayılır; fotoğrafını gizleyen kişiler de doluluk tahminine dahildir. Gerçek doluluk ve tek tek masaların doluluğu ölçülmez.'}</Text>
 </View>;
});
