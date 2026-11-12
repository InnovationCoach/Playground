/**
 * Server-side Mastery API Client
 * Target: Mastery Development Sandbox (https://api.develop.mastery.org)
 * Strictly server-authoritative; credentials never exposed to client.
 */

import { randomUUID } from 'node:crypto';

export const DEFAULT_MASTERY_BASE_URL = 'https://api.develop.mastery.org';

export class MasteryApiClient {
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || process.env.MASTERY_API_BASE_URL || DEFAULT_MASTERY_BASE_URL).replace(/\/$/, '');
    this.apiKey = options.apiKey || process.env.MASTERY_API_KEY || '';
    this.timeoutMs = options.timeoutMs || 15000;
    this.cachedSchoolId = options.schoolId || null;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Internal request helper with timeouts, safe error handling, and header sanitation
   */
  async _request(path, options = {}) {
    if (!this.isConfigured()) {
      const err = new Error('Mastery API key is not configured.');
      err.status = 503;
      err.code = 'MASTERY_NOT_CONFIGURED';
      throw err;
    }

    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const requestId = options.requestId || randomUUID();
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'X-Request-Id': requestId,
      ...(options.headers || {})
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
          ? JSON.stringify(options.body)
          : options.body,
        signal: controller.signal
      });

      const contentType = response.headers.get('content-type') || '';
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

      if (!response.ok) {
        const error = new Error(data?.description || data?.message || `Mastery API error ${response.status}`);
        error.status = response.status;
        error.code = data?.error || 'MASTERY_API_ERROR';
        error.data = data?.data || null;
        error.requestId = data?.requestId || requestId;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Mastery API request timed out after ${this.timeoutMs}ms`);
        timeoutErr.status = 504;
        timeoutErr.code = 'MASTERY_TIMEOUT';
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * 1. Retrieve authenticated school profile and cache schoolId
   */
  async getSchools() {
    const res = await this._request('/me/schools');
    const items = res?.data?.items || [];
    if (items.length > 0 && !this.cachedSchoolId) {
      this.cachedSchoolId = items[0].id;
    }
    return items;
  }

  async getSchoolId() {
    if (this.cachedSchoolId) return this.cachedSchoolId;
    const schools = await this.getSchools();
    if (schools.length === 0) {
      throw new Error('No schools associated with configured Mastery API credentials.');
    }
    return schools[0].id;
  }

  /**
   * 2. Retrieve Competency Model (MCA: 7 areas, 85/88 competencies)
   */
  async getCompetencyModel(schoolId) {
    const sId = schoolId || await this.getSchoolId();
    const res = await this._request(`/schools/${sId}/mca`);
    return res?.data || null;
  }

  /**
   * 3. Retrieve Courses & Experiences
   */
  async getCourses(schoolId) {
    const sId = schoolId || await this.getSchoolId();
    const res = await this._request(`/schools/courses?schoolId=${encodeURIComponent(sId)}`);
    return res?.data?.items || [];
  }

  /**
   * 4. Learner Operations
   */
  async createLearner(schoolId, { firstName, lastName, email, externalId, sendEmail = false }) {
    const sId = schoolId || await this.getSchoolId();
    const body = {
      firstName: String(firstName || '').trim(),
      lastName: String(lastName || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      sendEmail: Boolean(sendEmail),
      ...(externalId ? { externalId: String(externalId).slice(0, 20) } : {})
    };
    const res = await this._request(`/schools/${sId}/learners`, {
      method: 'POST',
      body
    });
    return res?.data || null;
  }

  async getLearner(learnerId) {
    const res = await this._request(`/learners/${encodeURIComponent(learnerId)}`);
    return res?.data || null;
  }

  async searchLearners(schoolId, filter) {
    const sId = schoolId || await this.getSchoolId();
    const res = await this._request(`/schools/${sId}/learners/search?filter=${encodeURIComponent(filter)}`);
    return res?.data?.items || [];
  }

  /**
   * 5. Evidence & Artifacts
   */
  async createEvidence(learnerId, { title, description }) {
    const body = {
      title: String(title || '').trim(),
      description: String(description || '').trim()
    };
    const res = await this._request(`/learners/${encodeURIComponent(learnerId)}/evidences`, {
      method: 'POST',
      body
    });
    // Returns evidenceId (integer or string)
    return res?.data;
  }

  async getEvidence(evidenceId) {
    const res = await this._request(`/evidences/${encodeURIComponent(evidenceId)}`);
    return res?.data || null;
  }

  async listLearnerEvidence(learnerId) {
    const res = await this._request(`/learners/${encodeURIComponent(learnerId)}/evidences`);
    return res?.data?.items || [];
  }

  /**
   * 6. Competency Association & Status Tracking
   * credits: [{ id: creditId, status: 'REQUESTED' | 'IN_PROGRESS' | 'EARNED' }]
   */
  async attachCompetenciesToEvidence(evidenceId, credits) {
    const body = {
      credits: credits.map(c => ({
        id: typeof c === 'object' ? c.id : c,
        status: (typeof c === 'object' && c.status) ? c.status : 'IN_PROGRESS'
      }))
    };
    const res = await this._request(`/evidences/${encodeURIComponent(evidenceId)}/credits/bulk`, {
      method: 'POST',
      body
    });
    return res?.data;
  }

  async getLearnerCredits(learnerId) {
    const res = await this._request(`/learners/${encodeURIComponent(learnerId)}/credits`);
    return res?.data || null;
  }

  async updateLearnerCredit(learnerId, creditId, { status = 'EARNED' }) {
    const res = await this._request(`/learners/${encodeURIComponent(learnerId)}/credits/${encodeURIComponent(creditId)}`, {
      method: 'PUT',
      body: { status }
    });
    return res?.data;
  }

  /**
   * 7. Coach Feedback Comments
   */
  async addEvidenceComment(evidenceId, { content }) {
    const res = await this._request(`/evidences/${encodeURIComponent(evidenceId)}/comment`, {
      method: 'POST',
      body: { content: String(content || '').trim() }
    });
    return res?.data;
  }
}

// Export default singleton instance initialized with environment variables
export const masteryClient = new MasteryApiClient();
