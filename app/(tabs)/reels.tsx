// Powered by OnSpace.AI
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { REELS } from '@/services/mockData';
import { listFeed } from '@/services/contentService';
import { MAIN_CATEGORIES, MainCategoryId, mainCategoryOf } from '@/services/categories';
import { CategoryId, Reel } from '@/services/types';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { useAlert } from '@/template';
import { fontSize, fontWeight, radius, spacing, ThemeColors } from '@/constants/theme';

const SHARE_BASE = 'https://caddeden.app/isletme';

export default function ReelsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [itemHeight, setItemHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [allReels, setAllReels] = useState<Reel[]>(REELS);
  const [main, setMain] = useState<MainCategoryId>('yeme_icme');
  const listRef = useRef<FlatList<Reel>>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const { data } = await listFeed('reel');
        if (!active) return;
        const real: Reel[] = data.map((f) => ({
          id: f.id,
          businessId: f.business_id,
          businessName: f.businesses?.name ?? 'İşletme',
          category: (f.businesses?.category as CategoryId) ?? 'restoran',
          image: f.image_url,
          caption: f.caption ?? '',
          likes: 0,
          sponsored: false,
        }));
        setAllReels([...real, ...REELS]);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const reels = useMemo(
    () => allReels.filter((r) => mainCategoryOf(r.category) === main),
    [allReels, main]
  );

  const handleMain = (id: MainCategoryId) => {
    setMain(id);
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const onViewRef = useRef<(info: { viewableItems: ViewToken[] }) => void>(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  });
  const viewConfigRef = useRef({ itemVisiblePercentThreshold: 60 });

  return (
    <View style={styles.screen} onLayout={(e) => setItemHeight(e.nativeEvent.layout.height)}>
      <StatusBar style="light" />
      {itemHeight > 0 ? (
        reels.length > 0 ? (
          <FlatList
            ref={listRef}
            data={reels}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <ReelItem reel={item} height={itemHeight} active={index === activeIndex} />
            )}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            onViewableItemsChanged={onViewRef.current}
            viewabilityConfig={viewConfigRef.current}
            getItemLayout={(_, index) => ({ length: itemHeight, offset: itemHeight * index, index })}
          />
        ) : (
          <View style={[styles.empty, { height: itemHeight }]}>
            <MaterialCommunityIcons name="play-box-outline" size={48} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyText}>Bu kategoride henüz Reels yok.</Text>
          </View>
        )
      ) : null}

      <View style={[styles.catBar, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        {MAIN_CATEGORIES.map((m) => {
          const activeCat = main === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => handleMain(m.id)}
              style={[styles.catPill, activeCat && styles.catPillActive]}
            >
              <Text style={[styles.catText, activeCat && styles.catTextActive]} numberOfLines={1}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ReelItem({ reel, height }: { reel: Reel; height: number; active: boolean }) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, likedReelIds, isSavedReel, toggleLikeReel, toggleSaveReel } = useApp();
  const isBusiness = user.type === 'business';
  const liked = likedReelIds.includes(reel.id);
  const saved = isSavedReel(reel.id);
  const link = `${SHARE_BASE}/${reel.businessId}`;

  const handleShare = () => {
    showAlert('Paylaş', reel.businessName, [
      {
        text: 'Uygulamalarda Paylaş',
        onPress: async () => {
          try {
            await Share.share({ message: `${reel.businessName} · ${reel.caption}\n${link}` });
          } catch {
            // paylaşım iptal edildi
          }
        },
      },
      {
        text: 'Bağlantıyı Kopyala',
        onPress: async () => {
          await Clipboard.setStringAsync(link);
          showAlert('Kopyalandı', 'Bağlantı panoya kopyalandı.', [{ text: 'Tamam' }]);
        },
      },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.item, { height }]}>
      <Image source={{ uri: reel.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(0,0,0,0.75)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {!isBusiness ? (
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} hitSlop={8} onPress={() => toggleLikeReel(reel.id)}>
            <MaterialCommunityIcons
              name={liked ? 'heart' : 'heart-outline'}
              size={32}
              color={liked ? colors.primary : colors.white}
            />
            <Text style={styles.actionText}>{reel.likes + (liked ? 1 : 0)}</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            hitSlop={8}
            onPress={() =>
              toggleSaveReel({
                id: reel.id,
                businessId: reel.businessId,
                businessName: reel.businessName,
                image: reel.image,
                caption: reel.caption,
              })
            }
          >
            <MaterialCommunityIcons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={30}
              color={saved ? colors.primary : colors.white}
            />
            <Text style={styles.actionText}>Kaydet</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} hitSlop={8} onPress={handleShare}>
            <MaterialCommunityIcons name="share-variant" size={28} color={colors.white} />
            <Text style={styles.actionText}>Paylaş</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.info}>
        {reel.sponsored ? (
          <View style={styles.sponsorInline}>
            <Text style={styles.sponsorText}>Sponsorlu</Text>
          </View>
        ) : null}
        <Pressable style={styles.bizRow} onPress={() => router.push(`/business/${reel.businessId}`)}>
          <MaterialCommunityIcons name="storefront" size={18} color={colors.white} />
          <Text style={styles.bizName}>{reel.businessName}</Text>
          <View style={styles.profileTag}>
            <Text style={styles.profileTagText}>Profili Gör</Text>
          </View>
        </Pressable>
        <Text style={styles.caption} numberOfLines={3}>
          {reel.caption}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.black },
    item: { width: '100%', backgroundColor: colors.black, justifyContent: 'flex-end' },
    catBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    catPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(0,0,0,0.4)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    catPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catText: { color: 'rgba(255,255,255,0.85)', fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
    catTextActive: { color: colors.white },
    empty: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: fontSize.md },
    actions: {
      position: 'absolute',
      right: spacing.lg,
      bottom: 140,
      alignItems: 'center',
      gap: spacing.xl,
    },
    actionBtn: { alignItems: 'center', gap: 4 },
    actionText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
    info: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, paddingRight: 80, gap: spacing.sm },
    sponsorInline: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    sponsorText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
    bizRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    bizName: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.bold },
    profileTag: {
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.7)',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    profileTagText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.medium },
    caption: { color: colors.white, fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.5 },
  });
