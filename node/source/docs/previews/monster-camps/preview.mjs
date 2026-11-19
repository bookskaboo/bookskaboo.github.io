import { rates, ap, maximum, material, fullySuppressed, createState, check, advance, extract, cornerRewards, upgradeMultiplier } from './model.mjs';

const $ = id => document.getElementById(id);
const names = { iron: 'Iron', copper: 'Copper', stone: 'Stone Deposit', mythril: 'Mythril' };
const sizes = ['Camp', 'Village', 'Kingdom'];
let state = createState();
const family = () => $('family').value;
const rank = () => Number($('rank').value);
const tier = () => Number($('tier').value);
const item = () => material(family(), $('material').value);
const upgrades = {
  base: {},
  stage2: { mineralRegeneration2: true },
  repeat1: { mineralRegeneration2: true, mineralRanks: 1 },
  endgame1: { mineralRegeneration2: true, mineralRanks: 1, endgameRanks: 1 },
};
const multiplier = () => upgradeMultiplier(upgrades[$('upgrades').value]);
const fmt = value => value.toLocaleString('en-US');
function event(message) { $('event').textContent = message; }
function render() {
  const open = fullySuppressed(state);
  const name = `${family() === 'dwarven' ? 'Dwarven' : 'Goblin'} ${sizes[rank()]}`;
  $('camp-name').textContent = name;
  $('camp-node').classList.toggle('dwarven', family() === 'dwarven');
  $('camp-state').textContent = `${state.strength}% size · ${open ? 'Fully suppressed' : state.lastPassed ? 'Shrinking' : state.strength === 25 ? 'Active' : 'Access locked'}`;
  $('camp-size').style.width = `${state.strength}%`;
  $('ap').textContent = `${ap[family()][rank()]} AP / 60-second check`;
  $('map-tier').textContent = `Tier ${tier()}`;
  $('resource-name').textContent = names[item()];
  $('inspector-title').textContent = names[item()];
  $('resource-icon').src = `../../item-art/${item()}.svg`;
  $('resource-access').textContent = open ? 'Accessible' : 'Locked · camp guards this deposit';
  $('resource-access').dataset.locked = String(!open);
  const reserveText = `${fmt(state.reserve)} / ${fmt(maximum(tier()))}`;
  $('reserve').textContent = reserveText;
  $('inspector-reserve').textContent = reserveText;
  $('reserve-fill').style.width = `${state.reserve / maximum(tier()) * 100}%`;
  $('access-reason').textContent = open ? 'Fully suppressed. Connect an Extractor to collect this resource.' : state.lastPassed ? 'One more successful check is needed to reach the 10% minimum.' : 'Fully suppress this camp to access the deposit.';
  const effectiveRate = rates[family()][rank()] * multiplier();
  $('regen-rate').textContent = `${fmt(effectiveRate)} ${effectiveRate === 1 ? 'item' : 'items'} / 5 seconds`;
  $('regen-multiplier').textContent = `×${fmt(multiplier())}`;
  $('regen-status').textContent = !open ? 'Paused · camp active' : state.reserve >= maximum(tier()) ? 'Paused · reserve full' : 'Regenerating';
  $('connect').disabled = !open || state.connected;
  $('connect').textContent = state.connected ? 'Extractor connected' : 'Connect Extractor';
  $('extract').disabled = !open || !state.connected || state.reserve === 0;
  $('connection').classList.toggle('connected', state.connected);
  $('connection-state').textContent = !state.connected ? 'No Extractor connected' : open ? 'Extraction route available' : 'Connection preserved · access paused';
  $('extractor-state').textContent = !open ? 'Waiting for suppression' : !state.connected ? 'Ready to connect' : state.reserve === 0 ? 'Waiting for regeneration' : 'Ready to extract';
  $('collected').textContent = `Collected ${fmt(state.collected)}`;
  $('elapsed').textContent = `Simulated regeneration time: ${state.elapsed} seconds`;
  $('material-label').hidden = family() === 'dwarven';
}
function configureTiers() {
  const ranges = family() === 'goblin' ? [[1, 2, 3], [4, 5, 6], [7, 8, 9]] : [[4, 5], [6, 7], [8, 9]];
  $('tier').replaceChildren(...ranges[rank()].map(t => new Option(String(t), String(t))));
}
function reset() { state = createState(tier()); event('Fresh camp. The resource is already visible.'); render(); }
for (const id of ['family', 'rank']) $(id).addEventListener('change', () => { configureTiers(); reset(); });
for (const id of ['tier', 'material']) $(id).addEventListener('change', reset);
$('upgrades').addEventListener('change', () => { event('Upgrade example changed. Reserve and suppression are preserved.'); render(); });
$('pass').addEventListener('click', () => { check(state, true); event(fullySuppressed(state) ? 'Check passed. The existing deposit is now accessible.' : 'Check passed. Camp shrinks to 15%; the deposit remains locked.'); render(); });
$('fail').addEventListener('click', () => { check(state, false); event('Check failed. Access and regeneration pause; reserve and wiring are preserved.'); render(); });
$('advance').addEventListener('click', () => { const regenerated = advance(state, family(), rank(), tier(), multiplier()); event(`Five seconds elapsed. ${regenerated} ${regenerated === 1 ? 'item' : 'items'} regenerated${fullySuppressed(state) ? '.' : ' while access was locked.'}`); render(); });
$('deplete').addEventListener('click', () => { state.reserve = 0; state.regenFraction = 0; event('Review preset: empty deposit. Regeneration still needs full suppression.'); render(); });
$('reset').addEventListener('click', reset);
$('connect').addEventListener('click', () => { if (!fullySuppressed(state)) return; state.connected = true; event('Extractor connected. Collection is now available.'); render(); });
$('extract').addEventListener('click', () => { const moved = extract(state); event(moved ? `Collected 1 ${names[item()]}.` : 'Extraction is unavailable.'); render(); });
$('resource').addEventListener('click', () => { $('resource-detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); event('Deposit inspected. Locked deposits can still be inspected.'); });
function renderCorners() {
  const complete = $('corner-complete').checked;
  $('corner-grid').replaceChildren(...cornerRewards.map(reward => {
    const card = document.createElement('article'); card.className = 'corner-card';
    const title = document.createElement('h3'); title.textContent = reward.item;
    const image = document.createElement('img'); image.src = `../../item-art/${reward.icon}.svg`; image.alt = ''; image.width = 52; image.height = 52;
    const caption = document.createElement('p'); caption.textContent = reward.name;
    const stock = document.createElement('div'); stock.className = 'corner-stock'; stock.textContent = complete ? '1 / 10 stored' : '0 / 10 · Awaiting completion';
    card.append(title, image, caption, stock); return card;
  }));
}
$('corner-complete').addEventListener('change', renderCorners);
for (const mode of ['test', 'proposal']) $(`${mode}-tab`).addEventListener('click', () => {
  for (const other of ['test', 'proposal']) { $(`${other}-tab`).setAttribute('aria-pressed', String(mode === other)); $(`${other}-view`).hidden = mode !== other; }
});
configureTiers(); reset(); renderCorners();
