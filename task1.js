'use strict';

/* ===== Task 1: Higher or Lower =====
   Option A. All numbers of the game are constants at the top. */

const MAX_LIVES = 3;          // lives at the start
const MIN_PRICE = 10;         // smallest possible price (included)
const MAX_PRICE = 60;         // largest possible price (included)
const WIN_STREAK = 10;        // a streak of this length wins the game
const LOG_LIMIT = 5;          // how many last moves are shown
const BEST_KEY = 'a5-best-streak';

const ITEM_NAMES = [
  'Mechanical keyboard', 'Wireless mouse', 'USB-C hub', 'Webcam HD',
  'Desk lamp', 'Bluetooth speaker', 'Phone stand', 'Laptop sleeve',
  'Gaming headset', 'Power bank', 'Smart plug', 'External SSD'
];

// ---------- elements ----------
const gameEl = document.getElementById('game');
const livesEl = document.getElementById('lives');
const streakEl = document.getElementById('streak');
const bestEl = document.getElementById('best');
const currentNameEl = document.getElementById('currentName');
const currentValueEl = document.getElementById('currentValue');
const nextCardEl = document.getElementById('nextCard');
const nextNameEl = document.getElementById('nextName');
const nextValueEl = document.getElementById('nextValue');
const higherBtn = document.getElementById('higherBtn');
const lowerBtn = document.getElementById('lowerBtn');
const typedForm = document.getElementById('typedForm');
const typedInput = document.getElementById('typedGuess');
const typedBtn = document.getElementById('typedBtn');
const messageEl = document.getElementById('message');
const bannerEl = document.getElementById('banner');
const restartBtn = document.getElementById('restartBtn');
const logEl = document.getElementById('log');

// ---------- game state ----------
const state = {
  lives: MAX_LIVES,
  streak: 0,
  best: 0,
  current: null,
  next: null,
  over: false,
  won: false,
  log: []
};

// Fair random whole number from min to max, both included.
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeItem() {
  return {
    name: ITEM_NAMES[randomInt(0, ITEM_NAMES.length - 1)],
    value: randomInt(MIN_PRICE, MAX_PRICE)
  };
}

function loadBest() {
  try {
    const saved = Number(localStorage.getItem(BEST_KEY));
    return Number.isInteger(saved) && saved >= 0 ? saved : 0;
  } catch (e) {
    return 0;
  }
}

function saveBest(value) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch (e) {
    /* storage can be blocked, the game still works */
  }
}

function setMessage(text, kind) {
  messageEl.textContent = text;
  messageEl.className = 'message message--' + kind;
}

// ---------- start / restart ----------
function startGame() {
  state.lives = MAX_LIVES;
  state.streak = 0;
  state.best = loadBest();
  state.current = makeItem();
  state.next = null;
  state.over = false;
  state.won = false;
  state.log = [];
  typedInput.value = '';
  typedInput.classList.remove('typed-input--invalid');
  setMessage('Is the next price higher or lower than $' + state.current.value + '?', 'info');
  render();
}

// ---------- a move ----------
function normalizeGuess(raw) {
  const text = String(raw).trim().toLowerCase();
  if (text === 'h' || text === 'higher') {
    return 'higher';
  }
  if (text === 'l' || text === 'lower') {
    return 'lower';
  }
  return null;
}

