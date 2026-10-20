import { useEffect, useState } from 'react';
import { usePathname, useSegments } from 'expo-router';
import { useAuth } from './useAuth';
import { requireBusinessAccess } from '@/services/accountAccessService';
export function useRouteAccess() {
  const { authUser, loading, operationLoading, profileError } = useAuth();
  const path = usePathname(); const segments = useSegments() as string[];
  const group = segments[0] ?? '';
  const manager = /^\/business\/(manage|register|ads|posts|campaigns|requests|notifications)(\/|$)/.test(path);
  const customerAction = /^\/business\/(reserve|rate)(\/|$)/.test(path);
  const ownId = /^\/business\/manage\/([^/]+)/.exec(path)?.[1];
  const [verified, setVerified] = useState('');
  const [failure, setFailure] = useState('');
  const key = `${path}:${authUser?.id ?? ''}:${authUser?.role ?? ''}:${authUser?.status ?? ''}:${authUser?.businessAccess ?? false}`;
  useEffect(() => {
    let active = true; setVerified(''); setFailure('');
    if (!manager || !authUser || !['business','admin'].includes(authUser.role) || (authUser.role === 'business' && !authUser.businessAccess)) return;
    void requireBusinessAccess(ownId).then(() => { if (active) setVerified(key); }, reason => { if (active) { setVerified(key); setFailure(reason instanceof Error ? reason.message : 'Yetki doğrulanamadı.'); } });
    return () => { active = false; };
  }, [manager, ownId, key, authUser?.id, authUser?.role, authUser]);
  const roleAllowed = !manager || (!!authUser && ['business','admin'].includes(authUser.role) && authUser.status === 'active' && (authUser.role !== 'business' || authUser.businessAccess));
  const blocked = !roleAllowed || (group === '(business-tabs)' && (authUser?.role !== 'business' || !authUser.businessAccess)) || (customerAction && !!authUser && authUser.role !== 'user');
  return { checking: (loading || operationLoading) && manager || (!blocked && manager && verified !== key), blocked: blocked || !!failure, error: profileError || failure, home: authUser?.role === 'business' ? '/(business-tabs)' as const : '/(tabs)' as const };
}
