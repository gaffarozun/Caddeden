// Powered by OnSpace.AI
import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useTheme } from '@/hooks/useTheme';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <RootNavigator />
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}

function RootNavigator() {
  const { colors, isDark } = useTheme();
  const header = {
    headerTintColor: colors.text,
    headerStyle: { backgroundColor: colors.surface },
    headerShadowVisible: false,
  };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="admin-setup" options={{ headerShown: true, title: 'Yönetici Erişimi', ...header }} />
        <Stack.Screen name="business/[id]" options={{ headerShown: true, title: '', ...header }} />
        <Stack.Screen name="business/manage/[id]" options={{ headerShown: true, title: 'İşletme Sayfam', ...header }} />
        <Stack.Screen name="business/register" options={{ headerShown: true, title: 'İşletme Kaydı', ...header }} />
        <Stack.Screen name="business/ads" options={{ headerShown: true, title: 'Reklam Ver', ...header }} />
        <Stack.Screen name="business/posts" options={{ headerShown: true, title: 'Paylaşım Ekle', ...header }} />
        <Stack.Screen name="business/campaigns" options={{ headerShown: true, title: 'Kampanya Ekle', ...header }} />
        <Stack.Screen name="business/requests" options={{ headerShown: true, title: 'Gelen Talepler', ...header }} />
        <Stack.Screen name="business/notifications" options={{ headerShown: true, title: 'Bildirim Gönder', ...header }} />
        <Stack.Screen name="profile-edit" options={{ headerShown: true, title: 'Hesap Bilgilerim', ...header }} />
        <Stack.Screen name="history" options={{ headerShown: true, title: 'Geçmişim', ...header }} />
        <Stack.Screen name="auth" options={{ headerShown: true, title: '', presentation: 'modal', ...header }} />
      </Stack>
    </>
  );
}
