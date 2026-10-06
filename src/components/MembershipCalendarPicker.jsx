import React, { memo, useCallback, useMemo, useState } from 'react';
import Calendar from './Calendar';

const PLAN_DAYS = {
  '1 Month': 30,
  '3 Months': 90,
  '6 Months': 180,
  '1 Year': 365
};

function normalizeDate(d) {
  if (!d) return new Date();
  if (d instanceof Date) return isNaN(d.getTime()) ? new Date() : d;
  const parsed = new Date(d);
  if (!isNaN(parsed.getTime())) return parsed;
  return new Date();
}

function formatDateDisplay(d) {
  const date = normalizeDate(d);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatShortDate(d) {
  const date = normalizeDate(d);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function toIsoDate(d) {
  const date = normalizeDate(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function MembershipCalendarPicker({
  startDate,
  onChangeStartDate,
  plan,
  planDurationDays,
  expiryDate,
  onChangeExpiryDate,
  minDate = null
}) {
  const [target, setTarget] = useState('start'); // 'start' or 'expiry'
  const [isOpen, setIsOpen] = useState(true);

  // Determine duration in days
  const duration = useMemo(() => {
    if (planDurationDays) return Number(planDurationDays);
    if (typeof plan === 'string' && PLAN_DAYS[plan]) return PLAN_DAYS[plan];
    if (typeof plan === 'number') return plan;
    return 30;
  }, [plan, planDurationDays]);

  const startObj = useMemo(() => {
    return normalizeDate(startDate);
  }, [startDate]);

  const computedExpiryObj = useMemo(() => {
    if (expiryDate && target === 'expiry') {
      return normalizeDate(expiryDate);
    }
    const end = new Date(startObj);
    end.setDate(end.getDate() + duration);
    return end;
  }, [startObj, duration, expiryDate, target]);

  const activeDate = target === 'start' ? startObj : computedExpiryObj;

  const calendarMinDate = useMemo(() => {
    if (minDate === null) return null;
    const baseMin = minDate ? normalizeDate(minDate) : new Date();
    baseMin.setHours(0, 0, 0, 0);

    if (target === 'expiry') {
      const startTime = startObj
        ? new Date(startObj.getFullYear(), startObj.getMonth(), startObj.getDate()).getTime()
        : 0;
      const base = Math.max(baseMin.getTime(), startTime);
      return new Date(base);
    }
    return baseMin;
  }, [target, minDate, startObj]);

  const startTime = useMemo(() => {
    const s = new Date(startObj);
    s.setHours(0, 0, 0, 0);
    return s.getTime();
  }, [startObj]);

  const expiryTime = useMemo(() => {
    const e = new Date(computedExpiryObj);
    e.setHours(0, 0, 0, 0);
    return e.getTime();
  }, [computedExpiryObj]);

  const handleSelectDate = useCallback(value => {
    if (!value) return;
    const selected = normalizeDate(value);
    selected.setHours(0, 0, 0, 0);

    if (calendarMinDate) {
      const minD = new Date(calendarMinDate);
      minD.setHours(0, 0, 0, 0);
      if (selected.getTime() < minD.getTime()) {
        return;
      }
    }

    if (target === 'start') {
      const iso = toIsoDate(selected);
      onChangeStartDate?.(iso, selected);

      // Auto-compute new expiry
      const nextExpiry = new Date(selected);
      nextExpiry.setDate(nextExpiry.getDate() + duration);
      onChangeExpiryDate?.(formatShortDate(nextExpiry), nextExpiry);
    } else {
      onChangeExpiryDate?.(formatShortDate(selected), selected);
    }
  }, [target, duration, calendarMinDate, onChangeStartDate, onChangeExpiryDate]);

  const setShortcut = useCallback(offsetDays => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offsetDays);
    handleSelectDate(d);
  }, [handleSelectDate]);

  const setFirstOfNextMonth = useCallback(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() + 1, 1);
    handleSelectDate(d);
  }, [handleSelectDate]);

  const tileClassName = useCallback(({ date, view }) => {
    if (view !== 'month') return '';
    const current = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    if (current === startTime) return 'membership-start-tile';
    if (current === expiryTime) return 'membership-expiry-tile';
    if (current > startTime && current < expiryTime) return 'membership-range-tile';
    return '';
  }, [startTime, expiryTime]);

  return (
    <div className="membership-calendar-section">
      <div className="membership-calendar-header">
        <div>
          <h4>Membership Schedule</h4>
          <p className="calendar-subtext">Select the start date using the calendar below</p>
        </div>
        <button
          type="button"
          className="calendar-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? 'Collapse ▴' : 'Expand ▾'}
        </button>
      </div>

      <div className="membership-period-banner">
        <div
          className={`membership-period-item ${target === 'start' ? 'active-target' : ''}`}
          onClick={() => setTarget('start')}
          role="button"
          tabIndex={0}
        >
          <small>Start Date (Joining)</small>
          <strong>{formatDateDisplay(startObj)}</strong>
          {target === 'start' && <span className="selection-badge">Editing on calendar</span>}
        </div>
        <div
          className={`membership-period-item ${target === 'expiry' ? 'active-target' : ''}`}
          onClick={() => setTarget('expiry')}
          role="button"
          tabIndex={0}
        >
          <small>Expiry Date</small>
          <strong>{formatDateDisplay(computedExpiryObj)}</strong>
          {target === 'expiry' && <span className="selection-badge expiry-badge">Editing on calendar</span>}
        </div>
      </div>

      {isOpen && (
        <>
          <div className="calendar-shortcuts">
            <span className="shortcuts-label">Quick set:</span>
            <button
              type="button"
              className="calendar-shortcut-btn"
              onClick={() => setShortcut(0)}
            >
              Today
            </button>
            <button
              type="button"
              className="calendar-shortcut-btn"
              onClick={() => setShortcut(1)}
            >
              Tomorrow
            </button>
            <button
              type="button"
              className="calendar-shortcut-btn"
              onClick={setFirstOfNextMonth}
            >
              1st of Next Month
            </button>
          </div>

          <div className="calendar-wrap registration-calendar">
            <Calendar
              value={activeDate}
              onChange={handleSelectDate}
              tileClassName={tileClassName}
              minDate={calendarMinDate}
            />
          </div>

          <div className="calendar-legend">
            <span className="legend-item">
              <span className="legend-swatch start-swatch" /> Start Date
            </span>
            <span className="legend-item">
              <span className="legend-swatch range-swatch" /> Active Duration ({duration} days)
            </span>
            <span className="legend-item">
              <span className="legend-swatch expiry-swatch" /> Expiry Date
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(MembershipCalendarPicker);
