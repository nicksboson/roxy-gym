import React, { useMemo } from 'react';
import { asDate, statusFor, today } from '../utils';

export default function PerformancePage({ members = [], payments = [] }) {
  const activeCount = members.filter(m => statusFor(m) === 'active').length;
  const expiredCount = members.filter(m => statusFor(m) === 'expired').length;
  const enquiriesCount = 0; 
  
  const totalMembers = activeCount + expiredCount;
  const liveRatio = totalMembers ? Math.round((activeCount / totalMembers) * 100) : 0;
  
  const todayStr = today();
  
  // Using the raw payments prop that comes from AppShell -> hooks.js 
  // It has all payments across all members.
  const todayFlow = payments
    .filter(p => p.status === 'paid' && p.payment_date === todayStr)
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  
  const pendingDues = members
    .filter(m => statusFor(m) === 'pending')
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);
    
  const expenses = 0;
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
  
  const daysUntil = (expiryStr) => {
    if (!expiryStr) return Infinity;
    const exp = asDate(expiryStr);
    const now = new Date();
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const expiring1to3 = members.filter(m => daysUntil(m.expiryDate) >= 1 && daysUntil(m.expiryDate) <= 3).length;
  const expiring4to7 = members.filter(m => daysUntil(m.expiryDate) >= 4 && daysUntil(m.expiryDate) <= 7).length;
  const expiring8to15 = members.filter(m => daysUntil(m.expiryDate) >= 8 && daysUntil(m.expiryDate) <= 15).length;

  const maxVal = Math.max(activeCount, expiredCount, 1); // for progress bars max
  const maxMoney = Math.max(todayFlow, pendingDues, expenses, totalCollection, 1);

  const ProgressRow = ({ label, value, max, displayValue }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div style={{ width: '80px', fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ flex: 1, margin: '0 12px', background: 'var(--surface-light)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, background: 'var(--text)', height: '100%', borderRadius: '4px' }} />
      </div>
      <div style={{ width: '40px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold' }}>{displayValue ?? value}</div>
    </div>
  );

  return (
    <main style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--surface-glass)', boxShadow: 'var(--shadow-sm)' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',  }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--primary-light, rgba(59, 130, 246, 0.1))', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M7 17V13M12 17V7M17 17v-4" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '20px', margin: '0 0 4px', fontWeight: 'bold' }}>Dashboard Insights</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Members and money at a glance</p>
            </div>
          </div>
          <button style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </button>
        </div>

        </div>

        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--surface-glass)', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Member Health</h2>
          <ProgressRow label="Live" value={activeCount} max={maxVal} />
          <ProgressRow label="Expired" value={expiredCount} max={maxVal} />
          <ProgressRow label="Enquiries" value={enquiriesCount} max={maxVal} />
        </div>


        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--surface-glass)', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Money Flow</h2>
          <ProgressRow label="Today" value={todayFlow} max={maxMoney} />
          <ProgressRow label="Due" value={pendingDues} max={maxMoney} />
          <ProgressRow label="Expense" value={expenses} max={maxMoney} />
          <ProgressRow label="Balance" value={totalCollection} max={maxMoney} />
        </div>


        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--surface-glass)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '160px', height: '160px', borderRadius: '50%', border: '16px solid var(--border)', borderTopColor: 'var(--primary)', borderRightColor: 'var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalCollection > 0 ? `₹${totalCollection.toLocaleString('en-IN')}` : '0'}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Flow</span>
          </div>
          <div style={{ width: '100%', textAlign: 'left' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 12px' }}>Money Split</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                <span>Revenue</span>
              </div>
              <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>100%</span>
            </div>
          </div>
        </div>


        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--surface-glass)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 24px' }}>Member Strength</h3>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>

            <div style={{ position: 'relative', width: '200px', height: '100px', overflow: 'hidden' }}>
              <div style={{ width: '200px', height: '200px', borderRadius: '50%', border: '16px solid var(--border)', boxSizing: 'border-box' }} />
              <div style={{ position: 'absolute', top: 0, left: 0, width: '200px', height: '200px', borderRadius: '50%', border: '16px solid var(--primary)', boxSizing: 'border-box', borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: `rotate(${-135 + (liveRatio * 1.8)}deg)` }} />
              <div style={{ position: 'absolute', bottom: '10px', left: '0', width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>{liveRatio}%</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Active Ratio</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, background: 'var(--surface)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                <span>Live</span>
              </div>
              <strong style={{ fontSize: '16px' }}>{activeCount}</strong>
            </div>
            <div style={{ flex: 1, background: 'var(--surface)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                <span>Expired</span>
              </div>
              <strong style={{ fontSize: '16px' }}>{expiredCount}</strong>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            {totalMembers > 0 ? `Total member strength based on live and expired users.` : 'No live or expired member data available yet'}
          </div>
        </div>


        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--surface-glass)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 24px' }}>Expiring Memberships</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '140px', marginBottom: '16px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
              <div style={{ background: 'var(--border)', width: '32px', height: '100px', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', marginBottom: '12px' }}>
                <div style={{ background: 'var(--primary)', width: '100%', height: `${Math.min(expiring1to3 * 10, 100)}%`, borderRadius: '16px' }} />
              </div>
              <strong style={{ fontSize: '16px' }}>{expiring1to3}</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>1-3 Days</span>
            </div>
            

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
              <div style={{ background: 'var(--border)', width: '32px', height: '100px', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', marginBottom: '12px' }}>
                <div style={{ background: 'var(--primary)', width: '100%', height: `${Math.min(expiring4to7 * 10, 100)}%`, borderRadius: '16px' }} />
              </div>
              <strong style={{ fontSize: '16px' }}>{expiring4to7}</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>4-7 Days</span>
            </div>
            

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
              <div style={{ background: 'var(--border)', width: '32px', height: '100px', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', marginBottom: '12px' }}>
                <div style={{ background: 'var(--primary)', width: '100%', height: `${Math.min(expiring8to15 * 10, 100)}%`, borderRadius: '16px' }} />
              </div>
              <strong style={{ fontSize: '16px' }}>{expiring8to15}</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>8-15 Days</span>
            </div>
          </div>
          
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            {expiring1to3 === 0 && expiring4to7 === 0 && expiring8to15 === 0 
              ? 'No memberships are close to expiry' 
              : 'Memberships expiring in the coming weeks'}
          </div>
        </div>

      </div>
    </main>
  );
}
