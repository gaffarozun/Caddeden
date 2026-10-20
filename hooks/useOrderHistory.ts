import { useCallback, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from './useAuth';
import { useBusinessCart } from './useBusinessCart';
import { OrderRow, ReservationRow, listMyOrders, listMyReservations } from '@/services/businessRequestService';
import { isActiveOrder } from '@/services/businessProfileService';
export type HistoryItem = { id: string; kind: 'order'; order: OrderRow } | { id: string; kind: 'reservation'; reservation: ReservationRow };
export function useOrderHistory(businessId: string, initialMode: string, initialSection: string) {
  const { authUser } = useAuth(); const { revision } = useBusinessCart();
  const [orders, setOrders] = useState<OrderRow[]>([]); const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState(initialMode || 'all'); const [section, setSection] = useState(initialSection === 'reservations' ? 'reservations' : 'orders');
  const request = useRef(0);
  const load = useCallback(async () => {
    const version = ++request.current;
    if (!authUser) { setOrders([]); setReservations([]); setLoading(false); return; }
    try {
      const [o, r] = await Promise.all([listMyOrders(authUser.id), listMyReservations(authUser.id)]);
      if (version !== request.current) return;
      if (o.error || r.error) throw new Error(o.error || r.error || 'Geçmiş yüklenemedi.');
      setOrders(o.data); setReservations(r.data); setError('');
    } catch (reason) { if (version === request.current) setError(reason instanceof Error ? reason.message : 'Geçmiş yüklenemedi.'); }
    finally { if (version === request.current) { setLoading(false); setRefreshing(false); } }
  }, [authUser?.id]);
  useFocusEffect(useCallback(() => {
    setMode(initialMode || 'all'); setSection(initialSection === 'reservations' ? 'reservations' : 'orders');
    setLoading(true); void load();
    const timer = setInterval(() => { if (!AppState.currentState || AppState.currentState === 'active') void load(); }, 15000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void load(); });
    return () => { clearInterval(timer); subscription.remove(); request.current += 1; };
  }, [load, revision, initialMode, initialSection, businessId]));
  const scopedOrders = useMemo(() => orders.filter(order => !businessId || order.business_id === businessId), [orders, businessId]);
  const activeCount = scopedOrders.filter(order => isActiveOrder(order.status)).length;
  const items: HistoryItem[] = useMemo(() => section === 'reservations'
    ? reservations.filter(row => !businessId || row.business_id === businessId).map(reservation => ({ id: reservation.id, kind: 'reservation' as const, reservation }))
    : scopedOrders.filter(row => mode === 'all' || (mode === 'active' ? isActiveOrder(row.status) : !isActiveOrder(row.status))).map(order => ({ id: order.id, kind: 'order' as const, order })), [section, reservations, businessId, scopedOrders, mode]);
  const refresh = useCallback(() => { setRefreshing(true); void load(); }, [load]);
  return { authUser, items, activeCount, orderCount: scopedOrders.length, loading, error, refreshing, refresh, mode, setMode, section, setSection };
}
