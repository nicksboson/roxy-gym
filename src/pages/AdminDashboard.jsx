import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { asDate, dateText, statusFor, statusLabel, today, toTimestamp } from '../utils';
import MemberCard from '../components/MemberCard';
import MemberAvatar from '../components/MemberAvatar';
import MemberContactActions from '../components/MemberContactActions';
import MemberForm from '../components/MemberForm';

function Details({ member, memberships, payments, plans, onClose, onEdit, onRenew, onDelete, onMarkPaid }) {
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

  const planName = member.planName || member.plan || 'Not set';
  const expiry = member.expiryDate || member.expiry;
  const memberStatus = statusFor(member);
  const ownPayments = member.payments || (member.amount ? [{
    id: 'pay-1',
    planName: planName,
    amount: member.amount,
    method: member.payment || (member.paymentStatus === 'pending' ? 'Pending' : 'Paid'),
    date: member.startDate || today()
  }] : payments?.filter(item => item.userId === member.uid || item.userId === member.id) || []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-card member-detail-sheet" onClick={event => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="profile-summary">
          <MemberAvatar src={member.photoURL || member.photo} name={member.name} className="profile-photo" size={56} />
          <div>
            <h2>{member.name}</h2>
            <span className={`status-badge ${memberStatus}`}>
              <i />{expiry ? statusLabel(member) : 'No plan'}
            </span>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail">
            <small>Address</small>
            <strong>{member.address || 'Not specified'}</strong>
          </div>
          <div className="detail">
            <small>Phone</small>
            <strong>{member.phone || 'Not specified'}</strong>
          </div>
          <div className="detail">
            <small>Plan</small>
            <strong>{planName}</strong>
          </div>
          <div className="detail">
            <small>Expiry</small>
            <strong>{expiry ? dateText(expiry) : 'Not set'}</strong>
          </div>
        </div>

        <MemberContactActions
          member={member}
          membership={{ expiryDate: expiry, plan: planName }}
          planName={planName}
          expiryDate={expiry}
        />

        <div className="member-detail-actions">
          <button
            type="button"
            className="outline-btn edit-member-btn"
            onClick={() => onEdit(member)}
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
            onClick={() => onRenew(member)}
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
            onClick={() => onDelete(member)}
            title="Delete member"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete member
          </button>
        </div>

        {member.memberships && member.memberships.length > 0 && (
          <>
            <h3 className="history-heading">Membership history</h3>
            {member.memberships.map((item, idx) => (
              <p className="history-row" key={item.id || idx}>
                {item.planName || item.plan} · expires {dateText(item.expiryDate)}
              </p>
            ))}
          </>
        )}
        <h3 className="history-heading">Payment history</h3>
        {ownPayments.map((item, idx) => (
          <div
            className="history-row"
            key={item.id || idx}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}
          >
            <span>
              <strong>{item.planName || item.plan || planName}</strong> · ₹{item.amount}<br />
              <small style={{ color: 'var(--soft)' }}>
                {item.method === 'Pending' ? 'Status: Pending' : `Paid: ${dateText(item.date)} (${item.method})`}
              </small>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong className={item.method === 'Pending' ? 'pending-text' : 'paid-text'}>
                {item.method === 'Pending' ? 'Pending' : item.method || 'Paid'}
              </strong>
              {item.method === 'Pending' && onMarkPaid && (
                <button
                  type="button"
                  className="mark-paid-btn"
                  onClick={() => onMarkPaid(member)}
                  title="Mark payment as complete"
                >
                  ✓ Mark Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function AdminRenewModal({ member, plans, onRenew, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Renew {member.name}</h2>
        <p>Select a plan. The new membership is appended to history and payment is marked pending.</p>
        <div className="plan-choice-list">
          {plans.map(plan => (
            <button
              type="button"
              className="outline-btn"
              key={plan.id}
              onClick={() => onRenew(member, plan.id)}
            >
              {plan.planName} · {plan.durationDays} days
            </button>
          ))}
        </div>
        <button type="button" className="text-btn" onClick={onClose}>Cancel</button>
      </section>
    </div>
  );
}

export default function AdminDashboard({ members, memberships, payments, plans, hasMore, onLoadMore }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);
  const [renewing, setRenewing] = useState(null);
  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter(member => member.name?.toLowerCase().includes(q) || member.phone?.includes(search));
  }, [members, search]);

  const categorized = useMemo(() => {
    return visible.filter(member => {
      if (filter === 'all') return true;
      return statusFor(member) === filter;
    });
  }, [visible, filter]);

  const handleEdit = useCallback(item => {
    setEditing(item);
  }, []);

  const handleDetails = useCallback(member => {
    setDetails(member);
  }, []);

  const handleRenew = useCallback(member => {
    setRenewing(member);
  }, []);

  const remove = useCallback(async member => {
    if (!window.confirm(`Delete ${member.name}? This cannot be undone.`)) return;
    const memberId = member.id || member.uid;
    const { error: err } = await supabase.from('members').delete().eq('id', memberId);
    if (err) {
      alert(`Failed to delete member: ${err.message}`);
      return;
    }
    if (member.photoURL && member.photoURL.includes('member-photos')) {
      try {
        const parts = member.photoURL.split('/');
        const filename = parts[parts.length - 1];
        await supabase.storage.from('member-photos').remove([filename]);
      } catch {
        /* optional photo cleanup */
      }
    }
  }, []);

  const renew = async (member, planId) => {
    const plan = plans.find(item => item.id === planId);
    if (!plan) return;
    const memberId = member.id || member.uid;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + Number(plan.durationDays));
    const expiryDateStr = expiry.toISOString().slice(0, 10);
    const todayStr = today();

    const renewalRecord = {
      member_id: memberId,
      user_id: member.userId || null,
      plan_name: plan.planName,
      amount: Number(plan.price),
      method: 'Pending',
      status: 'pending',
      payment_date: todayStr
    };

    await supabase
      .from('members')
      .update({
        plan_name: plan.planName,
        plan_id: planId && planId.length > 20 ? planId : null,
        start_date: todayStr,
        expiry_date: expiryDateStr,
        payment_status: 'pending',
        payment_method: 'Pending',
        amount: Number(plan.price)
      })
      .eq('id', memberId);

    try {
      await supabase.from('payments').insert(renewalRecord);
    } catch (pe) {
      console.warn('Payment insert note:', pe);
    }

    setRenewing(null);
  };

  const markPaymentPaid = async memberOrId => {
    try {
      const memberId = typeof memberOrId === 'string' ? memberOrId : (memberOrId?.id || memberOrId?.uid);
      await supabase
        .from('members')
        .update({
          payment_status: 'paid',
          payment_method: 'Cash'
        })
        .eq('id', memberId);

      try {
        await supabase
          .from('payments')
          .update({
            status: 'paid',
            method: 'Cash'
          })
          .eq('member_id', memberId)
          .eq('status', 'pending');
      } catch {}

      if (details && (details.id === memberId || details.uid === memberId)) {
        setDetails(prev => prev ? ({ ...prev, paymentStatus: 'paid', payment: 'Cash' }) : null);
      }
    } catch (err) {
      console.error('Failed to update payment status:', err);
    }
  };

  const activeCount = members.filter(m => statusFor(m) === 'active').length;
  const pendingCount = members.filter(m => statusFor(m) === 'pending').length;
  const expiringCount = members.filter(m => statusFor(m) === 'expiring').length;
  const expiredCount = members.filter(m => statusFor(m) === 'expired').length;

  const currentMonth = new Date().getMonth();
  const monthly = members.reduce((sum, member) => {
    if (Array.isArray(member.payments) && member.payments.length > 0) {
      const memberSum = member.payments
        .filter(p => p.date && asDate(p.date).getMonth() === currentMonth && p.method !== 'Pending')
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      return sum + memberSum;
    }
    if (member.paymentStatus === 'paid' && member.startDate && asDate(member.startDate).getMonth() === currentMonth) {
      return sum + Number(member.amount || 0);
    }
    return sum;
  }, 0);

  const pendingDues = members
    .filter(m => statusFor(m) === 'pending')
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  return (
    <main>
      <div className="eyebrow">Today at Roxy</div>
      <h1 className="page-title">Member overview</h1>
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
      <div className="metric-grid">
        <div className="metric-card"><small>Payments this month</small><strong>₹{monthly}</strong></div>
        <div className="metric-card pending-metric"><small>Pending dues</small><strong>₹{pendingDues}</strong></div>
      </div>
      <div className="toolbar">
        <input type="search" placeholder="Search name or phone" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="member-grid">
        {categorized.map(member => (
          <MemberCard
            key={member.id || member.uid}
            member={member}
            onEdit={handleEdit}
            onDelete={remove}
            onDetails={handleDetails}
            onRenew={handleRenew}
          />
        ))}
      </div>
      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <button type="button" className="secondary-btn" onClick={onLoadMore}>
            Load more members
          </button>
        </div>
      )}
      {!categorized.length && <div className="empty">No members found in this category.</div>}
      {details && !editing && !renewing && (
        <Details
          member={details}
          plans={plans}
          onClose={() => setDetails(null)}
          onEdit={member => setEditing(member)}
          onRenew={member => setRenewing(member)}
          onDelete={member => {
            setDetails(null);
            remove(member);
          }}
          onMarkPaid={markPaymentPaid}
        />
      )}
      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <section className="modal-card edit-member-sheet" onClick={event => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditing(null)}>×</button>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Update member</div>
            <h2 style={{ margin: '0 0 16px' }}>Edit {editing.name}</h2>
            <MemberForm
              existing={editing}
              plans={plans}
              onDone={() => {
                const uid = editing.uid;
                setEditing(null);
                if (details && details.uid === uid) {
                  const refreshed = members.find(m => m.uid === uid);
                  if (refreshed) setDetails(refreshed);
                }
              }}
              onCancel={() => setEditing(null)}
            />
          </section>
        </div>
      )}
      {renewing && <AdminRenewModal member={renewing} plans={plans} onRenew={renew} onClose={() => setRenewing(null)} />}
    </main>
  );
}
