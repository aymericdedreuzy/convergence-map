/**
 * licence-check.js — Convergence Map
 * Vérification des licences par événement (code) ou par utilisateur (uid)
 *
 * Usage dans app.html / dashboard.html :
 *   import { getLicence, PLANS } from './licence-check.js';
 *   const licence = await getLicence(db, { code: 'PELE2025', uid: 'abc123' });
 *   if (licence.plan === 'pro') { ... }
 */

// ── Limites par plan ──────────────────────────────────────────────────────────
export const PLANS = {
  freemium: {
    label:           'Freemium',
    maxParticipants: 10,
    replay:          true,   // replay dans l'app OK
    exportVideo:     false,  // export MP4 bloqué
    exportGpx:       false,
    branding:        true,   // watermark forcé
    customLogo:      false,
    notifications:   false,
    historyDays:     3,
  },
  standard: {
    label:           'Standard',
    maxParticipants: 50,
    replay:          true,
    exportVideo:     true,
    exportGpx:       true,
    branding:        false,  // watermark retiré
    customLogo:      false,
    notifications:   false,
    historyDays:     7,
  },
  pro: {
    label:           'Pro',
    maxParticipants: Infinity,
    replay:          true,
    exportVideo:     true,
    exportGpx:       true,
    branding:        false,
    customLogo:      true,
    notifications:   true,
    historyDays:     30,
  },
  orga: {
    label:           'Organisation',
    maxParticipants: Infinity,
    replay:          true,
    exportVideo:     true,
    exportGpx:       true,
    branding:        false,
    customLogo:      true,
    notifications:   true,
    historyDays:     Infinity,
  },
};

// ── Récupère la licence active pour un événement ou un utilisateur ────────────
/**
 * @param {Database} db       — instance Firebase Realtime Database
 * @param {object}   context  — { code?: string, uid?: string }
 * @returns {object}  { plan, limits, expiresAt, source }
 *   plan    : 'freemium' | 'standard' | 'pro' | 'orga'
 *   limits  : objet PLANS[plan]
 *   source  : 'event' | 'user' | 'default'
 *   expired : boolean
 */
export async function getLicence(db, { code, uid } = {}) {
  const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
  const now = Date.now();

  // 1. Licence utilisateur (Orga) — prioritaire sur la licence événement
  if (uid) {
    try {
      const snap = await get(ref(db, `licences/users/${uid}`));
      if (snap.exists()) {
        const data = snap.val();
        const expired = data.expiresAt && data.expiresAt < now;
        if (!expired && PLANS[data.plan]) {
          return {
            plan:      data.plan,
            limits:    PLANS[data.plan],
            expiresAt: data.expiresAt || null,
            source:    'user',
            expired:   false,
          };
        }
      }
    } catch (e) { /* pas de licence user */ }
  }

  // 2. Licence événement (Standard / Pro)
  if (code) {
    try {
      const snap = await get(ref(db, `licences/events/${code}`));
      if (snap.exists()) {
        const data = snap.val();
        const expired = data.expiresAt && data.expiresAt < now;
        if (!expired && PLANS[data.plan]) {
          return {
            plan:      data.plan,
            limits:    PLANS[data.plan],
            expiresAt: data.expiresAt || null,
            source:    'event',
            expired:   false,
          };
        }
        // Licence expirée → retombe sur freemium
        if (expired) {
          return { plan:'freemium', limits:PLANS.freemium, source:'event', expired:true };
        }
      }
    } catch (e) { /* pas de licence event */ }
  }

  // 3. Par défaut → Freemium
  return { plan:'freemium', limits:PLANS.freemium, source:'default', expired:false };
}

// ── Helper : affiche un badge plan dans la topbar ─────────────────────────────
export function renderPlanBadge(plan) {
  const colors = {
    freemium: '#475569',
    standard: '#f97316',
    pro:      '#38bdf8',
    orga:     '#a855f7',
  };
  const color = colors[plan] || '#475569';
  const label = PLANS[plan]?.label || plan;
  return `<span style="
    font-size:0.65rem;font-weight:700;padding:2px 9px;border-radius:10px;
    background:${color}22;color:${color};border:1px solid ${color}44;
    text-transform:uppercase;letter-spacing:0.06em;
  ">${label}</span>`;
}
