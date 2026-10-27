'use strict';

/* ===== Task 3: Ticket builder (Option A) =====
   Live validation, live preview, final ticket built only from correct data. */

// ---------- data ----------
const EVENTS = [
  { id: 'hackathon', name: 'Astana Hackathon' },
  { id: 'frontend',  name: 'Frontend Day' },
  { id: 'ai-meetup', name: 'AI Meetup' }
];

// seats left for every ticket type (changes after a booking)
const ticketTypes = [
  { id: 'standard', name: 'Standard', price: 5000,  seats: 8 },
  { id: 'vip',      name: 'VIP',      price: 15000, seats: 3 },
  { id: 'student',  name: 'Student',  price: 2500,  seats: 5 }
];

const SOLD_OUT_DATES = ['2026-11-14', '2026-11-21', '2026-12-05'];

const PROMO_CODES = [
  { code: 'AKAVIL10',  discount: 10 },
  { code: 'STUDENT20', discount: 20 },
  { code: 'ASTANA5',   discount: 5 }
];

const BLOCKED_EMAIL_DOMAINS = ['mailinator.com', 'tempmail.com', '10minutemail.com'];

const MAX_QUANTITY = 10;
const MAX_DAYS_AHEAD = 120;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

// ---------- elements ----------
const form = document.getElementById('ticketForm');
const summaryEl = document.getElementById('summary');
const previewEl = document.getElementById('preview');
const resultEl = document.getElementById('result');

const FIELD_NAMES = ['event', 'date', 'type', 'quantity', 'promo', 'name', 'email'];
const controls = {};
for (const fieldName of FIELD_NAMES) {
  controls[fieldName] = document.getElementById(fieldName);
}

form.noValidate = true; // browser messages off, HTML attributes stay

// fields the user has already left (blur) - they are checked on every input
const touched = new Set();

