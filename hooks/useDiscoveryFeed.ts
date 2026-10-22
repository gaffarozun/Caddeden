import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useRatings } from '@/hooks/useRatings';
import { countMainIn, fetchApprovedBusinesses, filterBusinessList, mergeBusinesses } from '@/services/businessService';
import { BUSINESSES } from '@/services/mockData';
import { Business } from '@/services/types';
import { MainCategoryId, getMainCategory } from '@/services/categories';
import { getOpenStatus } from '@/services/businessStatus';
import { DiscoveryRatingSort, sortDiscoveryBusinesses } from '@/services/discoveryRatingService';
import { shuffleFeed } from '@/services/feedOrderService';
import { useAlert } from '@/template';
import { useMenuSearch } from './useMenuSearch';
import { buildDiscoveryResults } from '@/services/discoveryResultsService';

export function useDiscoveryFeed() {
  const { authUser } = useAuth();
  const { showAlert } = useAlert();
  const { revision } = useRatings();
  const [query, setQuery] = useState('');
  const [main, setMain] = useState<MainCategoryId>('yeme_icme');
  const [sub, setSub] = useState('all');
  const [allBusinesses, setAllBusinesses] = useState<Business[]>(() => shuffleFeed(BUSINESSES));
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [ratingSort, setRatingSort] = useState<DiscoveryRatingSort>('recommended');
  const [refreshing, setRefreshing] = useState(false);
  const version = useRef(0);
  const load = useCallback(async (manual = false) => {
    const request = ++version.current;
    if (manual) setRefreshing(true);
    try {
      const real = await fetchApprovedBusinesses();
      if (request === version.current) setAllBusinesses(shuffleFeed(mergeBusinesses(real, BUSINESSES)));
    } catch (reason) {
      if (request === version.current) showAlert('Keşfet yüklenemedi', reason instanceof Error ? reason.message : 'İşletmeleri yeniden yüklemeyi deneyin.');
    } finally { if (request === version.current) setRefreshing(false); }
  }, [showAlert]);
  useFocusEffect(useCallback(() => {
    setRefreshing(false); void load();
    return () => { version.current += 1; };
  }, [load, revision, authUser?.id]));
  const businesses = useMemo(() => {
    const base = filterBusinessList(allBusinesses, main, sub, query);
    const visible = onlyOpen ? base.filter(item => getOpenStatus(item).open) : base;
    return sortDiscoveryBusinesses(visible, ratingSort);
  }, [allBusinesses, main, sub, query, onlyOpen, ratingSort]);
  const openBusinessIds = useMemo(() => onlyOpen ? allBusinesses
    .filter(item => /^[0-9a-f-]{36}$/i.test(item.id) && getOpenStatus(item).open)
    .map(item => item.id).sort() : null, [allBusinesses, onlyOpen]);
  const menuSearch = useMenuSearch({ query, main, sub, openBusinessIds }, revision);
  const searching = !!query.trim();
  const results = useMemo(() => buildDiscoveryResults(businesses, menuSearch.items, searching), [businesses, menuSearch.items, searching]);
  const counts = useMemo(() => ({
    yeme_icme: countMainIn(allBusinesses, 'yeme_icme'),
    guzellik_bakim: countMainIn(allBusinesses, 'guzellik_bakim'),
  }), [allBusinesses]);
  const handleMain = useCallback((id: MainCategoryId) => { setMain(id); setSub('all'); }, []);
  const refresh = useCallback(() => { menuSearch.retry(); void load(true); }, [load, menuSearch.retry]);
  return { query, setQuery, main, sub, setSub, onlyOpen, setOnlyOpen, ratingSort, setRatingSort,
    businesses, results, menuSearch, searching, counts, activeMain: getMainCategory(main), handleMain, refreshing, refresh };
}
