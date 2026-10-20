import { useMemo, useState } from 'react';
import { menuGroups } from '@/services/businessProfileService';
import { useBusinessProfile } from './useBusinessProfile';
import { useBusinessOrder } from './useBusinessOrder';
export function useBusinessMenu(id: string) {
  const profile = useBusinessProfile(id); const order = useBusinessOrder(profile.business, profile.canOrder);
  const [selected, setSelected] = useState(''); const [photo, setPhoto] = useState<string | null>(null);
  const groups = useMemo(() => menuGroups(profile.business?.menu ?? []), [profile.business?.menu]);
  const group = groups.find(value => value.name === selected) ?? groups[0];
  const banner = profile.business?.menuGroupCovers?.[group?.name ?? ''] || profile.business?.menuCover;
  return { profile, order, groups, group, setSelected, photo, setPhoto, banner };
}
