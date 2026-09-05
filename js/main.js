import { ships } from './ships.js';

const $ = (id) => document.getElementById(id);
let order = [];
let current = 0;
let sessionAttempts = 0;
let sessionCorrect = 0;
let hintUsed = false;

const storageKey = 'fleetbound-progress-v1';

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
  catch { return {}; }
}

function saveProgress(progress) {
  localStorage.setItem(storageKey, JSON.stringify(progress));
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
  $('start-screen').classList.add('hidden');
  $('end-screen').classList.add('hidden');
  $('game-screen').classList.remove('hidden');
  showShip();
}

function showShip() {
  if (current >= order.length) return finishGame();
  const ship = order[current];
  hintUsed = false;
  $('hint-box').textContent = '';
  $('result').textContent = '';
  $('hint-button').disabled = false;
  $('hint-button').classList.remove('hidden');
  $('next-button').classList.add('hidden');
  $('silhouette').innerHTML = '<span>Silhouette placeholder</span><small>Add the ship image later.</small>';
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
  if (hintUsed) return;
  const ship = order[current];
  hintUsed = true;
  $('hint-box').textContent = `Hint: ${ship.hints[0]}`;
  $('hint-button').disabled = true;
}

function nextShip() {
  current++;
  showShip();
}

function finishGame() {
  $('game-screen').classList.add('hidden');
  $('end-screen').classList.remove('hidden');
  const accuracy = sessionAttempts ? Math.round(sessionCorrect / sessionAttempts * 100) : 0;
  $('final-score').textContent = `Correct: ${sessionCorrect}/${sessionAttempts} (${accuracy}%). Progress is saved in this browser.`;
}

$('start-button').addEventListener('click', startGame);
$('hint-button').addEventListener('click', showHint);
$('next-button').addEventListener('click', nextShip);
$('restart-button').addEventListener('click', startGame);
