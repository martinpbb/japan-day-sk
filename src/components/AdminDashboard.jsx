import { useEffect, useState } from 'react';

const api = 'https://api.japanday.sk';
const signInUrl = `${api}/api/admin/summary`;
const link = (path, text, props = {}) => <a href={path} {...props}>{text}</a>;
const adminError = (type) => Object.assign(new Error(type), { type });
const timezone = 'Europe/Bratislava';

function parseDate(value) {
  if (!value) return null;
  const localTimestamp = typeof value === 'string' && /^(\d{4})-(\d\d)-(\d\d)[ T](\d\d):(\d\d)(?::(\d\d))?$/.exec(value);
  let date;
  if (localTimestamp) {
    const [, year, month, day, hour, minute, second = '0'] = localTimestamp;
    const wallTime = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
    const initial = new Date(wallTime);
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' }).formatToParts(initial);
    const offset = parts.find((part) => part.type === 'timeZoneName')?.value?.match(/GMT([+-])(\d{2}):(\d{2})/);
    const offsetMinutes = offset ? (offset[1] === '+' ? 1 : -1) * (Number(offset[2]) * 60 + Number(offset[3])) : 0;
    date = new Date(wallTime - offsetMinutes * 60_000);
  } else date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('sk-SK', { timeZone: timezone, day: 'numeric', month: 'numeric', year: 'numeric' }).format(date) : value || '—';
}

function formatTime(value) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('sk-SK', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date) : '';
}

function formatSession(session) {
  const start = formatTime(session.start_at);
  const end = formatTime(session.end_at);
  const date = formatDate(session.start_at);
  return { date, time: start ? `${start}${end ? `–${end}` : ''}` : date };
}

function formatCreatedAt(value) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('sk-SK', { timeZone: timezone, day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date) : value || '—';
}

const registrationStatuses = { registered: 'Registrovaný', waitlist: 'Čakacia listina', cancelled: 'Zrušený' };
const paymentStatuses = { free: 'Bezplatné', paid: 'Zaplatené', pending: 'Čaká na platbu', not_due: 'Zatiaľ sa neplatí', cancelled: 'Zrušené' };
function StatusBadge({ value, labels, kind }) {
  return <span className={`adminBadge adminBadge--${kind}`}>{labels[value] || value || '—'}</span>;
}

function useAdminData(path, enabled = true) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, data: null, error: null });
      return undefined;
    }
    let live = true;
    fetch(`${api}${path}`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) throw adminError('unauthenticated');
        if (response.status === 403) throw adminError('forbidden');
        if (!response.ok) throw adminError('api-error');
        return response.json();
      })
      .then((result) => { if (live) setState({ loading: false, data: result.data, error: null }); })
      .catch((error) => { if (live) setState({ loading: false, data: null, error: error?.type || 'unreachable' }); });
    return () => { live = false; };
  }, [path, enabled]);
  return state;
}

function State({ state }) {
  if (state.loading) return <p role="status">Načítava sa…</p>;
  if (!state.error) return null;
  if (state.error === 'unauthenticated') return <div role="alert"><p>Na prístup k údajom workshopov sa prihláste.</p>{link(signInUrl, 'Prihlásiť sa', { className: 'button' })}</div>;
  if (state.error === 'forbidden') return <p role="alert">Váš účet nemá oprávnenie na zobrazenie týchto údajov. Ak potrebujete prístup, kontaktujte administrátora.</p>;
  if (state.error === 'unreachable') return <div role="alert"><p>Administračné rozhranie sa nepodarilo načítať. Skúste sa prihlásiť alebo to skúste neskôr.</p>{link(signInUrl, 'Prihlásiť sa', { className: 'button' })}</div>;
  return <p role="alert">Údaje sa nepodarilo načítať. Skúste to znova neskôr.</p>;
}

function Occupancy({ session, compact = false }) {
  return <div className={`adminOccupancy${compact ? ' adminOccupancy--compact' : ''}`}>
    <span><strong>{session.registered_count ?? 0} / {session.capacity ?? 0}</strong> registrovaných</span>
    <span><strong>{session.available ?? 0}</strong> voľných miest</span>
    <span><strong>{session.waitlist_count ?? 0}</strong> čakateľov</span>
  </div>;
}

function workshopRow(workshop) {
  return <li className="adminWorkshopRow" key={workshop.id}>
    {link(`/admin/workshops/${encodeURIComponent(workshop.id)}/`, workshop.title)}
    <span>{workshop.lecturer || 'Lektor bude doplnený'} · {workshop.session_count} termínov · {workshop.registered_count}/{workshop.capacity} registrovaných</span>
  </li>;
}

