// Powered by OnSpace.AI
import { getSupabaseClient } from '@/template';
import { BUSINESSES } from './mockData';
import { Business } from './types';
import { MainCategoryId, getSubCategory } from './categories';

export function getBusinessById(id?: string): Business | undefined {
  return BUSINESSES.find((b) => b.id === id);
}

export function getFeatured(): Business[] {
  return BUSINESSES.filter((b) => b.featured);
}

export function getCampaignBusinesses(main?: MainCategoryId): Business[] {
  return BUSINESSES.filter(
    (b) => !!b.campaign && (!main || getSubCategory(b.category)?.main === main)
  );
}

export function countByMain(main: MainCategoryId): number {
  return BUSINESSES.filter((b) => getSubCategory(b.category)?.main === main).length;
}

export function filterBusinesses(
  main: MainCategoryId | 'all',
  sub: string | 'all',
  query: string
): Business[] {
  const q = query.trim().toLowerCase();
  return BUSINESSES.filter((b) => {
    const subCat = getSubCategory(b.category);
    const matchMain = main === 'all' ? true : subCat?.main === main;
    const matchSub = sub === 'all' ? true : subCat?.id === sub;
    const matchQ =
      q.length === 0 ||
      b.name.toLowerCase().includes(q) ||
      (subCat?.label.toLowerCase().includes(q) ?? false) ||
      (b.campaign ? b.campaign.toLowerCase().includes(q) : false);
    return matchMain && matchSub && matchQ;
  });
}

// Fetch a real (database) business for the detail screen. Used as a fallback
// when the id is not part of the demo/mock data set.
export async function fetchBusinessDetail(id?: string): Promise<Business | null> {
  if (!id) return null;
  const { data, error } = await getSupabaseClient()
    .from('businesses')
    .select('*, menu_items(*)')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, any>;
  const images: string[] = Array.isArray(row.images) ? row.images : [];
  const cover = row.cover_url || images[0] || row.logo_url || '';
  const sub = getSubCategory(row.category);
  const menu = (((row.menu_items as any[]) ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((m) => ({ id: m.id, name: m.name, price: Number(m.price ?? 0), image: m.image_url ?? undefined, group: m.group_name ?? undefined })));
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description ?? '',
    cover,
    images: images.length ? images : cover ? [cover] : [],
    rating: Number(row.rating ?? 0),
    reviewCount: row.review_count ?? 0,
    distanceKm: 0,
    address: row.address ?? '',
    phone: row.phone ?? '',
    hours: row.hours ?? '',
    openTime: row.open_time ?? undefined,
    closeTime: row.close_time ?? undefined,
    openDays: Array.isArray(row.open_days) ? row.open_days : undefined,
    statusMode: row.status_mode === 'auto' ? 'auto' : row.status_mode === 'manual' ? 'manual' : undefined,
    avgDeliveryMinutes: row.avg_delivery_minutes ?? undefined,
    isOpen: !!row.is_open,
    featured: !!row.featured,
    campaign: undefined,
    hasMenu: !!sub?.hasMenu,
    allowMenu: typeof row.allow_menu === 'boolean' ? row.allow_menu : undefined,
    allowReservation: typeof row.allow_reservation === 'boolean' ? row.allow_reservation : undefined,
    allowOrder: typeof row.allow_order === 'boolean' ? row.allow_order : undefined,
    minOrder: row.min_order != null ? Number(row.min_order) : undefined,
    menu,
    pin: { x: 0, y: 0 },
  };
}

// Map a raw DB business row to the app Business shape (list view; no menu).
function mapBusinessRow(row: Record<string, any>): Business {
  const images: string[] = Array.isArray(row.images) ? row.images : [];
  const cover = row.cover_url || images[0] || row.logo_url || '';
  const sub = getSubCategory(row.category);
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description ?? '',
    cover,
    images: images.length ? images : cover ? [cover] : [],
    rating: Number(row.rating ?? 0),
    reviewCount: row.review_count ?? 0,
    distanceKm: 0,
    address: row.address ?? '',
    phone: row.phone ?? '',
    hours: row.hours ?? '',
    openTime: row.open_time ?? undefined,
    closeTime: row.close_time ?? undefined,
    openDays: Array.isArray(row.open_days) ? row.open_days : undefined,
    statusMode: row.status_mode === 'auto' ? 'auto' : row.status_mode === 'manual' ? 'manual' : undefined,
    avgDeliveryMinutes: row.avg_delivery_minutes ?? undefined,
    isOpen: !!row.is_open,
    featured: !!row.featured,
    campaign: undefined,
    hasMenu: !!sub?.hasMenu,
    allowMenu: typeof row.allow_menu === 'boolean' ? row.allow_menu : undefined,
    allowReservation: typeof row.allow_reservation === 'boolean' ? row.allow_reservation : undefined,
    allowOrder: typeof row.allow_order === 'boolean' ? row.allow_order : undefined,
    minOrder: row.min_order != null ? Number(row.min_order) : undefined,
    menu: [],
    pin: { x: 0, y: 0 },
  };
}

// Fetch saved businesses by id from the database, preserving the given order.
// Falls back to local mock data for ids not present in the database so both
// real and demo saved businesses show up reliably.
export async function fetchBusinessesByIds(ids: string[]): Promise<Business[]> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return [];
  let dbList: Business[] = [];
  const { data, error } = await getSupabaseClient().from('businesses').select('*').in('id', unique);
  if (!error && Array.isArray(data)) dbList = data.map(mapBusinessRow);
  const byId = new Map<string, Business>();
  dbList.forEach((b) => byId.set(b.id, b));
  BUSINESSES.forEach((b) => {
    if (unique.includes(b.id) && !byId.has(b.id)) byId.set(b.id, b);
  });
  return unique.map((id) => byId.get(id)).filter(Boolean) as Business[];
}

// Fetch approved + published businesses for the Discover feed (public via RLS).
export async function fetchApprovedBusinesses(): Promise<Business[]> {
  const { data, error } = await getSupabaseClient()
    .from('businesses')
    .select('*')
    .eq('approval_status', 'approved')
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  if (error || !Array.isArray(data)) return [];
  return data.map(mapBusinessRow);
}

// Merge real DB businesses with demo data, real taking priority by id.
export function mergeBusinesses(real: Business[], mock: Business[]): Business[] {
  const byId = new Map<string, Business>();
  real.forEach((b) => byId.set(b.id, b));
  mock.forEach((b) => {
    if (!byId.has(b.id)) byId.set(b.id, b);
  });
  return Array.from(byId.values());
}

// Pure filter over a provided list (used with the merged real+mock list).
export function filterBusinessList(
  list: Business[],
  main: MainCategoryId | 'all',
  sub: string | 'all',
  query: string
): Business[] {
  const q = query.trim().toLowerCase();
  return list.filter((b) => {
    const subCat = getSubCategory(b.category);
    const matchMain = main === 'all' ? true : subCat?.main === main;
    const matchSub = sub === 'all' ? true : subCat?.id === sub;
    const matchQ =
      q.length === 0 ||
      b.name.toLowerCase().includes(q) ||
      (subCat?.label.toLowerCase().includes(q) ?? false) ||
      (b.campaign ? b.campaign.toLowerCase().includes(q) : false);
    return matchMain && matchSub && matchQ;
  });
}

export function countMainIn(list: Business[], main: MainCategoryId): number {
  return list.filter((b) => getSubCategory(b.category)?.main === main).length;
}
