import { API_BASE } from '../../services/apiBase.js';

/**
 * Frontend sync client for the headless Blender (bpy/bmesh) worker.
 * Uses WebSockets when available and falls back cleanly to local Three.js mode
 * when the backend worker is not configured.
 */
export class TinkerSyncClient {
  constructor({ getAuthToken, onGlbUpdate, onStatus } = {}) {
    this.getAuthToken = getAuthToken || (async () => null);
    this.onGlbUpdate = onGlbUpdate || (() => {});
    this.onStatus = onStatus || (() => {});
    this.sessionId = null;
    this.ws = null;
    this.mode = 'local-threejs';
    this.pending = new Map();
  }

  async connect(initialShapes = []) {
    const healthRes = await fetch(`${API_BASE}/api/tinker/health`);
    const health = await healthRes.json();
    if (!health?.configured) {
      this.mode = 'local-threejs';
      this.onStatus({ mode: this.mode, connected: false });
      return { mode: this.mode, connected: false };
    }

    const token = await this.getAuthToken();
    const res = await fetch(`${API_BASE}/api/tinker/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ shapes: initialShapes })
    });

    if (!res.ok) {
      this.mode = 'local-threejs';
      this.onStatus({ mode: this.mode, connected: false });
      return { mode: this.mode, connected: false };
    }

    const session = await res.json();
    this.sessionId = session.sessionId;
    this.mode = 'bpy-worker';

    if (typeof WebSocket !== 'undefined' && session.wsPath) {
      const origin = API_BASE || window.location.origin;
      const wsUrl = origin.replace(/^http/, 'ws') + session.wsPath;
      this.ws = new WebSocket(wsUrl);
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.requestId && this.pending.has(msg.requestId)) {
            const { resolve } = this.pending.get(msg.requestId);
            this.pending.delete(msg.requestId);
            resolve(msg);
          }
          if (msg.ok && msg.glbUrl) {
            this.onGlbUpdate(msg);
          }
        } catch {
          // ignore malformed frames
        }
      };
    }

    this.onStatus({ mode: this.mode, connected: true, sessionId: this.sessionId });
    return { mode: this.mode, connected: true, sessionId: this.sessionId, glbUrl: session.glbUrl };
  }

  async sendCommand(action, payload = null) {
    if (this.mode !== 'bpy-worker' || !this.sessionId) {
      return { ok: false, mode: 'local-threejs' };
    }
    const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    if (this.ws && this.ws.readyState === 1) {
      return new Promise((resolve) => {
        this.pending.set(requestId, { resolve });
        this.ws.send(JSON.stringify({ action, requestId, payload }));
        setTimeout(() => {
          if (this.pending.has(requestId)) {
            this.pending.delete(requestId);
            resolve({ ok: false, error: 'WebSocket command timeout' });
          }
        }, 15000);
      });
    }

    if (action === 'op' && payload) {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE}/api/tinker/sessions/${encodeURIComponent(this.sessionId)}/op`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok && data.glbUrl) this.onGlbUpdate(data);
      return data;
    }

    return { ok: false, error: 'WebSocket not connected for undo/redo' };
  }

  async disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.sessionId && this.mode === 'bpy-worker') {
      const token = await this.getAuthToken();
      await fetch(`${API_BASE}/api/tinker/sessions/${encodeURIComponent(this.sessionId)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).catch(() => {});
      this.sessionId = null;
    }
  }
}
