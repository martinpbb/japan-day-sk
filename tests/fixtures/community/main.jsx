import React from 'react';
import { createRoot } from 'react-dom/client';
import { Feedback } from '../../../src/components/PostEventHome.jsx';
import '../../../src/styles/theme.css';
import '../../../src/styles/global.css';

const locale = new URLSearchParams(location.search).get('locale') || 'sk';
const data = await import(`../../../src/data/locales/${locale}/site.json`);
document.documentElement.lang = locale;
const copy = data.default.postEvent;
const flags = new URLSearchParams(location.search);
const config = { locale, apiBase: location.origin, consentVersion: '2026-01', getToken: async () => 'local-mocked-challenge' };
// This fixture is outside the production entry graph; no public enable switch.
createRoot(document.getElementById('root')).render(<main className="postEventHome"><h1>{copy.hero.lines.join(' ')}</h1><Feedback copy={copy.feedback} newsletter={copy.newsletter} common={copy.forms}
  config={flags.get('feedback') === 'off' ? null : config}
  newsletterConfig={flags.get('newsletter') === 'off' ? null : config} /></main>);
