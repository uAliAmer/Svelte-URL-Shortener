export const DEFAULT_QR_STYLE = {
  fgColor: '#000000',
  bgColor: '#ffffff',
  margin: 1,
  errorLevel: 'M',
  dotsType: 'square',
  cornersSquareType: 'square',
  cornersDotType: 'square',
  logoDataUrl: null
};

export const DOT_TYPES = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'];
export const CORNER_SQUARE_TYPES = ['square', 'dot', 'extra-rounded'];
export const CORNER_DOT_TYPES = ['square', 'dot'];
export const ERROR_LEVELS = ['L', 'M', 'Q', 'H'];

const HEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export function sanitizeQrStyle(input) {
  const s = input && typeof input === 'object' ? input : {};
  const out = { ...DEFAULT_QR_STYLE };

  if (typeof s.fgColor === 'string' && HEX.test(s.fgColor)) out.fgColor = s.fgColor;
  if (typeof s.bgColor === 'string' && HEX.test(s.bgColor)) out.bgColor = s.bgColor;

  const m = Number(s.margin);
  if (Number.isFinite(m) && m >= 0 && m <= 8) out.margin = Math.round(m);

  if (ERROR_LEVELS.includes(s.errorLevel)) out.errorLevel = s.errorLevel;
  if (DOT_TYPES.includes(s.dotsType)) out.dotsType = s.dotsType;
  if (CORNER_SQUARE_TYPES.includes(s.cornersSquareType)) out.cornersSquareType = s.cornersSquareType;
  if (CORNER_DOT_TYPES.includes(s.cornersDotType)) out.cornersDotType = s.cornersDotType;

  if (typeof s.logoDataUrl === 'string' && s.logoDataUrl.startsWith('data:image/') && s.logoDataUrl.length < 100_000) {
    out.logoDataUrl = s.logoDataUrl;
  } else {
    out.logoDataUrl = null;
  }

  return out;
}

export function mergeQrStyle(instanceDefault, override) {
  return sanitizeQrStyle({ ...sanitizeQrStyle(instanceDefault), ...(override || {}) });
}

// Convert our style schema into qr-code-styling options
export function toQrCodeStylingOptions(style, { data, width = 256 }) {
  const s = sanitizeQrStyle(style);
  return {
    type: 'canvas',
    width,
    height: width,
    data,
    margin: s.margin,
    qrOptions: { errorCorrectionLevel: s.errorLevel },
    backgroundOptions: { color: s.bgColor },
    dotsOptions: { color: s.fgColor, type: s.dotsType },
    cornersSquareOptions: { color: s.fgColor, type: s.cornersSquareType },
    cornersDotOptions: { color: s.fgColor, type: s.cornersDotType },
    image: s.logoDataUrl || undefined,
    imageOptions: {
      crossOrigin: 'anonymous',
      imageSize: 0.3,
      margin: 4,
      hideBackgroundDots: true
    }
  };
}

// Server-side simple rendering options for the `qrcode` lib
export function toQrcodeLibOptions(style, { width = 192 } = {}) {
  const s = sanitizeQrStyle(style);
  return {
    width,
    margin: s.margin,
    errorCorrectionLevel: s.errorLevel,
    color: { dark: s.fgColor, light: s.bgColor }
  };
}
