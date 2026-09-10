import {
  signUpUser,
  signInUser,
  logoutUser,
  subscribeToAuth,
  getUserProfile,
  createNote,
  fetchNotes,
  deleteNote
} from "./auth.js";
import { initializeSENGlobally } from './integrations/senIntegration.js';
import { renderSENToggle } from './components/SEN/SENPreferenceToggle.js';
import { initializeGoalSettingForUser } from './integrations/goalSettingIntegration.js';
import { startTimeTracking, stopTimeTracking } from './utils/timeTracker.js';
import CoachDashboard from './components/Coach/CoachDashboard.js';
import { seedCoachTestData } from './utils/seedCoachTestData.js';

// Auto-seed test data for validation
seedCoachTestData();

// DOM Elements
const authCard = document.getElementById("auth-card");
const dashboardCard = document.getElementById("dashboard-card");
const coachDashboardCard = document.getElementById("coach-dashboard-card");

const authForm = document.getElementById("auth-form");
const authRoleInput = document.getElementById("auth-role-input");
const roleBtnStudent = document.getElementById("role-btn-student");
const roleBtnTeacher = document.getElementById("role-btn-teacher");

const tabSignIn = document.getElementById("tab-signin");
const tabSignUp = document.getElementById("tab-signup");
const groupName = document.getElementById("group-name");
const displayNameInput = document.getElementById("display-name");
const classCodeInput = document.getElementById("class-code-input");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const logoutBtn = document.getElementById("logout-btn");
const userEmailSpan = document.getElementById("user-email");
const alertBox = document.getElementById("alert-box");

const noteForm = document.getElementById("note-form");
const noteTitleInput = document.getElementById("note-title");
const noteContentInput = document.getElementById("note-content");
const notesList = document.getElementById("notes-list");
const coachHintBanner = document.getElementById("coach-hint-banner");

let isSignUp = false;
let currentRole = 'student';
let coachDashboardInstance = null;

