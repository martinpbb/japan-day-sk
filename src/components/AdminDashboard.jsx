import { useEffect, useState } from 'react';

const api = 'https://api.japanday.sk';
const signInUrl = `${api}/api/admin/summary`;
const link = (path, text) => <a href={path}>{text}</a>;
const adminError = (type) => Object.assign(new Error(type), { type });

function useAdminData(path) {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let live = true;
    fetch(`${api}${path}`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) throw adminError('unauthenticated');
        if (response.status === 403) throw adminError('forbidden');
        if (!response.ok) throw adminError('api-error');
        return response.json();
      })
      .then((result) => {
        if (live) setState({ loading: false, data: result.data, error: null });
      })
      .catch((error) => {
        if (live) setState({ loading: false, data: null, error: error?.type || 'unreachable' });
      });
    return () => { live = false; };
  }, [path]);

  return state;
}

function State({ state }) {
  if (state.loading) return <p role="status">Loading…</p>;
  if (!state.error) return null;

  if (state.error === 'unauthenticated') {
    return <div role="alert"><p>You need to sign in to access workshop data.</p><a className="button" href={signInUrl}>Sign in</a></div>;
  }
  if (state.error === 'forbidden') {
    return <p role="alert">Your account is not authorized to access this workshop data. Contact an administrator if you need access.</p>;
  }
  if (state.error === 'unreachable') {
    return <div role="alert"><p>Could not reach the admin API. It may require sign-in or be temporarily unavailable.</p><a className="button" href={signInUrl}>Sign in</a></div>;
  }
  return <p role="alert">Dashboard data could not be loaded. Please try again later.</p>;
}

function workshopRow(workshop) {
  return <li key={workshop.id}>{link(`/admin/workshops/${encodeURIComponent(workshop.id)}/`, workshop.title)} — {workshop.lecturer || '—'} · {workshop.session_count} sessions · {workshop.registered_count}/{workshop.capacity} registered · {Math.max(0, workshop.capacity - workshop.registered_count)} available</li>;
}

export default function AdminDashboard({ path }) {
  const workshopMatch = path.match(/^\/admin\/workshops\/([^/]+)\/?$/);
  const sessionMatch = path.match(/^\/admin\/sessions\/([^/]+)\/?$/);
  const endpoint = workshopMatch
    ? `/api/admin/workshops/${workshopMatch[1]}`
    : sessionMatch
      ? `/api/admin/sessions/${sessionMatch[1]}/registrations`
      : path.replace(/\/$/, '') === '/admin/workshops'
        ? '/api/admin/workshops'
        : '/api/admin/summary';
  const state = useAdminData(endpoint);
  const data = state.data;

  return <main className="adminDashboard">
    <h1>Workshop dashboard</h1>
    <nav>{link('/admin/', 'Overview')} · {link('/admin/workshops/', 'Workshops')}</nav>
    <State state={state} />
    {!state.loading && !state.error && data && (workshopMatch
      ? <>
          <h2>{data.workshop.title}</h2>
          <p>{data.workshop.lecturer} · {data.workshop.location}</p>
          <p>{data.workshop.short_description}</p>
          <h2>Sessions</h2>
          <ul>{data.sessions.map((session) => <li key={session.id}>
            {link(`/admin/sessions/${encodeURIComponent(session.id)}/`, `${session.start_at}${session.end_at ? `–${session.end_at}` : ''}`)} · {session.registered_count}/{session.capacity} registered · {session.waitlist_count} waitlisted · {session.available} available
          </li>)}</ul>
        </>
      : sessionMatch
        ? <>
            <h2>Session registrations</h2>
            <p>Registered: {data.session.registered_count} / {data.session.capacity} · Available: {data.session.available} · Waitlist: {data.session.waitlist_count}</p>
            <p>{link(`${api}/api/admin/sessions/${sessionMatch[1]}/export.csv`, 'Download CSV')}</p>
            <div className="adminTableWrap"><table>
              <thead><tr>{['First name', 'Last name', 'Email', 'Phone', 'Status', 'Payment status', 'Created at'].map((label) => <th key={label}>{label}</th>)}</tr></thead>
              <tbody>{data.registrations.map((registration, index) => <tr key={`${registration.email}-${index}`}>
                {[registration.first_name, registration.last_name, registration.email, registration.phone, registration.status, registration.payment_status, registration.created_at].map((value, cellIndex) => <td key={cellIndex}>{value}</td>)}
              </tr>)}</tbody>
            </table></div>
          </>
        : Array.isArray(data)
          ? <><h2>All workshops</h2><ul>{data.map(workshopRow)}</ul></>
          : <><p>{data.workshop_count} workshops · {data.registrations} registered · {data.waitlist} waitlisted · {data.capacity} capacity</p><ul>{data.workshops.map(workshopRow)}</ul></>)}
  </main>;
}
