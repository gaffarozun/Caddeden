import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '@/constants/theme';

const prefix = 'caddeden-appearance-v2';
export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'auto' || value === 'light' || value === 'dark' || value === 'pink' || value === 'system';
}
export function defaultThemeForGender(gender?: string | null): 'pink' | 'dark' {
  return gender === 'female' ? 'pink' : 'dark';
}
export function resolveTheme(mode: ThemeMode, gender: string | null | undefined, systemDark: boolean): 'pink' | 'dark' | 'light' {
  if (mode === 'auto') return defaultThemeForGender(gender);
  if (mode === 'system') return systemDark ? 'dark' : 'light';
  return mode;
}
export async function readThemePreference(scope: string): Promise<ThemeMode> {
  const stored = await AsyncStorage.getItem(`${prefix}:${scope}`);
  if (isThemeMode(stored)) return stored;
  // A former device-wide selection must not overwrite a new account default.
  if (scope === 'guest') {
    const legacy = await AsyncStorage.getItem('caddeden-theme-mode');
    if (isThemeMode(legacy)) return legacy;
  }
  return 'auto';
}
export async function saveThemePreference(scope: string, mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(`${prefix}:${scope}`, mode);
}
