# My Universe O05: "How this mission works" clip on arrival

3 November 2026 · Opus 5.5 · requested by Mani in chat:
- **Request:** a short clip on entering the planet that explains how to read the data and complete the challenge, hosted on Cloudinary.
- **Mani's choices:** offered first and skippable; built by Opus from the preview; Mani uploads to Cloudinary and sends the link.

Local commit only. Nothing pushed, deployed or uploaded. No server, rules, auth, config or fixture changes.

## The clip (Wind energy estimate, Thalassa, guided route)

- **Files (not in git):** `output/my-universe/videos/thalassa-wind/`
  - `how-it-works.mp4`: 1280×720, H.264 + AAC, 73 s, 6.5 MB, seekable.
  - `poster.jpg`
  - `captions.vtt`
  - `script.json` (narration and timings)
- **Production:**
  - Narration: the macOS Samantha voice (`say`).
  - Pictures: the real 5197 synthetic preview, captured in a separate headless Chrome with its own temporary profile. The amber outline marks what each line describes.
  - Encoding: joined with Chrome's own recorder, then rewritten into a normal seekable MP4 by macOS `avconvert`.
  - The approved Homebrew ffmpeg install failed: Homebrew's tooling is too old for the current formula. I didn't update Homebrew itself, a bigger system change than was approved. Nothing else was downloaded.
  - Scripts are in `output/my-universe/videos/tools/` (`capture.mjs`, `assemble.mjs`, `probe.mjs`).
- **Scenes:**
  1. Arrival and the mission question.
  2. Look around and place the sensor ("only a plan: the mission uses its supplied data").
  3. Start mission.
  4. Check the data and its source label ("made up … testing a method").
  5. Read the wind table one row at a time.
  6. Divide for the capacity factor, with hints.
  7. Compare, test less wind, recommend, review and send.
- **No answers given:** the clip gives no numerical answers.

## In the app

- **Registry:** `src/features/universe/explore/arrivalVideos.js` maps mission|route to a clip.
  - Each entry: title, duration, summary, `src`, and caption `cues`.
  - `src` is `null` until Mani supplies the uploaded link, and with no link nothing is shown.
  - Only `https://res.cloudinary.com/<cloud>/video/upload/…` links are played (`isCloudinaryVideo`).
  - The poster is derived from the same Cloudinary asset (`so_15,w_1280`, `.jpg`).
- **Offered first:** when a visit offers exactly one mission (an expedition card), the arrival card opens on "Before you explore, see how this mission works", with **Watch the video · 1:13**, **Skip video** and a **Read it instead** transcript.
  - Nothing plays by itself.
  - A general landing with several missions offers no single clip.
- **Playing:** the video plays inline in the card with native controls and English captions on by default (WebVTT built from the cues). **Done**, or the clip ending, returns to the normal arrival card, with focus on its heading.
  - "Watch how this mission works (1:13)" stays available in the arrival and ready views.
- **No effect on the mission:** watching is not exploration time, so the 45 s clock pauses while it plays. Skipping changes nothing about setup, the mission, its route or evidence. Watched or skipped state is local memory for the visit (learner/org and planet), like the rest of the arrival.
- **Phone (375×600):** the poster thumbnail is hidden, so Watch and Skip fit without scrolling. While playing, Done sits right under the video.
- **Preview:** `pilot.html?…&arrive=wind&video=local` plays the rendered file from `tests/universe-preview/media/` (local copy, not committed). `&video=<Cloudinary link>` plays an uploaded link.
- **No CSP:** the app has no Content-Security-Policy, so Cloudinary video and the blob caption track need no config change.

## Tests and checks

- `tests/universe-arrival-ui.test.jsx`: 3 new tests (15 in total).
  - Offered first, plays only on request, the clock pauses while playing (it fails without the pause), and Done or ended returns with focus.
  - Skip, then the mission opens normally.
  - No player without a link, for a non-Cloudinary host, or with several offered missions.
- Universe suites 149/149 (both the scratch include and the committed config, which now includes the arrival file), shared 35/35. The build passes with 0 fixture, demo or preview-media strings.
- **Browser, 5197:**
  - The offer shows the poster.
  - A real click plays with sound; duration 73.0 s; captions showing the right line at 6 s; focus on the player heading.
  - Skip, watch again, Done.
  - Phone layout checked.
