import type { CafeRoom } from './cafePresenceService';
import type { CafeTable } from './cafeSeatingService';
import { BUSINESSES } from './mockData';

// Isolated sample data: these non-UUID IDs must never enter cafe RPCs or private storage.
export type CafeDemoDecision = 'none' | 'pending' | 'accepted' | 'rejected';
export interface CafeDemoPerson { id: string; name: string; photo: string }
export interface CafeDemoVenue { businessId: string; name: string; cover: string; count: number; tables: CafeTable[]; people: CafeDemoPerson[] }
export interface CafeDemoSession { joined: boolean; visible: boolean; requests: Record<string, CafeDemoDecision>; hiddenUntil: Record<string, number>; incoming: CafeDemoDecision; notice: string; previewName: string }
const people: CafeDemoPerson[] = [
  { id: 'demo-deniz', name: 'Deniz', photo: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=200&q=80' },
  { id: 'demo-ece', name: 'Ece', photo: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=200&q=80' },
  { id: 'demo-mert', name: 'Mert', photo: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=200&q=80' },
];
function makePlan(id: string, total: number): CafeTable[] {
  return Array.from({ length: total }, (_, index) => ({ id: `${id}-table-${index}`, label: `Masa ${index + 1}`, seats: 4, grid_x: index % 3 * 2, grid_y: Math.floor(index / 3) }));
}
export const cafeDemoVenues: CafeDemoVenue[] = ['b2', 'b7'].map((id, index) => {
  const business = BUSINESSES.find(item => item.id === id)!;
  return { businessId: id, name: business.name, cover: business.cover, count: index === 0 ? 15 : 24, tables: makePlan(id, index === 0 ? 6 : 8), people };
});
export function getCafeDemoVenue(id: string): CafeDemoVenue | null { return cafeDemoVenues.find(item => item.businessId === id) ?? null; }
export function createCafeDemoSession(): CafeDemoSession {
  return { joined: true, visible: false, requests: {}, hiddenUntil: {}, incoming: 'pending', notice: '', previewName: '' };
}
export function cafeDemoRoom(venue: CafeDemoVenue, session: CafeDemoSession): CafeRoom {
  return { enabled: true, participation_enabled: true, occupancy_enabled: true, plan_visible: session.joined, mine: null, members: [], count: venue.count, capacity: venue.tables.reduce((sum, table) => sum + table.seats, 0), tables: session.joined ? venue.tables : [] };
}
export function reduceCafeDemo(session: CafeDemoSession, action: CafeDemoAction, now = Date.now()): CafeDemoSession {
  switch (action.kind) {
    case 'join': return { ...session, joined: true, visible: action.visible, notice: 'Demo katılımı açıldı. Konum alınmadı; gerçek bir mekâna katılmadınız.' };
    case 'leave': return { ...session, joined: false, visible: false, previewName: '', notice: 'Demo katılımı kapatıldı. Gerçek kafe katılımınız değişmedi.' };
    case 'visibility': return { ...session, visible: action.visible, notice: action.visible ? 'Demo fotoğrafınız görünür olarak işaretlendi.' : 'Demo fotoğrafınız gizlendi. Doluluk tahminine dahil olmayı sürdürürsünüz.' };
    case 'request': {
      if (!session.joined || (session.hiddenUntil[action.personId] ?? 0) > now || ['pending', 'accepted'].includes(session.requests[action.personId] ?? 'none')) return session;
      return { ...session, requests: { ...session.requests, [action.personId]: 'pending' }, notice: 'Örnek istek gönderildi. Aşağıdan karşı tarafın onayını veya reddini canlandırabilirsiniz.' };
    }
    case 'decide': {
      if (!session.joined || session.requests[action.personId] !== 'pending') return session;
      return { ...session, requests: { ...session.requests, [action.personId]: action.accept ? 'accepted' : 'rejected' }, hiddenUntil: { ...session.hiddenUntil, [action.personId]: action.accept ? 0 : now + 3 * 24 * 60 * 60 * 1000 }, notice: action.accept ? 'Demo izin verildi. Örnek profil artık açılabilir.' : 'Demo istek reddedildi. Bu örnek kişinin fotoğrafı size 3 gün gizlendi; sıfırlayarak tekrar deneyebilirsiniz.' };
    }
    case 'incoming': return { ...session, incoming: action.accept ? 'accepted' : 'rejected', notice: action.accept ? 'Demo gelen isteğe izin verdiniz.' : 'Demo gelen isteği reddettiniz. İstek gönderen örnek kişi fotoğrafınızı 3 gün göremez.' };
    case 'preview': return session.joined && session.requests[action.personId] === 'accepted' ? { ...session, previewName: action.name } : session;
    case 'close': return { ...session, previewName: '' };
    case 'reset': return createCafeDemoSession();
  }
}
export type CafeDemoAction = { kind: 'join' | 'visibility'; visible: boolean } | { kind: 'leave' | 'close' | 'reset' } | { kind: 'request'; personId: string } | { kind: 'decide'; personId: string; accept: boolean } | { kind: 'incoming'; accept: boolean } | { kind: 'preview'; personId: string; name: string };
