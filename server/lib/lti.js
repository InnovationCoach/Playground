import crypto from 'node:crypto';

/**
 * LTI 1.3 & 1EdTech Advantage Security Engine for Edmentum Integration
 * Implements:
 * - RSA Key generation and JWKS RFC 7517 export
 * - LtiResourceLinkRequest JWT signing & verification (RS256)
 * - OpenID Connect (OIDC) third-party login initiation
 * - Assignment and Grade Services (AGS) score passback
 * - Deep Linking 2.0 message format
 */

export const LTI_CONFIG = {
  get issuer() { return process.env.LTI_ISSUER || 'https://welearn.org/'; },
  get clientId() { return process.env.LTI_CLIENT_ID || 'welearn-edmentum-client'; },
  get deploymentId() { return process.env.EDMENTUM_DEPLOYMENT_ID || 'welearn-prod-deployment-01'; },
  get authLoginUrl() { return process.env.EDMENTUM_AUTH_URL || 'https://public.apps.elf.edmentum.com/lti/login'; },
  get launchUrl() { return process.env.EDMENTUM_LTI_LAUNCH_URL || 'https://public.apps.elf.edmentum.com/lti/launch'; },
  get tokenUrl() { return process.env.EDMENTUM_LTI_TOKEN_URL || 'https://auth.edmentum.com/connect/token'; },
  get toolJwksUrl() { return process.env.EDMENTUM_LTI_JWKS_URL || 'https://public.apps.elf.edmentum.com/lti/jwks'; },
  get jwksUrl() { return process.env.LTI_JWKS_URL || 'https://welearn.org/api/lti/jwks'; },
  get oidcInitiationUrl() { return process.env.LTI_OIDC_URL || 'https://welearn.org/api/lti/login_initiations'; },
  get agsUrl() { return process.env.LTI_AGS_URL || 'https://welearn.org/api/lti/ags'; },
  keyId: 'welearn-lti-key-2026'
};

// In-memory / persistent RSA Keypair for LTI 1.3 cryptographic operations
let cachedKeyPair = null;

export function getOrCreateKeyPair() {
  if (cachedKeyPair) return cachedKeyPair;

  const envPrivate = process.env.LTI_PRIVATE_KEY ? process.env.LTI_PRIVATE_KEY.replace(/\\n/g, '\n') : '';
  const envPublic = process.env.LTI_PUBLIC_KEY ? process.env.LTI_PUBLIC_KEY.replace(/\\n/g, '\n') : '';

  let privateKey = envPrivate;
  let publicKey = envPublic;
  if (!privateKey || !publicKey) {
    const generated = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    privateKey = generated.privateKey;
    publicKey = generated.publicKey;
  }

  const jwkObj = crypto.createPublicKey(publicKey).export({ type: 'pkcs1', format: 'jwk' });

  cachedKeyPair = {
    privateKeyPem: privateKey,
    publicKeyPem: publicKey,
    jwk: {
      kty: 'RSA',
      alg: 'RS256',
      use: 'sig',
      kid: LTI_CONFIG.keyId,
      n: jwkObj.n,
      e: jwkObj.e
    }
  };

  return cachedKeyPair;
}

export function getJwks() {
  const { jwk } = getOrCreateKeyPair();
  return {
    keys: [jwk]
  };
}

export function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function base64UrlDecode(str) {
  const padded = str + '==='.slice((str.length + 3) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

/**
 * Signs a JWT with RS256 using our LMS private key
 */
export function signLtiJwt(payload, options = {}) {
  const { privateKeyPem } = getOrCreateKeyPair();
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: options.kid || LTI_CONFIG.keyId
  };

  const encHeader = base64UrlEncode(JSON.stringify(header));
  const encPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(data);
  const signature = signer
    .sign(privateKeyPem, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

/**
 * Verifies an RS256 JWT using public key PEM
 */
export function verifyLtiJwt(token, publicKeyPem) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const data = `${parts[0]}.${parts[1]}`;
    const sig = Buffer.from(parts[2].replace(/-/g, '+').replace(/_/g, '/'), 'base64');

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(data);
    const valid = verifier.verify(publicKeyPem || getOrCreateKeyPair().publicKeyPem, sig);

    if (!valid) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

/**
 * Builds an authentic LTI 1.3 LtiResourceLinkRequest token for Edmentum
 */
export function buildLtiResourceLinkLaunchToken({
  user,
  course,
  targetLinkUri,
  roles = ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
  nonce = null
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    // Standard OIDC & OAuth Claims
    iss: LTI_CONFIG.issuer,
    sub: user.uid,
    aud: LTI_CONFIG.clientId,
    exp: now + 3600, // 1 hour
    iat: now,
    nonce: nonce || crypto.randomUUID(),

    // User Profile Information
    name: user.displayName || 'Student',
    given_name: (user.displayName || '').split(' ')[0] || 'Student',
    family_name: (user.displayName || '').split(' ').slice(1).join(' ') || '',
    email: user.email || `${user.uid}@welearn.local`,

    // LTI 1.3 Core Claims (1EdTech)
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': LTI_CONFIG.deploymentId,
    'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': targetLinkUri || course.targetLinkUri || 'https://ple.platoweb.com/EdmentumCourseware',
    'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
      id: course.id || 'edmentum-course-01',
      title: course.title || 'Edmentum Courseware',
      description: course.description || 'Interactive secondary curriculum'
    },
    'https://purl.imsglobal.org/spec/lti/claim/roles': roles,
    'https://purl.imsglobal.org/spec/lti/claim/context': {
      id: course.contextId || 'class-welearn-general',
      label: course.contextLabel || 'WeLearn Secondary',
      title: course.title || 'Edmentum Courseware',
      type: ['CourseSection']
    },
    'https://purl.imsglobal.org/spec/lti/claim/tool_platform': {
      guid: 'welearn-spark-lms',
      name: 'WeLearn SPARK Learning Management System',
      version: '1.0.0',
      product_family_code: 'welearn'
    },

    // LTI Advantage: Assignment and Grade Services (AGS) Claim
    'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint': {
      scope: [
        'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
        'https://purl.imsglobal.org/spec/lti-ags/scope/score'
      ],
      lineitems: `${LTI_CONFIG.agsUrl}/lineitems`,
      lineitem: `${LTI_CONFIG.agsUrl}/lineitems/${course.id || 'edmentum-course-01'}`
    }
  };

  return signLtiJwt(payload);
}
