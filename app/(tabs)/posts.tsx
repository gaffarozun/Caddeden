// Powered by OnSpace.AI
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { PostCard, ScreenHeader } from '@/components';
import { POSTS } from '@/services/mockData';
import { listFeed, timeAgo } from '@/services/contentService';
import { CategoryId, Post } from '@/services/types';
import { useTheme } from '@/hooks/useTheme';
import { spacing, ThemeColors } from '@/constants/theme';

export default function PostsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [posts, setPosts] = useState<Post[]>(POSTS);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const { data } = await listFeed('post');
        if (!active) return;
        const real: Post[] = data.map((f) => ({
          id: f.id,
          businessId: f.business_id,
          businessName: f.businesses?.name ?? 'İşletme',
          category: (f.businesses?.category as CategoryId) ?? 'restoran',
          image: f.image_url,
          caption: f.caption ?? '',
          likes: 0,
          sponsored: false,
          timeAgo: timeAgo(f.created_at),
        }));
        setPosts([...real, ...POSTS]);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="Gönderiler" subtitle="İşletmelerden kampanya ve duyurular" />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, width: '100%', maxWidth: 960, alignSelf: 'center' },
  });
