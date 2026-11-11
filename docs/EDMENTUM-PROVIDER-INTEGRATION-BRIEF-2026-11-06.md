# WeLearn–Edmentum integration discovery brief

Date: 6 November 2026  
Status: Draft for Mani's review; not sent to Edmentum.  
Purpose: Confirm a supported integration approach before technical registration.

## Our objective

Edmentum is our academic content provider. WeLearn operates its own LMS and wants learners to find assigned Edmentum courses and activities within WeLearn, open licensed activities without a separate manual sign-in, and view supported academic results within the WeLearn experience.

WeLearn is **not currently a certified LMS**. Our existing integration code is a prototype requiring further implementation and validation. We are not claiming LTI conformance, certification, completed grade synchronization or an approved Edmentum connection. We would like to establish whether Edmentum supports onboarding a custom, currently uncertified LMS and what prerequisites apply.

## Proposed division of responsibilities

| Area | Proposed responsibility |
|---|---|
| Licensed academic content and source assessments/results | Edmentum |
| Learner dashboard, local identity and school/class access | WeLearn |
| Integration | WeLearn as LTI platform, Edmentum as tool, if supported for our licensed products |
| Content presentation | Course/lesson references within WeLearn, with delivery method confirmed by Edmentum |
| Grade display | WeLearn mirrors only supported, verified provider results and preserves source dates |
| Provisioning and licences | Jointly agreed workflow; account creation and seat allocation must be confirmed |
| Credit, transcripts and academic accreditation | Defined by the contracted offering and responsible academic institution; not inferred from LTI integration |

Our preference is for activities to be usable within the WeLearn interface. Please identify which activities can be embedded and which require a separate browser window. We distinguish course-structure import from copying or rehosting the underlying content; any asset delivery/rehosting must be expressly supported and licensed.

## Questions for Edmentum

1. Can you onboard a custom LMS without existing 1EdTech certification? Is certification required for testing, pilot access or production? What approval/testing process applies?
2. Which exact products and subscriptions in our agreement support third-party LMS integration? Please distinguish Courseware, Apex and any other relevant offering rather than assuming identical capabilities.
3. For each product, which LTI 1.3 capabilities are supported: resource launch, Deep Linking, Assignment and Grade Services and NRPS? Can you provide the applicable implementation guide and supported versions?
4. Can we select individual lessons/assessments, import a complete course structure or both? Which package/import formats are supported? How do content updates and withdrawn resources propagate?
5. Can activities run in an embedded frame on our domain? What browser, cookie, mobile, accessibility or new-window requirements apply?
6. How are learners provisioned and matched to accounts, classes and licences? Is a separate API, roster sync or pre-provisioning process required? How are withdrawal, seat reuse and duplicate accounts handled?
7. What results are returned: lesson/assessment scores, attempts, mastery, unit completion, course completion or time spent? Which are AGS data and which need another API/report? How do corrections, retries and delayed events behave?
8. Who creates gradebook line items, and how are they bound to course/lesson resources? Which scopes, identifiers, score scales and timestamps should we use?
9. Please supply confirmed tool login-initiation, redirect/launch, content-selection and JWKS details, plus any service API documentation, rate limits and authentication requirements. We will supply verified platform configuration after implementation; no placeholder URL should be registered.
10. Can you provide a non-production environment, synthetic accounts and licensed sample resources for end-to-end testing? Please identify technical support ownership, onboarding costs, lead times and production acceptance criteria.
11. What student-data fields are essential, and what contractual arrangements cover processing, hosting location, retention, deletion and incident coordination?

## Proposed first acceptance scenario

An authorized synthetic learner opens one approved licensed resource from WeLearn. Edmentum recognizes the correct account and entitlement. A supported assessment result returns, is matched to the correct learner and school, and is visible in WeLearn with its source and timestamp. Failed access and failed grade delivery are reported accurately and can be retried safely.

Additional capabilities and pilot dates will be agreed after this scenario and onboarding prerequisites are confirmed. Production deployment requires separate written approval from WeLearn's platform lead.

## Registration status

All issuer URLs, platform authorization/token/JWKS URLs, client/deployment IDs, tool endpoints and permitted scopes are **pending verification**. Existing prototype defaults are not approved registration parameters. No credentials or student records are included in this brief.

Reference: [Edmentum's published integration overview](https://www.edmentum.com/support/integrations/) describes lesson/course-structure integration with LTI 1.3-capable LMSs. We request confirmation of applicability to our custom platform and licensed products.
