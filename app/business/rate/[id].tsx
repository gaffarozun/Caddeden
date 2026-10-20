import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BusinessStarRating } from '@/components/feature/BusinessStarRating';
import { BusinessHeader } from '@/components/feature/BusinessProfileControls';
import { businessStyles as s } from '@/constants/businessProfileStyles';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
export default function BusinessRateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const router = useRouter(); const m = useBusinessProfile(typeof id === 'string' ? id : '');
  return <SafeAreaView style={s.screen} edges={['top', 'bottom']}><StatusBar style="light" /><View style={s.frame}><BusinessHeader title="İşletmeyi değerlendir" onBack={() => router.back()} /><ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}><Text style={s.heading}>{m.business?.name}</Text>{m.data?.isDemo ? <Text style={s.text}>Demo işletmeler puanlanamaz.</Text> : <BusinessStarRating businessId={typeof id === 'string' ? id : ''} referenceStyle />}</ScrollView></View></SafeAreaView>;
}
