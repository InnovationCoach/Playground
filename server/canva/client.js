/**
 * Typed client & operations for Canva Connect REST API.
 * Uses OpenAPI definitions and strictly adheres to logging and security policies.
 * 
 * LOGGING RULE:
 * Logs HTTP status codes, job IDs, and operation durations.
 * NEVER logs tokens, authorization codes, client secrets, or design content.
 */

export class CanvaPermissionDeniedError extends Error {
  constructor(message = 'Canva export permission denied. Your Canva account may not have permission to export designs, or you have reached the trial export quota.') {
    super(message);
    this.name = 'CanvaPermissionDeniedError';
    this.code = 'PERMISSION_DENIED';
    this.status = 403;
  }
}

export class CanvaApiError extends Error {
  constructor(message, status = 500, code = 'CANVA_API_ERROR', details = null) {
    super(message);
    this.name = 'CanvaApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const CANVA_DEFAULT_SCOPES = [
  'asset:read',
  'asset:write',
  'design:content:read',
  'design:content:write',
  'design:meta:read',
  'folder:read',
  'profile:read'
];

export class CanvaClient {
  constructor(options = {}) {
    this.clientId = options.clientId || process.env.CANVA_CLIENT_ID || 'OC-AaFyafCLmW1w';
    this.clientSecret = options.clientSecret || process.env.CANVA_CLIENT_SECRET;
    this.baseUrl = (options.baseUrl || process.env.CANVA_API_BASE_URL || 'https://api.canva.com/rest').replace(/\/+$/, '');
    this.tokenEndpoint = `${this.baseUrl}/v1/oauth/token`;
    this.revokeEndpoint = `${this.baseUrl}/v1/oauth/revoke`;
    this.exportsEndpoint = `${this.baseUrl}/v1/exports`;
    this.fetchFn = options.fetchFn || globalThis.fetch;
  }

  getBasicAuthHeader() {
    if (!this.clientSecret) {
      throw new Error('CANVA_CLIENT_SECRET is missing from environment.');
    }
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Exchanges authorization code and PKCE code_verifier for tokens.
   */
  async exchangeAuthorizationCode({ code, codeVerifier, redirectUri }) {
    const startTime = Date.now();
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
      code,
      redirect_uri: redirectUri
    });

    const response = await this.fetchFn(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': this.getBasicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const durationMs = Date.now() - startTime;
    console.info(`[CanvaOAuth] token exchange finished with status=${response.status} in ${durationMs}ms`);

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errCode = data?.code || 'TOKEN_EXCHANGE_FAILED';
      const errMsg = data?.message || `Canva token exchange failed with HTTP ${response.status}`;
      throw new CanvaApiError(errMsg, response.status, errCode, data);
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      scope: data.scope
    };
  }

  /**
   * Refreshes access token using rotating refresh token.
   * Single-use refresh token: new refresh token returned must be saved.
   */
  async refreshAccessToken({ refreshToken }) {
    const startTime = Date.now();
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    const response = await this.fetchFn(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': this.getBasicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const durationMs = Date.now() - startTime;
    console.info(`[CanvaOAuth] token refresh finished with status=${response.status} in ${durationMs}ms`);

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errCode = data?.code || 'TOKEN_REFRESH_FAILED';
      const errMsg = data?.message || `Canva token refresh failed with HTTP ${response.status}`;
      throw new CanvaApiError(errMsg, response.status, errCode, data);
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      scope: data.scope
    };
  }

