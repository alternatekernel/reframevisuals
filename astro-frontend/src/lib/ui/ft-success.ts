// Full-page "Trial submitted" swap used by the free-trial / start / pilot-batch pages.
// A form script dispatches `ft:success`; the success panel replaces the page content (like the React views did).
const show = () => {
  const authed = Boolean(localStorage.getItem('portal_token'));
  document.querySelectorAll<HTMLElement>('[data-ft-authed]').forEach((e) => e.classList.toggle('hidden', !authed));
  document.querySelectorAll<HTMLElement>('[data-ft-guest]').forEach((e) => e.classList.toggle('hidden', authed));
  document.querySelector('[data-ft-page]')?.classList.add('hidden');
  document.querySelector('[data-ft-success]')?.classList.remove('hidden');
  window.scrollTo(0, 0);
};
document.addEventListener('ft:success', show);
