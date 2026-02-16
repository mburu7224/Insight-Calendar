import {
  addDays,
  getDayOfWeek,
  getEstimatedNisanStartDate,
  getGregorianStartYearFromBiblicalYear,
  getMonthNames,
  toIsoDate
} from '../utils/dateHelpers.js';

function shouldAddLeapForSpring(biblicalYear) {
  const driftDay = 16 + ((biblicalYear * 7) % 9);
  return driftDay < 20;
}

function shouldAddLeapForBarley(biblicalYear) {
  return biblicalYear % 5 === 0;
}

export function generateObservationalYear(biblicalYear, settings, logger) {
  logger.clear();
  const gregorianStartYear = getGregorianStartYearFromBiblicalYear(biblicalYear);
  const nisanStart = getEstimatedNisanStartDate(gregorianStartYear, settings.cycleOffset);

  let leapYear = false;
  const monthNames = [...getMonthNames('observational', false)];

  if (shouldAddLeapForSpring(biblicalYear)) {
    leapYear = true;
    monthNames.push('Adar II');
    logger.add('Leap month added', 'Nisan would begin before spring threshold; leap month inserted.');
  }

  if (!leapYear && shouldAddLeapForBarley(biblicalYear)) {
    leapYear = true;
    monthNames.push('Adar II');
    logger.add('Leap month added', 'Barley not ripe in expected harvest window.');
  }

  const lengths = monthNames.map((_, idx) => (idx % 2 === 0 ? 30 : 29));

  const cheshvanIdx = monthNames.indexOf('Cheshvan');
  if (cheshvanIdx >= 0) {
    let daysUntilCheshvan = 0;

    for (let idx = 0; idx < cheshvanIdx; idx += 1) {
      daysUntilCheshvan += lengths[idx];
    }

    const cheshvanStart = addDays(nisanStart, daysUntilCheshvan);
    const cheshvanEndDow = (getDayOfWeek(cheshvanStart) + lengths[cheshvanIdx]) % 7;

    if (cheshvanEndDow === 5 && lengths[cheshvanIdx] === 29) {
      lengths[cheshvanIdx] = 30;
      logger.add(
        'Month extension',
        'Cheshvan extended to 30 days to align Sabbath rhythm and avoid compression.',
        { month: 'Cheshvan' }
      );
    }
  }

  const months = [];
  let cursor = nisanStart;

  for (let idx = 0; idx < monthNames.length; idx += 1) {
    months.push({
      name: monthNames[idx],
      index: idx,
      days: lengths[idx],
      startDate: toIsoDate(cursor),
      newMoonDay: 1,
      feasts: []
    });

    cursor = addDays(cursor, lengths[idx]);
  }

  return {
    mode: 'observational',
    year: biblicalYear,
    gregorianStartYear,
    cycleYear: null,
    leapYear,
    targetYearLength: lengths.reduce((sum, n) => sum + n, 0),
    months,
    logs: logger.getAll()
  };
}
