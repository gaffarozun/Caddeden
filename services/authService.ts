// Powered by OnSpace.AI
import { getSupabaseClient } from '@/template';

const sb = () => getSupabaseClient();

export type UserRole = 'user' | 'business' | 'admin';
export type AccountStatus = 'active' | 'restricted' | 'banned';
export type Gender = 'male' | 'female';

export interface AuthProfile {
  id: string;
  email: string;
  username: string | null;
  role: UserRole;
  status: AccountStatus;
  restricted_until: string | null;
  first_name: string | null;
  last_name: string | null;
  gender: Gender | null;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export interface RegisterMeta {
  username?: string;
  phone?: string;
  role?: 'user' | 'business';
  first_name?: string;
  last_name?: string;
  gender?: Gender;
}

export async function getCurrentSession() {
  const { data } = await sb().auth.getSession();
  return data.session;
}

export async function fetchProfile(userId: string, fallbackEmail: string): Promise<AuthProfile> {
  const { data } = await sb()
    .from('user_profiles')
    .select('id, username, email, role, status, restricted_until, first_name, last_name, gender, phone, address, lat, lng')
    .eq('id', userId)
    .single();
  if (data) {
    return {
      id: data.id,
      email: data.email ?? fallbackEmail,
      username: data.username ?? null,
      role: (data.role ?? 'user') as UserRole,
      status: (data.status ?? 'active') as AccountStatus,
      restricted_until: data.restricted_until ?? null,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      gender: (data.gender ?? null) as Gender | null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
    };
  }
  return {
    id: userId,
    email: fallbackEmail,
    username: null,
    role: 'user',
    status: 'active',
    restricted_until: null,
    first_name: null,
    last_name: null,
    gender: null,
    phone: null,
    address: null,
    lat: null,
    lng: null,
  };
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password });
  return { error: error?.message ?? null };
}

export async function sendEmailOtp(email: string) {
  const { error } = await sb().auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true },
  });
  return { error: error?.message ?? null };
}

export async function verifyOtpAndRegister(
  email: string,
  token: string,
  password: string,
  meta: RegisterMeta
) {
  const { data, error } = await sb().auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'email',
  });
  if (error) return { error: error.message };

  const { error: upErr } = await sb().auth.updateUser({
    password,
    data: {
      username: meta.username,
      phone: meta.phone,
      first_name: meta.first_name,
      last_name: meta.last_name,
      gender: meta.gender,
    },
  });
  if (upErr) return { error: upErr.message };

  if (data.user) {
    // Persist the chosen account type (customer vs business) plus identity. The
    // protect_user_profile_cols trigger only permits user<->business from the
    // client and never grants/removes admin, so this is safe.
    const safeRole: UserRole = meta.role === 'business' ? 'business' : 'user';
    const patch: Record<string, unknown> = {
      username: meta.username ?? null,
      phone: meta.phone ?? null,
      role: safeRole,
    };
    if (meta.first_name !== undefined) patch.first_name = meta.first_name ?? null;
    if (meta.last_name !== undefined) patch.last_name = meta.last_name ?? null;
    if (meta.gender !== undefined) patch.gender = meta.gender ?? null;
    await sb().from('user_profiles').update(patch).eq('id', data.user.id);
  }
  return { error: null };
}

// Update the signed-in user's own profile (name, gender, saved contact/location).
// Keeps `username` in sync with first + last name for display everywhere.
export async function updateMyProfile(patch: {
  first_name?: string | null;
  last_name?: string | null;
  gender?: Gender | null;
  phone?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
}): Promise<{ error: string | null }> {
  const { data: auth } = await sb().auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { error: 'Oturum bulunamadı.' };
  const update: Record<string, unknown> = { ...patch };
  if (patch.first_name !== undefined || patch.last_name !== undefined) {
    const full = [patch.first_name ?? '', patch.last_name ?? ''].join(' ').replace(/\s+/g, ' ').trim();
    update.username = full || null;
  }
  const { error } = await sb().from('user_profiles').update(update).eq('id', uid);
  return { error: error?.message ?? null };
}

export async function signOut() {
  await sb().auth.signOut();
}

// Masked customer display name shown to businesses: the full first name plus the
// first two letters of the surname; the remaining surname letters are censored.
// e.g. maskFullName('Ahmet', 'Yılmaz') => 'Ahmet Yı****'
export function maskFullName(
  first?: string | null,
  last?: string | null,
  fallback?: string | null
): string {
  let f = (first ?? '').trim();
  let l = (last ?? '').trim();
  if (!f && !l) {
    const parts = (fallback ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'Müşteri';
    f = parts[0];
    l = parts.slice(1).join(' ');
  }
  if (!l) return f || 'Müşteri';
  const visible = l.slice(0, 2);
  const hiddenCount = Math.min(Math.max(l.length - 2, 0), 5);
  return `${f} ${visible}${'*'.repeat(hiddenCount)}`.trim();
}
