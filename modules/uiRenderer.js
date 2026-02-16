import { addDays, fromIsoDateLocal, getDayOfWeek } from '../utils/dateHelpers.js';
import { getScripturesForLabel } from './scriptureData.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function rotateWeekdays(firstDayOfWeek) {
  return [...WEEKDAYS.slice(firstDayOfWeek), ...WEEKDAYS.slice(0, firstDayOfWeek)];
}

function getFeastForDay(month, day) {
  return month.feasts.find((feast) => {
    if (feast.endDay) {
      return day >= feast.day && day <= feast.endDay;
    }

    return day === feast.day;
  });
}

export function renderYearlyOverview(container, yearData, settings, onScripturePick) {
  container.innerHTML = '';

  const card = document.createElement('section');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'section-head';
  header.innerHTML = `
    <h2>Yearly Overview: ${yearData.year}</h2>
    <div class="tag-row">
      <span class="tag">Gregorian Span: ${yearData.gregorianStartYear}-${yearData.gregorianStartYear + 1}</span>
      <span class="tag">Mode: ${yearData.mode}</span>
      <span class="tag">Leap Year: ${yearData.leapYear ? 'Yes' : 'No'}</span>
      <span class="tag">Length: ${yearData.targetYearLength} days</span>
      ${yearData.cycleYear ? `<span class="tag">Cycle Year: ${yearData.cycleYear}/19</span>` : ''}
    </div>
  `;

  const monthGrid = document.createElement('div');
  monthGrid.className = 'month-grid';

  for (const month of yearData.months) {
    const monthCard = document.createElement('article');
    monthCard.className = 'month-card';

    const monthRefs = getScripturesForLabel(month.name);
    const feastChips = month.feasts
      .map(
        (feast) => `<button class="chip" data-scripture="${feast.name}">${feast.name} (${feast.day}${
          feast.endDay ? '-' + feast.endDay : ''
        })</button>`
      )
      .join('');

    monthCard.innerHTML = `
      <h3>${month.name}</h3>
      <div class="month-meta">${month.days} days • New Moon: Day ${month.newMoonDay}</div>
      <div class="inline-feasts">${feastChips || '<span class="tag">No listed feast</span>'}</div>
      <button class="btn ghost" data-scripture="${month.name}">Open month scriptures (${monthRefs.length})</button>
    `;

    monthCard.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const scriptureKey = target.getAttribute('data-scripture');
      if (scriptureKey) {
        onScripturePick(scriptureKey);
      }
    });

    monthGrid.appendChild(monthCard);
  }

  const legend = document.createElement('div');
  legend.className = 'legend';
  legend.innerHTML = `
    <span class="tag">Sabbath: blue cells</span>
    <span class="tag">New Moon: purple outline</span>
    <span class="tag">Feast: amber background</span>
    ${settings.sunsetDayStart ? '<span class="tag">Sunset day start enabled</span>' : ''}
  `;

  card.appendChild(header);
  card.appendChild(monthGrid);
  card.appendChild(legend);
  container.appendChild(card);
}

export function renderMonthlyView(
  container,
  yearData,
  settings,
  selectedMonthIdx,
  onMonthChange,
  onScripturePick,
  todayBiblicalDate
) {
  container.innerHTML = '';

  const card = document.createElement('section');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'section-head';
  header.innerHTML = `<h2>Monthly View</h2>`;

  const layout = document.createElement('div');
  layout.className = 'monthly-layout';

  const sidebar = document.createElement('aside');
  sidebar.className = 'panel';

  const picker = document.createElement('select');
  picker.innerHTML = yearData.months
    .map((month, idx) => `<option value="${idx}" ${idx === selectedMonthIdx ? 'selected' : ''}>${month.name}</option>`)
    .join('');

  picker.addEventListener('change', () => onMonthChange(Number(picker.value)));

  const month = yearData.months[selectedMonthIdx] || yearData.months[0];

  sidebar.innerHTML = `
    <h3>${month.name}</h3>
    <div>${month.days} days</div>
    <div>Starts: ${month.startDate}</div>
    <div>New Moon: Day ${month.newMoonDay}</div>
  `;
  sidebar.appendChild(picker);

  const feastBox = document.createElement('div');
  feastBox.className = 'scripture-list';
  feastBox.innerHTML = month.feasts.length
    ? month.feasts
        .map(
          (feast) =>
            `<button class="btn ghost" data-scripture="${feast.name}">${feast.name} (Day ${feast.day}${
              feast.endDay ? '-' + feast.endDay : ''
            })</button>`
        )
        .join('')
    : '<div class="tag">No feast in this month</div>';

  feastBox.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement) {
      const scriptureKey = target.getAttribute('data-scripture');
      if (scriptureKey) {
        onScripturePick(scriptureKey);
      }
    }
  });

  sidebar.appendChild(feastBox);

  const gridPanel = document.createElement('section');
  gridPanel.className = 'panel';

  const weekdays = rotateWeekdays(settings.firstDayOfWeek);
  const startDowRaw = getDayOfWeek(month.startDate);
  const startDow = (startDowRaw - settings.firstDayOfWeek + 7) % 7;

  const cal = document.createElement('div');
  cal.className = 'calendar-grid';

  for (const wd of weekdays) {
    const hd = document.createElement('div');
    hd.className = 'day-head';
    hd.textContent = wd;
    cal.appendChild(hd);
  }

  for (let blank = 0; blank < startDow; blank += 1) {
    const empty = document.createElement('div');
    empty.className = 'day-cell';
    cal.appendChild(empty);
  }

  for (let day = 1; day <= month.days; day += 1) {
    const date = addDays(fromIsoDateLocal(month.startDate), day - 1);
    const dow = getDayOfWeek(date);
    const feast = getFeastForDay(month, day);

    const cell = document.createElement('div');
    cell.className = 'day-cell';

    if (dow === 6) {
      cell.classList.add('sabbath');
    }

    if (day === 1) {
      cell.classList.add('newmoon');
    }

    if (feast) {
      cell.classList.add('feast');
    }

    if (
      todayBiblicalDate &&
      yearData.year === todayBiblicalDate.year &&
      month.name === todayBiblicalDate.month &&
      day === todayBiblicalDate.day
    ) {
      cell.classList.add('current-day');
    }

    cell.innerHTML = `<div class="num">${day}</div>`;

    if (feast) {
      const note = document.createElement('button');
      note.className = 'chip';
      note.textContent = feast.name;
      note.addEventListener('click', () => onScripturePick(feast.name));
      cell.appendChild(note);
    }

    const dayNote = document.createElement('div');
    dayNote.className = 'day-note';
    if (
      todayBiblicalDate &&
      yearData.year === todayBiblicalDate.year &&
      month.name === todayBiblicalDate.month &&
      day === todayBiblicalDate.day
    ) {
      dayNote.textContent = 'Today';
    } else {
      dayNote.textContent = dow === 6 ? 'Sabbath' : day === 1 ? 'New Moon' : '';
    }
    cell.appendChild(dayNote);

    cal.appendChild(cell);
  }

  gridPanel.appendChild(cal);
  layout.appendChild(sidebar);
  layout.appendChild(gridPanel);

  card.appendChild(header);
  card.appendChild(layout);
  container.appendChild(card);
}

