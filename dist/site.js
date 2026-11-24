const nav = document.querySelector('nav');
const setNav = () => { nav.dataset.top = window.scrollY < 72; };
setNav();
window.addEventListener('scroll', setNav, {passive:true});
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
