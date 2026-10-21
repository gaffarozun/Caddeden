import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useCaddeTvStage } from '@/hooks/useCaddeTvStage';
import { caddeTvColors } from '@/constants/caddeTvTheme';
import { CaddeTvFrame } from './CaddeTvFrame';
interface CaddeTvCreativePreviewProps { image: string | null }
export const CaddeTvCreativePreview = memo(function CaddeTvCreativePreview({ image }: CaddeTvCreativePreviewProps) {
  const stage = useCaddeTvStage();
  return <View onLayout={stage.measure} style={[styles.viewport, { height: stage.width * 0.74 }]}>
    <View pointerEvents="none" style={[styles.canvas, { top: -stage.height * 0.246 }]}><CaddeTvFrame width={stage.width} image={image} preview /></View>
  </View>;
});
const styles = StyleSheet.create({ viewport: { width: '100%', overflow: 'hidden', backgroundColor: caddeTvColors.screen }, canvas: { position: 'absolute', left: 0 } });
