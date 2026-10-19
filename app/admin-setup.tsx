// Powered by OnSpace.AI
// Secure admin designation. The authorized admin email is stored server-side.
// An email-verified account matching it is promoted to admin automatically on
// signup (OTP path) or via the server-verified claim_admin action here. The
// existing admin account and all data are always preserved.
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { Button } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { adminApi } from '@/services/adminService';
import { useAlert } from '@/template';
import { colors, fontSize, fontWeight, radius, spacing } from '@/constants/theme';

interface ClaimStatus {
  authorized: boolean;
  emailConfirmed: boolean;
  alreadyAdmin: boolean;
  configured: boolean;
  authorizedHint: string | null;
}

export default function AdminSetup() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { authUser, isAdmin, refreshProfile } = useAuth();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<ClaimStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!authUser) {
      setStatus(null);
      return;
    }
    setChecking(true);
    const { data } = await adminApi.adminClaimStatus();
    setStatus((data as ClaimStatus) ?? null);
    setChecking(false);
  }, [authUser]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  if (isAdmin) return <Redirect href="/admin" />;

  const goAdmin = () =>
    showAlert(
      'Yönetici atandı',
      'Hesabın artık tüm yönetici yetkilerine sahip: işletme onayları, reklam yönetimi, bildirimler ve diğer tüm veriler korunur. Mevcut yönetici hesabı devre dışı bırakılmadı.',
      [{ text: 'Panele git', onPress: () => router.replace('/admin') }]
    );

  const handleClaim = async () => {
    setClaiming(true);
    const { error } = await adminApi.claimAdmin();
    if (error) {
      setClaiming(false);
      showAlert('Yetki verilemedi', error, [{ text: 'Tamam' }]);
      return;
    }
    await refreshProfile();
    setClaiming(false);
    goAdmin();
  };

  const handleBootstrap = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      showAlert('Eksik kod', 'Güvenli kurulum kodunu gir.', [{ text: 'Tamam' }]);
      return;
    }
    setSubmitting(true);
    const { error } = await adminApi.bootstrap(trimmed);
    if (error) {
      setSubmitting(false);
      showAlert('Doğrulama başarısız', error, [{ text: 'Tamam' }]);
      return;
    }
    await refreshProfile();
    setSubmitting(false);
    goAdmin();
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconBadge}>
          <MaterialCommunityIcons name="shield-crown-outline" size={34} color={colors.white} />
        </View>
        <Text style={styles.title}>Yönetici Erişimi</Text>
        <Text style={styles.desc}>
          Yönetici yetkisi yalnızca sunucu tarafında doğrulanır. Yetkili e-posta adresiyle giriş yapan ve e-postasını
          doğrulayan hesap güvenli şekilde yönetici olur; mevcut yönetici hesabı ve tüm veriler korunur.
        </Text>

        {!authUser ? (
          <>
            <View style={styles.note}>
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.textSubtle} />
              <Text style={styles.noteText}>
                Yeni yönetici e-postanla giriş yap veya kayıt ol. E-posta doğrulaması tamamlandığında bu hesap otomatik
                olarak yönetici yetkisine kavuşur. Kayıt sonrası otomatik atanmazsa aşağıdan Yönetici Ol diyebilirsin.
              </Text>
            </View>
            <Button label="Giriş Yap / Kayıt Ol" icon="login" onPress={() => router.push('/auth')} />
          </>
        ) : checking && !status ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Yetki durumu kontrol ediliyor...</Text>
          </View>
        ) : status?.authorized ? (
          <>
            <View style={styles.authorizedCard}>
              <MaterialCommunityIcons name="shield-check" size={24} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.authorizedLabel}>Bu e-posta yönetici olarak yetkilendirildi</Text>
                <Text style={styles.authorizedEmail}>{authUser.email}</Text>
              </View>
            </View>

            {status.emailConfirmed ? (
              <>
                <View style={styles.steps}>
                  <Step n={1} text="E-posta doğrulaman tamamlandı." />
                  <Step n={2} text="Yönetici Ol butonuna bas; yetki sunucuda atanır." />
                  <Step n={3} text="Panel açılır: onaylar, reklam ve bildirim yönetimi." />
                </View>
                <Button
                  label={claiming ? 'Yetki veriliyor...' : 'Yönetici Ol'}
                  icon="shield-check"
                  onPress={handleClaim}
                  loading={claiming}
                />
              </>
            ) : (
              <View style={styles.warnNote}>
                <MaterialCommunityIcons name="email-alert-outline" size={16} color={colors.warning} />
                <Text style={styles.noteText}>
                  Önce e-posta adresini doğrula. Doğrulama tamamlandıktan sonra bu ekrana dönüp Yönetici Ol diyebilirsin.
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.accountCard}>
              <MaterialCommunityIcons name="account-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.accountLabel}>Giriş yaptığın hesap</Text>
                <Text style={styles.accountEmail}>{authUser.email}</Text>
              </View>
            </View>
            <View style={styles.note}>
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.textSubtle} />
              <Text style={styles.noteText}>
                Bu hesap yönetici olarak yetkilendirilmemiş.{' '}
                {status?.authorizedHint
                  ? `Yetkili e-posta: ${status.authorizedHint}. Bu adresle giriş yap veya kayıt ol.`
                  : 'Yetkili yönetici e-postasıyla giriş yap veya kayıt ol.'}
              </Text>
            </View>
            <Button
              label="Farklı Hesapla Giriş Yap"
              icon="account-switch-outline"
              variant="secondary"
              onPress={() => router.push('/auth')}
            />
          </>
        )}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>veya kurulum kodu</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.inputRow}>
          <MaterialCommunityIcons name="key-outline" size={20} color={colors.textFaint} />
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Kurulum kodu (opsiyonel)"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!!authUser}
          />
        </View>
        <Button
          label={submitting ? 'Doğrulanıyor...' : 'Kod ile Yönetici Ol'}
          icon="shield-key-outline"
          variant="secondary"
          onPress={handleBootstrap}
          loading={submitting}
          disabled={!authUser}
        />
        {authUser ? <Text style={styles.hint}>Giriş yaptığın hesap: {authUser.email}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.md, flexGrow: 1, justifyContent: 'center' },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'center' },
  desc: {
    fontSize: fontSize.sm,
    color: colors.textSubtle,
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.6,
    marginBottom: spacing.sm,
  },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  warnNote: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: { flex: 1, fontSize: fontSize.sm, color: colors.textSubtle, lineHeight: fontSize.sm * 1.5 },
  loadingBox: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  loadingText: { fontSize: fontSize.sm, color: colors.textSubtle },
  authorizedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.successSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  authorizedLabel: { fontSize: fontSize.xs, color: colors.textSubtle },
  authorizedEmail: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.success, marginTop: 2 },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  accountLabel: { fontSize: fontSize.xs, color: colors.textSubtle },
  accountEmail: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primaryDark, marginTop: 2 },
  steps: { gap: spacing.sm, marginVertical: spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  stepText: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: fontSize.xs, color: colors.textFaint },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  input: { flex: 1, fontSize: fontSize.md, color: colors.text, padding: 0 },
  hint: { fontSize: fontSize.xs, color: colors.textFaint, textAlign: 'center', marginTop: spacing.sm },
});
