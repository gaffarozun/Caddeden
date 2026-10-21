import { useCallback, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { caddeTvLayout } from '@/constants/caddeTvTheme';
export function useCaddeTvStage() {
  const [width, setWidth] = useState(375);
  const measure = useCallback((event: LayoutChangeEvent) => {
    setWidth(Math.max(1, Math.min(event.nativeEvent.layout.width, caddeTvLayout.maxStageWidth)));
  }, []);
  return { width, height: Math.max(1, width * caddeTvLayout.canvasHeight / caddeTvLayout.canvasWidth), measure };
}
