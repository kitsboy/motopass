/** ISO 3166-1 alpha-2 codes for program jurisdictions (flag sprite CDN). */
const ISO_BY_NAME: Record<string, string> = {
  'El Salvador': 'SV',
  Malta: 'MT',
  Portugal: 'PT',
  'St Kitts & Nevis': 'KN',
  Paraguay: 'PY',
  Uruguay: 'UY',
  Switzerland: 'CH',
  Singapore: 'SG',
  'United Arab Emirates': 'AE',
  Bolivia: 'BO',
  'UAE (Dubai / Abu Dhabi)': 'AE',
  Panama: 'PA',
  Georgia: 'GE',
  Montenegro: 'ME',
  Turkey: 'TR',
  Thailand: 'TH',
  Mexico: 'MX',
  Brazil: 'BR',
  Argentina: 'AR',
  Chile: 'CL',
  Colombia: 'CO',
  'Costa Rica': 'CR',
  Dominica: 'DM',
  Grenada: 'GD',
  'Antigua and Barbuda': 'AG',
  'St Lucia': 'LC',
  Vanuatu: 'VU',
  Cambodia: 'KH',
  Malaysia: 'MY',
  Indonesia: 'ID',
  Philippines: 'PH',
  Japan: 'JP',
  'South Korea': 'KR',
  Taiwan: 'TW',
  'Hong Kong': 'HK',
  Mauritius: 'MU',
  Seychelles: 'SC',
  Cyprus: 'CY',
  Greece: 'GR',
  Spain: 'ES',
  Italy: 'IT',
  France: 'FR',
  Germany: 'DE',
  Austria: 'AT',
  Ireland: 'IE',
  'United Kingdom': 'GB',
  Canada: 'CA',
  'United States': 'US',
  Australia: 'AU',
  'New Zealand': 'NZ',
}

/** Resolve ISO alpha-2 for flag sprite URLs; falls back to initials. */
export function programCountryCode(name: string): string {
  if (ISO_BY_NAME[name]) return ISO_BY_NAME[name]
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/** flagcdn.com sprite URL (lazy-loaded in trusted strip). */
export function flagSpriteUrl(countryName: string, width = 20): string {
  const iso = programCountryCode(countryName).toLowerCase()
  return `https://flagcdn.com/w${width}/${iso}.png`
}