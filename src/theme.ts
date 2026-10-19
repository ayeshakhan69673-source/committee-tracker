// Palette taken from the purple swatch: deep plum -> soft lilac.
export const colors = {
  primary: '#4F2266', // deep plum (headers, main buttons)
  primaryMid: '#855E9C', // mid purple
  primarySoft: '#A07EB9', // soft purple
  lilac: '#C7A8E1', // light lilac
  lilacTint: '#F0E8F7', // very light lilac for chips and soft buttons
  background: '#F8F4FB',
  surface: '#FFFFFF',
  text: '#2A1236',
  textMuted: '#7B6A8A',
  border: '#E8DDF1',
  success: '#2A9468',
  successTint: '#E2F4EB',
  warning: '#B97A12',
  warningTint: '#FBF1DB',
  danger: '#C23D55',
  dangerTint: '#FBE7EB',
  white: '#FFFFFF',
} as const;

export const radius = { sm: 10, md: 16, lg: 22, xl: 32, pill: 999 } as const;

export const shadow = {
  shadowColor: '#4F2266',
  shadowOpacity: 0.1,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
} as const;

// Plus Jakarta Sans (loaded in src/app/_layout.tsx). One family per weight, because
// Android ignores fontWeight for custom fonts.
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;