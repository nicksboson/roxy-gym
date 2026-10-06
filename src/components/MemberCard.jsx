import React, { memo } from 'react';
import { dateText, formatExpiryDays, statusFor, statusLabel } from '../utils';
import MemberAvatar from './MemberAvatar';

function MemberCard({ member, membership, pendingPayment, onEdit, onDelete, onDetails, onRenew }) {
  const expiry = member?.expiryDate || member?.expiry || membership?.expiryDate;
  const planName = member?.planName || member?.plan || membership?.planName || membership?.plan;
  const isPending = member?.paymentStatus === 'pending' || member?.payment === 'Pending' || !!pendingPayment;
  const pendingAmount = member?.amount || pendingPayment?.amount;
  const status = statusFor(member);
  const photo = member?.photoURL || member?.photo;

  return (
    <article
      className="member-card member-card-grid member-card-clickable"
      onClick={() => onDetails(member)}
    >
      <div className="member-card-head">
        <MemberAvatar src={photo} name={member.name} className="member-photo" />
        <div className="member-copy">
          <h2>{member.name}</h2>
          <p>{member.phone}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span className={`status-badge ${status}`}>
            <i />
            {expiry ? statusLabel(member) : 'No plan'}
          </span>
          {isPending && (
            <span className="pending-badge-tag" title="Pending payment">
              {pendingAmount ? `₹${pendingAmount} Pending` : 'Pending'}
            </span>
          )}
        </div>
      </div>

      <div className="member-card-details">
        <div>
          <small>Plan</small>
          <strong>{planName || 'Not set'}</strong>
        </div>
        <div>
          <small>Expires</small>
          <strong>{expiry ? dateText(expiry) : 'Not set'}</strong>
        </div>
      </div>


    </article>
  );
}

export default memo(MemberCard);
