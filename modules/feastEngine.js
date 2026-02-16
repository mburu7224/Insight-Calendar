import { getScripturesForLabel } from './scriptureData.js';

function feast(name, month, day, endDay = null) {
  return {
    name,
    month,
    day,
    endDay,
    scriptures: getScripturesForLabel(name)
  };
}

export function applyFeasts(yearData) {
  const byName = Object.fromEntries(yearData.months.map((m) => [m.name, m]));

  for (const month of yearData.months) {
    month.feasts = month.feasts || [];
  }

  if (byName.Nisan) {
    byName.Nisan.feasts.push(feast('Passover', 'Nisan', 14));
    byName.Nisan.feasts.push(feast('Unleavened Bread', 'Nisan', 15, 21));
    byName.Nisan.feasts.push(feast('Firstfruits', 'Nisan', 16));
  }

  if (byName.Sivan) {
    byName.Sivan.feasts.push(feast('Pentecost', 'Sivan', 6));
  }

  if (byName.Tishri) {
    byName.Tishri.feasts.push(feast('Trumpets', 'Tishri', 1));
    byName.Tishri.feasts.push(feast('Day of Atonement', 'Tishri', 10));
    byName.Tishri.feasts.push(feast('Tabernacles', 'Tishri', 15, 21));
    byName.Tishri.feasts.push(feast('Last Great Day', 'Tishri', 22));
  }

  return yearData;
}
