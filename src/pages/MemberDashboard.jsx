import React from 'react';
import { asDate, dateText, statusFor, statusLabel } from '../utils';
import MemberAvatar from '../components/MemberAvatar';

function StatusBadge({ expiryDate }) {
  return (
    <span className={`status-badge ${statusFor(expiryDate)}`}>
      <i />
      {statusLabel(expiryDate)}
    </span>
  );
}

export default function MemberDashboard({ profile = {}, memberships = [], payments = [], plans = [], members = [] }) {
  const memberDoc = (members || []).find(
    m => m.uid === profile?.uid || m.id === profile?.uid || (profile?.email && m.email === profile.email)
  );
  const membership = (memberships || [])
    .filter(item => item && item.userId === profile?.uid)
    .sort((a, b) => asDate(b.startDate) - asDate(a.startDate))[0] || memberDoc;
  const ownPayments = (payments || []).filter(item => item && item.userId === profile?.uid);
  const effectivePayments = ownPayments.length > 0 ? ownPayments : (memberDoc?.payments || []);

  const plan = (plans || []).find(item => item.id === membership?.planId) || { planName: membership?.planName || membership?.plan };

  if (!membership) {
    return (
      <main>
        <div className="eyebrow">Your membership</div>
        <h1 className="page-title">Welcome to Roxy GYM</h1>
        <div className="empty">
          Your membership has not been set up yet. Ask the gym team to add your plan.
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="eyebrow">Member dashboard</div>
      <h1 className="page-title">Hi, {profile.name.split(' ')[0]}</h1>
      <div className="profile-summary">
        <MemberAvatar
          src={profile.photoURL || profile.photo}
          name={profile.name}
          className="profile-photo"
          size={56}
        />
        <div>
          <h2>{profile.name}</h2>
          <StatusBadge expiryDate={membership.expiryDate} />
        </div>
      </div>
      <section className="stats">
        <div className="stat">
          <div className="stat-value">{plan?.planName || membership.plan || 'Plan'}</div>
          <div className="stat-label">Current plan</div>
        </div>
        <div className="stat">
          <div className="stat-value">{dateText(membership.expiryDate)}</div>
          <div className="stat-label">Expiry date</div>
        </div>
      </section>
      <h2 className="section-title">Payment history</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {effectivePayments.map((payment, idx) => (
              <tr key={payment.id || idx}>
                <td>{dateText(payment.date)}</td>
                <td>{payment.planName || payment.plan || 'Membership'}</td>
                <td>₹{payment.amount}</td>
                <td>{payment.method === 'Pending' ? 'Pending' : (payment.method || 'Paid')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
