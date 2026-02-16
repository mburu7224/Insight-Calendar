export const scriptureData = {
  months: {
    Nisan: ['Exodus 12:2', 'Nehemiah 2:1'],
    Iyar: ['Numbers 9:10-11'],
    Sivan: ['Exodus 19:1'],
    Tammuz: ['Ezekiel 8:14'],
    Av: ['Deuteronomy 1:3'],
    Elul: ['Nehemiah 6:15'],
    Tishri: ['Leviticus 23:24-25'],
    Cheshvan: ['1 Kings 6:38'],
    Kislev: ['Zechariah 7:1'],
    Tevet: ['Esther 2:16'],
    Shevat: ['Zechariah 1:7'],
    Adar: ['Esther 9:1'],
    'Adar I': ['Esther 9:1'],
    'Adar II': ['Esther 9:20-22']
  },
  feasts: {
    Passover: ['Exodus 12:1-14', 'Leviticus 23:5', 'Luke 22:7'],
    'Unleavened Bread': ['Exodus 12:15-20', 'Leviticus 23:6-8'],
    Firstfruits: ['Leviticus 23:9-14', '1 Corinthians 15:20'],
    Pentecost: ['Leviticus 23:15-21', 'Acts 2:1-4'],
    Trumpets: ['Leviticus 23:23-25', 'Numbers 29:1'],
    'Day of Atonement': ['Leviticus 23:26-32', 'Hebrews 9:7'],
    Tabernacles: ['Leviticus 23:33-43', 'John 7:2'],
    'Last Great Day': ['Leviticus 23:36', 'John 7:37']
  }
};

export function getScripturesForLabel(label) {
  return scriptureData.feasts[label] || scriptureData.months[label] || [];
}
