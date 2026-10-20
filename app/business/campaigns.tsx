// Powered by OnSpace.AI
// Business campaign creation. Campaigns use the interactive cropper for their
// image and pick an admin-priced plan (duration). They require admin approval
// before appearing in the Discover "Güncel Kampanyalar" rail.
import React, { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components';
import { CROP_PRESETS, ImageCropper } from '@/components/feature/ImageCropper';
import { AdminEmpty, AdminLoading, StatusPill } from '@/components/admin/ui';
import { useAuth } from '@/hooks/useAuth';
import { AdPackage, MyBusiness, listActivePackagesByTypes, listMyBusinesses } from '@/services/adService';
import { MyCampaign, createCampaign, deleteCampaign, listMyCampaigns } from '@/services/campaignService';
import { timeAgo } from '@/services/contentService';
import { useAlert } from '@/template';
import { fontSize, fontWeight, radius, spacing, ThemeColors } from '@/constants/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';

const CAMPAIGN_RATIOS = [
  CROP_PRESETS['3:2'],
  CROP_PRESETS['16:9'],
  CROP_PRESETS['1:1'],
  CROP_PRESETS['4:5'],
  CROP_PRESETS.free,
];

export default function BusinessCampaigns() {
  const { colors, styles } = useThemeStyles(createStyles);
  const router = useRouter();
  const { showAlert } = useAlert();
  const { authUser } = useAuth();

  const [businesses, setBusinesses] = useState<MyBusiness[]>([]);
  const [items, setItems] = useState<MyCampaign[]>([]);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [bizId, setBizId] = useState('');
  const [planId, setPlanId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [picked, setPicked] = useState<{ uri: string; base64: string } | null>(null);
  const [cropUri, setCropUri] = useState<string | null>(null);
  const [cropVisible, setCropVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!authUser) {
      setLoading(false);
      return;
    }
    const [b, c, p] = await Promise.all([
      listMyBusinesses(authUser.id),
      listMyCampaigns(authUser.id),
      listActivePackagesByTypes(['content_campaign']),
    ]);
    setBusinesses(b.data);
    setItems(c.data);
    setPackages(p.data);
    setBizId((prev) => prev || (b.data[0]?.id ?? ''));
    setLoading(false);
  }, [authUser]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const selectedPlan = useMemo(() => packages.find((p) => p.id === planId), [packages, planId]);

  if (!authUser) {
    return (
      <View style={styles.guard}>
        <MaterialCommunityIcons name="account-lock-outline" size={48} color={colors.textFaint} />
        <Text style={styles.guardText}>Kampanya eklemek için giriş yapmalısın.</Text>
        <Button label="Giriş Yap" icon="login" onPress={() => router.replace('/auth')} />
      </View>
    );
  }

  if (loading) return <AdminLoading />;

  if (businesses.length === 0) {
    return (
      <View style={styles.guard}>
        <MaterialCommunityIcons name="storefront-outline" size={48} color={colors.textFaint} />
        <Text style={styles.guardText}>Kampanya vermek için önce bir işletme eklemelisin.</Text>
        <Button label="İşletme Ekle" icon="plus" onPress={() => router.replace('/business/register')} />
      </View>
    );
  }

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showAlert('İzin gerekli', 'Görsel seçmek için galeri iznine ihtiyaç var.', [{ text: 'Tamam' }]);
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setCropUri(res.assets[0].uri);
      setCropVisible(true);
    }
  };

  const submit = async () => {
    if (!bizId) {
      showAlert('Eksik bilgi', 'İşletme seç.', [{ text: 'Tamam' }]);
      return;
    }
    if (!title.trim()) {
      showAlert('Eksik bilgi', 'Kampanya başlığını yaz.', [{ text: 'Tamam' }]);
      return;
    }
    if (packages.length > 0 && !selectedPlan) {
      showAlert('Plan seç', 'Kampanya süresi ve ücretini seç.', [{ text: 'Tamam' }]);
      return;
    }
    setSaving(true);
    const { error } = await createCampaign({
      business_id: bizId,
      title: title.trim(),
      description: description.trim(),
      base64: picked?.base64 ?? null,
      package_id: selectedPlan?.id ?? null,
      price: selectedPlan?.price ?? 0,
    });
    setSaving(false);
    if (error) {
      showAlert('Gönderilemedi', error, [{ text: 'Tamam' }]);
      return;
    }
    setTitle('');
    setDescription('');
    setPicked(null);
    setPlanId('');
    showAlert('Gönderildi', 'Kampanyan yönetici onayına iletildi. Onaylandıktan sonra Keşfet sayfasında yayınlanır.', [{ text: 'Tamam' }]);
    load();
  };

  const confirmDelete = (id: string) =>
    showAlert('Kampanyayı sil', 'Bu kampanya silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteCampaign(id);
          if (error) showAlert('Silinemedi', error, [{ text: 'Tamam' }]);
          else load();
        },
      },
    ]);

  const statusMeta = (status: string): { label: string; tone: 'success' | 'warning' | 'danger' } =>
    status === 'approved'
      ? { label: 'Yayında', tone: 'success' }
      : status === 'rejected'
      ? { label: 'Reddedildi', tone: 'danger' }
      : { label: 'Onay bekliyor', tone: 'warning' };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Yeni Kampanya</Text>

          <Text style={styles.label}>İşletme</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {businesses.map((b) => {
              const active = bizId === b.id;
              return (
                <Pressable key={b.id} onPress={() => setBizId(b.id)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && { color: colors.onPrimary }]} numberOfLines={1}>{b.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.label}>Kampanya Başlığı</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Örn. Öğrenciye %20 indirim"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            accessibilityLabel="Kampanya başlığı"
          />

          <Text style={styles.label}>Açıklama (opsiyonel)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Kampanya detayları ve koşulları"
            placeholderTextColor={colors.textFaint}
            style={[styles.input, styles.textArea]}
            multiline
            accessibilityLabel="Kampanya açıklaması"
          />

          <Text style={styles.label}>Görsel (opsiyonel)</Text>
          <Pressable style={styles.picker} onPress={pickImage}>
            {picked ? (
              <Image source={{ uri: picked.uri }} style={styles.preview} contentFit="cover" />
            ) : (
              <View style={styles.pickerEmpty}>
                <MaterialCommunityIcons name="image-plus" size={30} color={colors.textFaint} />
                <Text style={styles.pickerText}>Kampanya görseli seç ve kırp</Text>
              </View>
            )}
          </Pressable>
          {picked ? (
            <Pressable onPress={pickImage} style={styles.removeImg}>
              <MaterialCommunityIcons name="crop-rotate" size={16} color={colors.primary} />
              <Text style={styles.changeText}>Görseli değiştir / yeniden kırp</Text>
            </Pressable>
          ) : null}

          {packages.length > 0 ? (
            <>
              <Text style={styles.label}>Kampanya Planı (yönetici fiyatı)</Text>
              <View style={{ gap: spacing.sm }}>
                {packages.map((p) => {
                  const active = planId === p.id;
                  return (
                    <Pressable key={p.id} onPress={() => setPlanId(p.id)} style={[styles.planCard, active && styles.planCardActive]}>
                      <MaterialCommunityIcons name={active ? 'radiobox-marked' : 'radiobox-blank'} size={20} color={active ? colors.primary : colors.textFaint} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.planName}>{p.name}</Text>
                        <Text style={styles.planMeta}>{p.duration_days} gün yayında kalır</Text>
                      </View>
                      <Text style={styles.planPrice}>{Number(p.price).toLocaleString('tr-TR')} ₺</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <View style={styles.note}>
            <MaterialCommunityIcons name="shield-check-outline" size={16} color={colors.textSubtle} />
            <Text style={styles.noteText}>
              Kampanyan yönetici onayından geçer. Seçtiğin plan ücretlendirilir ve yönetici onaylamadan yayınlanmaz.
            </Text>
          </View>

          <Button label={saving ? 'Gönderiliyor...' : 'Onaya Gönder'} icon="send" onPress={submit} loading={saving} />
        </View>

        <Text style={styles.recentTitle}>Kampanyalarım</Text>
        {items.length === 0 ? (
          <AdminEmpty icon="sale" text="Henüz kampanyan yok." />
        ) : (
          <View style={{ gap: spacing.md }}>
            {items.map((it) => {
              const st = statusMeta(it.status);
              return (
                <View key={it.id} style={styles.itemRow}>
                  {it.image_url ? (
                    <Image source={{ uri: it.image_url }} style={styles.itemImg} contentFit="cover" transition={150} />
                  ) : (
                    <View style={[styles.itemImg, styles.itemImgEmpty]}>
                      <MaterialCommunityIcons name="sale" size={22} color={colors.textFaint} />
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.itemTop}>
                      <StatusPill label={st.label} tone={st.tone} />
                      <Text style={styles.itemTime}>{timeAgo(it.created_at)}</Text>
                    </View>
                    <Text style={styles.itemTitle} numberOfLines={1}>{it.title}</Text>
                    {it.status === 'rejected' && it.rejection_reason ? (
                      <Text style={styles.rejected}>Ret: {it.rejection_reason}</Text>
                    ) : null}
                  </View>
                  <Pressable hitSlop={8} onPress={() => confirmDelete(it.id)} style={styles.deleteBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ImageCropper
        visible={cropVisible}
        uri={cropUri}
        ratios={CAMPAIGN_RATIOS}
        initialRatioId={CAMPAIGN_RATIOS[0].id}
        onCancel={() => setCropVisible(false)}
        onDone={(r) => {
          setPicked({ uri: r.uri, base64: r.base64 });
          setCropVisible(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
  guard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  guardText: { fontSize: fontSize.md, color: colors.textSubtle, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm },
  cardTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.xs },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text, marginTop: spacing.sm },
  chipsRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, maxWidth: 220 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  input: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: fontSize.md, color: colors.text },
  textArea: { height: 80, textAlignVertical: 'top' },
  picker: { height: 160, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  pickerEmpty: { alignItems: 'center', gap: 6 },
  pickerText: { fontSize: fontSize.sm, color: colors.textSubtle, fontWeight: fontWeight.medium },
  preview: { width: '100%', height: '100%' },
  removeImg: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  changeText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.medium },
  planCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt },
  planCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  planName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  planMeta: { fontSize: fontSize.xs, color: colors.textSubtle, marginTop: 2 },
  planPrice: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  note: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginVertical: spacing.sm },
  noteText: { flex: 1, fontSize: fontSize.xs, color: colors.textSubtle, lineHeight: fontSize.xs * 1.5 },
  recentTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm },
  itemImg: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.surfaceTint },
  itemImgEmpty: { alignItems: 'center', justifyContent: 'center' },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemTime: { fontSize: fontSize.xs, color: colors.textFaint },
  itemTitle: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  rejected: { fontSize: fontSize.xs, color: colors.danger },
  deleteBtn: { padding: spacing.sm },
});
