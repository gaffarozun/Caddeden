import React, { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { caddeTvColors as c, caddeTvLayout as frame } from '@/constants/caddeTvTheme';
import { fontSize, fontWeight, spacing } from '@/constants/theme';

interface CaddeTvFrameProps {
  width: number; image?: string | null; onPress?: () => void; loading?: boolean;
  error?: string; emptyText?: string; preview?: boolean;
}
export const CaddeTvFrame = memo(function CaddeTvFrame({ width, image, onPress, loading, error, emptyText = 'Bu kategoride henüz yayın yok.', preview = false }: CaddeTvFrameProps) {
  const height = width * frame.canvasHeight / frame.canvasWidth;
  return <View style={[styles.canvas, { width, height }]}>
    <Image source={require('@/assets/images/cadde-tv-room.png')} style={StyleSheet.absoluteFillObject} contentFit="fill" transition={200} accessibilityLabel="Sıcak ışıklı, bitkilerle çevrili retro televizyon odası" />
    <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : 'image'} accessibilityLabel={onPress ? 'Cadde TV ekranı. Sonraki işletme yayınına geç.' : 'Görselin televizyon ekranındaki ön izlemesi'} style={({ pressed }) => [styles.screen, {
      left: width * frame.screen.left, top: height * frame.screen.top,
      width: width * frame.screen.width, height: height * frame.screen.height,
      borderRadius: width * frame.screenCorner,
    }, pressed ? styles.pressed : null]}>
      {image ? <Image key={image} source={{ uri: image }} style={StyleSheet.absoluteFillObject} contentFit="contain" transition={200} accessibilityLabel="İşletmenin yayın görseli" /> : <View style={styles.empty}>
        {loading ? <ActivityIndicator color={c.amber} /> : <MaterialCommunityIcons name="television-classic" size={preview ? 24 : 36} color={c.amber} />}
        <Text style={[styles.emptyTitle, preview ? styles.previewText : null]}>{preview ? 'Görselini burada gör' : 'Cadde TV'}</Text>
        {!preview ? <Text style={styles.emptyText}>{error ? 'Yayınlar yüklenemedi. Kumandadan yenile.' : loading ? 'Yayınlar hazırlanıyor…' : emptyText}</Text> : null}
      </View>}
      <LinearGradient pointerEvents="none" colors={[c.glass, 'transparent', 'transparent']} locations={[0, 0.09, 1]} style={StyleSheet.absoluteFillObject} />
      <View pointerEvents="none" style={[styles.glassEdge, { borderRadius: width * frame.screenCorner }]} />
    </Pressable>
    {preview ? <View style={[styles.previewSubtitle, { left: width * frame.subtitle.left, top: height * frame.subtitle.top, width: width * frame.subtitle.width, height: height * frame.subtitle.height }]}><Text numberOfLines={1} style={styles.previewText}>CADDE TV · EKRANA TAM UYUMLU ÖN İZLEME</Text></View> : null}
  </View>;
});
const styles = StyleSheet.create({
  canvas: { position: 'relative', overflow: 'hidden', backgroundColor: c.room },
  screen: { position: 'absolute', overflow: 'hidden', backgroundColor: c.screen },
  glassEdge: { ...StyleSheet.absoluteFillObject, borderWidth: 2, borderColor: c.glass },
  pressed: { opacity: 0.88 }, empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  emptyTitle: { color: c.amber, fontSize: fontSize.xl, fontWeight: fontWeight.bold, includeFontPadding: false },
  emptyText: { color: c.muted, fontSize: fontSize.md, textAlign: 'center', lineHeight: fontSize.md * 1.6 },
  previewSubtitle: { position: 'absolute', backgroundColor: c.screen, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewText: { color: c.amber, fontSize: fontSize.xs, includeFontPadding: false },
});
