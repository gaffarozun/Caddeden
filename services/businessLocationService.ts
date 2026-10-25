import * as Location from 'expo-location';
import { isCafePositionUsable, CafePosition } from './cafeLocationRules';
import { withRequestTimeout } from './requestTimeoutService';
import { updateBusinessProfile } from './businessManageService';
// Owner-initiated location capture uses the same accuracy/freshness policy as customer confirmation.
export async function saveBusinessCurrentLocation(businessId: string): Promise<CafePosition> {
 const permission = await Location.requestForegroundPermissionsAsync();
 if (!permission.granted) throw new Error('İşletme konumunu kaydetmek için konum izni verin.');
 if (!await Location.hasServicesEnabledAsync()) throw new Error('Cihaz konumunu ve hassas konumu açın.');
 const fix = await withRequestTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest }), 'Konum alınamadı. İşletmenin içinde yeniden deneyin.', 20000);
 const position: CafePosition = { latitude: fix.coords.latitude, longitude: fix.coords.longitude, accuracy: fix.coords.accuracy, capturedAt: fix.timestamp };
 if (!isCafePositionUsable(position)) throw new Error('Konum yeterince hassas değil. İşletmede hassas konumu açıp yeniden deneyin; en fazla 20 m hassasiyet gerekir.');
 const { error } = await updateBusinessProfile(businessId, { lat: position.latitude, lng: position.longitude });
 if (error) throw new Error(error);
 return position;
}
