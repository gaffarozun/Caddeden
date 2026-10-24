import { useCallback, useEffect, useMemo, useState } from 'react';
import { cafeOccupancyEstimate } from '@/services/cafeSeatingService';
import { useCafeRoom } from './useCafeRoom';
import { useAuth } from './useAuth';
export function useCafeParticipation(businessId: string, manage = false) {
  const m = useCafeRoom(businessId, manage); const { authUser } = useAuth();
  const [choice, setChoice] = useState<boolean | null>(null);
  const active = m.local;
  useEffect(() => { setChoice(null); }, [businessId, active, authUser?.id]);
  const join = useCallback(async () => {
    if (m.room?.enabled && choice === null) return;
    if (await m.presence.join(businessId, m.room?.enabled ? choice === true : false)) setChoice(null);
  }, [choice, businessId, m.presence.join, m.room?.enabled]);
  const estimate = useMemo(() => m.room?.participation_enabled ? cafeOccupancyEstimate(m.room.count, m.room.capacity ?? 0) : null, [m.room?.participation_enabled, m.room?.count, m.room?.capacity]);
  return { ...m, estimate, active, choice, choose: setChoice, join, signedIn: !!authUser, customer: authUser?.role === 'user' && authUser.status === 'active' };
}
