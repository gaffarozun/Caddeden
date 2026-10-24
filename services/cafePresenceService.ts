import { getSupabaseClient } from '@/template';
import * as Location from 'expo-location';
import { withRequestTimeout } from './requestTimeoutService';
import { CafeTable } from './cafeSeatingService';
import { CafeRequestStatus } from './cafeSocialService';

export interface CafeVisit { business_id: string; business_name: string; photo_visible: boolean; expires_at: string; social_enabled?: boolean }
export interface CafeMember { user_id: string; name: string; photo_path: string; has_instagram?: boolean; request_status?: CafeRequestStatus | null; request_id?: string | null }
export interface CafeRoom { enabled: boolean; mine: CafeVisit | null; count: number; members: CafeMember[]; occupancy_enabled?: boolean; tables?: CafeTable[]; capacity?: number; participation_enabled?: boolean; plan_visible?: boolean }
export const cafePollMilliseconds = 10000;
export function isCafeVisitLive(visit: CafeVisit | null, now = Date.now()): visit is CafeVisit {
  return !!visit && Number.isFinite(Date.parse(visit.expires_at)) && Date.parse(visit.expires_at) > now;
}
export function isCafeRoomLocal(room: CafeRoom | null, visit: CafeVisit | null, businessId: string, now = Date.now()): boolean {
  return isCafeVisitLive(visit, now) && isCafeVisitLive(room?.mine ?? null, now)
    && visit.business_id === businessId && room?.mine?.business_id === businessId;
}
async function rpc<T>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await withRequestTimeout(getSupabaseClient().rpc(name, body), 'Kafe bilgileri alınamadı. Bağlantınızı kontrol edin.');
  if (error) throw new Error(error.message);
  return data as T;
}
export const fetchMyCafeVisit = () => rpc<CafeVisit | null>('cafe_my_visit');
export const fetchCafeRoom = (businessId: string) => rpc<CafeRoom>('cafe_room_state', { p_business: businessId });
export const setCafeRoomEnabled = (businessId: string, enabled: boolean) => rpc<{ enabled: boolean }>('cafe_set_room', { p_business: businessId, p_enabled: enabled });
export const setCafePhotoVisibility = (visible: boolean) => rpc<CafeVisit>('cafe_set_visibility', { p_visible: visible });
export const leaveCafe = () => rpc<void>('cafe_leave');
export async function joinCafe(businessId: string, visible: boolean): Promise<CafeVisit> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('Kafeye katılmak için konum izni verin.');
  const position = await withRequestTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }), 'Konum alınamadı. Kafenin yakınında yeniden deneyin.', 20000);
  const { latitude, longitude, accuracy } = position.coords;
  if (accuracy == null || accuracy > 60) throw new Error('Konum yeterince hassas değil. Hassas konumu açıp tekrar deneyin.');
  return rpc<CafeVisit>('cafe_join', { p_business: businessId, p_lat: latitude, p_lng: longitude, p_accuracy: accuracy, p_captured_at: new Date(position.timestamp).toISOString(), p_visible: visible });
}
