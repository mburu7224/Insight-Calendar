import { generatePredictiveYear } from './modules/predictiveEngine.js';
import { generateObservationalYear } from './modules/observationalEngine.js';
import { applyFeasts } from './modules/feastEngine.js';
import { ChangeLogger } from './modules/logger.js';
import {
  renderChangeLog,
  renderMonthlyView,
  renderScriptureExplorer,
  renderSettings,
  renderYearlyOverview
} from './modules/uiRenderer.js';
import {
  addDays,
  fromIsoDateLocal,
  getBiblicalYearFromGregorianDate,
  getDayOfWeek,
  toIsoDate
} from './utils/dateHelpers.js';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const state = {
  mode: 'predictive',
  view: 'yearly',
  year: 0,
  monthIdx: 0,
  selectedScriptureLabel: '',
  currentContext: null,
  currentContextKey: '',
  followCurrentYear: true,
  followCurrentMonth: true,
  settings: {
    firstDayOfWeek: 0,
    sunsetDayStart: true,
    cycleOffset: 0
  }
};

const logger = new ChangeLogger();

const refs = {
  content: document.getElementById('appContent'),
  nav: document.getElementById('mainNav'),
  todayBiblicalLabel: document.getElementById('todayBiblicalLabel'),
  biblicalYearLabel: document.getElementById('biblicalYearLabel'),
  time24Label: document.getElementById('time24Label'),
  sunsetTransitionLabel: document.getElementById('sunsetTransitionLabel'),
  yearInput: document.getElementById('yearInput'),
  prevYear: document.getElementById('prevYear'),
  nextYear: document.getElementById('nextYear')
};

function getYearData(year = state.year) {
  const base =
    state.mode === 'predictive'
      ? generatePredictiveYear(year, state.settings)
      : generateObservationalYear(year, state.settings, logger);

  return applyFeasts(base);
}

function setNavState() {
  for (const node of refs.nav.querySelectorAll('.nav-item')) {
    const role = node.getAttribute('data-role');
    const value = node.getAttribute('data-value');
    const active = (role === 'mode' && value === state.mode) || (role === 'view' && value === state.view);
    node.classList.toggle('active', active);
  }
}

function downloadFile(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportCurrentYear(format) {
  const data = getYearData();

  if (format === 'json') {
    downloadFile(JSON.stringify(data, null, 2), `biblical-calendar-${data.year}-${data.mode}.json`, 'application/json');
    return;
  }

  const rows = ['Year,Mode,Month,Days,StartDate,Feasts'];
  for (const month of data.months) {
    const feasts = month.feasts.map((f) => f.name).join('|');
    rows.push([data.year, data.mode, month.name, month.days, month.startDate, feasts].join(','));
  }

  downloadFile(rows.join('\n'), `biblical-calendar-${data.year}-${data.mode}.csv`, 'text/csv');
}

function findBiblicalDateInYear(yearData, date) {
  const targetKey = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  for (const month of yearData.months) {
    const start = fromIsoDateLocal(month.startDate);
    const end = addDays(start, month.days);
    const startKey = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endKey = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    if (targetKey >= startKey && targetKey < endKey) {
      const day = Math.floor((targetKey - startKey) / 86400000) + 1;
      return { month: month.name, day };
    }
  }
  return null;
}

function getEffectiveDate(now, settings) {
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!settings.sunsetDayStart) {
    return base;
  }
  return now.getHours() >= 18 ? addDays(base, 1) : base;
}

function syncAutoFocus(currentContext) {
  let changed = false;

  if (state.followCurrentYear && state.year !== currentContext.biblicalYear) {
    state.year = currentContext.biblicalYear;
    changed = true;
  }

  if (state.followCurrentMonth && currentContext.monthIdx >= 0 && state.monthIdx !== currentContext.monthIdx) {
    state.monthIdx = currentContext.monthIdx;
    changed = true;
  }

  return changed;
}

function formatTwoDigits(value) {
  return String(value).padStart(2, '0');
}

function format24Time(date) {
  return `${formatTwoDigits(date.getHours())}:${formatTwoDigits(date.getMinutes())}:${formatTwoDigits(date.getSeconds())}`;
}

function getSunsetTransitionText(now, settings) {
  if (!settings.sunsetDayStart) {
    return 'Sunset day start disabled (midnight boundary active).';
  }
  const sunsetHour = 18;
  if (now.getHours() >= sunsetHour) {
    return 'After sunset: biblical date already transitioned.';
  }

  const sunset = new Date(now);
  sunset.setHours(sunsetHour, 0, 0, 0);
  const diffMs = sunset - now;
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `Sunset transition at 18:00 (in ${formatTwoDigits(hours)}:${formatTwoDigits(minutes)}).`;
}

function getContextKey(effectiveDate) {
  return [toIsoDate(effectiveDate), state.mode, state.settings.cycleOffset].join('|');
}

