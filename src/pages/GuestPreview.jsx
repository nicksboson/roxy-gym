import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { asDate, formatExpiryDays, initials, statusFor, statusLabel, today } from '../utils';
import CameraCapture from '../components/CameraCapture';
import MembershipCalendarPicker from '../components/MembershipCalendarPicker';
import MemberAvatar from '../components/MemberAvatar';
import MemberContactActions from '../components/MemberContactActions';
import { useTheme } from '../context/ThemeContext';
import OwnerSidebar from '../components/OwnerSidebar';

import { seedMembers } from '../data/mockMembers';
import SwipeTabViews from '../components/SwipeTabViews';
import GlassBottomNav from '../components/GlassBottomNav';

const PLAN_DAYS = { '1 Month': 30, '3 Months': 90, '6 Months': 180, '1 Year': 365 };
const PLAN_FEES = { '1 Month': 1500, '3 Months': 4000, '6 Months': 7500, '1 Year': 14000 };

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&h=256&q=80'
];

function calculateExpiry(startDate, plan) {
  const d = new Date(startDate || new Date());
  d.setDate(d.getDate() + (PLAN_DAYS[plan] || 30));
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const defaultStart = today();
const emptyMember = {
  name: '',
  address: '',
  phone: '',
  plan: '1 Month',
  startDate: defaultStart,
  expiry: calculateExpiry(defaultStart, '1 Month'),
  payment: 'UPI',
  amount: 1500,
  photo: '',
  status: 'active',
  payments: []
};

function MemberForm({ member, onSave, onCancel }) {
  const [form, setForm] = useState(
    member
      ? { ...member, startDate: member.startDate || defaultStart }
      : { ...emptyMember, startDate: defaultStart, expiry: calculateExpiry(defaultStart, '1 Month'), amount: 1500 }
  );
  const [photo, setPhoto] = useState(member?.photo || member?.photoURL || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (member) {
      setForm({ ...member, startDate: member.startDate || defaultStart });
      setPhoto(member.photo || member.photoURL || '');
    } else {
      setForm({ ...emptyMember, startDate: defaultStart, expiry: calculateExpiry(defaultStart, '1 Month'), amount: 1500 });
      setPhoto('');
    }
    setError('');
  }, [member]);

  const update = useCallback(event => {
    const { name, value } = event.target;
    if (name === 'plan') {
      setForm(prev => {
        const newExpiry = calculateExpiry(prev.startDate, value);
        const autoFee = PLAN_FEES[value] || 1500;
        return { ...prev, plan: value, expiry: newExpiry, amount: autoFee };
      });
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleStartDateChange = useCallback((isoDate, dateObj) => {
    setForm(prev => {
      const newExpiry = calculateExpiry(dateObj, prev.plan);
      return { ...prev, startDate: isoDate, expiry: newExpiry };
    });
  }, []);

  const handleExpiryDateChange = useCallback(formattedDate => {
    setForm(prev => ({ ...prev, expiry: formattedDate }));
  }, []);

  const handlePhotoChange = useCallback((_, url) => {
    setPhoto(url);
  }, []);

  return (
    <form
      className="form-card"
      onSubmit={event => {
        event.preventDefault();
        setError('');
        const todayStr = today();
        const initialStartDate = member?.startDate;
        if (!member && form.startDate < todayStr) {
          setError('Registration date cannot be earlier than today.');
          return;
        }
        if (member && form.startDate < todayStr && form.startDate !== initialStartDate) {
          setError('Registration date cannot be earlier than today.');
          return;
        }
        const numAmount = Number(form.amount);
        if (!form.amount || isNaN(numAmount) || numAmount <= 0) {
          setError('Payment must be recorded to register membership. Amount must be greater than ₹0.');
          return;
        }

        const resolvedPhoto = photo || member?.photo || member?.photoURL || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];

        onSave({
          ...form,
          photo: resolvedPhoto,
          amount: numAmount,
          status: 'active',
          payments: form.payments?.length
            ? form.payments
            : [{ amount: numAmount, method: form.payment || 'UPI', date: form.startDate, plan: form.plan }]
        });
      }}
    >
      <div className="form-section">
        <h3>Member photo</h3>
        <CameraCapture initialPhoto={photo || member?.photo || member?.photoURL || ''} onPhotoChange={handlePhotoChange} />
      </div>

      <div className="field">
        <label>Full name</label>
        <input name="name" required placeholder="e.g. Rahul Sharma" value={form.name} onChange={update} />
      </div>

      <div className="field">
        <label>Address</label>
        <textarea name="address" required placeholder="Member residential address" value={form.address} onChange={update} />
      </div>

      <div className="field">
        <label>Phone number</label>
        <input name="phone" required placeholder="e.g. 9876543210" value={form.phone} onChange={update} />
      </div>

      <div className="form-section">
        <h3>Membership & Date</h3>
        <div className="field">
          <label>Plan</label>
          <select name="plan" value={form.plan} onChange={update}>
            <option value="1 Month">1 Month (30 days)</option>
            <option value="3 Months">3 Months (90 days)</option>
            <option value="6 Months">6 Months (180 days)</option>
            <option value="1 Year">1 Year (365 days)</option>
          </select>
          <div className="plan-selected-badge">
            {form.plan} · {PLAN_DAYS[form.plan] || 30} days duration
          </div>
        </div>

        <MembershipCalendarPicker
          startDate={form.startDate}
          onChangeStartDate={handleStartDateChange}
          plan={form.plan}
          expiryDate={form.expiry}
          onChangeExpiryDate={handleExpiryDateChange}
          minDate={member ? (member.startDate ? asDate(member.startDate) : null) : new Date()}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label>Amount paid (₹) *</label>
          <input name="amount" type="number" min="1" required placeholder="e.g. 1500" value={form.amount} onChange={update} />
        </div>
        <div className="field">
          <label>Payment method</label>
          <select name="payment" value={form.payment} onChange={update}>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {error && <div className="error-text" style={{ margin: '8px 0 14px' }}>{error}</div>}

      <div className="edit-form-actions">
        <button type="submit" className="primary-btn">
          {member ? 'Save changes' : 'Register member'}
        </button>
        {onCancel && (
          <button type="button" className="outline-btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function RenewalModal({ member, onSave, onClose }) {
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [clearPreviousPending, setClearPreviousPending] = useState(true);

  const pendingAmount = useMemo(() => {
    return (member?.payments || [])
      .filter(p => p.method === 'Pending')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [member]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const base = new Date(member.expiry);
  const next = new Date(base);
  next.setMonth(next.getMonth() + Number(months));
  const expiry = Number.isNaN(next.getTime()) ? member.expiry : next.toLocaleDateString(undefined, { dateStyle: 'medium' });
  const ready = amount.trim() !== '';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-card renewal-sheet" onClick={event => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Increase subscription</h2>
        <p className="notice">Current expiry: {member.expiry}</p>
        {pendingAmount > 0 && (
          <div className="pending-balance-banner">
            <div className="pending-balance-title">
              <span>⚠️ Previous unpaid balance:</span>
              <strong>₹{pendingAmount}</strong>
            </div>
            <label className="pending-balance-checkbox">
              <input
                type="checkbox"
                checked={clearPreviousPending}
                onChange={e => setClearPreviousPending(e.target.checked)}
              />
              <span>Clear previous pending dues (₹{pendingAmount}) with this renewal</span>
            </label>
          </div>
        )}
        <div className="field">
          <label>Additional months</label>
          <input type="number" min="1" value={months} onChange={event => setMonths(event.target.value)} />
        </div>
        <div className="field">
          <label>New expiry date</label>
          <input readOnly value={expiry} />
        </div>
        <div className="field">
          <label>Payment amount (₹)</label>
          <input type="number" min="0" value={amount} onChange={event => setAmount(event.target.value)} />
        </div>
        <div className="field">
          <label>Payment method</label>
          <select value={method} onChange={event => setMethod(event.target.value)}>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        <button
          className="primary-btn"
          disabled={!ready}
          onClick={() => ready && onSave(expiry, amount, method, months, clearPreviousPending)}
        >
          Save renewal and payment
        </button>
      </section>
    </div>
  );
}

function MemberDetails({ member, onClose, onEdit, onRenew, onDelete, onMarkPaid }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = event => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', close);
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-card member-detail-sheet" onClick={event => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="profile-summary">
          <MemberAvatar src={member.photo || member.photoURL} name={member.name} className="profile-photo" size={56} />
          <div>
            <h2>{member.name}</h2>
            <span className={`status-badge ${statusFor(member.expiry)}`}><i />{statusLabel(member.expiry)}</span>
          </div>
        </div>

        <div className="detail-grid">
          {[['Address', member.address], ['Phone', member.phone], ['Plan', member.plan], ['Expiry', member.expiry], ['Payment', typeof member.payment === 'string' ? member.payment : 'Paid'], ['Amount', `₹${member.amount}`]].map(([label, value]) => (
            <div className="detail" key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <MemberContactActions member={member} />

        <div className="member-detail-actions">
          <button
            type="button"
            className="outline-btn edit-member-btn"
            onClick={onEdit}
            title="Edit member personal details, plan, and photo"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit member
          </button>
          <button
            type="button"
            className="secondary-btn renew-member-btn"
            onClick={onRenew}
            title="Renew or extend membership"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Renew membership
          </button>
          <button
            type="button"
            className="outline-btn danger-btn delete-member-btn"
            onClick={onDelete}
            title="Delete member"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete member
          </button>
        </div>

        <h3 className="history-heading">Payment history</h3>
        {(member.payments || []).map(payment => (
          <div className="history-row" key={payment.id || `${payment.date}-${payment.amount}-${payment.plan || ''}`}>
            <span>{payment.date} · {payment.plan}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong className={payment.method === 'Pending' ? 'pending-text' : 'paid-text'}>
                ₹{payment.amount} · {payment.method}
              </strong>
              {payment.method === 'Pending' && onMarkPaid && (
                <button
                  type="button"
                  className="mark-paid-btn"
                  onClick={() => onMarkPaid(member.name, payment)}
                  title="Mark this pending payment as paid"
                >
                  ✓ Mark Paid
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function MembersPage({ members, onSelect }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m => (m.name && m.name.toLowerCase().includes(q)) || (m.phone && m.phone.includes(q)));
  }, [members, search]);

  const hasPending = useCallback(m => (m.payments || []).some(p => p.method === 'Pending') || m.payment === 'Pending', []);

  const activeCount = useMemo(() => members.filter(m => (m.expiry ? statusFor(m.expiry) : m.status) === 'active').length, [members]);
  const pendingCount = useMemo(() => members.filter(hasPending).length, [members, hasPending]);
  const expiringCount = useMemo(() => members.filter(m => (m.expiry ? statusFor(m.expiry) : m.status) === 'expiring').length, [members]);
  const expiredCount = useMemo(() => members.filter(m => (m.expiry ? statusFor(m.expiry) : m.status) === 'expired').length, [members]);

  const visible = useMemo(() => {
    return searched.filter(member => {
      if (filter === 'all') return true;
      if (filter === 'pending') return hasPending(member);
      const st = member.expiry ? statusFor(member.expiry) : member.status;
      return st === filter;
    });
  }, [searched, filter, hasPending]);

  return (
    <main>
      <div className="eyebrow">Today at Roxy</div>
      <h1 className="page-title">Member overview</h1>
      <div className="toolbar" style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '14px 0' }}>
        <input
          type="search"
          placeholder="Search 100 members by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '180px', height: '40px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: '10px' }}
        />

      </div>
      <section className="stats stats-5">
        <button
          type="button"
          className={`stat stat-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
        >
          <div className="stat-value">{members.length}</div>
          <div className="stat-label">All</div>
        </button>
        <button
          type="button"
          className={`stat stat-btn green ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter(current => (current === 'active' ? 'all' : 'active'))}
          aria-pressed={filter === 'active'}
        >
          <div className="stat-value">{activeCount}</div>
          <div className="stat-label">Active</div>
        </button>
        <button
          type="button"
          className={`stat stat-btn pending ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter(current => (current === 'pending' ? 'all' : 'pending'))}
          aria-pressed={filter === 'pending'}
        >
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">Pending</div>
        </button>
        <button
          type="button"
          className={`stat stat-btn orange ${filter === 'expiring' ? 'active' : ''}`}
          onClick={() => setFilter(current => (current === 'expiring' ? 'all' : 'expiring'))}
          aria-pressed={filter === 'expiring'}
        >
          <div className="stat-value">{expiringCount}</div>
          <div className="stat-label">Expiring</div>
        </button>
        <button
          type="button"
          className={`stat stat-btn red ${filter === 'expired' ? 'active' : ''}`}
          onClick={() => setFilter(current => (current === 'expired' ? 'all' : 'expired'))}
          aria-pressed={filter === 'expired'}
        >
          <div className="stat-value">{expiredCount}</div>
          <div className="stat-label">Expired</div>
        </button>
      </section>
      <div className="member-grid">
        {visible.map(member => {
          const st = member.expiry ? statusFor(member.expiry) : (member.status || 'active');
          const stLabel = member.expiry ? statusLabel(member.expiry) : (st === 'expired' ? 'Expired' : st === 'expiring' ? 'Expiring' : 'Active');
          const pendingItem = (member.payments || []).find(p => p.method === 'Pending') || (member.payment === 'Pending' ? { amount: member.amount } : null);
          return (
            <article
              className="member-card member-card-grid member-card-clickable"
              key={member.phone}
              onClick={() => onSelect(member)}
            >
              <div className="member-card-head">
                <MemberAvatar src={member.photo || member.photoURL} name={member.name} className="member-photo" />
                <div className="member-copy">
                  <h2>{member.name}</h2>
                  <p>{member.plan}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className={`status-badge ${st}`}><i />{stLabel}</span>
                  {pendingItem && (
                    <span className="pending-badge-tag" title="Pending payment">
                      ₹{pendingItem.amount} Pending
                    </span>
                  )}
                </div>
              </div>
              <div className="member-card-details">
                <div>
                  <small>Expiry</small>
                  <strong>{member.expiry}</strong>
                </div>
                <div>
                  <small>Phone</small>
                  <strong>{member.phone}</strong>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!visible.length && <div className="empty">No members found in this category.</div>}
    </main>
  );
}

function PerformancePage({ members, onMarkPaid }) {
  const [filter, setFilter] = useState('all');
  const payments = useMemo(() => members.flatMap(member => (member.payments || []).map(payment => ({ ...payment, member: member.name, expired: member.status === 'expired' }))), [members]);
  const collected = useMemo(() => payments.filter(payment => payment.method !== 'Pending').reduce((sum, payment) => sum + Number(payment.amount || 0), 0), [payments]);
  const pending = useMemo(() => payments.filter(payment => payment.method === 'Pending').reduce((sum, payment) => sum + Number(payment.amount || 0), 0), [payments]);
  const expiredPending = useMemo(() => payments.filter(payment => payment.method === 'Pending' && payment.expired).reduce((sum, payment) => sum + Number(payment.amount || 0), 0), [payments]);

  const toggleFilter = useCallback(type => setFilter(current => (current === type ? 'all' : type)), []);

  const filteredPayments = useMemo(() => payments.filter(p => {
    if (filter === 'collected') return p.method !== 'Pending';
    if (filter === 'pending') return p.method === 'Pending';
    if (filter === 'expired_pending') return p.method === 'Pending' && p.expired;
    return true;
  }), [payments, filter]);

  return (
    <main>
      <div className="eyebrow">Roxy GYM</div>
      <h1 className="page-title">Overview</h1>
      <div className="metric-grid performance-metrics">
        <div className="metric-card">
          <small>Active members</small>
          <strong>{members.filter(member => member.status === 'active').length}</strong>
        </div>
        <div
          className={`metric-card revenue-metric metric-card-clickable ${filter === 'collected' ? 'active-filter' : ''}`}
          onClick={() => toggleFilter('collected')}
          role="button"
          tabIndex={0}
        >
          <small>Total collected revenue</small>
          <strong>₹{collected}</strong>
        </div>
        <div
          className={`metric-card pending-metric metric-card-clickable ${filter === 'pending' ? 'active-filter' : ''}`}
          onClick={() => toggleFilter('pending')}
          role="button"
          tabIndex={0}
        >
          <small>All pending payments</small>
          <strong>₹{pending}</strong>
        </div>
        <div
          className={`metric-card pending-metric metric-card-clickable ${filter === 'expired_pending' ? 'active-filter' : ''}`}
          onClick={() => toggleFilter('expired_pending')}
          role="button"
          tabIndex={0}
        >
          <small>Expired users pending</small>
          <strong>₹{expiredPending}</strong>
        </div>
      </div>
      <section className="form-card performance-section">
        <div className="ledger-header">
          <h2>
            Payment ledger
            {filter !== 'all' && (
              <span className="ledger-filter-tag">
                {' · '}{filter === 'pending' ? 'Pending only' : filter === 'collected' ? 'Collected only' : 'Expired pending only'} ({filteredPayments.length})
              </span>
            )}
          </h2>
          {filter !== 'all' && (
            <button className="text-btn" onClick={() => setFilter('all')}>Show all</button>
          )}
        </div>
        {filteredPayments.length === 0 ? (
          <div className="empty">No payments match this filter.</div>
        ) : (
          filteredPayments.map(payment => (
            <div className="history-row" key={payment.id || `${payment.member}-${payment.date}-${payment.amount}`}>
              <span><strong>{payment.member}</strong><br />{payment.plan} · {payment.date}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong className={payment.method === 'Pending' ? 'pending-text' : 'paid-text'}>
                  ₹{payment.amount} · {payment.method}
                </strong>
                {payment.method === 'Pending' && onMarkPaid && (
                  <button
                    type="button"
                    className="mark-paid-btn"
                    onClick={() => onMarkPaid(payment.member, payment)}
                    title="Mark this pending payment as paid"
                  >
                    ✓ Mark Paid
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

export default function GuestPreview({ onSignInClick }) {
  const navigate = useNavigate();
  const { toggleSidebar } = useTheme();
  const [page, setPage] = useState('members');
  const [members, setMembers] = useState(seedMembers);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [renewing, setRenewing] = useState(null);

  // Load seed members on initial mount if not initialized
  useEffect(() => {
    if (!members || members.length === 0) {
      setMembers(seedMembers);
    }
  }, []);

  const saveMember = updatedMember => {
    setMembers(current => {
      if (editing) {
        return current.map(item => (item.phone === editing.phone || item === editing ? updatedMember : item));
      }
      return [updatedMember, ...current];
    });
    if (editing) {
      setSelected(updatedMember);
    } else {
      setPage('members');
      setSelected(updatedMember);
    }
    setEditing(null);
  };

  const deleteMember = () => {
    if (selected && window.confirm(`Delete ${selected.name}?`)) {
      setMembers(current => current.filter(item => item !== selected));
      setSelected(null);
    }
  };

  const saveRenewal = (expiry, amount, method, months, clearPending = true) => {
    const newPayment = {
      amount: Number(amount),
      method,
      date: new Date().toISOString().slice(0, 10),
      plan: `${months} additional months`
    };
    setMembers(current =>
      current.map(item => {
        if (item !== renewing) return item;
        let existingPayments = item.payments || [];
        if (clearPending) {
          existingPayments = existingPayments.map(p =>
            p.method === 'Pending' ? { ...p, method, date: new Date().toISOString().slice(0, 10) } : p
          );
        }
        return {
          ...item,
          expiry,
          amount: Number(amount),
          payment: method,
          status: 'active',
          payments: [...existingPayments, newPayment]
        };
      })
    );
    setRenewing(null);
    setSelected(null);
  };

  const handleMarkPaymentPaid = (memberName, targetPayment) => {
    setMembers(current =>
      current.map(m => {
        if (m.name !== memberName) return m;
        const updatedPayments = (m.payments || []).map(p => {
          if (p === targetPayment || (p.amount === targetPayment.amount && p.date === targetPayment.date && p.method === 'Pending')) {
            return { ...p, method: 'Cash', date: new Date().toISOString().slice(0, 10) };
          }
          return p;
        });
        const updated = {
          ...m,
          payment: 'Cash',
          payments: updatedPayments
        };
        if (selected && selected.name === memberName) {
          setSelected(updated);
        }
        return updated;
      })
    );
  };

  const tabNames = ['members', 'performance', 'register'];
  const activeTab = tabNames.indexOf(page) >= 0 ? tabNames.indexOf(page) : 0;

  const handleTabChange = index => {
    setPage(tabNames[index]);
  };

  const handleTabClick = (index, targetPage) => {
    if (targetPage === 'register') {
      setEditing(null);
    }
    setPage(targetPage);
  };

  const guestTabs = useMemo(() => [
    {
      id: 'members',
      label: 'Members',
      title: 'Members',
      icon: (
        <svg className="tab-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    {
      id: 'performance',
      label: 'Overview',
      title: 'Overview',
      icon: (
        <svg className="tab-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12M2 12h4M18 12h4" />
        </svg>
      )
    },
    {
      id: 'register',
      label: 'Register',
      title: 'Register',
      icon: (
        <svg className="tab-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      )
    }
  ], []);

  return (
    <div className="roxy-app">
      <div className="app-shell swipe-layout">
        <header className="topbar">
          <div>
            <div className="brand">Roxy <span>GYM</span></div>
            <div className="brand-sub">Owner Preview Mode</div>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="owner-profile-btn"
              onClick={toggleSidebar}
              title="Gym Owner Profile & Themes"
              aria-label="Open owner menu"
            >
              <div className="owner-profile-avatar">
                <span>GO</span>
              </div>
              <span className="owner-profile-name">Gym Owner</span>
              <svg className="owner-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </header>

        <div className="page-transition-wrap swipe-views-wrapper">
          <SwipeTabViews activeIndex={activeTab} onChangeTab={handleTabChange}>
            <MembersPage members={members} onSelect={setSelected} />
            <PerformancePage members={members} onMarkPaid={handleMarkPaymentPaid} />
            <main>
              <div className="eyebrow">New member</div>
              <h1 className="page-title">Register member</h1>
              <MemberForm onSave={saveMember} />
            </main>
          </SwipeTabViews>
        </div>

        <GlassBottomNav
          tabs={guestTabs}
          activeTab={activeTab}
          onTabSelect={(index, tab) => handleTabClick(index, tab.id)}
          className="guest-nav"
        />

        {selected && !renewing && !editing && (
          <MemberDetails
            member={selected}
            onClose={() => setSelected(null)}
            onEdit={() => setEditing(selected)}
            onRenew={() => setRenewing(selected)}
            onDelete={deleteMember}
            onMarkPaid={handleMarkPaymentPaid}
          />
        )}

        {editing && (
          <div className="modal-backdrop" onClick={() => { setEditing(null); setSelected(editing); }}>
            <section className="modal-card edit-member-sheet" onClick={event => event.stopPropagation()}>
              <button className="modal-close" onClick={() => { setEditing(null); setSelected(editing); }}>×</button>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Update member</div>
              <h2 style={{ margin: '0 0 16px' }}>Edit {editing.name}</h2>
              <MemberForm
                member={editing}
                onSave={saveMember}
                onCancel={() => { setEditing(null); setSelected(editing); }}
              />
            </section>
          </div>
        )}

        {renewing && (
          <RenewalModal
            member={renewing}
            onSave={saveRenewal}
            onClose={() => setRenewing(null)}
          />
        )}

        <OwnerSidebar
          isGuest={true}
        />
      </div>
    </div>
  );
}
