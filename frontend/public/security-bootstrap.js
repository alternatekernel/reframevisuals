// Guard browser/device prompt APIs on load.
(function () {
  if (typeof window === 'undefined') return;
  const isLocalDevHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!isLocalDevHost) {
    window.console.log = () => {};
    window.console.info = () => {};
    window.console.debug = () => {};
    window.console.trace = () => {};
  }

  localStorage.setItem('vercel_toolbar_disabled', '1');
  localStorage.setItem('va-disable-analytics', '1');

  const block = () => Promise.reject(new Error('Platform Security Policy: API Disabled'));
  const noop = () => {};

  if (navigator.hid) navigator.hid.requestDevice = block;
  if (navigator.usb) navigator.usb.requestDevice = block;
  if (navigator.serial) navigator.serial.requestDevice = block;
  if (navigator.bluetooth) navigator.bluetooth.requestDevice = block;

  if (window.getScreenDetails) window.getScreenDetails = block;
  if (navigator.getScreenDetails) navigator.getScreenDetails = block;
  if (navigator.windowControlsOverlay) {
    Object.defineProperty(navigator, 'windowControlsOverlay', {
      value: { visible: false, getTitlebarAreaRect: () => ({ x: 0, y: 0, width: 0, height: 0 }) },
      writable: false,
    });
  }

  if (window.showOpenFilePicker) window.showOpenFilePicker = block;
  if (window.showSaveFilePicker) window.showSaveFilePicker = block;
  if (window.showDirectoryPicker) window.showDirectoryPicker = block;

  if (navigator.mediaDevices) {
    navigator.mediaDevices.getDisplayMedia = block;
    navigator.mediaDevices.enumerateDevices = () => Promise.resolve([]);
  }

  if (navigator.presentation) navigator.presentation.defaultRequest = null;
  if (navigator.registerProtocolHandler) navigator.registerProtocolHandler = noop;

  // Route-aware canonical for SPA fallbacks
  var cleanPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
  var canonicalUrl = 'https://reframevisuals.com' + cleanPath;

  var canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', canonicalUrl);

  var ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', canonicalUrl);
})();