function refreshCurrentContext(force = false) {
  const now = new Date();
  const effectiveDate = getEffectiveDate(now, state.settings);
  const key = getContextKey(effectiveDate);

  if (!state.currentContext || force || state.currentContextKey !== key) {
    const biblicalYear = getBiblicalYearFromGregorianDate(effectiveDate, state.settings.cycleOffset);
    const todayYearData = getYearData(biblicalYear);
    const biblicalDate = findBiblicalDateInYear(todayYearData, effectiveDate);
    const monthIdx = biblicalDate
      ? todayYearData.months.findIndex((month) => month.name === biblicalDate.month)
      : -1;

    state.currentContext = {
      now,
      effectiveDate,
      biblicalYear,
      biblicalDate,
      monthIdx
    };
    state.currentContextKey = key;
  } else {
    state.currentContext.now = now;
    state.currentContext.effectiveDate = effectiveDate;
  }

  return state.currentContext;
}

function updateNowLabels(currentContext) {
  const { now, effectiveDate, biblicalYear, biblicalDate } = currentContext;
  const dayLabel = WEEKDAYS[getDayOfWeek(effectiveDate)];
  refs.biblicalYearLabel.textContent = `Biblical Year ${biblicalYear}`;
  refs.time24Label.textContent = `24h Time ${format24Time(now)}`;
  refs.sunsetTransitionLabel.textContent = getSunsetTransitionText(now, state.settings);

  if (!biblicalDate) {
    refs.todayBiblicalLabel.textContent = `Today: ${dayLabel}, Biblical Year ${biblicalYear}`;
    return;
  }

  refs.todayBiblicalLabel.textContent = `Today: ${dayLabel}, ${biblicalDate.month} ${biblicalDate.day}, Biblical Year ${biblicalYear}`;
}

function render() {
  const currentContext = refreshCurrentContext();
  syncAutoFocus(currentContext);
  refs.yearInput.value = String(state.year);
  setNavState();
  const yearData = getYearData();
  updateNowLabels(currentContext);

  if (state.monthIdx >= yearData.months.length) {
    state.monthIdx = 0;
  }

  switch (state.view) {
    case 'yearly':
      renderYearlyOverview(refs.content, yearData, state.settings, (label) => {
        state.selectedScriptureLabel = label;
        state.view = 'scripture';
        render();
      });
      break;
    case 'monthly':
      renderMonthlyView(
        refs.content,
        yearData,
        state.settings,
        state.monthIdx,
        (idx) => {
          state.followCurrentMonth = false;
          state.monthIdx = idx;
          render();
        },
        (label) => {
          state.selectedScriptureLabel = label;
          state.view = 'scripture';
          render();
        },
        currentContext.biblicalDate ? { ...currentContext.biblicalDate, year: currentContext.biblicalYear } : null
      );
      break;
    case 'scripture':
      renderScriptureExplorer(refs.content, state.selectedScriptureLabel);
      break;
    case 'changelog':
      renderChangeLog(refs.content, yearData.logs || []);
      break;
    case 'settings':
      renderSettings(
        refs.content,
        state.settings,
        (patch) => {
          state.settings = { ...state.settings, ...patch };
          render();
        },
        (format) => exportCurrentYear(format)
      );
      break;
    default:
      state.view = 'yearly';
      render();
  }
}

refs.nav.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.classList.contains('nav-item')) {
    return;
  }

  const role = target.getAttribute('data-role');
  const value = target.getAttribute('data-value');

  if (role === 'mode' && value) {
    state.mode = value;
  }

  if (role === 'view' && value) {
    if (value === 'monthly') {
      const currentContext = refreshCurrentContext();
      if (currentContext.monthIdx >= 0) {
        state.year = currentContext.biblicalYear;
        state.monthIdx = currentContext.monthIdx;
        state.followCurrentYear = true;
        state.followCurrentMonth = true;
      }
    }
    state.view = value;
  }

  render();
});

refs.prevYear.addEventListener('click', () => {
  state.followCurrentYear = false;
  state.followCurrentMonth = false;
  state.year -= 1;
  render();
});

refs.nextYear.addEventListener('click', () => {
  state.followCurrentYear = false;
  state.followCurrentMonth = false;
  state.year += 1;
  render();
});

refs.yearInput.addEventListener('change', () => {
  const parsed = Number(refs.yearInput.value);
  if (Number.isFinite(parsed) && parsed > 0) {
    state.followCurrentYear = false;
    state.followCurrentMonth = false;
    state.year = Math.floor(parsed);
    render();
  }
});

state.year = getBiblicalYearFromGregorianDate(
  getEffectiveDate(new Date(), state.settings),
  state.settings.cycleOffset
);

render();

setInterval(() => {
  const prevKey = state.currentContextKey;
  const context = refreshCurrentContext();
  const autoChanged = syncAutoFocus(context);
  updateNowLabels(context);
  if (state.view === 'monthly' && (prevKey !== state.currentContextKey || autoChanged)) {
    render();
  } else if (state.view === 'yearly' && autoChanged) {
    render();
  }
}, 1000);
