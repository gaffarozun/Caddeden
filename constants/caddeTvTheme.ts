import { darkColors } from '@/constants/theme';

// Students discover local businesses in a cheerful, colorful shared lounge.
// Stage metaphor: an enlarged vintage wooden TV, clipped glass and a multicolor LED subtitle.
export const caddeTvColors = {
  room: darkColors.onPrimary, screen: darkColors.black, amber: darkColors.primaryDark,
  white: darkColors.white, muted: darkColors.textSubtle, glass: darkColors.overlayStrong,
  remote: darkColors.surface, trim: darkColors.borderStrong, live: darkColors.success,
  transparent: 'transparent', roomGlow: 'rgba(53,234,255,0.10)', warmGlow: 'rgba(255,227,107,0.12)',
};
// Every overlay is measured against the SAME uncropped reference canvas.
export const caddeTvLayout = {
  canvasWidth: 941, canvasHeight: 1672,
  screen: { left: 0.080, top: 0.282, width: 0.846, height: 0.303 },
  subtitle: { left: 0.055, top: 0.597, width: 0.900, height: 0.033 },
  screenCorner: 0.040, remoteWidth: 208, remoteTop: 0.784,
  infoTop: 0.664, maxStageWidth: 620,
};
// Crop only the original TV cabinet; its glass geometry and creative aspect ratio stay unchanged.
export const caddeTvStage = {
  sourceCropTop: 420, cabinetHeight: 660, heightRatio: 1.65,
  tvScale: 1.06, tvTop: 0.28, subtitleSourceTop: 994, subtitleSourceHeight: 64,
  transitionMs: 260, autoAdvanceMs: 4000,
  roomImage: 'https://images.unsplash.com/photo-1650138278103-1f8a3d208cb3?auto=format&fit=crop&w=1400&q=85',
};
export const caddeTvCreative = {
  id: 'cadde-tv', label: 'Cadde TV ekranı',
  value: (caddeTvLayout.screen.width * caddeTvLayout.canvasWidth) / (caddeTvLayout.screen.height * caddeTvLayout.canvasHeight),
  recommendedWidth: 1584, recommendedHeight: 1008,
};
export const caddeTvCropRatios = [caddeTvCreative];
