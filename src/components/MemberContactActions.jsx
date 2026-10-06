import { useMemo, useState } from 'react';
import { dateText, statusFor } from '../utils';

export function getCleanPhoneNumber(phone = '', forWhatsApp = false) {
  const raw = String(phone || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  if (forWhatsApp) {
    if (digits.length === 12 && digits.startsWith('91')) return digits;
    if (digits.length === 10) return `91${digits}`;
    if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
    return digits;
  }

  if (raw.startsWith('+')) return `+${digits}`;
  return digits;
}

export default function MemberContactActions({ member, membership, planName, expiryDate }) {
  const memberName = member?.name?.trim() || 'Member';
  const phone = member?.phone || '';
  const currentPlan = planName || member?.plan || membership?.planName || membership?.plan || 'gym membership';
  const currentExpiry = member?.expiry || (expiryDate ? dateText(expiryDate) : (membership?.expiryDate ? dateText(membership.expiryDate) : ''));
  const currentStatus = member?.status || (membership?.expiryDate ? statusFor(membership.expiryDate) : 'active');
  const amountDue = member?.amount || membership?.amount || '';

  const templates = useMemo(() => {
    const expiryStr = currentExpiry ? ` on ${currentExpiry}` : '';
    const dueStr = amountDue ? ` of ₹${amountDue}` : '';

    return {
      expiry: currentStatus === 'expired'
        ? `Hi ${memberName}, your Roxy GYM ${currentPlan} plan has expired${expiryStr}. Please renew your membership today to continue your fitness training!`
        : `Hi ${memberName}, this is a gentle reminder that your Roxy GYM ${currentPlan} plan is expiring${expiryStr}. Renew early for uninterrupted gym access!`,
      payment: `Hi ${memberName}, greetings from Roxy GYM! You have a pending payment${dueStr} for your ${currentPlan} plan. Please clear the dues at your earliest convenience.`,
      greeting: `Hi ${memberName}, hope you are enjoying your workouts at Roxy GYM! Feel free to reach out if you need any fitness advice or have any queries.`,
      custom: `Hi ${memberName}, this is Roxy GYM.`
    };
  }, [memberName, currentPlan, currentExpiry, currentStatus, amountDue]);

  const initialKey = useMemo(() => {
    if (member?.payment === 'Pending' || membership?.method === 'Pending') return 'payment';
    if (currentStatus === 'expired' || currentStatus === 'expiring') return 'expiry';
    return 'expiry';
  }, [member?.payment, membership?.method, currentStatus]);

  const [activeTemplate, setActiveTemplate] = useState(initialKey);
  const [message, setMessage] = useState(templates[initialKey]);

  const handleSelectTemplate = key => {
    setActiveTemplate(key);
    setMessage(templates[key]);
  };

  const handleWhatsApp = () => {
    const cleanPhone = getCleanPhoneNumber(phone, true);
    if (!cleanPhone) {
      alert('Phone number is missing or invalid for this member.');
      return;
    }
    const text = message.trim();
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSMS = () => {
    const cleanPhone = getCleanPhoneNumber(phone, false);
    if (!cleanPhone) {
      alert('Phone number is missing or invalid for this member.');
      return;
    }
    const text = message.trim();
    const url = `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  return (
    <div className="contact-section">
      <div className="contact-section-head">
        <h4>Send message</h4>
      </div>

      <div className="message-template-pills" role="tablist" aria-label="Message template options">
        <button
          type="button"
          className={`template-pill ${activeTemplate === 'expiry' ? 'active' : ''}`}
          onClick={() => handleSelectTemplate('expiry')}
        >
          Expiry reminder
        </button>
        <button
          type="button"
          className={`template-pill ${activeTemplate === 'payment' ? 'active' : ''}`}
          onClick={() => handleSelectTemplate('payment')}
        >
          Payment due
        </button>
        <button
          type="button"
          className={`template-pill ${activeTemplate === 'greeting' ? 'active' : ''}`}
          onClick={() => handleSelectTemplate('greeting')}
        >
          Greeting
        </button>
        <button
          type="button"
          className={`template-pill ${activeTemplate === 'custom' ? 'active' : ''}`}
          onClick={() => handleSelectTemplate('custom')}
        >
          Custom
        </button>
      </div>

      <textarea
        className="message-preview-input"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type your message here..."
        rows={2}
      />

      <div className="mobile-contact-actions">
        <button
          type="button"
          className="secondary-btn whatsapp-action"
          onClick={handleWhatsApp}
          title="Send message via WhatsApp"
        >
          <svg className="contact-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.49-8.413Z"/>
          </svg>
          WhatsApp
        </button>
        <button
          type="button"
          className="outline-btn sms-action"
          onClick={handleSMS}
          title="Send message via SMS"
        >
          <svg className="contact-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          SMS
        </button>
      </div>
    </div>
  );
}
