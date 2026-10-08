import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { friendlyError, triggerRefetch } from '../utils';

export default function PlansPage({ plans = [] }) {
  const [editing, setEditing] = useState(undefined);
  const [form, setForm] = useState({ planName: '', durationDays: '', price: '' });
  const [error, setError] = useState('');

  const open = plan => {
    setEditing(plan);
    setForm(
      plan
        ? { planName: plan.planName, durationDays: plan.durationDays, price: plan.price }
        : { planName: '', durationDays: '', price: '' }
    );
  };

  const save = async event => {
    event.preventDefault();
    setError('');
    try {
      const payload = {
        plan_name: form.planName.trim(),
        duration_days: Number(form.durationDays),
        price: Number(form.price)
      };

      if (editing) {
        const { error: err } = await supabase
          .from('plans')
          .update(payload)
          .eq('id', editing.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('plans')
          .insert(payload);
        if (err) throw err;
      }
      triggerRefetch();
      setEditing(undefined);
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const remove = async plan => {
    if (window.confirm(`Delete ${plan.planName}? Existing memberships keep their history.`)) {
      try {
        const { error: err } = await supabase
          .from('plans')
          .delete()
          .eq('id', plan.id);
        if (err) alert(friendlyError(err));
        else triggerRefetch();
      } catch (err) {
        alert(friendlyError(err));
      }
    }
  };

  return (
    <main>
      <div className="eyebrow">Gym fees</div>
      <h1 className="page-title">Plans</h1>
      <div className="toolbar">
        <button className="primary-btn" onClick={() => open(null)}>
          Create plan
        </button>
      </div>

      {editing !== undefined && (
        <form className="form-card plan-form" onSubmit={save}>
          <h2>{editing ? 'Edit plan' : 'New plan'}</h2>
          <div className="field">
            <label>Plan name</label>
            <input
              required
              value={form.planName}
              onChange={e => setForm({ ...form, planName: e.target.value })}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Duration days</label>
              <input
                required
                type="number"
                min="1"
                value={form.durationDays}
                onChange={e => setForm({ ...form, durationDays: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Price</label>
              <input
                required
                type="number"
                min="0"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="form-actions">
            <button className="primary-btn">Save plan</button>
            <button type="button" className="outline-btn" onClick={() => setEditing(undefined)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="plan-list">
        {plans.map(plan => (
          <article className="metric-card plan-row" key={plan.id}>
            <div>
              <strong>{plan.planName}</strong>
              <small>
                {plan.durationDays} days · ₹{plan.price}
              </small>
            </div>
            <div className="form-actions">
              <button className="text-btn" onClick={() => open(plan)}>
                Edit
              </button>
              <button className="text-btn danger-text" onClick={() => remove(plan)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