function makeGuess(raw) {
  if (state.over) {
    setMessage('The game is over. Press "Restart game" to play again.', 'warn');
    return;
  }

  const choice = normalizeGuess(raw);
  if (choice === null) {
    // invalid input: reject, state is not changed
    typedInput.classList.add('typed-input--invalid');
    setMessage('Invalid move. Type "higher" or "lower" (or H / L).', 'bad');
    return;
  }
  typedInput.classList.remove('typed-input--invalid');

  const previous = state.current;
  const next = makeItem();
  state.next = next;

  // Equal values count as a right guess.
  const correct =
    (choice === 'higher' && next.value >= previous.value) ||
    (choice === 'lower' && next.value <= previous.value);

  let text;
  if (correct) {
    state.streak += 1;
    if (state.streak > state.best) {
      state.best = state.streak;
      saveBest(state.best);
    }
    text = next.value === previous.value
      ? 'Equal prices ($' + next.value + ') - counts as a right guess!'
      : 'Right! $' + next.value + ' is ' + (next.value > previous.value ? 'higher' : 'lower') + ' than $' + previous.value + '.';
    setMessage(text, 'ok');
  } else {
    state.lives -= 1;
    state.streak = 0;
    text = 'Wrong. $' + next.value + ' is ' + (next.value > previous.value ? 'higher' : 'lower') + ' than $' + previous.value + '.';
    setMessage(text, 'bad');
  }

  // game end conditions
  if (state.lives === 0) {
    state.over = true;
    state.won = false;
  } else if (state.streak === WIN_STREAK) {
    state.over = true;
    state.won = true;
  }

  state.log.unshift({ text: text, correct: correct });
  if (state.log.length > LOG_LIMIT) {
    state.log.length = LOG_LIMIT;
  }

  state.current = next;
  render();
}

// ---------- render ----------
function render() {
  // lives as hearts
  livesEl.textContent = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    const heart = document.createElement('span');
    heart.className = i < state.lives ? 'heart' : 'heart heart--lost';
    heart.textContent = '♥';
    livesEl.appendChild(heart);
  }
  livesEl.setAttribute('aria-label', state.lives + ' of ' + MAX_LIVES + ' lives left');

  streakEl.textContent = state.streak;
  bestEl.textContent = state.best;

  currentNameEl.textContent = state.current.name;
  currentValueEl.textContent = '$' + state.current.value;

  nextCardEl.classList.add('item--hidden');
  nextNameEl.textContent = state.over ? 'Game over' : 'Next gadget';
  nextValueEl.textContent = '?';

  // controls
  higherBtn.disabled = state.over;
  lowerBtn.disabled = state.over;
  typedBtn.disabled = state.over;
  typedInput.disabled = state.over;

  // end state
  gameEl.classList.toggle('game--over', state.over);
  gameEl.classList.toggle('game--won', state.over && state.won);
  gameEl.classList.toggle('game--lost', state.over && !state.won);
  bannerEl.classList.toggle('hidden', !state.over);
  if (state.over) {
    bannerEl.textContent = state.won
      ? 'You win! Streak of ' + WIN_STREAK + ' reached.'
      : 'Game over. No lives left. Best streak: ' + state.best + '.';
  }

  // log
  logEl.textContent = '';
  if (state.log.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'log__empty';
    empty.textContent = 'No moves yet. Make your first guess!';
    logEl.appendChild(empty);
  } else {
    for (const entry of state.log) {
      const li = document.createElement('li');
      li.className = 'log__item ' + (entry.correct ? 'log__item--correct' : 'log__item--wrong');
      li.textContent = entry.text;
      logEl.appendChild(li);
    }
  }
}

// ---------- events ----------
higherBtn.addEventListener('click', function () { makeGuess('higher'); });
lowerBtn.addEventListener('click', function () { makeGuess('lower'); });
restartBtn.addEventListener('click', startGame);

typedForm.addEventListener('submit', function (event) {
  event.preventDefault();
  makeGuess(typedInput.value);
  if (!state.over) {
    typedInput.value = '';
    typedInput.focus();
  }
});

document.addEventListener('keydown', function (event) {
  // keyboard shortcuts only when the user is not typing in a field
  if (event.target === typedInput || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  const key = event.key.toLowerCase();
  if (key === 'h') {
    makeGuess('higher');
  } else if (key === 'l') {
    makeGuess('lower');
  } else if (key === 'r') {
    startGame();
  }
});

startGame();
