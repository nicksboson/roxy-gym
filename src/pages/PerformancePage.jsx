import React, { useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { asDate, dateText, statusFor } from '../utils';

export default function PerformancePage({ members = [], payments = [] }) {
  const [filter, setFilter] = useState('all');

  const enrichedPayments = useMemo(() => {
    const list = [];
    for (const member of members) {
      const isExpired = statusFor(member) === 'expired';
      if (Array.isArray(member.payments) && member.payments.length > 0) {
        member.payments.forEach((p, idx) => {
          list.push({
            id: p.id || `${member.id || member.uid}-${idx}`,
            memberId: member.id || member.uid,
            member: member.name || 'Member',
            amount: p.amount,
            method: p.method,
            planName: p.plan || p.planName || member.plan || member.planName || 'Membership',
            date: p.date,
            dateFormatted: dateText(p.date),
            expired: isExpired
          });
        });
      } else if (member.amount) {
        list.push({
          id: `${member.id || member.uid}-main`,
          memberId: member.id || member.uid,
          member: member.name || 'Member',
          amount: member.amount,
          method: member.payment || (member.paymentStatus === 'pending' ? 'Pending' : 'UPI'),
          planName: member.plan || member.planName || 'Membership',
          date: member.startDate,
          dateFormatted: dateText(member.startDate),
          expired: isExpired
        });
      }
    }
    return list.length > 0 ? list : payments.map(p => ({
      ...p,
      member: members.find(m => m.uid === p.userId)?.name || 'Member',
      dateFormatted: dateText(p.date)
    }));
  }, [members, payments]);

  const collected = enrichedPayments
    .filter(p => p.method !== 'Pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pending = enrichedPayments
    .filter(p => p.method === 'Pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const expiredPending = enrichedPayments
    .filter(p => p.method === 'Pending' && p.expired)
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const active = members.filter(member => statusFor(member) === 'active').length;

  const toggleFilter = type => setFilter(current => (current === type ? 'all' : type));

  const filteredPayments = enrichedPayments.filter(p => {
    if (filter === 'collected') return p.method !== 'Pending';
    if (filter === 'pending') return p.method === 'Pending';
    if (filter === 'expired_pending') return p.method === 'Pending' && p.expired;
    return true;
  });

  const markPaid = async payment => {
    try {
      const memberId = payment?.memberId || payment?.userId;
      if (memberId) {
        await supabase
          .from('members')
          .update({
            payment_status: 'paid',
            payment_method: 'Cash'
          })
          .eq('id', memberId);

        if (payment.id) {
          try {
            await supabase
              .from('payments')
              .update({
                status: 'paid',
                method: 'Cash'
              })
              .eq('id', payment.id);
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to update payment status:', err);
    }
  };

  return (
    <main>
      <div className="eyebrow">Roxy GYM</div>
      <h1 className="page-title">Overview</h1>
      <div className="metric-grid performance-metrics">
        <div className="metric-card">
          <small>Active members</small>
          <strong>{active}</strong>
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
          filteredPayments.map((payment, index) => (
            <div className="history-row" key={payment.id || `${payment.userId}-${payment.date}-${payment.amount}`}>
              <span><strong>{payment.member}</strong><br />{payment.planName || 'Plan'} · {payment.dateFormatted}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong className={payment.method === 'Pending' ? 'pending-text' : 'paid-text'}>
                  ₹{payment.amount} · {payment.method}
                </strong>
                {payment.method === 'Pending' && payment.id && (
                  <button
                    type="button"
                    className="mark-paid-btn"
                    onClick={() => markPaid(payment)}
                    title="Mark payment as complete"
                  >
                    ✓ Mark Complete
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
