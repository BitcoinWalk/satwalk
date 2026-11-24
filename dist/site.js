const nav = document.querySelector('.nav');
const menu = document.querySelector('#site-menu');
const trigger = nav.querySelector('.menuButton');
const mobile = matchMedia('(max-width: 1100px)');
function updateHeader() {
  const compact = String(window.scrollY >= (mobile.matches ? 68 : 74));
  nav.dataset.compact = compact;
  nav.querySelector('.brand').dataset.compact = compact;
}
updateHeader();
window.addEventListener('scroll', updateHeader, {passive:true});
mobile.onchange = () => { menu.close(); updateHeader(); };
trigger.onclick = () => {
  menu.showModal();
  document.body.style.overflow = 'hidden';
  trigger.setAttribute('aria-expanded','true');
};
menu.onclick = event => { if (event.target.closest('a, .menuClose')) menu.close(); };
menu.onclose = () => {
  document.body.style.overflow = '';
  trigger.setAttribute('aria-expanded','false');
  if (mobile.matches) trigger.focus({preventScroll:true});
};
const preference = matchMedia('(prefers-color-scheme: dark)');
const toggle = nav.querySelector('#theme');
let selectedTheme;
try { selectedTheme = localStorage.getItem('satwalk-theme'); } catch {}
function applyTheme() {
  const dark = selectedTheme ? selectedTheme === 'dark' : preference.matches;
  document.documentElement.dataset.bwTheme = dark ? 'dark' : 'light';
  for (const logo of document.querySelectorAll('.wordmark')) {
    logo.src = 'brand/satwalk-horizontal-' + (dark ? 'white' : 'ink') + '.svg';
  }
  nav.querySelector('.icon').src = 'brand/satwalk-mark-' + (dark ? 'white' : 'ink') + '.png';
  toggle.title = 'Switch to ' + (dark ? 'light' : 'dark') + ' theme';
  toggle.setAttribute('aria-label',toggle.title);
}
toggle.onclick = () => {
  selectedTheme = document.documentElement.dataset.bwTheme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('satwalk-theme',selectedTheme); } catch {}
  applyTheme();
};
preference.onchange = applyTheme;
applyTheme();
const playback = document.querySelector('.heroPlayback');
const photos = document.querySelector('.heroVisual');
playback.onclick = () => {
  const pause = photos.dataset.paused !== 'true';
  photos.dataset.paused = String(pause);
  playback.textContent = pause ? '▶' : 'Ⅱ';
  playback.setAttribute('aria-label', pause ? 'Resume photo rotation' : 'Pause photo rotation');
};
const form = document.querySelector('#invite');
const message = document.querySelector('#message');
const status = document.querySelector('#status');
form.onsubmit = event => {
  event.preventDefault();
  const place = form.elements.place.value.trim();
  if (!place) {form.elements.place.value=''; form.reportValidity(); return;}
  message.value = `Join me for a SatWalk this Saturday at ${form.elements.time.value}. Meet me at ${place} for a walk and a chat about freedom. Bring a neighbour!\n\nhttps://satwalk.org/`;
  document.querySelector('#result').hidden = false;
  status.textContent = '';
  message.focus();
};
document.querySelector('#copy').onclick = async () => {
  try {await navigator.clipboard.writeText(message.value); status.textContent = ' Invitation copied.';}
  catch {message.focus(); message.select(); status.textContent = ' Invitation selected. Copy it to share.';}
};
