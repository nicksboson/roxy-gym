import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function startOfDay(d) {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function Calendar({ value, onChange, tileClassName, minDate, maxDate }) {
  const selectedDate = useMemo(() => {
    if (!value) return new Date();
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(selectedDate);
    d.setDate(1);
    return d;
  });

  const minTime = useMemo(() => startOfDay(minDate), [minDate]);
  const maxTime = useMemo(() => startOfDay(maxDate), [maxDate]);

  // Sync viewDate when selected date month changes
  useEffect(() => {
    if (value) {
      const d = value instanceof Date ? value : new Date(value);
      if (!isNaN(d.getTime())) {
        setViewDate(prev => {
          if (prev.getFullYear() === d.getFullYear() && prev.getMonth() === d.getMonth()) {
            return prev;
          }
          return new Date(d.getFullYear(), d.getMonth(), 1);
        });
      }
    }
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const isPrevDisabled = useMemo(() => {
    if (minTime === null) return false;
    const lastDayOfPrevMonth = new Date(year, month, 0);
    return (startOfDay(lastDayOfPrevMonth) ?? 0) < minTime;
  }, [minTime, year, month]);

  const isNextDisabled = useMemo(() => {
    if (maxTime === null) return false;
    const firstDayOfNextMonth = new Date(year, month + 1, 1);
    return (startOfDay(firstDayOfNextMonth) ?? 0) > maxTime;
  }, [maxTime, year, month]);

  const prevMonth = useCallback(() => {
    if (isPrevDisabled) return;
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, [isPrevDisabled]);

  const nextMonth = useCallback(() => {
    if (isNextDisabled) return;
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, [isNextDisabled]);

  const monthLabel = useMemo(() => {
    return viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [viewDate]);

  // Generate calendar days (previous month trailing days, current month days, next month leading days)
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month leading days (to fill 35 or 42 grid slots)
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  }, [year, month]);

  const handleDayClick = useCallback(
    (dayDate, isDisabled) => {
      if (isDisabled) return;
      onChange?.(dayDate);
    },
    [onChange]
  );

  return (
    <div className="react-calendar">
      <div className="react-calendar__navigation">
        <button
          type="button"
          aria-label="Previous month"
          className="react-calendar__navigation__arrow react-calendar__navigation__prev-button"
          onClick={prevMonth}
          disabled={isPrevDisabled}
          aria-disabled={isPrevDisabled}
        >
          ‹
        </button>
        <div className="react-calendar__navigation__label">
          <span>{monthLabel}</span>
        </div>
        <button
          type="button"
          aria-label="Next month"
          className="react-calendar__navigation__arrow react-calendar__navigation__next-button"
          onClick={nextMonth}
          disabled={isNextDisabled}
          aria-disabled={isNextDisabled}
        >
          ›
        </button>
      </div>

      <div className="react-calendar__viewContainer">
        <div className="react-calendar__month-view">
          <div>
            <div>
              <div className="react-calendar__month-view__weekdays">
                {WEEKDAYS.map(day => (
                  <div key={day} className="react-calendar__month-view__weekdays__weekday">
                    <abbr title={day}>{day}</abbr>
                  </div>
                ))}
              </div>

              <div className="react-calendar__month-view__days">
                {calendarDays.map(({ date, isCurrentMonth }) => {
                  const dayTime = startOfDay(date);
                  const isDisabled = Boolean(
                    (minTime !== null && dayTime < minTime) ||
                    (maxTime !== null && dayTime > maxTime)
                  );
                  const extraClass = tileClassName ? tileClassName({ date, view: 'month' }) : '';
                  const isNeighbor = !isCurrentMonth ? 'react-calendar__month-view__days__day--neighboringMonth' : '';
                  const isSelected = isSameDay(date, selectedDate) ? 'react-calendar__tile--active' : '';
                  const disabledClass = isDisabled ? 'react-calendar__tile--disabled' : '';
                  const fullClassName = `react-calendar__tile ${isNeighbor} ${extraClass || ''} ${isSelected} ${disabledClass}`.trim();

                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      className={fullClassName}
                      disabled={isDisabled}
                      aria-disabled={isDisabled}
                      onClick={() => handleDayClick(date, isDisabled)}
                    >
                      <time dateTime={date.toISOString()}>{date.getDate()}</time>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(Calendar);
