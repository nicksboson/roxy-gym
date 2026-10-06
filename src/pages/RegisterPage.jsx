import React from 'react';
import { useNavigate } from 'react-router-dom';
import MemberForm from '../components/MemberForm';

export default function RegisterPage({ plans = [] }) {
  const navigate = useNavigate();
  return (
    <main style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="eyebrow">New member</div>
      <h1 className="page-title">Register member</h1>
      <p className="notice">
        Add the member photo, personal details, payment, and plan. Expiry is calculated from the selected plan.
      </p>
      <MemberForm plans={plans} onDone={() => navigate('/members')} />
    </main>
  );
}
