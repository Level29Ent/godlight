export const POWERS = ['sun', 'rain', 'lightning'] as const
export type Power = (typeof POWERS)[number]
export function isPower(value: unknown): value is Power {
  return POWERS.includes(value as Power)
}
// Sun disperses rain, rain grounds lightning, lightning eclipses sun.
export function outcome(a: Power, b: Power): 0 | 1 | -1 {
  if (a === b) return 0
  return (a === 'sun' && b === 'rain') || (a === 'rain' && b === 'lightning') || (a === 'lightning' && b === 'sun') ? 1 : -1
}
