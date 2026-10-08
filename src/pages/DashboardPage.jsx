import React from 'react';
import { useNavigate } from 'react-router-dom';
import { asDate, statusFor } from '../utils';

export default function DashboardPage({ members }) {
  const navigate = useNavigate();

  const daysUntil = (expiryStr) => {
    if (!expiryStr) return Infinity;
    const exp = asDate(expiryStr);
    const now = new Date();
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const activeCount = members.filter(m => statusFor(m) === 'active').length;
  const expiredCount = members.filter(m => statusFor(m) === 'expired').length;
  const expiring1to3 = members.filter(m => daysUntil(m.expiryDate) >= 1 && daysUntil(m.expiryDate) <= 3).length;
  const expiring4to7 = members.filter(m => daysUntil(m.expiryDate) >= 4 && daysUntil(m.expiryDate) <= 7).length;
  const expiring8to15 = members.filter(m => daysUntil(m.expiryDate) >= 8 && daysUntil(m.expiryDate) <= 15).length;

  const totalCollection = members.reduce((sum, member) => {
    let memberSum = 0;
    if (Array.isArray(member.payments) && member.payments.length > 0) {
      memberSum += member.payments
        .filter(p => p.method !== 'Pending' && p.status === 'paid')
        .reduce((s, p) => s + Number(p.amount || 0), 0);
    } else {
      if (member.paymentStatus === 'paid' || member.payment === 'Cash' || member.payment === 'UPI') {
        memberSum += Number(member.amount || 0);
      }
    }
    return sum + memberSum;
  }, 0);

  const pendingDues = members
    .filter(m => statusFor(m) === 'pending')
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const dashCards = [
    { 
      label: 'Live Memberships', count: activeCount, filter: 'active', 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
      iconColor: 'var(--green)', iconBg: 'var(--green-light)'
    },
    { 
      label: 'Total Memberships', count: members.length, filter: 'all', 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      iconColor: 'var(--primary)', iconBg: 'var(--primary-light)'
    },
    { 
      label: 'Expired Memberships', count: expiredCount, filter: 'expired', 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="11" x2="23" y2="11"/></svg>,
      iconColor: 'var(--red)', iconBg: 'var(--red-light)'
    },
    { 
      label: 'Expiring (1-3 Days)', count: expiring1to3, filter: 'expiring1to3', 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
      iconColor: 'var(--orange)', iconBg: 'var(--orange-light)'
    },
    { 
      label: 'Expiring (4-7 Days)', count: expiring4to7, filter: 'expiring4to7', 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h5"/><path d="M17.5 17.5 16 16.25V14"/><circle cx="16" cy="16" r="6"/></svg>,
      iconColor: 'var(--orange)', iconBg: 'var(--orange-light)'
    },
    { 
      label: 'Expiring (8-15 Days)', count: expiring8to15, filter: 'expiring8to15', 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/></svg>,
      iconColor: 'var(--orange)', iconBg: 'var(--orange-light)'
    },
    { 
      label: 'Due Amount', count: `\u20B9${pendingDues.toLocaleString('en-IN')}`, filter: 'pending', 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
      iconColor: 'var(--red)', iconBg: 'var(--red-light)'
    },
    { 
      label: 'Total Collection', count: `\u20B9${totalCollection.toLocaleString('en-IN')}`, filter: 'all', 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3h-4c-1 0-1.5.5-2 1.5S8.5 7 12 7s3.5-1.5 3-2.5S15 3 14 3z" /><path d="M10 7c-3.5 1-6 4-6 8a8 8 0 0 0 16 0c0-4-2.5-7-6-8" /><path d="M10.5 11h3M10.5 13.5h3M10.5 16.5l2-2h-1c-.5 0-1-.5-1-1s.5-1 1-1" /></svg>,
      iconColor: 'var(--primary)', iconBg: 'var(--primary-light)'
    },
  ];

  return (
    <main>
      <div className="eyebrow">Dashboard</div>
      <h1 className="page-title">Gym Overview</h1>
      
      <div className="dashboard-grid">
        {dashCards.map((card, i) => (
          <button 
            key={i} 
            className="stat stat-btn glass-card" 
            style={{ 
              position: 'relative',
              overflow: 'hidden',
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '18px 16px',
              textAlign: 'left',
              borderRadius: '24px',
              border: '1px solid var(--border)',
              background: 'var(--surface-glass)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onClick={() => navigate(`/members?filter=${card.filter}`)}
          >

            <div style={{
              position: 'absolute',
              right: '-20px',
              bottom: '-20px',
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              border: `8px solid ${card.iconColor}`,
              opacity: 0.08,
              pointerEvents: 'none',
              zIndex: 0
            }} />
            

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px', gap: '8px' }}>
              <div style={{ 
                  background: card.iconBg,
                  color: card.iconColor, 
                  width: '44px', 
                  minWidth: '44px',
                  height: '44px', 
                  borderRadius: '12px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                {card.icon}
              </div>
              <strong style={{ 
                fontSize: String(card.count).length > 10 ? '14px' : String(card.count).length > 8 ? '16px' : String(card.count).length > 6 ? '20px' : '26px', 
                fontWeight: '800', 
                color: 'var(--ink)',
                textAlign: 'right',
                letterSpacing: '-0.04em',
                whiteSpace: 'nowrap'
              }}>
                {card.count}
              </strong>
            </div>


            <div style={{ height: '1px', width: '100%', background: 'var(--border)', opacity: 0.6, marginBottom: '14px' }} />


            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', lineHeight: '1.2', position: 'relative', zIndex: 1 }}>
              {card.label.split(' ').map((word, index) => <React.Fragment key={index}>{word}<br/></React.Fragment>)}
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
