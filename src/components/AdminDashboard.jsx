import { useEffect, useState } from 'react';

const api = 'https://api.japanday.sk';
const link = (path, text) => <a href={path}>{text}</a>;
function useAdminData(path) {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  useEffect(() => {
    let live = true;
    fetch(`${api}${path}`, { credentials: 'include', cache: 'no-store' })
      .then(async (r) => { if (r.status === 401) throw new Error('Sign in through your organization account to continue.'); if (r.status === 403) throw new Error('Your account is not authorized for this information.'); if (!r.ok) throw new Error('Dashboard data could not be loaded.'); return r.json(); })
      .then((result) => { if (live) setState({ loading: false, data: result.data, error: '' }); })
      .catch((error) => { if (live) setState({ loading: false, data: null, error: error.message }); });
    return () => { live = false; };
  }, [path]);
  return state;
}
function State({ state }) { return state.loading ? <p role="status">Loading…</p> : state.error ? <p role="alert">{state.error}</p> : null; }
function workshopRow(w) { return <li key={w.id}>{link(`/admin/workshops/${encodeURIComponent(w.id)}/`, w.title)} — {w.lecturer || '—'} · {w.session_count} sessions · {w.registered_count}/{w.capacity} registered · {Math.max(0,w.capacity-w.registered_count)} available</li>; }
export default function AdminDashboard({ path }) {
  const match = path.match(/^\/admin\/workshops\/([^/]+)\/?$/);
  const session = path.match(/^\/admin\/sessions\/([^/]+)\/?$/);
  const endpoint = match ? `/api/admin/workshops/${match[1]}` : session ? `/api/admin/sessions/${session[1]}/registrations` : path.replace(/\/$/,'') === '/admin/workshops' ? '/api/admin/workshops' : '/api/admin/summary';
  const state = useAdminData(endpoint);
  const data = state.data;
  return <main className="adminDashboard"><h1>Workshop dashboard</h1><nav>{link('/admin/','Overview')} · {link('/admin/workshops/','Workshops')}</nav><State state={state}/>
    {!state.loading && !state.error && data && (match ? <><h2>{data.workshop.title}</h2><p>{data.workshop.lecturer} · {data.workshop.location}</p><p>{data.workshop.short_description}</p><h2>Sessions</h2><ul>{data.sessions.map(s=><li key={s.id}>{link(`/admin/sessions/${encodeURIComponent(s.id)}/`,`${s.start_at}${s.end_at ? `–${s.end_at}` : ''}`)} · {s.registered_count}/{s.capacity} registered · {s.waitlist_count} waitlisted · {s.available} available</li>)}</ul></> : session ? <><h2>Session registrations</h2><p>Registered: {data.session.registered_count} / {data.session.capacity} · Available: {data.session.available} · Waitlist: {data.session.waitlist_count}</p><p>{link(`${api}/api/admin/sessions/${session[1]}/export.csv`,'Download CSV')}</p><div className="adminTableWrap"><table><thead><tr>{['First name','Last name','Email','Phone','Status','Payment status','Created at'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{data.registrations.map((r,i)=><tr key={`${r.email}-${i}`}>{[r.first_name,r.last_name,r.email,r.phone,r.status,r.payment_status,r.created_at].map((v,j)=><td key={j}>{v}</td>)}</tr>)}</tbody></table></div></> : Array.isArray(data) ? <><h2>All workshops</h2><ul>{data.map(workshopRow)}</ul></> : <><p>{data.workshop_count} workshops · {data.registrations} registered · {data.waitlist} waitlisted · {data.capacity} capacity</p><ul>{data.workshops.map(workshopRow)}</ul></>)}
  </main>;
}
