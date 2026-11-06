import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { subscribeToAuth, getUserProfile, logoutUser } from '../auth.js';
import { startTimeTracking, stopTimeTracking } from '../utils/timeTracker.js';
import { purgeUnscopedUserData, purgeUserDataFor } from '../utils/deviceData.js';
import { resolveRole } from './roles.js';
import { useLocale } from './i18n/LocaleProvider.jsx';

const AuthContext = createContext(null);

/**
 * Single source of truth for who is signed in and what they may see.
 *
 * Role and classIds come from the signed auth claim - the SAME source the
 * Firestore rules read. The Firestore profile supplies display data only
 * (name, group, age band).
 *
 * That split matters. When the UI took its role from the profile document while
 * the rules took theirs from the claim, the two could disagree: a coach whose
 * profile document was missing or stale was shown the student app while holding
 * full coach read access. Reading both from the claim makes that impossible.
 *
 * Neither is ever derived from the email address or from localStorage - that was
 * the privilege-escalation bug fixed in Phase 0.
 *
 * The provider fails closed: if the profile cannot be read, the user is signed
 * out rather than defaulted to a role.
 */
/**
 * Tear down UI owned by imperative, non-React code before the signed-in user
 * changes.
 *
 * The goal-setting wizard appends itself to document.body and lives outside the
 * React tree, so nothing unmounts it on sign-out. The old vanilla main.js
 * removed it on every auth state change; that teardown was lost in the React
 * migration, and the result was one account's wizard sitting on top of the next
 * account's screen - including a student's wizard over a coach's dashboard.
 */
function clearImperativeOverlays() {
  document.getElementById('goal-setting-modal')?.remove();
}

