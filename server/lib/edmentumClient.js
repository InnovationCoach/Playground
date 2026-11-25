/**
 * Server-side Edmentum Courseware API v2 Client
 * Reference: https://app.edmentum.com/api/help/index
 * Swagger v2: https://app.edmentum.com/api/v2/swagger.json
 *
 * Strictly server-authoritative; credentials are never exposed to the browser.
 */

import { randomUUID } from 'node:crypto';

export const DEFAULT_EDMENTUM_BASE_URL = 'https://app.edmentum.com/api';
export const DEFAULT_EDMENTUM_TOKEN_URL = 'https://auth.edmentum.com/connect/token';
export const DEFAULT_EDMENTUM_SCOPE = 'openid profile offline_access role api_web';

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      qs.set(k, String(v));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export class EdmentumApiClient {
  constructor(options = {}) {
    this._options = options;
    this.timeoutMs = options.timeoutMs || 15000;
    this.fetchImpl = options.fetchImpl || fetch;

    this._cachedToken = null;
    this._tokenExpiresAt = 0;
  }

  get baseUrl() {
    return (this._options.baseUrl ?? process.env.EDMENTUM_API_BASE_URL ?? DEFAULT_EDMENTUM_BASE_URL).replace(/\/$/, '');
  }
  get tokenUrl() {
    return (this._options.tokenUrl ?? process.env.EDMENTUM_TOKEN_URL ?? DEFAULT_EDMENTUM_TOKEN_URL).trim();
  }
  get clientId() {
    return (this._options.clientId ?? process.env.EDMENTUM_CLIENT_ID ?? '').trim();
  }
  get clientSecret() {
    return (this._options.clientSecret ?? process.env.EDMENTUM_CLIENT_SECRET ?? '').trim();
  }
  get username() {
    return (this._options.username ?? process.env.EDMENTUM_USERNAME ?? '').trim();
  }
  get password() {
    return (this._options.password ?? process.env.EDMENTUM_PASSWORD ?? '').trim();
  }
  get scope() {
    return (this._options.scope ?? process.env.EDMENTUM_SCOPE ?? DEFAULT_EDMENTUM_SCOPE).trim();
  }
  get bearerToken() {
    return (this._options.bearerToken ?? process.env.EDMENTUM_BEARER_TOKEN ?? '').trim();
  }
  get defaultProgramId() {
    return (this._options.defaultProgramId ?? process.env.EDMENTUM_DEFAULT_PROGRAM_ID ?? '').trim();
  }
  get defaultClassId() {
    return (this._options.defaultClassId ?? process.env.EDMENTUM_DEFAULT_CLASS_ID ?? '').trim();
  }

  hasBearerToken() {
    return Boolean(this.bearerToken);
  }

  hasPasswordGrantConfig() {
    return Boolean(this.clientId && this.clientSecret && this.username && this.password);
  }

  isConfigured() {
    return this.hasBearerToken() || this.hasPasswordGrantConfig();
  }

  getConfigStatus() {
    const missingVariables = [];
    if (!this.hasBearerToken()) {
      if (!this.clientId) missingVariables.push('EDMENTUM_CLIENT_ID');
      if (!this.clientSecret) missingVariables.push('EDMENTUM_CLIENT_SECRET');
      if (!this.username) missingVariables.push('EDMENTUM_USERNAME');
      if (!this.password) missingVariables.push('EDMENTUM_PASSWORD');
    }
    return {
      configured: this.isConfigured(),
      authMode: this.hasBearerToken()
        ? 'bearer_token'
        : (this.hasPasswordGrantConfig() ? 'oauth2_password_grant' : 'unconfigured'),
      baseUrl: this.baseUrl,
      tokenUrl: this.tokenUrl,
      hasDefaultProgramId: Boolean(this.defaultProgramId),
      hasDefaultClassId: Boolean(this.defaultClassId),
      missingVariables
    };
  }

  async getAccessToken({ forceRefresh = false } = {}) {
    if (this.hasBearerToken()) {
      return this.bearerToken;
    }
    if (!this.hasPasswordGrantConfig()) {
      const err = new Error('Edmentum API credentials are not configured.');
      err.status = 503;
      err.code = 'EDMENTUM_NOT_CONFIGURED';
      throw err;
    }
    const now = Date.now();
    if (!forceRefresh && this._cachedToken && now < this._tokenExpiresAt - 60_000) {
      return this._cachedToken;
    }

    const body = new URLSearchParams({
      grant_type: 'password',
      username: this.username,
      password: this.password,
      scope: this.scope
    });

    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          Authorization: `Basic ${basicAuth}`
        },
        body: body.toString(),
        signal: controller.signal
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.access_token) {
        const err = new Error(data?.error_description || data?.error || `Edmentum OAuth2 token error (${res.status})`);
        err.status = res.status === 400 || res.status === 401 ? 502 : res.status;
        err.code = 'EDMENTUM_AUTH_FAILED';
        throw err;
      }
      const expiresInSec = Number(data.expires_in) > 0 ? Number(data.expires_in) : 3600;
      this._cachedToken = data.access_token;
      this._tokenExpiresAt = Date.now() + expiresInSec * 1000;
      return this._cachedToken;
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Edmentum OAuth2 token request timed out after ${this.timeoutMs}ms`);
        timeoutErr.status = 504;
        timeoutErr.code = 'EDMENTUM_TIMEOUT';
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async _request(path, options = {}) {
    if (!this.isConfigured()) {
      const err = new Error('Edmentum API credentials are not configured.');
      err.status = 503;
      err.code = 'EDMENTUM_NOT_CONFIGURED';
      throw err;
    }

    const execute = async (forceRefresh = false) => {
      const token = await this.getAccessToken({ forceRefresh });
      const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
      const requestId = options.requestId || randomUUID();
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'X-Request-Id': requestId,
        ...(options.headers || {})
      };
      if (options.body && typeof options.body === 'object') {
        headers['Content-Type'] = 'application/json';
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(url, {
          method: options.method || 'GET',
          headers,
          body: options.body && typeof options.body === 'object' ? JSON.stringify(options.body) : options.body,
          signal: controller.signal
        });

        const contentType = response.headers?.get?.('content-type') || '';
        let data = null;
        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            data = { raw: text };
          }
        }

        return { response, data, requestId };
      } catch (err) {
        if (err.name === 'AbortError') {
          const timeoutErr = new Error(`Edmentum API request timed out after ${this.timeoutMs}ms`);
          timeoutErr.status = 504;
          timeoutErr.code = 'EDMENTUM_TIMEOUT';
          throw timeoutErr;
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    };

    let { response, data, requestId } = await execute(false);
    if (response.status === 401 && !this.hasBearerToken()) {
      ({ response, data, requestId } = await execute(true));
    }

    if (!response.ok) {
      const error = new Error(data?.Message || data?.message || `Edmentum API error ${response.status}`);
      error.status = response.status;
      error.code = 'EDMENTUM_API_ERROR';
      error.requestId = requestId;
      throw error;
    }

    return data;
  }

  // --- AdminCenter v2.0 ---
  getPrograms() {
    return this._request('/admincenter/v2.0/programs');
  }

  getLocations() {
    return this._request('/admincenter/v2.0/locations');
  }

  getUsers({ pageSize = 100, skip = 0, sisId } = {}) {
    return this._request(`/admincenter/v2.0/users${buildQuery({ $pagesize: pageSize, $skip: skip, sisId })}`);
  }

  getUserById(userId) {
    return this._request(`/admincenter/v2.0/users/${encodeURIComponent(userId)}`);
  }

  createUser(userPayload) {
    return this._request('/admincenter/v2.0/users', {
      method: 'POST',
      body: userPayload
    });
  }

  updateUser(userPayload) {
    return this._request('/admincenter/v2.0/users', {
      method: 'PUT',
      body: userPayload
    });
  }

  deleteUser(userId) {
    return this._request(`/admincenter/v2.0/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    });
  }

  getAlertsSummary(programId, userIds) {
    const query = Array.isArray(userIds) && userIds.length > 0 ? buildQuery({ userIds: userIds.join(',') }) : '';
    return this._request(`/admincenter/v2.0/alerts/${encodeURIComponent(programId)}/summary${query}`);
  }

  getTimeOnSystem({ startDate, pageSize = 100, skip = 0 } = {}) {
    return this._request(`/admincenter/v2.0/timeonsystem${buildQuery({ startDate, $pagesize: pageSize, $skip: skip })}`);
  }

  // --- Courseware v2.0 ---
  getProgramClasses(programId, { pageSize = 100, skip = 0, name, afterStartDate } = {}) {
    return this._request(
      `/courseware/v2.0/programs/${encodeURIComponent(programId)}/classes${buildQuery({ $pagesize: pageSize, $skip: skip, name, afterStartDate })}`
    );
  }

  getProgramClassDetails(programId, { pageSize = 100, skip = 0, afterStartDate } = {}) {
    return this._request(
      `/courseware/v2.0/programs/${encodeURIComponent(programId)}/classdetails${buildQuery({ $pagesize: pageSize, $skip: skip, afterStartDate })}`
    );
  }

  getClassUsers(classId) {
    return this._request(`/courseware/v2.0/classes/${encodeURIComponent(classId)}/users`);
  }

  getEnrollableUsers(classId, { pageSize = 100, skip = 0 } = {}) {
    return this._request(
      `/courseware/v2.0/classes/${encodeURIComponent(classId)}/enrollableusers${buildQuery({ $pagesize: pageSize, $skip: skip })}`
    );
  }

  enrollUserInClass(classId, userId, { startDate, endDate } = {}) {
    return this._request(
      `/courseware/v2.0/classes/${encodeURIComponent(classId)}/users/${encodeURIComponent(userId)}${buildQuery({ startDate, endDate })}`,
      { method: 'POST' }
    );
  }

  updateClassUserDates(classId, userId, { startDate, endDate } = {}) {
    return this._request(
      `/courseware/v2.0/classes/${encodeURIComponent(classId)}/users/${encodeURIComponent(userId)}${buildQuery({ startDate, endDate })}`,
      { method: 'PUT' }
    );
  }

  withdrawUserFromClass(classId, userId) {
    return this._request(
      `/courseware/v2.0/classes/${encodeURIComponent(classId)}/users/${encodeURIComponent(userId)}`,
      { method: 'DELETE' }
    );
  }

  transferClassUser(targetClassId, { learnerUserId, sourceClassroomId }) {
    return this._request(
      `/courseware/v2.0/classes/${encodeURIComponent(targetClassId)}/transfer`,
      {
        method: 'POST',
        body: {
          LearnerUserId: Number(learnerUserId),
          SourceClassroomId: Number(sourceClassroomId)
        }
      }
    );
  }

  getResourceNodes() {
    return this._request('/courseware/v2.0/resourcenodes');
  }

  getResourceNodeChildren(resourceNodeId) {
    return this._request(`/courseware/v2.0/resourcenodes/${encodeURIComponent(resourceNodeId)}`);
  }

  setClassResourceNodeStatus(classId, resourceNodeId, { isLocked }) {
    return this._request(
      `/courseware/v2.0/classes/${encodeURIComponent(classId)}/resourcenodes/${encodeURIComponent(resourceNodeId)}/status`,
      {
        method: 'PUT',
        body: {
          ClassId: Number(classId),
          ResourceNodeId: Number(resourceNodeId),
          IsLocked: Boolean(isLocked)
        }
      }
    );
  }

  setClassUserResourceNodeStatus(classId, userId, resourceNodeId, { isLocked }) {
    return this._request(
      `/courseware/v2.0/classes/${encodeURIComponent(classId)}/users/${encodeURIComponent(userId)}/resourcenodes/${encodeURIComponent(resourceNodeId)}/status`,
      {
        method: 'PUT',
        body: {
          ClassId: Number(classId),
          UserId: Number(userId),
          ResourceNodeId: Number(resourceNodeId),
          IsLocked: Boolean(isLocked)
        }
      }
    );
  }

  getClassProgress(classId) {
    return this._request(`/courseware/v2.0/classes/${encodeURIComponent(classId)}/gradetracker/progress`);
  }

  getClassGrades(classId) {
    return this._request(`/courseware/v2.0/classes/${encodeURIComponent(classId)}/gradetracker/grades`);
  }

  getClassActivities(classId, { gradetrackerCategoryId } = {}) {
    return this._request(
      `/courseware/v2.0/classes/${encodeURIComponent(classId)}/gradetracker/activities${buildQuery({ gradetrackerCategoryId })}`
    );
  }

  getClassActivityScores(classId, { resourceNodeId, learnerUserId } = {}) {
    return this._request(
      `/courseware/v2.0/classes/${encodeURIComponent(classId)}/gradetracker/activityscores${buildQuery({ resourceNodeId, learnerUserId })}`
    );
  }

  getClassTimeOnTask(classId, { startDate } = {}) {
    return this._request(
      `/courseware/v2.0/classes/${encodeURIComponent(classId)}/timeontask${buildQuery({ startdate: startDate })}`
    );
  }
}

export const edmentumClient = new EdmentumApiClient();
