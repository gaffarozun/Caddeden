import { darkColors } from '@/constants/theme';

// Students discover local businesses in the user-provided neon lounge.
// Stage metaphor: the reference TV cabinet, clipped glass and a multicolor LED subtitle.
export const caddeTvColors = {
  room: darkColors.onPrimary, screen: darkColors.black, amber: darkColors.primaryDark,
  white: darkColors.white, muted: darkColors.textSubtle, glass: darkColors.overlayStrong,
  remote: darkColors.surface, trim: darkColors.borderStrong, live: darkColors.success,
  transparent: 'transparent', roomGlow: 'rgba(53,234,255,0.10)', warmGlow: 'rgba(255,227,107,0.12)',
};
// Room, cabinet, screen and subtitle share the same uncropped 941 × 1672 canvas.
export const caddeTvLayout = {
  canvasWidth: 941, canvasHeight: 1672,
  screen: { left: 137 / 941, top: 432 / 1672, width: 660 / 941, height: 376 / 1672 },
  subtitle: { left: 56 / 941, top: 817 / 1672, width: 848 / 941, height: 63 / 1672 },
  screenCorner: 0.040, remoteWidth: 208, remoteTop: 0.784,
  infoTop: 0.664, maxStageWidth: 620,
};
// Overlay only the TV region, at exactly the same scale as the full local room image.
export const caddeTvStage = {
  sourceCropTop: 386, cabinetHeight: 510, heightRatio: 1672 / 941,
  tvScale: 1, tvTop: 386 / 1672, subtitleSourceTop: 817, subtitleSourceHeight: 63,
  transitionMs: 260, autoAdvanceMs: 4000,
};
export const caddeTvCreative = {
  id: 'cadde-tv', label: 'Cadde TV ekranı',
  // Preserve the existing upload contract; contain fits legacy creatives to the new glass.
  value: (0.846 * 941) / (0.303 * 1672),
  recommendedWidth: 1584, recommendedHeight: 1008,
};
export const caddeTvCropRatios = [caddeTvCreative];
