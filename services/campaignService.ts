// Powered by OnSpace.AI
// Campaign service: businesses create campaigns that (after admin approval)
// appear in the Discover "Güncel Kampanyalar" rail. Status is forced to
// 'pending' on insert server-side (protect_content_insert trigger); only admins
// can approve via the admin-api edge function.
import { decode } from 'base64-arraybuffer';
import { getSupabaseClient } from '@/template';
import { MainCategoryId, getSubCategory } from './categories';

const sb = () => getSupabaseClient();
const BUCKET = 'business-media';

export interface MyCampaign {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  businesses?: { name?: string; category?: string } | null;
}

export interface DiscoverCampaign {
  id: string;
  businessId: string;
  title: string;
  name: string;
  category: string;
  cover: string;
  main?: MainCategoryId;
}

export async function listMyCampaigns(ownerId: string): Promise<{ data: MyCampaign[]; error: string | null }> {
  const { data, error } = await sb()
    .from('campaigns')
    .select('*, businesses!inner(name, category, owner_id)')
    .eq('businesses.owner_id', ownerId)
    .order('created_at', { ascending: false });
  return { data: (data as MyCampaign[]) ?? [], error: error?.message ?? null };
}

export async function createCampaign(params: {
  business_id: string;
  title: string;
  description: string;
  base64?: string | null;
  package_id?: string | null;
  price?: number;
}): Promise<{ error: string | null }> {
  try {
    let imageUrl: string | null = null;
    if (params.base64) {
      const path = `${params.business_id}/campaigns/${Date.now()}.jpg`;
      const { error: upErr } = await sb()
        .storage.from(BUCKET)
        .upload(path, decode(params.base64), { contentType: 'image/jpeg', upsert: false });
      if (upErr) return { error: upErr.message };
      const { data: pub } = sb().storage.from(BUCKET).getPublicUrl(path);
      imageUrl = pub.publicUrl;
    }
    // status/rejection_reason are intentionally omitted: the DB trigger forces
    // status='pending' so clients can never self-approve a campaign.
    const { error } = await sb().from('campaigns').insert({
      business_id: params.business_id,
      title: params.title,
      description: params.description || null,
      image_url: imageUrl,
      package_id: params.package_id ?? null,
      price: params.price ?? 0,
    });
    return { error: error?.message ?? null };
  } catch (e) {
    return { error: (e as Error)?.message ?? 'Kampanya oluşturulamadı.' };
  }
}

export async function deleteCampaign(id: string): Promise<{ error: string | null }> {
  const { error } = await sb().from('campaigns').delete().eq('id', id);
  return { error: error?.message ?? null };
}

// Approved campaigns for the Discover rail. RLS already restricts rows to
// approved campaigns from approved+published businesses; the explicit filter
// keeps owner-only pending rows out of the public feed.
export async function fetchDiscoverCampaigns(): Promise<DiscoverCampaign[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb()
    .from('campaigns')
    .select('id, title, image_url, business_id, businesses(name, category, cover_url, logo_url, images)')
    .eq('status', 'approved')
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error || !Array.isArray(data)) return [];
  return (data as any[]).map((row) => {
    const biz = row.businesses ?? {};
    const images = Array.isArray(biz.images) ? biz.images : [];
    const cover = row.image_url || biz.cover_url || images[0] || biz.logo_url || '';
    return {
      id: row.id,
      businessId: row.business_id,
      title: row.title,
      name: biz.name ?? 'İşletme',
      category: biz.category ?? 'restoran',
      cover,
      main: getSubCategory(biz.category)?.main,
    };
  });
}
