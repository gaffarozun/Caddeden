import { memo, useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CafeRoom } from '@/services/cafePresenceService';
import { occupancyShare } from '@/services/educationService';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createCafeStyles } from '@/constants/cafeStyles';
import { spacing } from '@/constants/theme';
interface CafeOccupancyCardProps { room: CafeRoom }
export const CafeOccupancyCard=memo(function CafeOccupancyCard({room}:CafeOccupancyCardProps){
 const {colors:c,styles:s}=useThemeStyles(createCafeStyles); const d=room.demographics;
 const rows=useMemo(()=>d?[
  {id:'female',label:'Kadın',count:d.female},{id:'male',label:'Erkek',count:d.male},
  {id:'gender_unknown',label:'Cinsiyet belirtilmemiş',count:d.gender_unknown},
  {id:'university',label:'Üniversite öğrencisi',count:d.university},
  {id:'student',label:'Aktif öğrenci',count:d.student},{id:'nonstudent',label:'Mezun / okumuyor',count:d.nonstudent},
  {id:'education_unknown',label:'Eğitim belirtilmemiş',count:d.education_unknown},
 ]:[],[d]);
 if(!room.occupancy_enabled || !room.occupancy_visible)return null;
 const value=room.occupancy_percent; const percent=typeof value==='number' && Number.isFinite(value)?Math.min(100,Math.max(0,value)):null;
 return <View style={s.card}>
  <View style={s.row}><MaterialCommunityIcons name="chart-donut" size={28} color={c.primaryDark}/><Text style={s.title}>Doluluk</Text></View>
  <View style={s.row}><Text style={s.occupancyValue}>{percent===null?'—':`%${percent}`}</Text><Text style={s.text}>Tahmini doluluk</Text></View>
  {percent!==null?<View style={s.progressTrack} accessible accessibilityRole="progressbar" accessibilityLabel="Tahmini doluluk" accessibilityValue={{min:0,max:100,now:percent}}><View style={[s.progressFill,{width:`${percent}%`}]}/></View>:<Text style={s.text}>İşletme kapasite belirtmemiş</Text>}
  <Text style={s.text}>Konumla katılanlar · {room.count}</Text>
  <FlatList data={rows} numColumns={2} scrollEnabled={false} keyExtractor={item=>item.id} columnWrapperStyle={{gap:spacing.sm}} contentContainerStyle={{gap:spacing.sm}} renderItem={({item})=>{
   const share=occupancyShare(item.count,d?.total??0);
   return <View style={s.statCell}><Text style={s.statValue}>{share===null?'—':`%${share}`}</Text><Text style={s.text}>{item.label}</Text></View>;
  }}/>
  {d && d.total>0?<Text style={s.peerHint}>Katılımcı beyanları · Üniversite öğrencileri aktif öğrenci oranına dahildir.</Text>:null}
 </View>;
});
