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

## To finish

1. **Mani uploads** `how-it-works.mp4` to Cloudinary (public video) and sends the delivery link.
2. **Opus sets** `src` in `arrivalVideos.js` and checks it at 5197 with `&video=<link>`.
3. **Educator review:** GPT/educator review of the narration (`script.json`). The voice is synthetic; a human recording can replace the MP4 later with no code change if the timings are kept (or the cues are updated).
4. **Not done:**
   - clips for Journey timing (Thalassa) and Mass and power (Ignis);
   - Safari, physical devices and screen readers.
