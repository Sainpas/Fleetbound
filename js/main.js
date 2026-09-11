import { ships } from './ships.js';

const $ = (id) => document.getElementById(id);
let order = [];
let current = 0;
let sessionAttempts = 0;
let sessionCorrect = 0;
let hintIndex = 0;

const cookieKey = 'fleetbound-progress-v1';

function loadProgress() {
  const row = document.cookie.split('; ').find(x => x.startsWith(cookieKey + '='));
  if (!row) return {};
  try { return JSON.parse(decodeURIComponent(row.split('=').slice(1).join('='))) || {}; }
  catch { return {}; }
}

function saveProgress(progress) {
  const value = encodeURIComponent(JSON.stringify(progress));
  document.cookie = `${cookieKey}=${value}; max-age=31536000; path=/; SameSite=Lax`;
}

function resetProgress() {
  document.cookie = `${cookieKey}=; max-age=0; path=/; SameSite=Lax`;
  $('reset-message').textContent = 'Your saved Fleetbound results have been reset.';
}

function recordAttempt(ship, correct) {
  const progress = loadProgress();
  const p = progress[ship.id] || { attempts: 0, correct: 0 };
  p.attempts += 1;
  if (correct) p.correct += 1;
  progress[ship.id] = p;
  saveProgress(progress);
}

function updateStats() {
  $('ship-number').textContent = Math.min(current + 1, order.length);
  $('ship-total').textContent = order.length;
  $('attempts').textContent = sessionAttempts;
  $('correct').textContent = sessionCorrect;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function startGame() {
  order = shuffle(ships);
  current = 0;
  sessionAttempts = 0;
  sessionCorrect = 0;
  $('reset-message').textContent = '';
  $('start-screen').classList.add('hidden');
  $('end-screen').classList.add('hidden');
  $('game-screen').classList.remove('hidden');
  showShip();
}

function showShip() {
  if (current >= order.length) return finishGame();
  const ship = order[current];
  hintIndex = 0;
  $('hint-box').textContent = '';
  $('result').textContent = '';
  $('hint-button').disabled = false;
  $('hint-button').textContent = 'Show Hint';
  $('hint-button').classList.remove('hidden');
  $('next-button').classList.add('hidden');
  const silhouette = $('silhouette');
  silhouette.innerHTML = '';
  if (ship.silhouette) {
    const image = document.createElement('img');
    image.src = ship.silhouette;
    image.alt = 'Warship silhouette';
    image.addEventListener('error', () => {
      silhouette.innerHTML = '<span>Silhouette unavailable</span><small>Check the ship image file.</small>';
    });
    silhouette.appendChild(image);
  } else {
    silhouette.innerHTML = '<span>Silhouette placeholder</span><small>Add the ship image later.</small>';
  }
  const answers = shuffle(ships).map(s => s.id === ship.id ? ship : s).slice(0, 4);
  if (!answers.some(s => s.id === ship.id)) answers[0] = ship;
  $('answers').innerHTML = '';
  shuffle(answers).forEach(answer => {
    const button = document.createElement('button');
    button.className = 'answer';
    button.textContent = answer.name;
    button.dataset.id = answer.id;
    button.addEventListener('click', () => chooseAnswer(answer.id, ship, button));
    $('answers').appendChild(button);
  });
  updateStats();
}

function chooseAnswer(id, ship, clicked) {
  const buttons = [...document.querySelectorAll('.answer')];
  buttons.forEach(b => b.disabled = true);
  sessionAttempts++;
  const correct = id === ship.id;
  recordAttempt(ship, correct);
  if (correct) {
    sessionCorrect++;
    clicked.classList.add('correct');
    $('result').textContent = '✓ Correct!';
  } else {
    clicked.classList.add('wrong');
    const right = buttons.find(b => b.dataset.id === ship.id);
    if (right) right.classList.add('correct');
    $('result').textContent = `✗ Not quite — this was ${ship.name}.`;
  }
  $('hint-button').disabled = true;
  $('next-button').classList.remove('hidden');
  updateStats();
}

function showHint() {
  const ship = order[current];
  if (hintIndex >= ship.hints.length) return;
  hintIndex++;
  $('hint-box').textContent = `Hint ${hintIndex}/${ship.hints.length}: ${ship.hints[hintIndex - 1]}`;
  $('hint-button').textContent = hintIndex < ship.hints.length ? 'Show Next Hint' : 'No More Hints';
  $('hint-button').disabled = hintIndex >= ship.hints.length;
}

function nextShip() {
  current++;
  showShip();
}

function finishGame() {
  $('game-screen').classList.add('hidden');
  $('end-screen').classList.remove('hidden');
  const accuracy = sessionAttempts ? Math.round(sessionCorrect / sessionAttempts * 100) : 0;
  $('final-score').textContent = `Correct: ${sessionCorrect}/${sessionAttempts} (${accuracy}%). Ship progress is saved in a browser cookie.`;
}

$('start-button').addEventListener('click', startGame);
$('hint-button').addEventListener('click', showHint);
$('next-button').addEventListener('click', nextShip);
$('restart-button').addEventListener('click', startGame);
$('reset-progress-button').addEventListener('click', () => {
  if (window.confirm('Reset all saved Fleetbound results on this browser?')) resetProgress();
});
$('end-reset-progress-button').addEventListener('click', () => {
  if (window.confirm('Reset all saved Fleetbound results on this browser?')) {
    resetProgress();
    $('end-screen').classList.add('hidden');
    $('start-screen').classList.remove('hidden');
  }
});
