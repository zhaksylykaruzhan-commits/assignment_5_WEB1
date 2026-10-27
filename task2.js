'use strict';

/* ===== Task 2: Kanban board (Option A) =====
   The page is built from the "initialTasks" array. The HTML only has empty containers. */

const COLUMNS = [
  { key: 'todo', title: 'To do' },
  { key: 'doing', title: 'In progress' },
  { key: 'done', title: 'Done' }
];
const DOING_LIMIT = 3; // the middle column holds at most 3 cards
const ALL_TAGS = 'all';

// priority: 1 = high, 2 = medium, 3 = low
const initialTasks = [
  { id: 1,  title: 'Design landing page',      tag: 'design',   priority: 1, hours: 6, urgent: true,  column: 'todo' },
  { id: 2,  title: 'Write login form',          tag: 'frontend', priority: 1, hours: 4, urgent: true,  column: 'doing' },
  { id: 3,  title: 'Set up GitHub repository',  tag: 'devops',   priority: 2, hours: 1, urgent: false, column: 'done' },
  { id: 4,  title: 'Create color palette',      tag: 'design',   priority: 3, hours: 2, urgent: false, column: 'done' },
  { id: 5,  title: 'Validate email field',      tag: 'frontend', priority: 2, hours: 3, urgent: false, column: 'todo' },
  { id: 6,  title: 'Write project README',      tag: 'docs',     priority: 3, hours: 2, urgent: false, column: 'todo' },
  { id: 7,  title: 'Build navigation bar',      tag: 'frontend', priority: 2, hours: 3, urgent: false, column: 'doing' },
  { id: 8,  title: 'Test on mobile screens',    tag: 'testing',  priority: 1, hours: 5, urgent: true,  column: 'todo' },
  { id: 9,  title: 'Deploy to GitHub Pages',    tag: 'devops',   priority: 2, hours: 1, urgent: false, column: 'todo' },
  { id: 10, title: 'Prepare presentation',      tag: 'docs',     priority: 3, hours: 4, urgent: false, column: 'todo' },
  { id: 11, title: 'Fix footer layout bug',     tag: 'frontend', priority: 2, hours: 1, urgent: false, column: 'doing' },
  { id: 12, title: 'Collect user feedback',     tag: 'testing',  priority: 3, hours: 3, urgent: false, column: 'done' }
];

// ---------- state ----------
let tasks = initialTasks.map(function (t) { return Object.assign({}, t); });
let query = '';
let tagFilter = ALL_TAGS;
let sortBy = 'priority';
let message = { text: 'Ready. Pick a card and press a button.', kind: 'info' };

// ---------- elements ----------
const boardEl = document.getElementById('board');
const searchEl = document.getElementById('search');
const tagEl = document.getElementById('tagFilter');
const sortEl = document.getElementById('sortBy');
const resetBtn = document.getElementById('resetBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const hoursText = document.getElementById('hoursText');
const messageEl = document.getElementById('message');
const emptyEl = document.getElementById('emptyState');

const PRIORITY_NAMES = { 1: 'High', 2: 'Medium', 3: 'Low' };

// ---------- helpers ----------
function countInColumn(key) {
  let count = 0;
  for (const task of tasks) {
    if (task.column === key) {
      count += 1;
    }
  }
  return count;
}

// my own loop: total hours of cards that are not finished yet
function remainingHours() {
  let total = 0;
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].column !== 'done') {
      total += tasks[i].hours;
    }
  }
  return total;
}

function columnIndex(key) {
  for (let i = 0; i < COLUMNS.length; i++) {
    if (COLUMNS[i].key === key) {
      return i;
    }
  }
  return -1;
}

function matchesFilters(task) {
  const text = query.trim().toLowerCase();
  const titleOk = text === '' || task.title.toLowerCase().includes(text);
  const tagOk = tagFilter === ALL_TAGS || task.tag === tagFilter;
  return titleOk && tagOk;
}

function compareTasks(a, b) {
  if (sortBy === 'hours') {
    return a.hours - b.hours || a.title.localeCompare(b.title);
  }
  if (sortBy === 'title') {
    return a.title.localeCompare(b.title);
  }
  return a.priority - b.priority || a.title.localeCompare(b.title);
}

function setMessage(text, kind) {
  message = { text: text, kind: kind };
}

// ---------- the ONLY place that changes the data: move ----------
function moveTask(id, direction) {
  const task = tasks.find(function (t) { return t.id === id; });
  if (!task) {
    return;
  }
  const from = columnIndex(task.column);
  const to = from + direction;

  if (to < 0 || to >= COLUMNS.length) {
    setMessage('"' + task.title + '" cannot go further in that direction.', 'warn');
    return;
  }

  const target = COLUMNS[to].key;

  // rule: the middle column holds at most DOING_LIMIT cards
  if (target === 'doing' && countInColumn('doing') >= DOING_LIMIT) {
    setMessage('Blocked: "In progress" already has ' + DOING_LIMIT + ' cards. Finish one of them first.', 'bad');
    return;
  }

  task.column = target;
  setMessage('Moved "' + task.title + '" to "' + COLUMNS[to].title + '".', 'ok');
}

