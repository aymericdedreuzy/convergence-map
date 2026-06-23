/**
 * licence-check.js — Convergence Map
 * Vérification des licences par événement (code) ou par utilisateur (uid)
 */

export const PLANS = {
  freemium: {
    label:            'Freemium',
    maxParticipants:  10,
    maxEventDuration: 2,          // heures max par événement
    historyDays:      7,          // 1 semaine
    replay:           true,
    exportVideo:      false,
    exportGpx:        false,
    branding:         true,
    customLogo:       false,
    notifications:    false,
  },
  standard: {
    label:            'Standard',
    maxParticipants:  50,
    maxEventDuration: 5,          // heures max par événement
    historyDays:      14,         // 2 semaines
    replay:           true,
    exportVideo:      true,
    exportGpx:        true,
    branding:         false,
    customLogo:       false,
    notifications:    false,
  },
  pro: {
    label:            'Pro',
    maxParticipants:  Infinity,
    maxEventDuration: Infinity,
    historyDays:      30,         // 1 mois
    replay:           true,
    exportVideo:      true,
    exportGpx:        true,
    branding:         false,
    customLogo:       false,
    notifications:    false,
  },
  orga: {
    label:            'Organisation',
    maxParticipants:  Infinity,
    maxEventDuration: Infinity,
    historyDays:      365,        // 1 an
    replay:           true,
    exportVideo:      true,
    exportGpx:        true,
    branding:         false,
    customLogo:       false,
    notifications:    false,
  },
};

export async function getLicence(db, { code, uid } = {}) {
  const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
  const now = Date.now();

  if (uid) {
    try {
      const snap = await get(ref(db, `licences/users/${uid}`));
      if (snap.exists()) {
        const data = snap.val();
        const expired = data.expiresAt && data.expiresAt < now;
        if (!expired && PLANS[data.plan]) {
          return { plan: data.plan, limits: PLANS[data.plan], expiresAt: data.expiresAt || null, source: 'user', expired: false };
        }
      }
    } catch (e) {}
  }

  if (code) {
    try {
      const snap = await get(ref(db, `licences/events/${code}`));
      if (snap.exists()) {
        const data = snap.val();
        const expired = data.expiresAt && data.expiresAt < now;
        if (!expired && PLANS[data.plan]) {
          return { plan: data.plan, limits: PLANS[data.plan], expiresAt: data.expiresAt || null, source: 'event', expired: false };
        }
        if (expired) {
          return { plan: 'freemium', limits: PLANS.freemium, source: 'event', expired: true };
        }
      }
    } catch (e) {}
  }

  return { plan: 'freemium', limits: PLANS.freemium, source: 'default', expired: false };
}

export function renderPlanBadge(plan) {
  const colors = { freemium: '#475569', standard: '#f97316', pro: '#38bdf8', orga: '#a855f7' };
  const color = colors[plan] || '#475569';
  const label = PLANS[plan]?.label || plan;
  return `<span style="font-size:0.65rem;font-weight:700;padding:2px 9px;border-radius:10px;background:${color}22;color:${color};border:1px solid ${color}44;text-transform:uppercase;letter-spacing:0.06em;">${label}</span>`;
}
