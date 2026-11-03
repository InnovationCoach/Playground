# Coach lesson media

Coaches open PBL Programs, choose an assigned offering/class and add a lesson with instructions, images and videos. Save draft uploads the media and stores verified file metadata with the lesson. Publish lesson makes the instructions and media visible in the enrolled student's PBL Programs view. The dashboard refreshes published lessons every 30 seconds.

Supported media: JPG, PNG, WebP, GIF, MP4 and WebM. Maximum eight attachments per lesson and 100 MB per attachment. Files stream from Firebase Storage without automatic video transcoding. Published lessons stay immutable; add a new lesson for revised content.

## Release requirements

- Deploy the updated school API, frontend and `storage.rules` together. These changes do not deploy themselves.
- Ensure Firebase Storage is provisioned for the existing bucket. Override the API bucket using `FIREBASE_STORAGE_BUCKET` if the deployed bucket differs from `dnd-master-73449.firebasestorage.app`.
- Enable the Firebase Storage rules integration with Firestore, including its service-agent permissions, when deploying cross-service rules.
- The backend identity needs Storage object metadata/read permissions and permission to sign URLs (IAM `iam.serviceAccounts.signBlob`, or credentials supporting signing). Keep service-account credentials on the server.
- Verify a real coach draft upload, publication and enrolled student playback after deployment. Confirm an unrelated class cannot see the lesson and students cannot upload into coach drafts.

## Access and limitations

Storage uploads require signed school/class grants intersected with the provisioned profile, an owned lesson draft, and the supported media type/size. Files cannot be overwritten directly. The API verifies stored object metadata and restricts attachments to the same lesson before saving them. Authorized lesson responses contain read URLs that expire after one hour. A URL may be used by anyone possessing it until expiry; scope changes prevent issuance of new URLs.

Removing an attachment removes its association with the draft. Unattached objects from removed files or failed uploads remain in Storage; add an administrative cleanup policy if needed. No Cloudinary credentials are used or required.
