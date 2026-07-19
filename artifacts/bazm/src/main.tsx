import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';
import './i18n';

// When the frontend is deployed separately from the API (e.g. this build on
// Vercel, API on a different host), VITE_API_URL points requests at it.
// Unset for same-origin deployments (e.g. the ECS/Nginx setup, where the
// frontend and API share a domain and relative /api/... paths just work).
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

createRoot(document.getElementById('root')!).render(<App />);
