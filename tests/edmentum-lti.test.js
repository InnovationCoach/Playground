// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  getJwks,
  signLtiJwt,
  verifyLtiJwt,
  buildLtiResourceLinkLaunchToken,
  LTI_CONFIG
} from '../server/lib/lti.js';
import { SYNTHETIC_EDMENTUM_COURSES } from '../src/features/edmentum/fixtures/syntheticEdmentum.js';

describe('Edmentum LTI 1.3 Advantage & Rostering Integration', () => {
  it('generates valid RFC 7517 JWKS with RS256 RSA public key', () => {
    const jwks = getJwks();
    expect(jwks).toBeDefined();
    expect(Array.isArray(jwks.keys)).toBe(true);
    expect(jwks.keys.length).toBeGreaterThan(0);

    const key = jwks.keys[0];
    expect(key.kty).toBe('RSA');
    expect(key.alg).toBe('RS256');
    expect(key.use).toBe('sig');
    expect(key.kid).toBe(LTI_CONFIG.keyId);
    expect(typeof key.n).toBe('string');
    expect(key.e).toBe('AQAB');
  });

  it('signs and cryptographically verifies an RS256 LTI token', () => {
    const payload = {
      iss: LTI_CONFIG.issuer,
      sub: 'student-liam-chen',
      aud: LTI_CONFIG.clientId,
      exp: Math.floor(Date.now() / 1000) + 3600,
      customClaim: 'welearn-pbl-test'
    };

    const token = signLtiJwt(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = verifyLtiJwt(token);
    expect(verified).not.toBeNull();
    expect(verified.sub).toBe('student-liam-chen');
    expect(verified.customClaim).toBe('welearn-pbl-test');
  });

  it('constructs an authentic 1EdTech LtiResourceLinkRequest conforming payload', () => {
    const user = {
      uid: 'student-maya-patel',
      displayName: 'Maya Patel',
      email: 'maya.patel@school.edu'
    };
    const course = SYNTHETIC_EDMENTUM_COURSES[0];

    const token = buildLtiResourceLinkLaunchToken({
      user,
      course,
      targetLinkUri: course.targetLinkUri
    });

    const payload = verifyLtiJwt(token);
    expect(payload).not.toBeNull();
    expect(payload.iss).toBe(LTI_CONFIG.issuer);
    expect(payload.sub).toBe(user.uid);
    expect(payload.name).toBe(user.displayName);
    expect(payload.email).toBe(user.email);

    // 1EdTech Core Claims
    expect(payload['https://purl.imsglobal.org/spec/lti/claim/message_type']).toBe('LtiResourceLinkRequest');
    expect(payload['https://purl.imsglobal.org/spec/lti/claim/version']).toBe('1.3.0');
    expect(payload['https://purl.imsglobal.org/spec/lti/claim/deployment_id']).toBe(LTI_CONFIG.deploymentId);
    expect(payload['https://purl.imsglobal.org/spec/lti/claim/target_link_uri']).toBe(course.targetLinkUri);
    expect(payload['https://purl.imsglobal.org/spec/lti/claim/resource_link'].id).toBe(course.id);
    expect(payload['https://purl.imsglobal.org/spec/lti/claim/roles']).toContain('http://purl.imsglobal.org/vocab/lis/v2/membership#Learner');

    // AGS Endpoint Claim
    const agsClaim = payload['https://purl.imsglobal.org/spec/lti-ags/claim/endpoint'];
    expect(agsClaim).toBeDefined();
    expect(agsClaim.scope).toContain('https://purl.imsglobal.org/spec/lti-ags/scope/score');
    expect(agsClaim.lineitems).toContain('/api/lti/ags/lineitems');
  });

  it('fails closed with 503 PILOT_EXCLUDED when EDMENTUM_LTI_ENABLED is not true, and serves /config and /jwks when enabled', async () => {
    const originalEnv = process.env.EDMENTUM_LTI_ENABLED;
    delete process.env.EDMENTUM_LTI_ENABLED;

    const { default: ltiRouter } = await import('../server/routes/lti.js');
    const endpointsToTest = [
      { method: 'GET', url: '/config' },
      { method: 'GET', url: '/jwks' },
      { method: 'POST', url: '/launch/diag-bio-01' },
      { method: 'POST', url: '/ags/lineitems/diag-bio-01/scores' },
      { method: 'POST', url: '/diagnostics' }
    ];

    for (const ep of endpointsToTest) {
      let statusCode = null;
      let responseBody = null;
      const req = { method: ep.method, url: ep.url, headers: {} };
      const res = {
        status(s) { statusCode = s; return this; },
        json(j) { responseBody = j; return this; }
      };

      ltiRouter.handle(req, res, () => {});
      expect(statusCode).toBe(503);
      expect(responseBody.error.code).toBe('PILOT_EXCLUDED');
    }

    process.env.EDMENTUM_LTI_ENABLED = 'true';
    for (const url of ['/config', '/jwks']) {
      let statusCode = 200;
      let responseBody = null;
      const req = { method: 'GET', url, headers: {} };
      const res = {
        setHeader() {},
        status(s) { statusCode = s; return this; },
        json(j) { responseBody = j; return this; }
      };
      ltiRouter.handle(req, res, () => {});
      expect(statusCode).toBe(200);
      expect(responseBody).toBeTruthy();
    }

    if (originalEnv !== undefined) {
      process.env.EDMENTUM_LTI_ENABLED = originalEnv;
    } else {
      delete process.env.EDMENTUM_LTI_ENABLED;
    }
  });

  it('rejects unauthenticated or under-scoped LTI /token and AGS score requests', async () => {
    const originalEnv = process.env.EDMENTUM_LTI_ENABLED;
    process.env.EDMENTUM_LTI_ENABLED = 'true';

    try {
      const { default: ltiRouter } = await import('../server/routes/lti.js');

      const dispatch = ({ method, url, headers = {}, body = {} }) =>
        new Promise((resolve) => {
          let statusCode = 200;
          const req = { method, url, headers, body };
          const res = {
            setHeader() {},
            status(s) { statusCode = s; return this; },
            json(payload) { resolve({ statusCode, body: payload }); return this; }
          };
          ltiRouter.handle(req, res, (err) => {
            resolve({ statusCode: err ? 500 : 404, body: err || null });
          });
        });

      const missingAssertion = await dispatch({
        method: 'POST',
        url: '/token',
        body: { grant_type: 'client_credentials' }
      });
      expect(missingAssertion.statusCode).toBe(401);
      expect(missingAssertion.body.error.code).toBe('INVALID_CLIENT');

      const invalidAssertion = await dispatch({
        method: 'POST',
        url: '/token',
        body: {
          grant_type: 'client_credentials',
          client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
          client_assertion: 'not-a-valid-jwt'
        }
      });
      expect(invalidAssertion.statusCode).toBe(401);
      expect(invalidAssertion.body.error.code).toBe('INVALID_CLIENT');

      const missingBearer = await dispatch({
        method: 'POST',
        url: '/ags/lineitems/edmentum-bio-01/scores',
        body: { userId: 'u1', scoreGiven: 90, scoreMaximum: 100 }
      });
      expect(missingBearer.statusCode).toBe(401);
      expect(missingBearer.body.error.code).toBe('UNAUTHENTICATED');

      const invalidBearer = await dispatch({
        method: 'POST',
        url: '/ags/lineitems/edmentum-bio-01/scores',
        headers: { authorization: 'Bearer invalid.jwt.token' },
        body: { userId: 'u1', scoreGiven: 90, scoreMaximum: 100 }
      });
      expect(invalidBearer.statusCode).toBe(401);
      expect(invalidBearer.body.error.code).toBe('UNAUTHENTICATED');

      const underScopedToken = signLtiJwt({
        aud: LTI_CONFIG.clientId,
        exp: Math.floor(Date.now() / 1000) + 3600,
        scope: 'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem'
      });
      const underScoped = await dispatch({
        method: 'POST',
        url: '/ags/lineitems/edmentum-bio-01/scores',
        headers: { authorization: `Bearer ${underScopedToken}` },
        body: { userId: 'u1', scoreGiven: 90, scoreMaximum: 100 }
      });
      expect(underScoped.statusCode).toBe(403);
      expect(underScoped.body.error.code).toBe('FORBIDDEN');
    } finally {
      if (originalEnv !== undefined) {
        process.env.EDMENTUM_LTI_ENABLED = originalEnv;
      } else {
        delete process.env.EDMENTUM_LTI_ENABLED;
      }
    }
  });

  // Client-side connection, score and launch behaviour is covered by
  // tests/edmentum-truthful-states.test.jsx (O0): no default "connected",
  // no generated scores and no successful launch after a failure.
});
