# Learner personalization and portfolio privacy

Learners open **Personalize dashboard** from their private dashboard and **My portfolio** from navigation. Each surface has its own heading, introduction, interests, profile image and appearance. Dashboard personal goals are private. Portfolio covers and work audiences apply only to the portfolio.

Settings use schema version 1, enumerated palettes/backgrounds/layouts, an explicit permutation of four widget IDs and bounded plain-text fields. HTML and scripts are never accepted as layout configuration. Code is displayed as text or downloaded, never executed. Files are limited to 20 MB. Supported work includes code text/files/ZIPs, GLB/glTF/OBJ models, raster images, written reflections and recorded audio/video. Microphone recording stops after three minutes; transcripts can be added in the reflection field.

Changes preview live before saving. Undo and discard are available; the dashboard can restore its default layout. Widgets support drag-and-drop, Alt + arrow keys and explicit move buttons, with position announcements and stable keyed widgets. Appearance and work edits have separate save controls.

## Storage and authorization

- `learnerSpaces/{uid}`: owner-only dashboard settings, private personal goals and revision.
- `learnerPortfolios/{uid}`: shareable profile settings and up to 60 curated entries. Each entry starts private and has an explicit audience list.
- `portfolioAudienceGrants/{uid}`: administrator-approved signed-in viewer IDs and approving school, with independent revision checks.
- `learnerMedia/{uid}/{uploadId}/{filename}`: immutable owner uploads. Direct reads are denied. The server verifies owner paths, actual file metadata, supported MIME types and size. Any Firebase permanent download token is removed before saving media. Authorized requests receive URLs expiring after five minutes.

Direct Firestore access to these three collections is denied, including for owners. The authenticated API applies verified claims and current profiles. Assigned coaches and classmates must still share an active school and class. Wider viewers must be explicitly named in a school administrator's approval; learner audience choices alone cannot approve wider viewers. Anonymous public sharing is unavailable. Administrator approval does not grant access to private work.

Shared responses whitelist the portfolio profile and visible entries. They never read the private dashboard, notes, personal goals or support requests. Revocation affects new requests immediately; an already issued media URL may remain usable until its five-minute expiration. Downloaded copies cannot be recalled.

## Routes and API

- `#/home`: private dashboard.
- `#/portfolio`: learner portfolio editor.
- `#/portfolio/<uid>`: authenticated audience-filtered portfolio viewer. School administrators also manage wider audience approvals here.
- `GET/PUT /api/learner-space`: read or save owner settings.
- `POST /api/learner-space/media-preview`: validate an owner upload and issue its temporary preview URL.
- `POST/PATCH/DELETE /api/learner-space/items[/<id>]`: curate work with revision checks.
- `GET /api/learner-portfolios/<uid>`: scoped shared projection.
- `GET/PUT /api/learner-portfolios/<uid>/audience`: school-admin audience approvals.

The frontend, API and Firestore/Storage rules must be deployed together before use on the live site. No deployment was performed as part of implementation.

## Verification

Model tests cover settings validation, widget ordering, media ownership, safe URLs, audience previews and WCAG AA contrast for every palette/background combination. Interface tests cover keyboard and drag ordering, undo/reset/discard, explicit saves, private-data exclusion and service failure. Emulator API tests cover private/shared separation, authorizations, revisions, audience approval and revocation, file validation, media projection and preservation of work during settings saves.
