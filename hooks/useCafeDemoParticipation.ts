import { useCallback, useMemo, useState } from 'react';
import { CafeDemoAction, cafeDemoRoom, getCafeDemoVenue } from '@/services/cafeDemoService';
import { cafeOccupancyEstimate } from '@/services/cafeSeatingService';
import { useCafeDemo } from './useCafeDemo';
export function useCafeDemoParticipation(businessId: string) {
  const { sessions, dispatch } = useCafeDemo();
  const [choice, setChoice] = useState<boolean | null>(null);
  const venue = useMemo(() => getCafeDemoVenue(businessId), [businessId]);
  const session = sessions[businessId];
  const room = useMemo(() => venue && session ? cafeDemoRoom(venue, session) : null, [venue, session]);
  const estimate = useMemo(() => room ? cafeOccupancyEstimate(room.count, room.capacity ?? 0) : null, [room]);
  const act = useCallback((action: CafeDemoAction) => dispatch(businessId, action), [businessId, dispatch]);
  const join = useCallback(() => { if (choice !== null) { act({ kind: 'join', visible: choice }); setChoice(null); } }, [act, choice]);
  const reset = useCallback(() => { act({ kind: 'reset' }); setChoice(null); }, [act]);
  return { venue, session, room, estimate, choice, choose: setChoice, act, join, reset };
}
