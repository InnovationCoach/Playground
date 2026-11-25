import { schoolRequest } from '../../services/api/apiClient.js';
import { launchEdmentumCourse } from './edmentumService.js';

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export async function getEdmentumStatus() {
  return schoolRequest('GET', '/api/edmentum/status');
}

export async function getStudentEdmentumDashboard(params = {}) {
  return schoolRequest('GET', `/api/edmentum/student/dashboard${buildQuery(params)}`);
}

export async function getCoachEdmentumDashboard(params = {}) {
  return schoolRequest('GET', `/api/edmentum/coach/dashboard${buildQuery(params)}`);
}

export async function getAdminEdmentumDashboard(params = {}) {
  return schoolRequest('GET', `/api/edmentum/admin/dashboard${buildQuery(params)}`);
}

export async function getEdmentumClassGradetracker(classId, params = {}) {
  return schoolRequest('GET', `/api/edmentum/classes/${encodeURIComponent(classId)}/gradetracker${buildQuery(params)}`);
}

export async function setEdmentumClassResourceNodeStatus(classId, resourceNodeId, isLocked) {
  return schoolRequest(
    'PUT',
    `/api/edmentum/classes/${encodeURIComponent(classId)}/resourcenodes/${encodeURIComponent(resourceNodeId)}/status`,
    { isLocked: Boolean(isLocked) }
  );
}

export async function setEdmentumUserResourceNodeStatus(classId, userId, resourceNodeId, isLocked) {
  return schoolRequest(
    'PUT',
    `/api/edmentum/classes/${encodeURIComponent(classId)}/users/${encodeURIComponent(userId)}/resourcenodes/${encodeURIComponent(resourceNodeId)}/status`,
    { isLocked: Boolean(isLocked) }
  );
}

/**
 * Performs a 1-click LTI 1.3 form_post launch into Edmentum for a specific course,
 * falling back to opening the Edmentum portal URL if LTI is disabled/unavailable.
 */
export async function openEdmentumLtiCourse(course, fallbackUrl = 'https://f1.apps.elf.edmentum.com/courseware') {
  const ltiEnabled = typeof import.meta !== 'undefined' && import.meta.env?.VITE_EDMENTUM_LTI_LAUNCH === 'true';
  const id = course?.classId != null ? String(course.classId) : (course?.id ? String(course.id) : '');
  const title = course?.courseName || course?.name || course?.title || 'Edmentum Course';
  if (!ltiEnabled || !id) {
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    return { ok: false, fallback: true };
  }

  const res = await launchEdmentumCourse({ id, title, targetLinkUri: course?.targetLinkUri });
  if (!res.ok) {
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    return { ok: false, fallback: true, message: res.message };
  }

  if (res.oidcStartUrl) {
    window.open(res.oidcStartUrl, '_blank', 'noopener,noreferrer');
    return { ok: true };
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = res.launchUrl;
  form.target = '_blank';
  form.style.display = 'none';

  const tokenInput = document.createElement('input');
  tokenInput.type = 'hidden';
  tokenInput.name = 'id_token';
  tokenInput.value = res.idToken;
  form.appendChild(tokenInput);

  document.body.appendChild(form);
  form.submit();
  form.remove();
  return { ok: true };
}
