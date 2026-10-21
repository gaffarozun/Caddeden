import { useEffect, useRef, useState } from 'react';
import { cancelAnimation, Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { caddeTvStage } from '@/constants/caddeTvTheme';

export function useCaddeTvTransition(image: string | null | undefined, reduced: boolean) {
  const [layers, setLayers] = useState<{ current: string | null; previous: string | null }>({ current: image ?? null, previous: null });
  const lastImage = useRef<string | null>(image ?? null);
  const progress = useSharedValue(1);
  useEffect(() => {
    const nextImage = image ?? null;
    const previous = lastImage.current;
    lastImage.current = nextImage;
    cancelAnimation(progress);
    if (!nextImage || !previous || previous === nextImage || reduced) {
      setLayers({ current: nextImage, previous: null }); progress.value = 1;
      return;
    }
    setLayers({ current: nextImage, previous });
    progress.value = 0;
    // Brief CRT tuning/static, then a hard cut to the already-mounted next photo.
    progress.value = withTiming(1, { duration: caddeTvStage.transitionMs, easing: Easing.linear });
    const timer = setTimeout(() => setLayers(value => ({ current: value.current, previous: null })), caddeTvStage.transitionMs);
    return () => { clearTimeout(timer); cancelAnimation(progress); };
  }, [image, reduced, progress]);
  const incomingStyle = useAnimatedStyle(() => ({ opacity: progress.value >= 0.5 ? 1 : 0 }));
  const outgoingStyle = useAnimatedStyle(() => ({
    opacity: progress.value < 0.5 ? 1 : 0,
    transform: [{ scaleY: interpolate(progress.value, [0, 0.38, 0.5, 1], [1, 0.04, 0.01, 0.01]) }],
  }));
  const staticStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.08, 0.32, 0.5, 0.66, 1], [0, 0.8, 0.9, 0.8, 0, 0]),
    transform: [{ translateX: interpolate(progress.value, [0, 0.16, 0.3, 0.42, 0.5, 1], [0, -6, 6, -4, 4, 0]) }, { scaleX: 1.06 }],
  }));
  const flashStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3, 0.42, 0.5, 0.62, 1], [0, 0, 0.8, 0.65, 0, 0]),
    transform: [{ scaleY: interpolate(progress.value, [0, 0.3, 0.42, 0.5, 1], [0.01, 0.01, 0.025, 0.01, 0.01]) }],
  }));
  return { layers, incomingStyle, outgoingStyle, staticStyle, flashStyle };
}
