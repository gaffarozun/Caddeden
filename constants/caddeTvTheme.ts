import { darkColors } from '@/constants/theme';

// Product soul: students discover local businesses in a warm, familiar TV room.
// Stage metaphor: photographic wood frame, clipped glass, amber subtitles and a physical remote.
export const caddeTvColors = {
  room: darkColors.onPrimary, screen: darkColors.black, amber: darkColors.primaryDark,
  white: darkColors.white, muted: darkColors.textSubtle, glass: darkColors.overlayStrong,
  remote: darkColors.surface, trim: darkColors.borderStrong, live: darkColors.success,
};
// Every overlay is measured against the SAME uncropped reference canvas.
export const caddeTvLayout = {
  canvasWidth: 941, canvasHeight: 1672,
  screen: { left: 0.080, top: 0.282, width: 0.846, height: 0.303 },
  subtitle: { left: 0.055, top: 0.597, width: 0.900, height: 0.033 },
  screenCorner: 0.040, remoteWidth: 208, remoteTop: 0.784,
  infoTop: 0.664, maxStageWidth: 520,
};
export const caddeTvCreative = {
  id: 'cadde-tv', label: 'Cadde TV ekranı',
  value: (caddeTvLayout.screen.width * caddeTvLayout.canvasWidth) / (caddeTvLayout.screen.height * caddeTvLayout.canvasHeight),
  recommendedWidth: 1584, recommendedHeight: 1008,
};
export const caddeTvCropRatios = [caddeTvCreative];