// ---------- render: called after every change ----------
function render() {
  // 1. progress and hours (from ALL cards, not only the filtered ones)
  const doneCount = countInColumn('done');
  const percent = Math.round((doneCount / tasks.length) * 100);
  progressBar.value = percent;
  progressText.textContent = 'Finished: ' + doneCount + ' of ' + tasks.length + ' cards (' + percent + '%)';
  hoursText.textContent = 'Hours left: ' + remainingHours() + ' h';

  // 2. message
  messageEl.textContent = message.text;
  messageEl.className = 'message message--' + message.kind;

  // 3. board
  boardEl.textContent = '';
  let visibleTotal = 0;

  for (const column of COLUMNS) {
    const section = document.createElement('section');
    section.className = 'column';
    const inColumn = countInColumn(column.key);
    if (column.key === 'doing' && inColumn >= DOING_LIMIT) {
      section.classList.add('column--full');
    }

    const head = document.createElement('div');
    head.className = 'column__head';
    const title = document.createElement('h2');
    title.className = 'column__title';
    title.textContent = column.title;
    const count = document.createElement('span');
    count.className = 'column__count';
    count.textContent = column.key === 'doing' ? inColumn + ' / ' + DOING_LIMIT : String(inColumn);
    head.appendChild(title);
    head.appendChild(count);
    section.appendChild(head);

    const visible = tasks.filter(function (t) { return t.column === column.key && matchesFilters(t); });
    visible.sort(compareTasks);
    visibleTotal += visible.length;

    if (visible.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'column__empty';
      empty.textContent = 'No cards here';
      section.appendChild(empty);
    } else {
      const list = document.createElement('ul');
      list.className = 'column__list';
      for (const task of visible) {
        list.appendChild(createCard(task));
      }
      section.appendChild(list);
    }

    boardEl.appendChild(section);
  }

  // 4. nothing found
  emptyEl.classList.toggle('hidden', visibleTotal !== 0);
}

function createCard(task) {
  const li = document.createElement('li');
  li.className = 'task task--p' + task.priority;
  if (task.column === 'done') {
    li.classList.add('task--done');
  }
  li.dataset.id = String(task.id);

  const title = document.createElement('p');
  title.className = 'task__title';
  title.textContent = task.title;

  const meta = document.createElement('div');
  meta.className = 'task__meta';
  const tag = document.createElement('span');
  tag.className = 'badge';
  tag.textContent = '#' + task.tag;
  const prio = document.createElement('span');
  prio.className = 'badge';
  prio.textContent = PRIORITY_NAMES[task.priority] + ' priority';
  const hours = document.createElement('span');
  hours.className = 'badge badge--hours';
  hours.textContent = task.hours + ' h';
  meta.appendChild(tag);
  meta.appendChild(prio);
  meta.appendChild(hours);
  if (task.urgent) {
    const urgent = document.createElement('span');
    urgent.className = 'badge badge--urgent';
    urgent.textContent = 'Urgent';
    meta.appendChild(urgent);
  }

  const actions = document.createElement('div');
  actions.className = 'task__actions';
  const index = columnIndex(task.column);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'btn btn--ghost btn--small';
  back.dataset.action = 'back';
  back.dataset.id = String(task.id);
  back.textContent = '← Back';
  back.disabled = index === 0;
  back.setAttribute('aria-label', 'Move "' + task.title + '" back');

  const forward = document.createElement('button');
  forward.type = 'button';
  forward.className = 'btn btn--small';
  forward.dataset.action = 'forward';
  forward.dataset.id = String(task.id);
  forward.textContent = 'Forward →';
  forward.disabled = index === COLUMNS.length - 1;
  forward.setAttribute('aria-label', 'Move "' + task.title + '" forward');

  actions.appendChild(back);
  actions.appendChild(forward);

  li.appendChild(title);
  li.appendChild(meta);
  li.appendChild(actions);
  return li;
}

// ---------- tag filter options built from the data ----------
function fillTagOptions() {
  const tags = [];
  for (const task of initialTasks) {
    if (!tags.includes(task.tag)) {
      tags.push(task.tag);
    }
  }
  tags.sort();
  tagEl.textContent = '';
  const all = document.createElement('option');
  all.value = ALL_TAGS;
  all.textContent = 'All tags';
  tagEl.appendChild(all);
  for (const tag of tags) {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = '#' + tag;
    tagEl.appendChild(option);
  }
}

// ---------- events ----------
// ONE listener on the container for the buttons of all cards (event delegation)
boardEl.addEventListener('click', function (event) {
  const button = event.target.closest('button[data-action]');
  if (!button || !boardEl.contains(button) || button.disabled) {
    return;
  }
  const id = Number(button.dataset.id);
  const direction = button.dataset.action === 'forward' ? 1 : -1;
  moveTask(id, direction);
  render();
  // keep keyboard focus near the moved card
  const moved = boardEl.querySelector('li[data-id="' + id + '"] button[data-action="' + button.dataset.action + '"]');
  if (moved && !moved.disabled) {
    moved.focus();
  }
});

searchEl.addEventListener('input', function () {
  query = searchEl.value;
  setMessage(query.trim() === '' && tagFilter === ALL_TAGS ? 'Showing all cards.' : 'Filter applied.', 'info');
  render();
});

tagEl.addEventListener('change', function () {
  tagFilter = tagEl.value;
  setMessage(tagFilter === ALL_TAGS && query.trim() === '' ? 'Showing all cards.' : 'Filter applied.', 'info');
  render();
});

sortEl.addEventListener('change', function () {
  sortBy = sortEl.value;
  setMessage('Cards sorted.', 'info');
  render();
});

resetBtn.addEventListener('click', function () {
  tasks = initialTasks.map(function (t) { return Object.assign({}, t); });
  query = '';
  tagFilter = ALL_TAGS;
  sortBy = 'priority';
  searchEl.value = '';
  tagEl.value = ALL_TAGS;
  sortEl.value = 'priority';
  setMessage('Board reset to the start data.', 'info');
  render();
});

fillTagOptions();
render();
