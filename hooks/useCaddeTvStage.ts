import { useCallback, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { caddeTvLayout, caddeTvStage } from '@/constants/caddeTvTheme';
export function useCaddeTvStage() {
  const [width, setWidth] = useState(375);
  const measure = useCallback((event: LayoutChangeEvent) => {
    setWidth(Math.max(1, Math.min(event.nativeEvent.layout.width || 375, caddeTvLayout.maxStageWidth)));
  }, []);
  const height = Math.max(1, width * caddeTvStage.heightRatio);
  const tvWidth = Math.max(1, width * caddeTvStage.tvScale);
  const tvHeight = Math.max(1, tvWidth * caddeTvStage.cabinetHeight / caddeTvLayout.canvasWidth);
  const tvLeft = (width - tvWidth) / 2;
  const tvTop = height * caddeTvStage.tvTop;
  return { width, height, tvWidth, tvHeight, tvLeft, tvTop, measure };
}
