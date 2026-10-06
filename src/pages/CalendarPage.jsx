import React, { memo, useCallback, useMemo, useState } from 'react';
import Calendar from '../components/Calendar';
import { asDate, dateText } from '../utils';

function CalendarPage({ memberships = [], members = [] }) {
  const [selected, setSelected] = useState(() => new Date());

  const expiries = useMemo(() => {
    if (memberships && memberships.length > 0) return memberships.filter(item => item.expiryDate);
    return members
      .filter(m => m.expiryDate || m.expiry)
      .map(m => ({
        id: m.id || m.uid,
        userId: m.id || m.uid,
        expiryDate: m.expiryDate || m.expiry,
        plan: m.plan || m.planName
      }));
  }, [memberships, members]);

  // Precompute Set for O(1) membership expiry lookups
  const expiryDateSet = useMemo(() => {
    const set = new Set();
    for (const item of expiries) {
      if (item.expiryDate) {
        set.add(asDate(item.expiryDate).toDateString());
      }
    }
    return set;
  }, [expiries]);

  const membersMap = useMemo(() => {
    const map = new Map();
    for (const m of members) {
      map.set(m.id || m.uid, m);
      if (m.uid) map.set(m.uid, m);
    }
    return map;
  }, [members]);

  const key = useMemo(() => selected.toISOString().slice(0, 10), [selected]);

  const expiring = useMemo(() => {
    return expiries
      .filter(item => asDate(item.expiryDate).toISOString().slice(0, 10) === key)
      .map(item => membersMap.get(item.userId))
      .filter(Boolean);
  }, [expiries, key, membersMap]);

  // Stable tileClassName callback prevents re-rendering calendar tile tree on unrelated state changes
  const tileClassName = useCallback(
    ({ date, view }) => {
      if (view !== 'month') return '';
      const dStr = date.toDateString();
      return expiryDateSet.has(dStr) ? 'expiry-day' : '';
    },
    [expiryDateSet]
  );

  const handleSelectDate = useCallback(date => {
    setSelected(date);
  }, []);

  return (
    <main>
      <div className="eyebrow">Membership schedule</div>
      <h1 className="page-title">Expiry calendar</h1>

      <div className="calendar-wrap">
        <Calendar value={selected} onChange={handleSelectDate} tileClassName={tileClassName} />
      </div>

      <section className="calendar-results">
        <h2>{selected.toLocaleDateString(undefined, { dateStyle: 'long' })}</h2>
        {expiring.length ? (
          expiring.map(member => (
            <div className="calendar-member" key={member.uid}>
              <strong>{member.name}</strong>
              <span>Expires {dateText(expiries.find(item => item.userId === member.uid)?.expiryDate)}</span>
            </div>
          ))
        ) : (
          <div className="empty">No members expire on this date.</div>
        )}
      </section>
    </main>
  );
}

export default memo(CalendarPage);
