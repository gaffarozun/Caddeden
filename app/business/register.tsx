// Powered by OnSpace.AI
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { getSupabaseClient } from '@/template';
import { useAlert } from '@/template';
import { MAIN_CATEGORIES, MainCategoryId, subCategoriesOf } from '@/services/categories';
import { fontSize, fontWeight, radius, spacing, ThemeColors } from '@/constants/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';

export default function BusinessRegister() {
  const { colors, styles } = useThemeStyles(createStyles);
  const router = useRouter();
  const { showAlert } = useAlert();
  const { authUser } = useAuth();

  const [main, setMain] = useState<MainCategoryId>('yeme_icme');
  const [sub, setSub] = useState('restoran');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState('');
  const [saving, setSaving] = useState(false);

  const subs = useMemo(() => subCategoriesOf(main), [main]);

  if (!authUser) {
    return (
      <View style={styles.guard}>
        <MaterialCommunityIcons name="account-lock-outline" size={48} color={colors.textFaint} />
        <Text style={styles.guardText}>İşletme eklemek için giriş yapmalısın.</Text>
        <Button label="Giriş Yap" icon="login" onPress={() => router.replace('/auth')} />
      </View>
    );
  }

  const submit = async () => {
    if (!name.trim()) {
      showAlert('Eksik bilgi', 'İşletme adını gir.', [{ text: 'Tamam' }]);
      return;
    }
    setSaving(true);
    const { error } = await getSupabaseClient().from('businesses').insert({
      owner_id: authUser.id,
      main_category: main,
      category: sub,
      name: name.trim(),
      description: description.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      hours: hours.trim() || null,
    });
    setSaving(false);
    if (error) {
      showAlert('Kaydedilemedi', error.message, [{ text: 'Tamam' }]);
      return;
    }
    showAlert('İşletme kaydedildi', 'Yönetici onayından sonra uygulamada yayınlanacak.', [
      { text: 'Tamam', onPress: () => router.replace('/(tabs)/profile') },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Ana Kategori</Text>
        <View style={styles.mainRow}>
          {MAIN_CATEGORIES.map((m) => {
            const active = main === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => { setMain(m.id); setSub(subCategoriesOf(m.id)[0].id); }}
                style={[styles.mainCard, active && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
              >
                <MaterialCommunityIcons name={m.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={24} color={active ? colors.primary : colors.textSubtle} />
                <Text style={[styles.mainText, active && { color: colors.primaryDark }]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Alt Kategori</Text>
        <View style={styles.subWrap}>
          {subs.map((c) => {
            const active = sub === c.id;
            return (
              <Pressable key={c.id} onPress={() => setSub(c.id)} style={[styles.subChip, active && styles.subChipActive]}>
                <MaterialCommunityIcons name={c.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={15} color={active ? colors.onPrimary : colors.textSubtle} />
                <Text style={[styles.subText, active && { color: colors.onPrimary }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Field label="İşletme Adı" value={name} onChangeText={setName} placeholder="Örn. Köşe Ocakbaşı" />
        <Field label="Açıklama" value={description} onChangeText={setDescription} placeholder="Kısa tanıtım" multiline />
        <Field label="Telefon" value={phone} onChangeText={setPhone} placeholder="+90 5xx xxx xx xx" keyboardType="phone-pad" />
        <Field label="Adres" value={address} onChangeText={setAddress} placeholder="Açık adres" />
        <Field label="Çalışma Saatleri" value={hours} onChangeText={setHours} placeholder="Örn. 10:00 - 23:00" />

        <View style={styles.infoNote}>
          <MaterialCommunityIcons name="shield-check-outline" size={16} color={colors.textSubtle} />
          <Text style={styles.infoText}>
            Kayıt yönetici onayından geçer. Onay durumunu profilindeki İşletmelerim bölümünden takip edebilirsin.
          </Text>
        </View>

        <Button label={saving ? 'Kaydediliyor...' : 'İşletmeyi Kaydet'} icon="content-save-outline" onPress={submit} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad';
}) {
  const { colors, styles } = useThemeStyles(createStyles);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        style={[styles.input, multiline && styles.textArea]}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        accessibilityLabel={label}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },
  guard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  guardText: { fontSize: fontSize.md, color: colors.textSubtle, textAlign: 'center' },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text, marginTop: spacing.sm, marginBottom: 6 },
  mainRow: { flexDirection: 'row', gap: spacing.md },
  mainCard: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, alignItems: 'flex-start', backgroundColor: colors.surface },
  mainText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  subWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  subChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  subChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  subText: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  fieldWrap: { gap: 0 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.md,
    color: colors.text,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  infoNote: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginVertical: spacing.md },
  infoText: { flex: 1, fontSize: fontSize.xs, color: colors.textSubtle, lineHeight: fontSize.xs * 1.5 },
});