export function AuthProvider({ children, onThemeLoaded }) {
  const { setLocale } = useLocale();
  const [state, setState] = useState({
    status: 'loading', // 'loading' | 'signed-out' | 'ready'
    user: null,
    profile: null,
    role: null,
    classIds: [],
    cohortIds: [],
    orgId: null,
    error: null,
    themePreference: 'light'
  });

  // Every observer event starts a new generation; an async step continues only while its
  // generation is current, so a slow callback for one account can never touch the next.
  const generation = useRef(0);
  // Identity (uid) changes only on sign-in, sign-out or switching account; profile refreshes check it.
  const identity = useRef({ uid: null, ready: false, profile: null, seq: 0 });
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    let unmounted = false;
    purgeUnscopedUserData();
    const live = (gen) => !unmounted && gen === generation.current;
    const claimsOf = async (user) => {
      try { return (await user.getIdTokenResult())?.claims || {}; } catch { return {}; } // non-forced: no refresh loop
    };
    const scopeOf = (claims, profile) => ({
      role: resolveRole(claims, profile),
      classIds: (Array.isArray(claims.classIds) && claims.classIds.length > 0) ? claims.classIds : (Array.isArray(profile?.classIds) ? profile.classIds : []),
      cohortIds: (Array.isArray(claims.cohortIds) && claims.cohortIds.length > 0) ? claims.cohortIds : (Array.isArray(profile?.cohortIds) ? profile.cohortIds : []),
      orgId: typeof claims.orgId === 'string' && claims.orgId ? claims.orgId : null
    });

    async function signedIn(user, gen) {
      // Also on sign-IN: switching accounts in one page load fires this with a
      // new user and never passes through the signed-out branch.
      clearImperativeOverlays();
      setState((s) => ({ ...s, status: 'loading', orgId: null }));

      const profile = await getUserProfile(user.uid, user.email);
      if (!live(gen)) return;

      if (!profile) {
        // getUserProfile returns null only when the read failed. Guessing a role
        // here is exactly what used to hand out coach access.
        await logoutUser();
        if (!live(gen)) return;
        setState({
          status: 'signed-out', user: null, profile: null, role: null, classIds: [], cohortIds: [], orgId: null,
          error: 'Could not load your profile. Please sign in again.'
        });
        return;
      }

      const claims = await claimsOf(user);
      if (!live(gen)) return;

      // A suspended account is refused by the API immediately, but an ID token
      // already issued stays valid in Firestore rules for up to an hour. Signing
      // out here closes that window in this browser.
      if (profile.status === 'suspended') {
        await logoutUser();
        if (!live(gen)) return;
        setState({
          status: 'signed-out', user: null, profile: null, role: null, classIds: [], cohortIds: [], orgId: null,
          error: 'This account is suspended. Please contact the school.'
        });
        return;
      }

      const claimRole = claims.role;
      const profileRole = profile.role;
      const { role, classIds, cohortIds, orgId } = scopeOf(claims, profile);

      if (role === 'teacher' && profileRole && claimRole && profileRole !== claimRole) {
        console.warn(
          `[Auth] Profile role "${profileRole}" disagrees with the auth claim "${claimRole}". ` +
          'Re-run scripts/grant-coach.js to resync the mirror.'
        );
      }

      startTimeTracking(user.uid);

      // The language saved to the account follows the learner between devices.
      if (profile.locale) setLocale(profile.locale);

      // Theme preference is passed up to the App to initialize ThemeProvider
      const themePreference = profile.themePreference || 'light';
      if (onThemeLoaded) onThemeLoaded(themePreference);

      // Cached so the legacy inline activity code can read the band without an
      // async profile fetch. A presentation hint only - the server re-resolves
      // it and never treats it as a privilege signal.
      try {
        localStorage.setItem('ageBand', profile.ageBand || '13-15');
      } catch { /* private browsing */ }

      // The legacy inline script still branches on this for coach preview mode.
      window.currentUserRole = role;

      // Organization scope comes only from the signed ID token claim, never the client-writable
      // profile. Screens that keep organization data (My Universe missions, mission reviews)
      // stay closed without it; the mission service re-verifies it on every request.
      identity.current = { ...identity.current, ready: true, profile };
      setState({
        status: 'ready',
        user,
        profile,
        role,
        classIds,
        cohortIds,
        orgId,
        themePreference,
        error: null
      });
    }

    // Same account, new ID token (refresh, or claims changed server-side): re-read its claims
    // without reloading the profile. An organization change or removal applies at once; a role
    // change takes the full fail-closed load path again rather than being patched in place.
    async function tokenChanged(user, gen) {
      const claims = await claimsOf(user);
      if (!live(gen)) return;
      const next = scopeOf(claims, identity.current.profile);
      const now = latest.current;
      if (now.status !== 'ready' || now.user?.uid !== user.uid) return;
      if (next.role !== now.role) { identity.current = { ...identity.current, ready: false }; await signedIn(user, gen); return; }
      const sameClasses = next.classIds.length === now.classIds.length && next.classIds.every((c, i) => c === now.classIds[i]);
      const sameCohorts = next.cohortIds.length === now.cohortIds.length && next.cohortIds.every((c, i) => c === now.cohortIds[i]);
      if (next.orgId === now.orgId && sameClasses && sameCohorts) return;
      setState((s) => (s.status === 'ready' && s.user?.uid === user.uid ? { ...s, orgId: next.orgId, classIds: next.classIds, cohortIds: next.cohortIds } : s));
    }

    const unsubscribe = subscribeToAuth((user) => {
      if (unmounted) return;
      const gen = ++generation.current;

      if (!user) {
        identity.current = { uid: null, ready: false, profile: null, seq: identity.current.seq + 1 };
        stopTimeTracking();
        clearImperativeOverlays();
        setState({ status: 'signed-out', user: null, profile: null, role: null, classIds: [], cohortIds: [], orgId: null, error: null });
        return;
      }

      if (user.uid === identity.current.uid && identity.current.ready) { tokenChanged(user, gen); return; }
      if (user.uid !== identity.current.uid) identity.current = { uid: user.uid, ready: false, profile: null, seq: identity.current.seq + 1 };
      signedIn(user, gen);
    }, { tokens: true });

    return () => {
      unmounted = true;
      generation.current += 1;
      unsubscribe?.();
    };
  }, []);

  /**
   * Re-read the profile without a full sign-out.
   *
   * Joining a class changes `classIds` in Firestore, but the provider only
   * loads the profile on an auth state change - so without this the learner
   * would be told they had joined while the dashboard carried on insisting they
   * were in no class until they signed out and back in.
   *
   * The answer is applied only if the same account is still signed in: a slow read
   * for one account must never land on the next one's screen.
   */
  const refreshProfile = async () => {
    const current = state.user;
    if (!current) return;
    const seq = identity.current.seq;
    const profile = await getUserProfile(current.uid, current.email);
    if (!profile || seq !== identity.current.seq || identity.current.uid !== current.uid) return;
    identity.current = { ...identity.current, profile };
    setState((s) => (s.status === 'ready' && s.user?.uid === current.uid ? { ...s, profile } : s));
  };

  const signOut = async () => {
    stopTimeTracking();
    window.currentUserRole = null;
    purgeUserDataFor(state.user?.uid);
    await logoutUser();
  };

  return (
    <AuthContext.Provider value={{ ...state, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
