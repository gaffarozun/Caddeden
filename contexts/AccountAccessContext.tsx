import React, { createContext, ReactNode, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { loadCustomerAccess } from '@/services/accountStateService';
export interface AccountAccess { customer: boolean; checking: boolean; business: boolean; admin: boolean; guest: boolean }
export const AccountAccessContext = createContext<AccountAccess | undefined>(undefined);
export function AccountAccessProvider({ children }: { children: ReactNode }) {
 const { authUser, loading, operationLoading } = useAuth(); const [customer, setCustomer] = useState(false); const [checking, setChecking] = useState(true);
 useEffect(() => {
  let active = true; setCustomer(false); setChecking(true);
  if (!authUser || authUser.role !== 'user' || authUser.status !== 'active') { setChecking(false); return; }
  void loadCustomerAccess().then(value => { if (active) { setCustomer(value); setChecking(false); } }, () => { if (active) setChecking(false); });
  return () => { active = false; };
 }, [authUser]);
 const value = useMemo(() => ({ customer, checking: checking || loading || operationLoading, business: authUser?.role === 'business' && authUser.status === 'active', admin: authUser?.role === 'admin', guest: !authUser }), [customer, checking, loading, operationLoading, authUser]);
 return <AccountAccessContext.Provider value={value}>{children}</AccountAccessContext.Provider>;
}
