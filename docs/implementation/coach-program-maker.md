# Coach program maker

Open Coach dashboard → PBL Studio → Create your own program. Design the program manually, describe it for conversion, or upload a curriculum PDF (up to 4 MB). Conversion uses the existing server-side school Gemini connection, school AI allowance, and coach request limits. No API keys belong in the browser. PDFs are sent to Gemini for conversion and are not stored as student lesson attachments. Upload curriculum source material without learner personal records.

Review the title, driving question, overview, grade band, milestones, Activities and Simulations. Every activity or simulation links to a program milestone. Save program draft creates an existing program offering plus separate lesson documents in one transaction, assigned to one class. An empty program can be saved, but publishing requires at least one lesson. Program details remain editable while the program is a draft; existing lesson editors and Activity Studio handle lesson editing and interactive activities.

Publish program publishes its draft lessons and program together. Revision checks reject stale updates; school/class checks, lesson author checks and AI activity safety confirmation remain enforced. A coach must have access to every assigned class to publish the offering. Draft programs are hidden from learners and cannot be joined. After publishing, issue an enrollment code using the existing panel. Students join and view the same program layout, with Activities and Simulations rendered as separate sections. Lessons containing both an interactive activity and a simulation appear in both sections, with their respective player displayed only in its section.

The PDF converter produces structured lesson instructions and supported simplified resource simulations. It does not turn arbitrary source physics or code into custom executable simulations. Coaches can enrich lessons using the existing Activity Studio. Generated output is validated, and failed conversion preserves the current draft. Browser unload and replacement/discard confirmation protect unsaved program edits. Saved draft overview and milestone titles can be reopened and edited.

Verification uses a mock AI adapter and local Firebase emulators, without production credentials. A real Gemini PDF conversion requires the configured school connection and has not been exercised by this verification.

Endpoints:
- POST /api/schools/:schoolId/program-drafts/convert: prompt and/or PDF → validated structured draft.
- POST /api/schools/:schoolId/program-offerings with programId=custom and programDraft: save offering and linked draft lessons.
- PATCH /api/schools/:schoolId/program-offerings/:offeringId/definition: edit draft program details with revision checks.
- POST /api/schools/:schoolId/program-offerings/:offeringId/publish: publish program and linked draft lessons atomically.
