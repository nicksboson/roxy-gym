import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { asDate, dateText, statusFor, statusLabel, today, formatDateLocal, triggerRefetch } from '../utils';
import MemberCard from '../components/MemberCard';
import MemberAvatar from '../components/MemberAvatar';
import MemberContactActions from '../components/MemberContactActions';
import MemberForm from '../components/MemberForm';

function Details({ member, plans, onClose, onEdit, onRenew, onDelete, onMarkPaid, payments }) {
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
  const rawPayments = member.payments || (member.amount ? [{
    id: 'pay-1',
    plan_name: planName,
    amount: member.amount,
    method: member.paymentMethod || member.payment || (member.paymentStatus === 'pending' ? 'Pending' : 'Paid'),
    payment_date: member.startDate || today()
  }] : payments?.filter(item => item.userId === member.uid || item.userId === member.id) || []);

  const ownPayments = [...rawPayments].sort((a, b) => {
    const d1 = new Date(b.payment_date || b.date || b.created_at || 0).getTime();
    const d2 = new Date(a.payment_date || a.date || a.created_at || 0).getTime();
    return d1 - d2;
  });

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
                {item.planName || item.plan_name || item.plan} · expires {dateText(item.expiryDate)}
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
              <strong>{item.plan_name || item.planName || item.plan || planName}</strong> · ₹{item.amount}<br />
              <small style={{ color: 'var(--soft)' }}>
                {item.method === 'Pending' ? 'Status: Pending' : `Paid: ${dateText(item.payment_date || item.date)} (${item.method})`}
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
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [startDate, setStartDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handlePlanChange = (e) => {
    const pid = e.target.value;
    setSelectedPlanId(pid);
    const plan = plans.find(p => p.id === pid);
    if (plan && plan.price !== undefined && plan.price !== null) {
      setCustomAmount(String(plan.price));
    } else {
      setCustomAmount('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlanId) return alert('Select a plan');
    if (customAmount === '') return alert('Enter an amount');
    if (!startDate) return alert('Select a start date');
    onRenew(member, selectedPlanId, Number(customAmount), startDate, paymentMethod);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 style={{ margin: '0 0 8px' }}>Renew {member.name}</h2>
        <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14 }}>
          Select a plan and confirm the payment amount.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="field">
            <label>Start Date</label>
            <input 
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Select Plan</label>
            <select value={selectedPlanId} onChange={handlePlanChange} required>
              <option value="" disabled>Choose a plan...</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.planName} ({plan.durationDays} days)
                </option>
              ))}
            </select>
          </div>

          {selectedPlanId && (
            <>
              <div className="field">
                <label>Amount to Charge (₹)</label>
                <input 
                  type="number" 
                  value={customAmount} 
                  onChange={e => setCustomAmount(e.target.value)}
                  min="0"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="field">
                <label>Mode of Payment</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Online">Online / Card</option>
                  <option value="Pending">Pending (Pay later)</option>
                </select>
              </div>
            </>
          )}

          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button type="submit" className="primary-btn" disabled={!selectedPlanId || customAmount === ''}>
              Confirm Renewal
            </button>
            <button type="button" className="text-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function MembersListPage({ members, plans, hasMore, onLoadMore }) {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
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
      if (filter.startsWith('expiring')) {
        
        
        const dUntil = (expiryStr) => {
          if (!expiryStr) return Infinity;
          const exp = asDate(expiryStr);
          const now = new Date();
          const diffTime = exp.getTime() - now.getTime();
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        };
        const d = dUntil(member.expiryDate);

        if (filter === 'expiring1to3') return d >= 1 && d <= 3;
        if (filter === 'expiring4to7') return d >= 4 && d <= 7;
        if (filter === 'expiring8to15') return d >= 8 && d <= 15;
        return true; 
      }
      return statusFor(member) === filter;
    });
  }, [visible, filter]);

  const handleEdit = useCallback(item => { setEditing(item); }, []);
  const handleDetails = useCallback(member => { setDetails(member); }, []);
  const handleRenew = useCallback(member => { setRenewing(member); }, []);

  // Keep details modal perfectly in sync with the global database state
  useEffect(() => {
    if (details) {
      const fresh = members.find(m => (m.id || m.uid) === (details.id || details.uid));
      // Shallow comparison is usually enough for the top-level fields, but stringify ensures we catch nested payment updates
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(details)) {
        setDetails(fresh);
      }
    }
  }, [members, details]);

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
      } catch { }
    }
    triggerRefetch();
  }, []);

  const renew = async (member, planId, customAmount, selectedStartDate, paymentMethodArg) => {
    const plan = plans.find(item => item.id === planId);
    if (!plan) return;
    const memberId = member.id || member.uid;
    
    const parts = selectedStartDate.split('-');
    const expiry = new Date(parts[0], parts[1] - 1, parts[2]); 
    expiry.setDate(expiry.getDate() + Number(plan.durationDays));
    
    const expiryDateStr = formatDateLocal(expiry);
    const startDateStr = selectedStartDate;

    const actualAmount = customAmount !== undefined && customAmount !== '' ? Number(customAmount) : 0;
    const paymentStatus = paymentMethodArg === 'Pending' ? 'pending' : 'paid';
    const paymentMethod = paymentMethodArg;

    const renewalRecord = {
      member_id: memberId,
      plan_name: plan.planName,
      amount: actualAmount,
      method: paymentMethod,
      status: paymentStatus,
      payment_date: startDateStr
    };

    await supabase.from('members').update({
      plan_name: plan.planName,
      plan_id: planId && planId.length > 20 ? planId : null,
      start_date: startDateStr,
      expiry_date: expiryDateStr,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      amount: actualAmount
    }).eq('id', memberId);

    try {
      await supabase.from('payments').insert(renewalRecord);
    } catch (pe) { }

    triggerRefetch();
    setRenewing(null);
  };

  const markPaymentPaid = async memberOrId => {
    try {
      const memberId = typeof memberOrId === 'string' ? memberOrId : (memberOrId?.id || memberOrId?.uid);
      await supabase.from('members').update({
        payment_status: 'paid',
        payment_method: 'Cash'
      }).eq('id', memberId);

      try {
        await supabase.from('payments').update({
          status: 'paid',
          method: 'Cash'
        }).eq('member_id', memberId).eq('status', 'pending');
      } catch {}

      triggerRefetch();
    } catch (err) {
      console.error('Failed to update payment status:', err);
    }
  };

  let title = 'Members';
  if (filter === 'active') title = 'Live Memberships';
  else if (filter === 'expired') title = 'Expired Memberships';
  else if (filter === 'pending') title = 'Due Amount';
  else if (filter === 'expiring1to3') title = 'Expiring (1-3 Days)';
  else if (filter === 'expiring4to7') title = 'Expiring (4-7 Days)';
  else if (filter === 'expiring8to15') title = 'Expiring (8-15 Days)';

  return (
    <main>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button className="outline-btn" onClick={() => navigate('/dashboard')} style={{ padding: '6px 12px', border: 'none', background: 'var(--surface)' }}>
          ← Back
        </button>
      </div>
      <div className="eyebrow">List View</div>
      <h1 className="page-title">{title} ({categorized.length})</h1>
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
              onDone={() => setEditing(null)}
            />
          </section>
        </div>
      )}
      {renewing && (
        <AdminRenewModal
          member={renewing}
          plans={plans}
          onClose={() => setRenewing(null)}
          onRenew={renew}
        />
      )}
    </main>
  );
}