export function renderScriptureExplorer(container, query) {
  container.innerHTML = '';

  const card = document.createElement('section');
  card.className = 'card';

  const refs = query ? getScripturesForLabel(query) : [];
  card.innerHTML = `
    <div class="section-head">
      <h2>Scripture Explorer</h2>
      <span class="tag">Selection: ${query || 'None'}</span>
    </div>
  `;

  const list = document.createElement('ul');
  list.className = 'scripture-list';

  if (!query) {
    list.innerHTML = '<li>Select a month or feast from Yearly/Monthly view to load passages.</li>';
  } else if (!refs.length) {
    list.innerHTML = `<li>No passages mapped yet for <strong>${query}</strong>.</li>`;
  } else {
    list.innerHTML = refs.map((r) => `<li>${r}</li>`).join('');
  }

  card.appendChild(list);
  container.appendChild(card);
}

export function renderChangeLog(container, logs) {
  container.innerHTML = '';

  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = '<div class="section-head"><h2>Observational Change Log</h2></div>';

  const list = document.createElement('div');
  list.className = 'log-list';

  if (!logs.length) {
    list.innerHTML = '<div class="tag">No changes recorded for this year.</div>';
  } else {
    for (const item of logs) {
      const node = document.createElement('article');
      node.className = 'log-item';
      node.innerHTML = `
        <div><strong>${item.change}</strong></div>
        <div>${item.reason}</div>
        <div class="when">Logged: ${item.when}</div>
      `;
      list.appendChild(node);
    }
  }

  card.appendChild(list);
  container.appendChild(card);
}

export function renderSettings(container, settings, onChange, onExport) {
  container.innerHTML = '';

  const card = document.createElement('section');
  card.className = 'card';

  card.innerHTML = `
    <div class="section-head"><h2>Settings</h2></div>
    <div class="settings-grid">
      <div class="setting-item">
        <label for="firstDay">First day of week</label>
        <select id="firstDay">
          <option value="0" ${settings.firstDayOfWeek === 0 ? 'selected' : ''}>Sunday</option>
          <option value="1" ${settings.firstDayOfWeek === 1 ? 'selected' : ''}>Monday</option>
        </select>
      </div>

      <div class="setting-item">
        <label for="sunsetDayStart">Sunset-based day start</label>
        <input id="sunsetDayStart" type="checkbox" ${settings.sunsetDayStart ? 'checked' : ''}>
      </div>

      <div class="setting-item">
        <label for="cycleOffset">19-year cycle offset</label>
        <input id="cycleOffset" type="number" min="-18" max="18" value="${settings.cycleOffset}">
      </div>

      <div class="setting-item">
        <button class="btn primary" id="exportJson">Export Current Year JSON</button>
        <button class="btn" id="exportCsv">Export Current Year CSV</button>
      </div>
    </div>
  `;

  card.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.id === 'firstDay') {
      onChange({ firstDayOfWeek: Number(target.value) });
    }

    if (target.id === 'sunsetDayStart' && target instanceof HTMLInputElement) {
      onChange({ sunsetDayStart: target.checked });
    }

    if (target.id === 'cycleOffset' && target instanceof HTMLInputElement) {
      const parsed = Number(target.value);
      if (Number.isFinite(parsed)) {
        onChange({ cycleOffset: parsed });
      }
    }
  });

  card.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.id === 'exportJson') {
      onExport('json');
    }

    if (target.id === 'exportCsv') {
      onExport('csv');
    }
  });

  container.appendChild(card);
}