export default function AdminDashboard({ path }) {
  const workshopMatch = path.match(/^\/admin\/workshops\/([^/]+)\/?$/);
  const sessionMatch = path.match(/^\/admin\/sessions\/([^/]+)\/?$/);
  const endpoint = workshopMatch ? `/api/admin/workshops/${workshopMatch[1]}`
    : sessionMatch ? `/api/admin/sessions/${sessionMatch[1]}/registrations`
      : path.replace(/\/$/, '') === '/admin/workshops' ? '/api/admin/workshops' : '/api/admin/summary';
  const state = useAdminData(endpoint);
  const data = state.data;
  const sessionWorkshopId = sessionMatch && data?.session?.workshop_id;
  const workshopState = useAdminData(sessionWorkshopId ? `/api/admin/workshops/${encodeURIComponent(sessionWorkshopId)}` : '', Boolean(sessionWorkshopId));
  const workshopTitle = workshopState.data?.workshop?.title;
  const detailSession = data?.session;
  const sessionDisplay = detailSession ? formatSession(detailSession) : null;

  return <main className="adminDashboard">
    <h1>Workshop dashboard</h1>
    <nav aria-label="Drobečková navigácia" className="adminBreadcrumbs">{link('/admin/', 'Overview')}<span aria-hidden="true">›</span>{link('/admin/workshops/', 'Workshopy')}{workshopMatch && data?.workshop ? <><span aria-hidden="true">›</span><span aria-current="page">{data.workshop.title}</span></> : null}{sessionMatch && workshopTitle ? <><span aria-hidden="true">›</span>{link(`/admin/workshops/${encodeURIComponent(detailSession.workshop_id)}/`, workshopTitle)}<span aria-hidden="true">›</span><span aria-current="page">Termín</span></> : null}</nav>
    {workshopMatch ? link('/admin/workshops/', '← Späť na workshopy', { className: 'adminBackLink' }) : null}
    {sessionMatch && workshopTitle ? link(`/admin/workshops/${encodeURIComponent(detailSession.workshop_id)}/`, `← Späť na ${workshopTitle}`, { className: 'adminBackLink' }) : null}
    <State state={state} />
    {!state.loading && !state.error && data && (workshopMatch
      ? <>
          <h2>{data.workshop.title}</h2>
          <p className="adminWorkshopMeta">{data.workshop.lecturer} · {data.workshop.location}</p>
          <p>{data.workshop.short_description}</p>
          <h2>Termíny</h2>
          <div className="adminSessionList">{data.sessions.map((session) => {
            const display = formatSession(session);
            return <a className="adminSessionCard" key={session.id} href={`/admin/sessions/${encodeURIComponent(session.id)}/`}>
              <span className="adminSessionCard__date">{display.date}</span><strong className="adminSessionCard__time">{display.time}</strong><Occupancy session={session} compact />
            </a>;
          })}</div>
        </>
      : sessionMatch
        ? <>
            {workshopTitle && <h2>{workshopTitle}</h2>}
            <section className="adminSessionHeader" aria-label="Prehľad termínu">
              <h3>{workshopTitle ? `${workshopTitle} · ` : ''}{sessionDisplay?.date} · {sessionDisplay?.time}</h3>
              <Occupancy session={detailSession} />
            </section>
            {link(`${api}/api/admin/sessions/${sessionMatch[1]}/export.csv`, 'Stiahnuť CSV', { className: 'adminCsvLink' })}
            <div className="adminTableWrap" role="region" aria-label="Zoznam registrácií" tabIndex="0"><table>
              <thead><tr>{['Meno', 'Priezvisko', 'E-mail', 'Telefón', 'Stav', 'Platba', 'Registrovaný'].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
              <tbody>{data.registrations.map((registration, index) => <tr key={`${registration.email}-${index}`}>
                <td>{registration.first_name || '—'}</td><td>{registration.last_name || '—'}</td>
                <td>{registration.email ? link(`mailto:${registration.email}`, registration.email) : '—'}</td>
                <td>{registration.phone ? link(`tel:${registration.phone}`, registration.phone) : '—'}</td>
                <td><StatusBadge value={registration.status} labels={registrationStatuses} kind="registration" /></td>
                <td><StatusBadge value={registration.payment_status} labels={paymentStatuses} kind="payment" /></td>
                <td>{formatCreatedAt(registration.created_at)}</td>
              </tr>)}</tbody>
            </table></div>
          </>
        : Array.isArray(data)
          ? <><h2>Všetky workshopy</h2><ul className="adminWorkshopList">{data.map(workshopRow)}</ul></>
          : <><p className="adminSummary">{data.workshop_count} workshopov · {data.registrations} registrovaných · {data.waitlist} čakateľov · kapacita {data.capacity}</p><ul className="adminWorkshopList">{data.workshops.map(workshopRow)}</ul></>)
    }
  </main>;
}
