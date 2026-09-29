import { useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { hhmm, iso, localeOf, pad, todayISO } from '../utils';

// تقويم شهري: أخضر متاح / أصفر معلّق / أحمر محجوز / رمادي محجوب أو ماضٍ
export default function Calendar({ month, onMonthChange, bookings = [], blocked = [], selected, onSelect, admin = false }) {
  const { t, lang } = useI18n();
  const [hover, setHover] = useState(null);
  const [y, m] = month.split('-').map(Number);
  const today = todayISO();

  const byDay = useMemo(() => {
    const map = {};
    for (const b of bookings) (map[String(b.date).slice(0, 10)] ||= { list: [] }).list.push(b);
    for (const k in map) {
      const l = map[k].list;
      map[k].booked = l.some((b) => b.status === 'confirmed' || b.status === 'completed');
      map[k].pending = !map[k].booked && l.some((b) => b.status === 'pending');
    }
    return map;
  }, [bookings]);
  const blockedMap = useMemo(() => Object.fromEntries(blocked.map((b) => [String(b.date).slice(0, 10), b.reason])), [blocked]);

  const loc = localeOf(lang);
  const firstDow = new Date(y, m - 1, 1).getDay(); // 0 = الأحد
  const weekStart = lang === 'ar' ? 6 : 0; // السبت في العربية
  const offset = (firstDow - weekStart + 7) % 7;
  const daysInMonth = new Date(y, m, 0).getDate();
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 7 + ((weekStart + i) % 7)); // 7 يناير 2024 = أحد
    return new Intl.DateTimeFormat(loc, { weekday: 'short' }).format(d);
  });
  const title = new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));

  const go = (delta) => {
    const d = new Date(y, m - 1 + delta, 1);
    onMonthChange(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  };

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(iso(y, m - 1, d));

  const info = (date) => {
    const bd = byDay[date];
    if (date in blockedMap) return { kind: 'blocked', disabled: !admin };
    if (!admin && date < today) return { kind: 'past', disabled: true };
    if (bd?.booked) return { kind: 'booked', disabled: !admin };
    if (bd?.pending) return { kind: 'pending', disabled: false };
    return { kind: 'free', disabled: false };
  };
  const STYLE = {
    free: 'bg-emerald-50 text-emerald-900 ring-emerald-200 hover:bg-emerald-100',
    pending: 'bg-amber-100 text-amber-900 ring-amber-300 hover:bg-amber-200',
    booked: 'bg-rose-100 text-rose-900 ring-rose-300',
    blocked: 'bg-ink/15 text-ink/50 ring-ink/20',
    past: 'bg-transparent text-ink/30 ring-transparent',
  };

  const detailsDate = hover || selected;
  const details = detailsDate ? byDay[detailsDate]?.list || [] : [];

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => go(-1)} className="btn btn-line btn-sm" aria-label="prev">{lang === 'ar' ? '›' : '‹'}</button>
        <h3 className="text-lg font-black">{title}</h3>
        <button type="button" onClick={() => go(1)} className="btn btn-line btn-sm" aria-label="next">{lang === 'ar' ? '‹' : '›'}</button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {weekdays.map((w, i) => <div key={i} className="pb-1 text-xs font-bold text-ink/50">{w}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />;
          const { kind, disabled } = info(date);
          const isSel = selected === date;
          return (
            <button
              key={date} type="button" disabled={disabled}
              onClick={() => onSelect?.(date)}
              onMouseEnter={() => setHover(date)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(date)} onBlur={() => setHover(null)}
              aria-label={`${date} — ${kind}`}
              className={`relative aspect-square rounded-xl text-sm font-bold ring-1 transition disabled:cursor-not-allowed ${STYLE[kind]} ${isSel ? '!ring-2 !ring-ink' : ''} ${date === today ? 'underline decoration-gold-deep decoration-2 underline-offset-4' : ''}`}
            >
              {Number(date.slice(8))}
              {admin && byDay[date] && <span className="absolute bottom-0.5 end-1 text-[10px] font-black">{byDay[date].list.length}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {[['free', 'legend_free'], ['pending', 'legend_pending'], ['booked', 'legend_booked'], ['blocked', 'legend_blocked']].map(([k, l]) => (
          <span key={k} className="flex items-center gap-1.5"><i className={`inline-block h-3 w-3 rounded ring-1 ${STYLE[k]}`} />{t(l)}</span>
        ))}
      </div>

      {detailsDate && (
        <div className="mt-3 rounded-xl bg-ivory p-3 text-sm" aria-live="polite">
          <p className="mb-1 font-black">{t('day_details')}: {detailsDate}</p>
          {detailsDate in blockedMap && <p className="text-ink/70">{t('blocked_reason')}{blockedMap[detailsDate] ? `: ${blockedMap[detailsDate]}` : ''}</p>}
          {details.length === 0 && !(detailsDate in blockedMap) && <p className="text-ink/60">{t('nothing_that_day')}</p>}
          <ul className="space-y-0.5">
            {details.map((b, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>{hhmm(b.start_time)} – {hhmm(b.end_time)}{admin && b.customer_name ? ` · ${b.customer_name}` : ''}</span>
                <span className="font-bold">{t(`st_${b.status}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
