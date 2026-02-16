export const BASE_MONTHS = [
  'Nisan',
  'Iyar',
  'Sivan',
  'Tammuz',
  'Av',
  'Elul',
  'Tishri',
  'Cheshvan',
  'Kislev',
  'Tevet',
  'Shevat',
  'Adar'
];

const METONIC_LEAP_POSITIONS = new Set([3, 6, 8, 11, 14, 17, 19]);

export function addDays(date, days) {
  const output = new Date(date);
  output.setDate(output.getDate() + days);
  return output;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

export function fromIsoDateLocal(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getDayOfWeek(date) {
  const parsed = typeof date === 'string' ? fromIsoDateLocal(date) : new Date(date);
  return parsed.getDay();
}

export function getBiblicalYearFromGregorianDate(date) {
  const target = new Date(date);
  const gregYear = target.getFullYear();
  const nisanStart = getEstimatedNisanStartDate(gregYear, 0);
  return target >= nisanStart ? gregYear + 3760 : gregYear + 3759;
}

export function getGregorianStartYearFromBiblicalYear(biblicalYear) {
  return biblicalYear - 3760;
}

export function getMetonicYearPosition(year, cycleOffset = 0) {
  const normalized = ((year + cycleOffset - 1) % 19 + 19) % 19;
  return normalized + 1;
}

export function isLeapYear(year, cycleOffset = 0) {
  return METONIC_LEAP_POSITIONS.has(getMetonicYearPosition(year, cycleOffset));
}

export function getEstimatedNisanStartDate(gregorianStartYear, cycleOffset = 0) {
  // Keep biblical new year between late March and early April.
  const drift = ((gregorianStartYear + cycleOffset) % 4 + 4) % 4;
  return new Date(gregorianStartYear, 2, 29 + drift);
}

export function getMonthNames(mode, isLeap) {
  if (!isLeap) {
    return [...BASE_MONTHS];
  }

  if (mode === 'predictive') {
    return [
      'Nisan',
      'Iyar',
      'Sivan',
      'Tammuz',
      'Av',
      'Elul',
      'Tishri',
      'Cheshvan',
      'Kislev',
      'Tevet',
      'Shevat',
      'Adar I',
      'Adar II'
    ];
  }

  return [
    'Nisan',
    'Iyar',
    'Sivan',
    'Tammuz',
    'Av',
    'Elul',
    'Tishri',
    'Cheshvan',
    'Kislev',
    'Tevet',
    'Shevat',
    'Adar',
    'Adar II'
  ];
}

export function getMonthLength(monthIndex, mode, leapYear = false, desiredYearLength = null) {
  const monthNames = getMonthNames(mode, leapYear);
  const lengths = monthNames.map((_, idx) => (idx % 2 === 0 ? 30 : 29));

  if (desiredYearLength !== null) {
    const total = lengths.reduce((sum, value) => sum + value, 0);
    const delta = desiredYearLength - total;
    const cheshvanIdx = monthNames.indexOf('Cheshvan');
    const kislevIdx = monthNames.indexOf('Kislev');

    if (delta > 0 && cheshvanIdx >= 0) {
      lengths[cheshvanIdx] += 1;
    }

    if (delta < 0 && kislevIdx >= 0) {
      lengths[kislevIdx] -= 1;
    }
  }

  return lengths[monthIndex];
}

export function toIsoDate(date) {
  const parsed = new Date(date);
  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
}