// UI Helpers
function showAlert(message, type = "error") {
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type}`;
  alertBox.classList.remove("hidden");
  setTimeout(() => {
    alertBox.classList.add("hidden");
  }, 5000);
}

// Role Selector Toggle (Student vs Coach)
if (roleBtnStudent && roleBtnTeacher) {
  roleBtnStudent.addEventListener("click", () => {
    currentRole = 'student';
    authRoleInput.value = 'student';
    roleBtnStudent.style.background = 'var(--primary)';
    roleBtnStudent.style.color = '#000';
    roleBtnTeacher.style.background = 'transparent';
    roleBtnTeacher.style.color = 'var(--text-muted)';
    authSubmitBtn.textContent = isSignUp ? "Sign Up as Student" : "Sign In as Student";
    if (coachHintBanner) coachHintBanner.style.display = "none";
  });

  roleBtnTeacher.addEventListener("click", () => {
    currentRole = 'teacher';
    authRoleInput.value = 'teacher';
    roleBtnTeacher.style.background = '#38bdf8';
    roleBtnTeacher.style.color = '#000';
    roleBtnStudent.style.background = 'transparent';
    roleBtnStudent.style.color = 'var(--text-muted)';
    authSubmitBtn.textContent = isSignUp ? "Sign Up as Coach / Teacher" : "Sign In as Coach / Teacher";
    if (coachHintBanner) coachHintBanner.style.display = "block";
  });
}

// Tab Switching (Sign In / Sign Up)
if (tabSignIn && tabSignUp) {
  tabSignIn.addEventListener("click", () => {
    isSignUp = false;
    tabSignIn.classList.add("active");
    tabSignUp.classList.remove("active");
    if (groupName) groupName.style.display = "none";
    authSubmitBtn.textContent = currentRole === 'teacher' ? "Sign In as Coach / Teacher" : "Sign In as Student";
  });

  tabSignUp.addEventListener("click", () => {
    isSignUp = true;
    tabSignUp.classList.add("active");
    tabSignIn.classList.remove("active");
    if (groupName) groupName.style.display = "block";
    authSubmitBtn.textContent = currentRole === 'teacher' ? "Sign Up as Coach / Teacher" : "Sign Up as Student";
  });
}

// Form Submission
if (authForm) {
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const role = authRoleInput?.value || currentRole || 'student';
    const group = classCodeInput?.value?.trim() || 'Climate Champions 7A';

    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = "Processing...";

    try {
      if (isSignUp) {
        const displayName = displayNameInput.value.trim();
        const result = await signUpUser(email, password, displayName, role, group);
        if (!result.success) {
          showAlert(result.error, "error");
        } else {
          showAlert("Account created successfully!", "success");
          if (role === 'teacher' || role === 'coach') {
            window.location.hash = "#/coach/dashboard";
            if (typeof window.switchPhase === 'function') window.switchPhase('coach');
          }
        }
      } else {
        const result = await signInUser(email, password);
        if (!result.success) {
          showAlert(result.error || "User not found or invalid password", "error");
        } else if (result.user) {
          const profile = await getUserProfile(result.user.uid);
          if (profile?.role === 'teacher' || profile?.role === 'coach') {
            window.location.hash = "#/coach/dashboard";
            if (typeof window.switchPhase === 'function') window.switchPhase('coach');
          }
        }
      }
    } catch (err) {
      showAlert(err.message || "Error logging in", "error");
    } finally {
      authSubmitBtn.disabled = false;
      authSubmitBtn.textContent = isSignUp
        ? (role === 'teacher' ? "Sign Up as Coach / Teacher" : "Sign Up as Student")
        : (role === 'teacher' ? "Sign In as Coach / Teacher" : "Sign In as Student");
    }
  });
}

// Sign Out
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      stopTimeTracking();
      await logoutUser();
      window.location.hash = "#/coach/login";
    } catch (err) {
      showAlert(err.message, "error");
    }
  });
}

// Route Hash Observer
function handleHashRoute() {
  const hash = window.location.hash || '';
  if (hash.includes('/coach/login')) {
    if (roleBtnTeacher) roleBtnTeacher.click();
    if (authCard) {
      authCard.style.display = "block";
      authCard.classList.remove("hidden");
    }
  } else if (hash.includes('/coach/dashboard')) {
    // Checked inside Auth state observer
  }
}

window.addEventListener('hashchange', handleHashRoute);
window.addEventListener('DOMContentLoaded', handleHashRoute);

// Auth State Observer
subscribeToAuth(async (user) => {
  const authStatus = document.getElementById("auth-status");
  const modal = document.getElementById("goal-setting-modal");
  const fullHash = window.location.hash || '';

  if (user) {
    if (modal) modal.remove();

    startTimeTracking(user.uid);
    const profile = await getUserProfile(user.uid);
    const isCoachEmail = user.email && (user.email.toLowerCase().includes('coach') || user.email.toLowerCase().includes('teacher'));
    const userRole = isCoachEmail ? 'teacher' : (profile?.role || 'student');
    console.log('[Auth] User logged in:', user.email, 'Role evaluated:', userRole, 'Profile:', profile);

    // Scenario 4: Student tries coach login / dashboard access
    if (fullHash.includes('/coach') && userRole !== 'teacher' && userRole !== 'coach') {
      showAlert("This account does not have coach access", "error");
      await logoutUser();
      window.location.hash = "#/coach/login";
      return;
    }

    window.currentUserRole = userRole;
    const btnCoachPortal = document.getElementById("btn-coach-portal");
    const senToggle = document.getElementById("sen-preference-toggle");

    if (userRole === 'teacher' || userRole === 'coach') {
      // Hide student dashboard & SEN toggle & auth card & activity containers
      if (authCard) authCard.style.display = "none";
      if (dashboardCard) dashboardCard.style.display = "none";
      if (senToggle) senToggle.style.display = "none";
      if (btnCoachPortal) btnCoachPortal.style.display = "inline-flex";

      // Hide activity buttons for coaches - they should only see coach dashboard
      const btnHome = document.getElementById("btn-home");
      const btnPhase1 = document.getElementById("btn-phase1");
      const btnBunker = document.getElementById("btn-bunker");
      const btnCoding = document.getElementById("btn-coding");
      const btnBangkok = document.getElementById("btn-bangkok");
      const btnSolar = document.getElementById("btn-solar");

      if (btnHome) btnHome.style.display = "none";
      if (btnPhase1) btnPhase1.style.display = "none";
      if (btnBunker) btnBunker.style.display = "none";
      if (btnCoding) btnCoding.style.display = "none";
      if (btnBangkok) btnBangkok.style.display = "none";
      if (btnSolar) btnSolar.style.display = "none";

      const homeContainer = document.getElementById("home-container");
      const p1Container = document.getElementById("phase1-container");
      const bunkerContainer = document.getElementById("bunker-container");
      const codingContainer = document.getElementById("coding-container");
      const bangkokContainer = document.getElementById("bangkok-container");
      const solarContainer = document.getElementById("solar-container");

      if (homeContainer) homeContainer.classList.add("hidden");
      if (p1Container) p1Container.classList.add("hidden");
      if (bunkerContainer) bunkerContainer.classList.add("hidden");
      if (codingContainer) codingContainer.classList.add("hidden");
      if (bangkokContainer) bangkokContainer.classList.add("hidden");
      if (solarContainer) solarContainer.classList.add("hidden");

      if (userEmailSpan) userEmailSpan.textContent = user.email;
      if (logoutBtn) logoutBtn.style.display = "inline-block";

      if (coachDashboardCard) {
        console.log('[Coach] Showing coach dashboard...');
        coachDashboardCard.style.display = "block";
        coachDashboardCard.classList.remove("hidden");

        try {
          if (typeof window.switchPhase === 'function') {
            window.switchPhase('coach');
          }
          if (!coachDashboardInstance) {
            coachDashboardInstance = new CoachDashboard({
              containerId: 'coach-dashboard-card',
              coachUser: { uid: user.uid, email: user.email, displayName: profile?.displayName || 'Coach' }
            });
            await coachDashboardInstance.init();
          }
          console.log('[Coach] Coach dashboard initialized successfully');
          window.location.hash = "#/coach/dashboard";
        } catch (error) {
          console.error('[Coach] Error initializing coach dashboard:', error);
          showAlert('Error loading coach dashboard: ' + error.message, 'error');
        }
      }

      window.showCoachPortal = () => {
        window.isCoachPreviewingMode = false;
        if (typeof window.switchPhase === 'function') {
          window.switchPhase('coach');
        } else if (coachDashboardCard) {
          coachDashboardCard.style.display = "block";
          coachDashboardCard.classList.remove("hidden");
        }
      };

        // Scenario 7: Direct student detail hash navigation /coach/student/:studentId
        if (fullHash.includes('/coach/student/')) {
          const studentId = fullHash.split('/coach/student/')[1];
          if (studentId) {
            coachDashboardInstance.selectedStudent = coachDashboardInstance.students.find(s => s.uid === studentId) || null;
            coachDashboardInstance.render();
          }
        }
    } else {
      if (btnCoachPortal) btnCoachPortal.style.display = "none";
      // Student Dashboard
      if (coachDashboardCard) coachDashboardCard.style.display = "none";
      if (authCard) authCard.style.display = "none";
      if (dashboardCard) {
        dashboardCard.style.display = "block";
        dashboardCard.classList.remove("hidden");
      }

      // Show activity buttons for students
      const btnHome = document.getElementById("btn-home");
      const btnPhase1 = document.getElementById("btn-phase1");
      const btnBunker = document.getElementById("btn-bunker");
      const btnCoding = document.getElementById("btn-coding");
      const btnBangkok = document.getElementById("btn-bangkok");
      const btnSolar = document.getElementById("btn-solar");

      if (btnHome) btnHome.style.display = "inline-flex";
      if (btnPhase1) btnPhase1.style.display = "inline-flex";
      if (btnBunker) btnBunker.style.display = "inline-flex";
      if (btnCoding) btnCoding.style.display = "inline-flex";
      if (btnBangkok) btnBangkok.style.display = "inline-flex";
      if (btnSolar) btnSolar.style.display = "inline-flex";

      if (userEmailSpan) userEmailSpan.textContent = user.email;
      if (logoutBtn) logoutBtn.style.display = "inline-block";

      // Show home container for students only
      const homeContainer = document.getElementById("home-container");
      if (homeContainer) homeContainer.style.display = "block";

      initializeSENGlobally({
        userId: user.uid,
        senEnabled: localStorage.getItem('senEnabled') === 'true',
        geminiEndpoint: 'http://localhost:3001/api'
      });

      try { renderSENToggle('sen-preference-toggle'); } catch (e) {}
      try { initializeGoalSettingForUser(user.uid); } catch (e) {}
      loadNotes();
    }
  } else {
    // Logged Out - Show only login form, hide all content
    stopTimeTracking();
    if (modal) modal.remove();

    // Scenario 5: Direct navigation to /coach/dashboard without login
    if (fullHash.includes('/coach/dashboard') || fullHash.includes('/coach/student')) {
      window.location.hash = "#/coach/login";
    }

    if (authCard) {
      authCard.style.display = "block";
      authCard.classList.remove("hidden");
    }
    if (dashboardCard) dashboardCard.style.display = "none";
    if (coachDashboardCard) coachDashboardCard.style.display = "none";

    // Hide activity buttons and content when logged out
    const btnHome = document.getElementById("btn-home");
    const btnPhase1 = document.getElementById("btn-phase1");
    const btnBunker = document.getElementById("btn-bunker");
    const btnCoding = document.getElementById("btn-coding");
    const btnBangkok = document.getElementById("btn-bangkok");
    const btnSolar = document.getElementById("btn-solar");
    const btnCoachPortal = document.getElementById("btn-coach-portal");

    // Hide activity buttons when logged out
    if (btnHome) btnHome.style.display = "none";
    if (btnPhase1) btnPhase1.style.display = "none";
    if (btnBunker) btnBunker.style.display = "none";
    if (btnCoding) btnCoding.style.display = "none";
    if (btnBangkok) btnBangkok.style.display = "none";
    if (btnSolar) btnSolar.style.display = "none";
    if (btnCoachPortal) btnCoachPortal.style.display = "none";

    // Hide home portal and activity containers
    const homeContainer = document.getElementById("home-container");
    const p1Container = document.getElementById("phase1-container");
    const bunkerContainer = document.getElementById("bunker-container");
    const codingContainer = document.getElementById("coding-container");
    const bangkokContainer = document.getElementById("bangkok-container");
    const solarContainer = document.getElementById("solar-container");

    if (homeContainer) homeContainer.classList.add("hidden");
    if (p1Container) p1Container.classList.add("hidden");
    if (bunkerContainer) bunkerContainer.classList.add("hidden");
    if (codingContainer) codingContainer.classList.add("hidden");
    if (bangkokContainer) bangkokContainer.classList.add("hidden");
    if (solarContainer) solarContainer.classList.add("hidden");

    if (userEmailSpan) userEmailSpan.textContent = "";
    if (logoutBtn) logoutBtn.style.display = "none";

    if (emailInput) emailInput.disabled = false;
    if (passwordInput) passwordInput.disabled = false;
    if (displayNameInput) displayNameInput.disabled = false;
  }
});

async function loadNotes() {
  if (!notesList) return;
  notesList.innerHTML = `<p style="color: var(--text-muted); font-style: italic;">Loading notes...</p>`;
  try {
    const notes = await fetchNotes();
    if (notes.length === 0) {
      notesList.innerHTML = `<p style="color: var(--text-muted);">No notes yet. Add your first note above!</p>`;
      return;
    }
    notesList.innerHTML = "";
    notes.forEach((note) => {
      const noteEl = document.createElement("div");
      noteEl.className = "note-item";
      noteEl.innerHTML = `
        <div>
          <h4 style="margin: 0 0 0.5rem 0;">${escapeHtml(note.title)}</h4>
          <p style="margin: 0; color: var(--text-muted); white-space: pre-wrap;">${escapeHtml(note.content)}</p>
        </div>
        <button class="btn-danger btn-delete-note" data-id="${note.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Delete</button>
      `;
      notesList.appendChild(noteEl);
    });

    document.querySelectorAll(".btn-delete-note").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        try {
          await deleteNote(id);
          loadNotes();
        } catch (err) {
          showAlert(err.message, "error");
        }
      });
    });
  } catch (error) {
    notesList.innerHTML = `<p style="color: var(--danger);">Error loading notes: ${error.message}</p>`;
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