// ---------- small helpers ----------
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateString(date) {
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

function todayString() {
  return toDateString(new Date());
}

function maxDateString() {
  const d = new Date();
  d.setDate(d.getDate() + MAX_DAYS_AHEAD);
  return toDateString(d);
}

function formatMoney(amount) {
  return amount.toLocaleString('en-US') + ' ₸';
}

function findType(id) {
  return ticketTypes.find(function (t) { return t.id === id; });
}

function findEvent(id) {
  return EVENTS.find(function (e) { return e.id === id; });
}

function findPromo(value) {
  const code = value.trim().toUpperCase();
  return PROMO_CODES.find(function (p) { return p.code === code; });
}

// ---------- fill selects ----------
function fillEventOptions() {
  controls.event.textContent = '';
  const first = document.createElement('option');
  first.value = '';
  first.textContent = 'Choose an event';
  controls.event.appendChild(first);
  for (const ev of EVENTS) {
    const option = document.createElement('option');
    option.value = ev.id;
    option.textContent = ev.name;
    controls.event.appendChild(option);
  }
}

function fillTypeOptions() {
  const selected = controls.type.value;
  controls.type.textContent = '';
  const first = document.createElement('option');
  first.value = '';
  first.textContent = 'Choose a ticket type';
  controls.type.appendChild(first);
  for (const type of ticketTypes) {
    const option = document.createElement('option');
    option.value = type.id;
    option.textContent = type.name + ' - ' + formatMoney(type.price) + ' (' + type.seats + ' left)';
    controls.type.appendChild(option);
  }
  controls.type.value = selected;
}

// ---------- validation rules ----------
// every rule returns an error text or '' when the value is correct
const validators = {
  event: function (value) {
    return findEvent(value) ? '' : 'Choose an event from the list.';
  },

  date: function (value) {
    if (value === '') {
      return 'Choose a date.';
    }
    if (value < todayString()) {
      return 'The date is in the past. Choose today or a later day.';
    }
    if (value > maxDateString()) {
      return 'Tickets are sold only ' + MAX_DAYS_AHEAD + ' days ahead.';
    }
    if (SOLD_OUT_DATES.includes(value)) {
      return 'Tickets for this date are sold out. Choose another date.';
    }
    return '';
  },

  type: function (value) {
    return findType(value) ? '' : 'Choose a ticket type.';
  },

  quantity: function (value) {
    if (value.trim() === '') {
      return 'Enter how many tickets you need.';
    }
    const n = Number(value);
    if (!Number.isInteger(n)) {
      return 'Quantity must be a whole number.';
    }
    if (n < 1 || n > MAX_QUANTITY) {
      return 'Quantity must be from 1 to ' + MAX_QUANTITY + '.';
    }
    const type = findType(controls.type.value);
    if (type && n > type.seats) {
      return 'Only ' + type.seats + ' seat(s) left for the ' + type.name + ' ticket.';
    }
    return '';
  },

  promo: function (value) {
    if (value.trim() === '') {
      return ''; // the promo code is optional
    }
    return findPromo(value) ? '' : 'Unknown promo code. Check it or leave the field empty.';
  },

  name: function (value) {
    const text = value.trim();
    if (text === '') {
      return 'Enter your name and surname.';
    }
    // at least two words, letters only (Latin or Cyrillic), each word 2+ letters
    if (!/^[\p{L}]{2,}(?:[ '-][\p{L}]{2,})+$/u.test(text)) {
      return 'Use two or more words with letters only, e.g. "Aidos Nurlan".';
    }
    return '';
  },

  email: function (value) {
    const text = value.trim();
    if (text === '') {
      return 'Enter your email.';
    }
    if (controls.email.validity.typeMismatch || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(text)) {
      return 'Email must look like name@example.com.';
    }
    const domain = text.split('@')[1].toLowerCase();
    if (BLOCKED_EMAIL_DOMAINS.includes(domain)) {
      return 'Temporary email services (' + domain + ') are not allowed.';
    }
    return '';
  }
};

// show or clear the message under one field
function showFieldState(fieldName, errorText) {
  const control = controls[fieldName];
  const wrapper = control.closest('.field');
  const errorEl = document.getElementById(fieldName + '-error');

  errorEl.textContent = errorText;
  wrapper.classList.toggle('field--invalid', errorText !== '');
  wrapper.classList.toggle('field--valid', errorText === '' && control.value.trim() !== '');
  control.setAttribute('aria-invalid', errorText === '' ? 'false' : 'true');
}

function clearFieldState(fieldName) {
  const control = controls[fieldName];
  const wrapper = control.closest('.field');
  document.getElementById(fieldName + '-error').textContent = '';
  wrapper.classList.remove('field--invalid', 'field--valid');
  control.removeAttribute('aria-invalid');
}

function checkField(fieldName) {
  const error = validators[fieldName](controls[fieldName].value);
  showFieldState(fieldName, error);
  return error;
}

// ---------- live preview ----------
function addRow(list, label, value) {
  const row = document.createElement('div');
  row.className = 'ticket__row';
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = value;
  row.appendChild(dt);
  row.appendChild(dd);
  list.appendChild(row);
}

function calculateTotal(typeId, quantityText, promoText) {
  const type = findType(typeId);
  const qty = Number(quantityText);
  if (!type || !Number.isInteger(qty) || qty < 1) {
    return { total: 0, discount: 0 };
  }
  const promo = findPromo(promoText);
  const discount = promo ? promo.discount : 0;
  const gross = type.price * qty;
  return { total: Math.round(gross * (100 - discount) / 100), discount: discount };
}

function renderPreview() {
  const ev = findEvent(controls.event.value);
  const type = findType(controls.type.value);
  const name = controls.name.value.trim();
  const email = controls.email.value.trim();
  const qty = controls.quantity.value.trim();
  const date = controls.date.value;
  const money = calculateTotal(controls.type.value, qty, controls.promo.value);

  previewEl.textContent = '';

  const title = document.createElement('h3');
  title.className = 'ticket__title';
  title.textContent = ev ? ev.name : 'Your event';
  previewEl.appendChild(title);

  const rows = document.createElement('dl');
  rows.className = 'ticket__rows';
  addRow(rows, 'Date', date || '-');
  addRow(rows, 'Type', type ? type.name : '-');
  addRow(rows, 'Quantity', qty || '-');
  addRow(rows, 'Name', name || '-');
  addRow(rows, 'Email', email || '-');
  if (money.discount > 0) {
    addRow(rows, 'Promo', '-' + money.discount + '%');
  }
  previewEl.appendChild(rows);

  const total = document.createElement('div');
  total.className = 'ticket__total';
  total.textContent = 'Total: ' + formatMoney(money.total);
  previewEl.appendChild(total);
}

// ---------- events ----------
for (const fieldName of FIELD_NAMES) {
  const control = controls[fieldName];

  // 1) leaving a field: first check
  control.addEventListener('blur', function () {
    touched.add(fieldName);
    checkField(fieldName);
  });

  // 2) after that: check on every input
  control.addEventListener('input', function () {
    if (touched.has(fieldName)) {
      checkField(fieldName);
    }
    // quantity depends on the ticket type, so check it again when the type changes
    if (fieldName === 'type' && touched.has('quantity')) {
      checkField('quantity');
    }
    renderPreview();
  });
}

form.addEventListener('submit', function (event) {
  event.preventDefault();

  let errorCount = 0;
  let firstInvalid = null;

  for (const fieldName of FIELD_NAMES) {
    touched.add(fieldName);
    if (checkField(fieldName) !== '') {
      errorCount += 1;
      if (firstInvalid === null) {
        firstInvalid = controls[fieldName];
      }
    }
  }

  if (errorCount > 0) {
    summaryEl.textContent = 'The form has ' + errorCount + ' error' + (errorCount === 1 ? '' : 's') + '. Please fix the fields marked in red.';
    summaryEl.classList.remove('hidden');
    firstInvalid.focus();
    return;
  }

  summaryEl.classList.add('hidden');
  summaryEl.textContent = '';
  buildFinalTicket();
});

form.addEventListener('reset', function () {
  // wait until the browser clears the values, then clean the states
  setTimeout(function () {
    resetFormState();
  }, 0);
});

// ---------- final result ----------
function makeBookingCode() {
  let code = 'AK-';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length - 1)];
  }
  return code;
}

