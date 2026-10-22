# Canva and Cloudinary: backend contract for Gemini

**Status (2026-10-22):** phase 1 is built on branch `feature/portfolio-media`, frontend only. Learners paste Canva view links, Cloudinary media and YouTube links, and they show inside the portfolio. There is also a Showcase view. See `src/features/pbl/engine/mediaEmbed.js`.

Phase 2 below needs server code and rules, which Gemini owns. The frontend builds against these endpoints once they exist.

Every secret stays on the server: the Cloudinary API secret, the Canva client secret, and Canva access and refresh tokens. None of them goes in the bundle, the repository or Firestore documents that clients can read.

## 1. Cloudinary uploads (portfolio files and coach resources)

Use signed uploads. Unsigned presets can be used by anyone who finds the preset name, and these files come from children.

`POST /api/media/sign`
- Callers: students and teachers.
- Body: `{ purpose: 'portfolio' | 'resource', classId?: string, resourceType: 'image' | 'video' | 'raw' }`
- Checks:
  - `portfolio`: the caller is the owner.
  - `resource`: the caller teaches `classId`.
  - Refuse students under 13 until parental consent exists (`consent.status`), for every upload.
- Returns: `{ cloudName, apiKey, timestamp, signature, folder, publicIdPrefix, allowedFormats, maxBytes }`. The signature covers `folder`, `timestamp`, the moderation setting and `allowed_formats`.
- Folders:
  - `portfolio/<uid>/`
  - `resources/<classId>/`
- Limits:
  - images 10 MB: jpg, png, webp, heic
  - video 100 MB: mp4, mov, webm
  - documents 20 MB: pdf
- Moderation:
  - Enable a Cloudinary moderation add-on on image uploads.
  - The frontend shows "Waiting for review" until the asset is approved.
- The frontend uses the Upload Widget with these parameters, then stores the returned `secure_url` on the evidence item (`link`). Those links already embed (`res.cloudinary.com/.../image|video/upload/...`).
- To decide with Mani: should portfolio media be public URLs (simple), or Cloudinary authenticated delivery with short-lived signed URLs (more private, needs a URL-signing endpoint)?

## 2. Canva Connect ("Create in Canva", then bring the design back)

- Register the integration in the Canva Developer Portal under the school's account. Mani currently has Canva Pro.
- The Connect APIs use OAuth 2.0 Authorization Code with PKCE (SHA-256).
- A private, school-only integration needs Canva Enterprise. Otherwise the integration must be public and pass Canva's review before coaches and students can use it. Until then it only works for its developer's account.

Endpoints:
- `GET /api/canva/connect` starts OAuth (PKCE verifier kept server-side) and redirects to Canva.
- `GET /api/canva/callback` exchanges the code and stores tokens server-side only. Refresh tokens are single-use, so store the new one on every refresh.
- `POST /api/canva/designs`
  - Body: `{ title, preset: 'presentation' | 'doc' | 'whiteboard' | 'poster' }`
  - Returns: `{ designId, editUrl }`
  - Uses Canva's return navigation so the user comes back to WeLearn when they finish.
- `POST /api/canva/designs/:designId/export`
  - Body: `{ format: 'png' | 'pdf' }`
  - Runs Canva's export job, uploads the result to Cloudinary (section 1 folders, server-to-server) and returns `{ url }`.
- `DELETE /api/canva/connection` revokes and deletes the stored tokens.

Scopes: request only design create/read and export (exact scope names from canva.dev).

## 3. Coach course content (needs rules)

Coaches attach Canva designs and Cloudinary media to a class's PBL program lessons.

Proposed store: `classes/{classId}/resources/{resourceId}`
- Fields: `{ title, kind: 'canva' | 'image' | 'video' | 'pdf' | 'youtube', url, programId, section, createdBy, createdAt }`
- Create, update and delete: teachers of the class.
- Read: members of the class, and admins.
- `url` must pass the same allowlist as `mediaEmbed.js`. Check it in the rules with a regex on the host.

If the AI Course Studio has its own content model, use that instead and tell Claude the shape. The embed component (`src/features/pbl/MediaEmbed.jsx`) works anywhere.

## Report back

For each endpoint: whether it's deployed, the request and response as built, error codes, and any differences from this contract. Nothing deploys to production without Mani's written "go" for that step (see `AGENTS.md`).
