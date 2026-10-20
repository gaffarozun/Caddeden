import { useLocalSearchParams } from 'expo-router';
import { BusinessReservationView } from '@/components/feature/BusinessReservationView';
export default function BusinessReserveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BusinessReservationView businessId={typeof id === 'string' ? id : ''} />;
}
