// Powered by OnSpace.AI
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Post } from '@/services/types';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { fontSize, fontWeight, radius, spacing, ThemeColors } from '@/constants/theme';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, likedReelIds, isSavedPost, toggleLikeReel, toggleSavePost } = useApp();
  const isBusiness = user.type === 'business';
  const liked = likedReelIds.includes(post.id);
  const saved = isSavedPost(post.id);

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.header}
        onPress={() => router.push(`/business/${post.businessId}`)}
      >
        <Avatar name={post.businessName} size={40} />
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {post.businessName}
            </Text>
            {post.sponsored ? <Badge label="Sponsorlu" tone="neutral" /> : null}
          </View>
          <Text style={styles.time}>{post.timeAgo}</Text>
        </View>
      </Pressable>

      <Image source={{ uri: post.image }} style={styles.image} contentFit="cover" transition={200} />

      {!isBusiness ? (
        <View style={styles.actions}>
          <Pressable hitSlop={8} onPress={() => toggleLikeReel(post.id)} style={styles.actionBtn}>
            <MaterialCommunityIcons
              name={liked ? 'heart' : 'heart-outline'}
              size={24}
              color={liked ? colors.primary : colors.text}
            />
            <Text style={styles.actionText}>{post.likes + (liked ? 1 : 0)}</Text>
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() =>
              toggleSavePost({
                id: post.id,
                businessId: post.businessId,
                businessName: post.businessName,
                image: post.image,
                caption: post.caption,
              })
            }
            style={styles.actionBtn}
          >
            <MaterialCommunityIcons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={saved ? colors.primary : colors.text}
            />
            <Text style={styles.actionText}>Kaydet</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.footer}>
        {post.campaign ? <Badge label={post.campaign} tone="primary" /> : null}
        <Text style={styles.caption}>{post.caption}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    name: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
    time: { fontSize: fontSize.xs, color: colors.textFaint, marginTop: 2 },
    image: { width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceTint },
    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, paddingHorizontal: spacing.md, paddingTop: spacing.md },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionText: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
    footer: { padding: spacing.md, gap: spacing.sm },
    caption: { fontSize: fontSize.sm, color: colors.text, lineHeight: fontSize.sm * 1.6 },
  });