- **Captures:** `captures/o05/` (offer, playing with captions, phone).

## Uploaded clip (follow-up)

- **Link:** Mani uploaded the file: `https://res.cloudinary.com/dkplz6vbx/video/upload/v1793678509/tv2VtAzF6diYWhaPDP4s6Q_xytypx.mp4`.
  - Same bytes as the render (6,524,314).
  - Served as `video/mp4;codecs=avc1`, with byte ranges (206) and `Access-Control-Allow-Origin: *`.
  - The derived poster (`so_15,w_1280`, `.jpg`) returns 200.
- **Registry:** `src` is set in `arrivalVideos.js`, so the wind expedition now offers the clip by default.
- **Tests:** arrival tests that aren't about the clip pass an empty clip registry. A new test checks that the shipped registry offers the Cloudinary clip for wind and none for Mass and power. Suite 150/150.
- **5197, no preview switch:** the Cloudinary poster loaded; a real click played the hosted file (73.0 s, no media error); a seek to 45 s worked with the matching caption showing. Capture `04-cloudinary-clip-playing-seeked.jpg`.
- **Local copy removed:** the uncommitted copy in `tests/universe-preview/media/` is gone; `&video=local` only works if it's restored.

## Journey timing and Mass and power clips (follow-up)

- **Files (not in git):** same pipeline, in `output/my-universe/videos/journey-timing/` and `output/my-universe/videos/mass-power/` (MP4, poster, captions, script).
  - Scenes now live in each folder's `scenes.mjs`.
  - Narration is built by `tools/narrate.py`.
- **Journey timing** (Thalassa departure station, guided):
  - 66.0 s, 5.9 MB, seekable, 20 caption cues.
  - Covers: limits (80 days, 400 kg food), reading the concept table (average speed per row; time = distance ÷ speed), converting seconds to days with hints, then check the concepts, show the journey, recommend and send.
- **Mass and power** (Ignis, advanced):
  - 69.8 s, 5.9 MB, seekable, 19 cues.
  - Covers: limits (150 days, 21,000 kg, 260 m²), the supplied rocket equation for chemical then ion, the mass ledger one row at a time, and the independent 140-day ion assumption ("not the timing case"), then the references, label the scenario, defend a conditional choice and send.
- **No answers given:** neither clip states a result.
- **Sync check:** `probe.mjs` frames at 40 s match the narration (Mass and power: "Model chemical propellant").
- **Registry:** both entries are in `arrivalVideos.js` with their cues; `src` stays `null` until uploaded, so no player shows for them yet.
- **Preview:** `?video=local` now covers all three clips (local copies in `tests/universe-preview/media/`, removed again after checking).
- **5197 checks:**
  - Mass and power on Ignis: "Arrived · Ignis · 1:10", plays, seeks to 50 s with the ledger caption. Capture `05-mass-power-ignis-playing.jpg`.
  - Journey timing on Thalassa: "1:06", seeks to 40 s with the concept-table caption.
- **Tests:** a registry test covers three routes, ordered non-empty cues, and links that are `null` or Cloudinary. Suite 151/151, shared 35/35; the build passes with no preview media in the bundle.

## Still open

- **Mass and power: uploaded and set.**
  - Link: `https://res.cloudinary.com/dkplz6vbx/video/upload/v1793681362/IHUXnNr7VKBL6nReVK2peA_un6ujs.mp4`. The size (5,911,491 bytes) matches only the Mass and power render; byte ranges (206) and the derived poster both work.
  - At 5197 with no preview switch: it played the hosted file (69.8 s, no media error) and seeked to 50 s with the ledger caption.
- **Journey timing: still to upload.** The second link Mani sent was the wind clip again (already set), so `spacecraft-journey|guided` stays `null` and shows no player.
- **Shipped-registry test:** now expects the Mass and power clip on Ignis and no player for Journey timing.


1. **Educator review:** GPT/educator review of the narration (`script.json`). The voice is synthetic; a human recording can replace the MP4 later with no code change if the timings are kept (or the cues are updated).
4. **Not done:**
   - clips for Journey timing (Thalassa) and Mass and power (Ignis);
   - Safari, physical devices and screen readers.