function buildFinalTicket() {
  const ev = findEvent(controls.event.value);
  const type = findType(controls.type.value);
  const qty = Number(controls.quantity.value);
  const money = calculateTotal(controls.type.value, controls.quantity.value, controls.promo.value);
  const data = {
    event: ev.name,
    date: controls.date.value,
    type: type.name,
    qty: qty,
    name: controls.name.value.trim(),
    email: controls.email.value.trim(),
    discount: money.discount,
    total: money.total
  };

  type.seats -= qty; // seats left go down after a booking

  resultEl.textContent = '';
  const ticket = document.createElement('div');
  ticket.className = 'ticket ticket--final';

  const heading = document.createElement('h3');
  heading.className = 'ticket__title';
  heading.textContent = 'Booking confirmed: ' + data.event;
  ticket.appendChild(heading);

  const rows = document.createElement('dl');
  rows.className = 'ticket__rows';
  addRow(rows, 'Date', data.date);
  addRow(rows, 'Type', data.type);
  addRow(rows, 'Quantity', String(data.qty));
  addRow(rows, 'Name', data.name);
  addRow(rows, 'Email', data.email);
  if (data.discount > 0) {
    addRow(rows, 'Promo', '-' + data.discount + '%');
  }
  ticket.appendChild(rows);

  const total = document.createElement('div');
  total.className = 'ticket__total';
  total.textContent = 'Paid: ' + formatMoney(data.total);
  ticket.appendChild(total);

  const code = document.createElement('div');
  code.className = 'ticket__code';
  code.textContent = makeBookingCode();
  ticket.appendChild(code);

  resultEl.appendChild(ticket);

  form.reset(); // the reset event handler clears all states
  fillTypeOptions();
}

function resetFormState() {
  touched.clear();
  for (const fieldName of FIELD_NAMES) {
    clearFieldState(fieldName);
  }
  summaryEl.classList.add('hidden');
  summaryEl.textContent = '';
  fillTypeOptions();
  renderPreview();
}

// ---------- start ----------
fillEventOptions();
fillTypeOptions();
controls.date.min = todayString();
controls.date.max = maxDateString();
renderPreview();
