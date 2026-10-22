// Powered by OnSpace.AI
import React, { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostCard, ScreenHeader } from '@/components';
import { usePostsFeed } from '@/hooks/usePostsFeed';
import { FeedbackButton, FeedbackError } from '@/components/feature/FeedbackControls';
import { useTheme } from '@/hooks/useTheme';
import { spacing, ThemeColors } from '@/constants/theme';

export default function PostsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { posts, error, refreshing, refresh } = usePostsFeed();

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={error ? <View style={styles.error}><FeedbackError message={error} /><FeedbackButton label="Yeniden dene" secondary onPress={refresh} /></View> : null}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    error: { gap: spacing.sm, marginBottom: spacing.lg },
    content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, width: '100%', maxWidth: 960, alignSelf: 'center' },
  });
