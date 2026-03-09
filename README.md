# Her Universe v3.0 ✨

A beautiful animated photo gallery — local photos, secure uploads, birthday celebration mode.

## Quick Start

```bash
npm install
npm start
# → http://localhost:3000
```

---

## 📸 Adding Your Photos

Place your photos directly into the season folders:

```
public/photos/
├── spring/     ← put spring photos here
├── summer/     ← put summer photos here
├── monsoon/    ← put monsoon photos here
├── autumn/     ← put autumn photos here
├── winter/     ← put winter photos here
└── golden/     ← put golden hour photos here
```

**Supported formats:** JPEG, PNG, WEBP, GIF

**Hero image per season:** name one file `_hero.jpg` to use it as the season's banner image.

```
public/photos/spring/_hero.jpg    ← spring banner
public/photos/summer/_hero.jpg    ← summer banner
...
```

The server automatically serves all images from these folders. No code changes needed — just drop photos in and restart.

---

## 🔒 Upload System (PIN-protected)

Users can also upload photos from the browser:

1. Click **Upload** on any season card
2. Enter the PIN (set in `.env`)
3. Drag & drop or browse — photos go into `public/photos/<season>/`
4. New photos appear seamlessly in the grid without refreshing

**Set your PIN in `.env`:**
```
UPLOAD_PIN=your_secret_pin
```

---

## 🎂 Birthday System

Set her birthday in `public/js/countdown.js`:
```js
window.HER_BIRTHDAY = "2026-03-07";  // YYYY-MM-DD
window.CELEBRATION_DAYS = 30;         // how long to celebrate
```

**How it works:**
- **Before birthday:** countdown timer shown, birthday button is locked 🔒
- **On birthday (30 days):** confetti + balloons launch, celebration mode, button unlocks → links to `/birthday` page
- **After 30 days:** countdown restarts to next year automatically

**Build the birthday page** at `public/birthday.html` — it's a template ready for your content.

---

## 🔐 Security

| Layer | Detail |
|---|---|
| Helmet | Secure HTTP headers, CSP |
| Rate limiting | 300/15min general · 40 uploads/15min · 10 auth/15min |
| PIN auth | Required for uploads and deletes |
| File whitelist | MIME type + extension must be images |
| UUID filenames | No path traversal possible |
| Per-season limit | Max 500 photos per season |


---

## 🎬 Season Videos (16:9)

Place one video per season inside the `public/videos/` folder:

```
public/videos/
├── spring/    ← spring.mp4  (or .webm / .mov)
├── summer/    ← summer.mp4
├── monsoon/   ← monsoon.mp4
├── autumn/    ← autumn.mp4
├── winter/    ← winter.mp4
└── golden/    ← golden.mp4
```

**Rules:**
- Filename can be anything — the server picks the first video file it finds
- Recommended format: **MP4 (H.264)** — widest device support
- Also supports: `.webm`, `.mov`, `.ogg`
- Aspect ratio: **16:9** — the card enforces this automatically
- Keep files under ~20MB for fast loading; compress with HandBrake or ffmpeg

**How it works:**
- On page load, gallery fetches `/api/videos` (one request for all 6 seasons)
- Cards with a video get a `<video autoplay muted loop playsinline>` injected
- Video plays only when the card is ≥40% visible (IntersectionObserver)
- Video pauses when the browser tab is hidden (battery saving)
- Smooth crossfade: poster image → video when ready
- A small animated red dot badge shows `VIDEO` on video cards
- Seasons without a video keep their poster photo

---

## 🚀 Deploy to Render / Railway

1. Push to GitHub (never commit `.env`!)
2. Set env vars in dashboard: `UPLOAD_PIN`, `PORT`
3. Start command: `npm start`

Note: uploaded photos are saved to disk. On platforms with ephemeral filesystems (like Render free tier), use a persistent disk or cloud storage.

---

## Project Structure

```
her-universe/
├── server.js
├── .env
├── public/
│   ├── index.html
│   ├── gallery.html
│   ├── about.html
│   ├── birthday.html        ← birthday page template
│   ├── photos/
│   │   ├── spring/          ← YOUR photos go here
│   │   ├── summer/
│   │   ├── monsoon/
│   │   ├── autumn/
│   │   ├── winter/
│   │   └── golden/
│   ├── css/
│   │   ├── base.css
│   │   ├── home.css
│   │   ├── gallery.css
│   │   ├── about.css
│   │   ├── upload.css
│   │   └── birthday.css     ← celebration styles
│   └── js/
│       ├── cursor.js
│       ├── common.js
│       ├── seasons.js
│       ├── gallery.js        ← fetches from /api/photos/:season
│       ├── upload.js         ← seamless upload merge
│       ├── home.js
│       ├── countdown.js      ← birthday logic + confetti + balloons
│       ├── about.js
│       └── birthday-page.js  ← /birthday page celebration
```
