import { redirect } from 'next/navigation';

/**
 * Root of the App Router.
 *
 * The preserved static prototype lives at /index.html (served from /public);
 * all existing pages (tickets.html, visas.html, request.html, join-agent.html,
 * agent.html, offer-details.html, admin.html) remain available at their
 * original URLs. The App Router adds the backend API under /api/*.
 *
 * We redirect the bare `/` to the prototype home so the original visual design
 * is preserved while the API foundation is introduced alongside it.
 */
export default function HomePage() {
  redirect('/index.html');
}
