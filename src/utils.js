
// Triggers an instant data refetch across the app after any CRUD operation
export const triggerRefetch = () => window.dispatchEvent(new CustomEvent('roxy:refetch'));

export const plans = { '1 Month': 30, '3 Months': 90, '6 Months': 180, '1 Year': 365 };
export const today = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Formats a Date object as YYYY-MM-DD strictly in local time (avoids toISOString UTC shift bugs)
export const formatDateLocal = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
export const asDate = value => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
};
export const dateText = value => value ? asDate(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not set';
export const dateInput = value => {
  if (!value) return today();
  const d = asDate(value);
  if (isNaN(d.getTime())) return today();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
export const isDateBeforeToday = value => {
  if (!value) return false;
  const d = asDate(value);
  if (isNaN(d.getTime())) return false;
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return target < todayStart;
};
export const getExpiryDays = expiryDate => {
  if (!expiryDate) return null;
  const target = asDate(expiryDate);
  if (Number.isNaN(target.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();

  return Math.round((startOfTarget - startOfToday) / 86400000);
};

export const formatExpiryDays = expiryDate => {
  const days = getExpiryDays(expiryDate);
  if (days === null) return '';

  if (days < 0) {
    const overdue = Math.abs(days);
    return overdue === 1 ? 'Expired yesterday' : `Expired ${overdue} days ago`;
  }
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
};

export const statusFor = input => {
  if (!input) return 'expired';
  // Support passing full member object or just expiry date
  if (typeof input === 'object' && !(input instanceof Date) && !input.toDate) {
    if (input.paymentStatus === 'pending' || input.payment === 'Pending') {
      return 'pending';
    }
    const expiry = input.expiryDate || input.expiry;
    const days = getExpiryDays(expiry);
    if (days === null) return 'expired';
    return days < 0 ? 'expired' : days <= 5 ? 'expiring' : 'active';
  }
  const days = getExpiryDays(input);
  if (days === null) return 'expired';
  return days < 0 ? 'expired' : days <= 5 ? 'expiring' : 'active';
};

export const statusLabel = input => {
  const status = statusFor(input);
  if (status === 'pending') return 'Payment Pending';
  if (status === 'expired') return 'Expired';
  if (status === 'expiring') {
    const expiry = (input && typeof input === 'object' && !(input instanceof Date) && !input.toDate)
      ? (input.expiryDate || input.expiry)
      : input;
    const days = getExpiryDays(expiry);
    if (days === 0) return 'Expires today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  }
  return 'Active';
};
export const toTimestamp = value => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
};
export const initials = name => String(name || '?').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
export const friendlyError = error => {
  if (!error) return 'Something went wrong.';
  if (typeof error === 'string') return error;
  const msg = error.message || error.error_description || 'Something went wrong.';
  return msg.replace(/^Firebase: /i, '').replace(/^AuthApiError: /i, '');
};
export const planDuration = plan => Number(plan?.durationDays ?? plan?.duration ?? 0);

export function compressImage(fileOrBlobOrUrl, maxDim = 500, quality = 0.8) {
  return new Promise(resolve => {
    if (!fileOrBlobOrUrl) return resolve({ blob: null, dataUrl: '' });
    const img = new Image();
    const isBlob = fileOrBlobOrUrl instanceof Blob;
    const url = isBlob ? URL.createObjectURL(fileOrBlobOrUrl) : fileOrBlobOrUrl;

    img.onload = () => {
      if (isBlob) URL.revokeObjectURL(url);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (!blob) {
            resolve({ blob: fileOrBlobOrUrl, dataUrl: typeof fileOrBlobOrUrl === 'string' ? fileOrBlobOrUrl : '' });
            return;
          }
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({ blob, dataUrl });
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      if (isBlob) URL.revokeObjectURL(url);
      resolve({ blob: fileOrBlobOrUrl, dataUrl: typeof fileOrBlobOrUrl === 'string' ? fileOrBlobOrUrl : '' });
    };

    img.src = url;
  });
}
