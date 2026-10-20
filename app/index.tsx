import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { AccountRouteBoundary } from '@/components/auth/AccountRouteBoundary';
function AuthRouter() {
  const { authUser, loading, operationLoading } = useAuth(); const { colors } = useTheme();
  if (loading || operationLoading) return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  return <Redirect href={authUser?.role === 'business' ? (authUser.businessAccess ? '/(business-tabs)' : '/business-approval') : '/(tabs)'} />;
}
export default function IndexScreen() { return <AccountRouteBoundary><AuthRouter /></AccountRouteBoundary>; }
