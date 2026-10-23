// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  getJwks,
  signLtiJwt,
  verifyLtiJwt,
  buildLtiResourceLinkLaunchToken,
  LTI_CONFIG
} from '../server/lib/lti.js';
import {
  CONNECTED_EDMENTUM_COURSES,
  getEdmentumConfig,
  getEdmentumLearnerScores,
  recordAgsScore,
  launchEdmentumCourse
} from '../src/features/edmentum/edmentumService.js';

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
    const course = CONNECTED_EDMENTUM_COURSES[0];

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

  it('loads connected Edmentum courses with standards and specs', () => {
    expect(CONNECTED_EDMENTUM_COURSES.length).toBeGreaterThanOrEqual(4);
    const bio = CONNECTED_EDMENTUM_COURSES.find((c) => c.id === 'edmentum-bio-101');
    expect(bio).toBeDefined();
    expect(bio.title).toContain('Biology');
    expect(bio.standards).toContain('NGSS HS-LS1');
    expect(bio.targetLinkUri).toContain('platoweb.com');
  });

  it('records Assignment and Grade Services (AGS) scores and updates student progress', () => {
    const studentUid = 'student-test-eval';
    const scoreData = {
      courseId: 'edmentum-bio-101',
      title: 'Enzyme Virtual Lab Mastery Quiz',
      scoreGiven: 96,
      scoreMaximum: 100
    };

    const updated = recordAgsScore(studentUid, scoreData);
    expect(updated).toBeDefined();
    expect(updated.averageScore).toBeGreaterThanOrEqual(90);

    const scores = getEdmentumLearnerScores(studentUid);
    expect(scores['edmentum-bio-101']).toBeDefined();
    expect(scores['edmentum-bio-101'].recent[0].title).toBe('Enzyme Virtual Lab Mastery Quiz');
    expect(scores['edmentum-bio-101'].recent[0].scoreGiven).toBe(96);
  });

  it('executes 1-click launch flow for students into Edmentum', async () => {
    const user = { uid: 'student-liam', displayName: 'Liam Chen' };
    const launchResult = await launchEdmentumCourse('edmentum-eng-201', user);

    expect(launchResult.success).toBe(true);
    expect(launchResult.launchUrl).toContain('platoweb.com');
    expect(launchResult.id_token).toBeDefined();
    expect(launchResult.courseTitle).toContain('Principles of Engineering');
  });
});
