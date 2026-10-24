import { useCallback } from 'react';
import { CafeMember } from '@/services/cafePresenceService';
import { findCafeInstagramRequest, isCafeRequestBlocked, isInstagramHandleValid } from '@/services/cafeSocialService';
import { useCafeSocial } from './useCafeSocial';
export function useCafeMember(member: CafeMember) {
 const social = useCafeSocial();
 const request = findCafeInstagramRequest(member.user_id, social.incoming, social.outgoing);
 const outgoing = social.outgoing.find(item => item.user_id === member.user_id);
 const status = request?.status ?? member.request_status;
 const anonymous = member.anonymous === true || isCafeRequestBlocked(outgoing);
 const hasHandle = social.ready && isInstagramHandleValid(social.handle);
 const incomingPending = !!request && request.status === 'pending' && social.incoming.some(item => item.id === request.id);
 const canOpen = !anonymous && hasHandle && request?.status === 'accepted' && request.can_open === true;
 const canSend = !anonymous && hasHandle && !!member.has_instagram && status !== 'pending' && status !== 'accepted';
 const send = useCallback(() => canSend ? social.request(member.user_id) : Promise.resolve(false), [canSend, social.request, member.user_id]);
 const open = useCallback(() => canOpen && request ? social.open(request.id) : Promise.resolve(false), [canOpen, request, social.open]);
 return { social, status, anonymous, hasHandle, incomingPending, canSend, canOpen, blocked: isCafeRequestBlocked(outgoing), send, open };
}
