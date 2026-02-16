import {
  addDays,
  getEstimatedNisanStartDate,
  getGregorianStartYearFromBiblicalYear,
  getMonthLength,
  getMonthNames,
  getMetonicYearPosition,
  isLeapYear,
  toIsoDate
} from '../utils/dateHelpers.js';

function getPredictiveYearLength(year, leapYear) {
  const options = leapYear ? [383, 384, 385] : [353, 354, 355];
  return options[Math.abs(year) % 3];
}

export function generatePredictiveYear(biblicalYear, settings) {
  const leapYear = isLeapYear(biblicalYear, settings.cycleOffset);
  const cycleYear = getMetonicYearPosition(biblicalYear, settings.cycleOffset);
  const targetYearLength = getPredictiveYearLength(biblicalYear + settings.cycleOffset, leapYear);
  const monthNames = getMonthNames('predictive', leapYear);
  const gregorianStartYear = getGregorianStartYearFromBiblicalYear(biblicalYear);
  const startDate = getEstimatedNisanStartDate(gregorianStartYear, settings.cycleOffset);

  const months = [];
  let cursor = startDate;

  for (let idx = 0; idx < monthNames.length; idx += 1) {
    const name = monthNames[idx];
    const days = getMonthLength(idx, 'predictive', leapYear, targetYearLength);

    months.push({
      name,
      index: idx,
      days,
      startDate: toIsoDate(cursor),
      newMoonDay: 1,
      feasts: []
    });

    cursor = addDays(cursor, days);
  }

  return {
    mode: 'predictive',
    year: biblicalYear,
    gregorianStartYear,
    cycleYear,
    leapYear,
    targetYearLength,
    months,
    logs: []
  };
}