  /**
   * Revokes token (revoking refresh token terminates session and lineage).
   */
  async revokeToken({ token }) {
    const startTime = Date.now();
    const params = new URLSearchParams({
      token
    });

    const response = await this.fetchFn(this.revokeEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': this.getBasicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const durationMs = Date.now() - startTime;
    console.info(`[CanvaOAuth] token revoke finished with status=${response.status} in ${durationMs}ms`);

    if (!response.ok && response.status !== 404) {
      let data = null;
      try { data = await response.json(); } catch {}
      console.warn(`[CanvaOAuth] revoke returned non-OK status=${response.status}`);
    }

    return { revoked: true, status: response.status };
  }

  /**
   * Starts an asynchronous export job.
   */
  async createExportJob({ accessToken, designId, format = 'png' }) {
    const startTime = Date.now();
    const response = await this.fetchFn(this.exportsEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        design_id: designId,
        format: {
          type: format
        }
      })
    });

    const durationMs = Date.now() - startTime;
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const jobId = data?.job?.id || 'unknown';
    console.info(`[CanvaExport] create job=${jobId} status=${response.status} in ${durationMs}ms`);

    if (!response.ok) {
      if (response.status === 403 || data?.code === 'permission_denied' || data?.error?.code === 'permission_denied') {
        throw new CanvaPermissionDeniedError(data?.message);
      }
      const errCode = data?.code || 'EXPORT_CREATE_FAILED';
      const errMsg = data?.message || `Failed to create export job (HTTP ${response.status})`;
      throw new CanvaApiError(errMsg, response.status, errCode, data);
    }

    return data.job;
  }

  /**
   * Gets current status of an export job.
   */
  async getExportJob({ accessToken, exportId }) {
    const startTime = Date.now();
    const response = await this.fetchFn(`${this.exportsEndpoint}/${encodeURIComponent(exportId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const durationMs = Date.now() - startTime;
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const job = data?.job;
    const jobStatus = job?.status || 'unknown';
    console.info(`[CanvaExport] poll job=${exportId} status=${jobStatus} http=${response.status} in ${durationMs}ms`);

    if (!response.ok) {
      if (response.status === 403 || data?.code === 'permission_denied' || data?.error?.code === 'permission_denied') {
        throw new CanvaPermissionDeniedError(data?.message);
      }
      const errCode = data?.code || 'EXPORT_POLL_FAILED';
      const errMsg = data?.message || `Failed to poll export job (HTTP ${response.status})`;
      throw new CanvaApiError(errMsg, response.status, errCode, data);
    }

    return job;
  }

  /**
   * Polls export job until success or failure using exponential backoff.
   * Guarantees termination: stops on success, failure, trial quota/permission_denied, or timeout.
   */
  async pollExportJob({
    accessToken,
    exportId,
    initialDelayMs = 1000,
    maxDelayMs = 16000,
    backoffFactor = 2,
    maxAttempts = 15,
    timeoutMs = 60000,
    sleepFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  }) {
    const startTime = Date.now();
    let currentDelay = initialDelayMs;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      if (Date.now() - startTime > timeoutMs) {
        throw new CanvaApiError(`Export job ${exportId} timed out after ${timeoutMs}ms`, 408, 'EXPORT_TIMEOUT');
      }

      const job = await this.getExportJob({ accessToken, exportId });

      if (job.status === 'success') {
        const totalDuration = Date.now() - startTime;
        console.info(`[CanvaExport] job=${exportId} succeeded in ${totalDuration}ms after ${attempt} attempts`);
        return job;
      }

      if (job.status === 'failed') {
        const jobError = job.error || {};
        if (jobError.code === 'permission_denied' || String(jobError.message).toLowerCase().includes('quota')) {
          throw new CanvaPermissionDeniedError(jobError.message);
        }
        throw new CanvaApiError(jobError.message || `Export job ${exportId} failed`, 400, jobError.code || 'EXPORT_FAILED', jobError);
      }

      // If still in_progress, backoff and wait
      await sleepFn(currentDelay);
      currentDelay = Math.min(Math.round(currentDelay * backoffFactor), maxDelayMs);
    }

    throw new CanvaApiError(`Export job ${exportId} reached maximum poll attempts (${maxAttempts})`, 408, 'EXPORT_MAX_ATTEMPTS');
  }
}
