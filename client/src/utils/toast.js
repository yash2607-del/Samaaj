let _cachedToast = undefined;

async function _ensureToast() {
  if (typeof _cachedToast !== 'undefined') return _cachedToast;
  try {
    const mod = await import('react-toastify');
    _cachedToast = mod.toast;
    return _cachedToast;
  } catch (err) {
    _cachedToast = null; // explicitly mark as unavailable
    return null;
  }
}

export const toastSuccess = (message) => {
  _ensureToast().then(t => {
    if (t) t.success(message || 'Success');
    else window.alert(message || 'Success');
  });
};

export const toastError = (message) => {
  _ensureToast().then(t => {
    if (t) t.error(message || 'Something went wrong');
    else window.alert(message || 'Something went wrong');
  });
};

export const toastInfo = (message) => {
  _ensureToast().then(t => {
    if (t) t.info(message || 'Info');
    else window.alert(message || 'Info');
  });
};

export default {
  success: toastSuccess,
  error: toastError,
  info: toastInfo
};
