import { CafeMember } from '@/services/cafePresenceService';
import { isCafeRequestBlocked } from '@/services/cafeSocialService';
import { useCafeSocial } from './useCafeSocial';
export function useCafeMember(member: CafeMember) {
 const social = useCafeSocial();
 const request = social.outgoing.find(item => item.user_id === member.user_id);
 const status = request?.status ?? member.request_status;
 const requestId = request?.id ?? member.request_id;
 return { social, status, blocked: isCafeRequestBlocked(request), send: () => social.request(member.user_id), open: () => requestId ? social.open(requestId) : Promise.resolve(false), canOpen: status === 'accepted' && !!requestId };
}
