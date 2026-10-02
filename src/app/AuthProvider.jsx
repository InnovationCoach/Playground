import { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuth, getUserProfile, logoutUser } from '../auth.js';
import { getAuthClaims } from '../firebase.js';
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
    error: null,
    themePreference: 'system'
  });

  useEffect(() => {
    let cancelled = false;
    purgeUnscopedUserData();

    const unsubscribe = subscribeToAuth(async (user) => {
      if (cancelled) return;

      if (!user) {
        stopTimeTracking();
        clearImperativeOverlays();
        setState({ status: 'signed-out', user: null, profile: null, role: null, classIds: [], error: null });
        return;
      }

      // Also on sign-IN: switching accounts in one page load fires this with a
      // new user and never passes through the signed-out branch.
      clearImperativeOverlays();
      setState((s) => ({ ...s, status: 'loading' }));

      const profile = await getUserProfile(user.uid, user.email);

      if (cancelled) return;

      if (!profile) {
        // getUserProfile returns null only when the read failed. Guessing a role
        // here is exactly what used to hand out coach access.
        await logoutUser();
        setState({
          status: 'signed-out', user: null, profile: null, role: null, classIds: [],
          error: 'Could not load your profile. Please sign in again.'
        });
        return;
      }

      const claims = await getAuthClaims();
      if (cancelled) return;

      // A suspended account is refused by the API immediately, but an ID token
      // already issued stays valid in Firestore rules for up to an hour. Signing
      // out here closes that window in this browser.
      if (profile.status === 'suspended') {
        await logoutUser();
        setState({
          status: 'signed-out', user: null, profile: null, role: null, classIds: [],
          error: 'This account is suspended. Please contact the school.'
        });
        return;
      }

      const claimRole = claims.role;
      const profileRole = profile.role;
      const role = resolveRole(claims, profile);

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
      const themePreference = profile.themePreference || 'system';
      if (onThemeLoaded) onThemeLoaded(themePreference);

      // Cached so the legacy inline activity code can read the band without an
      // async profile fetch. A presentation hint only - the server re-resolves
      // it and never treats it as a privilege signal.
      try {
        localStorage.setItem('ageBand', profile.ageBand || '13-15');
      } catch { /* private browsing */ }

      // The legacy inline script still branches on this for coach preview mode.
      window.currentUserRole = role;

      const classIds = (Array.isArray(claims.classIds) && claims.classIds.length > 0)
        ? claims.classIds
        : (Array.isArray(profile.classIds) ? profile.classIds : []);

      setState({
        status: 'ready',
        user,
        profile,
        role,
        classIds,
        themePreference,
        error: null
      });
    });

    return () => {
      cancelled = true;
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
   */
  const refreshProfile = async () => {
    const current = state.user;
    if (!current) return;
    const profile = await getUserProfile(current.uid, current.email);
    if (profile) setState((s) => ({ ...s, profile }));
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
