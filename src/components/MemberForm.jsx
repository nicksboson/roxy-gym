import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { compressImage, dateInput, friendlyError, triggerRefetch, formatDateLocal } from '../utils';
import CameraCapture from './CameraCapture';
import MembershipCalendarPicker from './MembershipCalendarPicker';

export default function MemberForm({ existing, plans = [], onDone, onCancel }) {
  const existingMembership = existing?.membership;
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(existing?.photoURL || existing?.photo || '');
  const [paymentMethod, setPaymentMethod] = useState(existing ? (existing.paymentStatus === 'pending' ? 'Pending' : (existing.payment || 'UPI')) : 'UPI');

  const initialPlan = plans.find(p => p.id === (existingMembership?.planId || existing?.planId)) || plans[0];

  const [form, setForm] = useState({
    name: existing?.name || '',
    address: existing?.address || '',
    phone: existing?.phone || '',
    email: existing?.email || '',
    gender: existing?.gender || '',
    planId: existingMembership?.planId || existing?.planId || plans[0]?.id || '',
    startDate: dateInput(existingMembership?.startDate || existing?.startDate),
    amount: existing?.amount !== undefined ? existing.amount : '',
  });
  const [error, setError] = useState('');

  // Sync form when existing member data loads
  useEffect(() => {
    if (existing) {
      const mem = existing.membership;
      setForm({
        name: existing.name || '',
        address: existing.address || '',
        phone: existing.phone || '',
        email: existing.email || '',
        gender: existing.gender || '',
        planId: mem?.planId || existing.planId || plans[0]?.id || '',
        startDate: dateInput(mem?.startDate || existing.startDate),
        amount: existing.amount !== undefined ? existing.amount : '',
      });
      setPreview(existing.photoURL || existing.photo || '');
    }
  }, [existing, plans]);

  // Auto-select first plan if none selected yet
  useEffect(() => {
    if (!form.planId && plans.length > 0) {
      setForm(f => ({ ...f, planId: plans[0].id }));
    }
  }, [plans, form.planId]);

  const plan = plans.find(item => item.id === form.planId) || plans[0];

  // When plan changes, just update the planId (do not auto-fill amount)
  const handlePlanChange = (e) => {
    setForm(f => ({ ...f, planId: e.target.value }));
  };

  const save = async event => {
    event.preventDefault();

    if (!form.gender) {
      setError('Please select the member gender.');
      return;
    }
    if (!form.startDate) {
      setError('Please select a membership start date.');
      return;
    }
    const parsedAmount = Number(form.amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError('Please enter a valid amount.');
      return;
    }

    try {
      const memberId = existing?.id || existing?.uid;
      const parts = form.startDate.split('-');
      const expiry = new Date(parts[0], parts[1] - 1, parts[2]); // Parse locally
      expiry.setDate(expiry.getDate() + Number(plan?.durationDays || 30));
      const expiryIso = formatDateLocal(expiry);

      // Handle photo upload
      let finalPhotoURL = preview;
      if (photo) {
        try {
          const { blob: compressedBlob, dataUrl } = await compressImage(photo, 256, 0.60);
          const photoFileName = `${memberId || `temp_${Date.now()}`}.jpg`;
          const { error: uploadErr } = await supabase.storage
            .from('member-photos')
            .upload(photoFileName, compressedBlob || photo, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (!uploadErr) {
            const { data: { publicUrl } } = supabase.storage
              .from('member-photos')
              .getPublicUrl(photoFileName);
            finalPhotoURL = publicUrl;
          } else {
            finalPhotoURL = dataUrl || preview;
          }
        } catch {
          finalPhotoURL = preview;
        }
      }

      const memberPayload = {
        name: form.name.trim(),
        address: form.address.trim() || null,
        phone: form.phone.trim(),
        email: form.email?.trim() || null,
        gender: form.gender,
        plan_name: plan?.planName || 'Membership',
        plan_id: form.planId && String(form.planId).length > 20 ? form.planId : null,
        start_date: form.startDate,
        expiry_date: expiryIso,
        amount: parsedAmount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'Pending' ? 'pending' : 'paid',
        photo_url: finalPhotoURL || null
        // user_id intentionally omitted — Clerk IDs are not valid Postgres UUIDs
      };

      let finalId = memberId;

      if (existing) {
        const { error: updateErr } = await supabase
          .from('members')
          .update(memberPayload)
          .eq('id', memberId);
        if (updateErr) throw updateErr;
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('members')
          .insert(memberPayload)
          .select()
          .single();
        if (insertErr) throw insertErr;
        finalId = inserted?.id;

        // CRITICAL FIX: Log the initial registration payment into the ledger!
        try {
          await supabase.from('payments').insert({
            member_id: finalId,
            plan_name: memberPayload.plan_name,
            amount: memberPayload.amount,
            method: memberPayload.payment_method,
            status: memberPayload.payment_status,
            payment_date: memberPayload.start_date
          });
        } catch (err) {
          console.error("Failed to log initial payment", err);
        }
      }

      // Re-upload photo with permanent member ID as filename
      if (photo && finalId && finalPhotoURL && !finalPhotoURL.startsWith('http') && !finalPhotoURL.startsWith('data:')) {
        try {
          const { blob: compressedBlob } = await compressImage(photo, 256, 0.60);
          const photoFileName = `${finalId}.jpg`;
          const { error: uploadErr } = await supabase.storage
            .from('member-photos')
            .upload(photoFileName, compressedBlob || photo, {
              contentType: 'image/jpeg',
              upsert: true
            });
          if (!uploadErr) {
            const { data: { publicUrl } } = supabase.storage
              .from('member-photos')
              .getPublicUrl(photoFileName);
            await supabase.from('members').update({ photo_url: publicUrl }).eq('id', finalId);
          }
        } catch (e) {
          console.warn('Photo upload note:', e);
        }
      }

      triggerRefetch();
      onDone();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <form className="form-card" onSubmit={save}>

      {/* ── Photo ─────────────────────────────────── */}
      <div className="form-section">
        <h3>Member photo</h3>
        <CameraCapture
          initialPhoto={preview}
          onPhotoChange={(blob, url) => {
            setPhoto(blob);
            setPreview(url);
          }}
        />
      </div>

      {/* ── Personal details ──────────────────────── */}
      <div className="field">
        <label>Name</label>
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="field">
        <label>Phone</label>
        <input
          required
          type="tel"
          placeholder="Mobile number"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
        />
      </div>

      <div className="field">
        <label>Email <span style={{ fontWeight: 400, color: 'var(--soft, #94a3b8)' }}>(Optional)</span></label>
        <input
          type="email"
          placeholder="member@email.com"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
      </div>

      <div className="field">
        <label>Address</label>
        <textarea
          placeholder="Home address"
          value={form.address}
          onChange={e => setForm({ ...form, address: e.target.value })}
        />
      </div>

      {/* ── Gender ────────────────────────────────── */}
      <div className="field">
        <label>Gender</label>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          {['Male', 'Female'].map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setForm(f => ({ ...f, gender: g }))}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 10,
                border: `2px solid ${form.gender === g ? 'var(--accent, #f59e0b)' : 'var(--border, #e2e8f0)'}`,
                background: form.gender === g ? 'var(--accent, #f59e0b)' : 'transparent',
                color: form.gender === g ? '#000' : 'var(--ink, #1e293b)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>{g === 'Male' ? '♂' : '♀'}</span>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ── Membership & Date ─────────────────────── */}
      <div className="form-section">
        <h3>Membership &amp; Payment</h3>

        <div className="field">
          <label>Plan</label>
          <select
            required
            value={form.planId}
            onChange={handlePlanChange}
          >
            {plans.map(item => (
              <option key={item.id} value={item.id}>
                {item.planName} — {item.durationDays} days
              </option>
            ))}
          </select>

        </div>

        {/* Amount paid */}
        <div className="field">
          <label>Amount Paid <span style={{ fontWeight: 400, color: 'var(--soft, #94a3b8)', fontSize: 12 }}>(₹)</span></label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontWeight: 700, fontSize: 15, color: 'var(--ink)', pointerEvents: 'none'
            }}>₹</span>
            <input
              required
              type="number"
              min="0"
              step="1"
              autoComplete="off"
              placeholder="Enter amount paid"
              value={form.amount}
              onChange={e => {
                let val = e.target.value;
                if (val !== '' && Number(val) < 0) val = '0';
                setForm(f => ({ ...f, amount: val }));
              }}
              onWheel={e => e.target.blur()}
              onKeyDown={e => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              style={{ paddingLeft: 30 }}
            />
          </div>
        </div>

                  {form.amount !== '' && (
            <div className="field">
              <label>Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Pending">Pending (Will pay later)</option>
              </select>
            </div>
          )}

          <MembershipCalendarPicker
          startDate={form.startDate}
          onChangeStartDate={iso => setForm(f => ({ ...f, startDate: iso }))}
          planDurationDays={plan?.durationDays}
          plan={plan?.planName}
          minDate={null}
        />
      </div>

      {error && <div className="error-text">{error}</div>}

      <div className={onCancel ? 'edit-form-actions' : ''}>
        <button
          type="submit"
          className="primary-btn"
          disabled={!plans.length}
        >
          {existing ? 'Save member' : 'Register member'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="outline-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
