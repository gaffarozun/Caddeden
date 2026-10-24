import { getSupabaseClient } from '@/template';
import * as Location from 'expo-location';
import { withRequestTimeout } from './requestTimeoutService';
import { CafeTable } from './cafeSeatingService';
import { CafeRequestStatus } from './cafeSocialService';
import { CafePosition, cafePositionParameters, isCafePositionUsable, isCafeWithinEntryRadius } from './cafeLocationRules';

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
export interface NearbyCafe { business_id: string; business_name: string; social_enabled: boolean; distance_meters: number }
async function readCafePosition(): Promise<CafePosition> {
  const fix = await withRequestTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }), 'Konum alınamadı. Kafenin içinde yeniden deneyin.', 20000);
  const position: CafePosition = { latitude: fix.coords.latitude, longitude: fix.coords.longitude, accuracy: fix.coords.accuracy, capturedAt: fix.timestamp };
  if (!isCafePositionUsable(position)) throw new Error('Konum yeterince hassas veya güncel değil. Hassas konumu açıp yeniden deneyin (en fazla 20 m hassasiyet).');
  return position;
}
// Passive checks never open the system permission dialog and never persist GPS coordinates.
export async function getGrantedCafePosition(): Promise<CafePosition | null> {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) return null;
  return readCafePosition();
}
export async function fetchNearbyCafes(position: CafePosition): Promise<NearbyCafe[]> {
  if (!isCafePositionUsable(position)) return [];
  const rows = await rpc<NearbyCafe[]>('cafe_nearby', cafePositionParameters(position));
  return (Array.isArray(rows) ? rows : []).filter(row => isCafeWithinEntryRadius(row.distance_meters));
}
export async function joinCafe(businessId: string, visible: boolean): Promise<CafeVisit> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('Burada olduğunuzu doğrulamak için konum izni verin.');
  const position = await readCafePosition();
  return rpc<CafeVisit>('cafe_join', { p_business: businessId, ...cafePositionParameters(position), p_visible: visible });
}
