import { useCallback, useEffect, useMemo, useState } from 'react';
import { cafeOccupancyEstimate } from '@/services/cafeSeatingService';
import { useCafeRoom } from './useCafeRoom';
import { useAuth } from './useAuth';
export function useCafeParticipation(businessId: string) {
  const m = useCafeRoom(businessId); const { authUser } = useAuth();
  const [choice, setChoice] = useState<boolean | null>(null);
  const active = m.presence.visit?.business_id === businessId;
  useEffect(() => { setChoice(null); }, [businessId, active, authUser?.id]);
  const join = useCallback(async () => {
    if (choice === null) return;
    if (await m.presence.join(businessId, choice)) setChoice(null);
  }, [choice, businessId, m.presence.join]);
  const estimate = useMemo(() => m.room?.enabled ? cafeOccupancyEstimate(m.room.count, m.room.capacity ?? 0) : null, [m.room?.enabled, m.room?.count, m.room?.capacity]);
  return { ...m, estimate, active, choice, choose: setChoice, join, signedIn: !!authUser, customer: authUser?.role === 'user' && authUser.status === 'active' };
}
