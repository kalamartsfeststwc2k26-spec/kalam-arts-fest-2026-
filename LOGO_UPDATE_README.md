# KALAM logo update (local preview)

Based on production main commit `836834f5f18ed772d5751fd27a73368a815c9398`. The supplied transparent artwork already includes the college name and festival wording in black; it is preserved in the full logo used for the intro, home hero and PDF watermark. A compact artwork-only version is paired with readable college name text in shared header/footer. App and browser icons use the artwork-only version because the full wording would be too small. Team logos are not changed.

## Changed assets and implementation

- `public/kalam-logo-college-v2.png`: transparent 1600 × 1000 full lockup.
- `public/kalam-mark-v2.png`: compact mark (without the college-name strip).
- `public/icon-192-v2.png`, `public/icon-512-v2.png`, `public/icon-maskable-512-v2.png`: favicon/install icons. The maskable icon's visible artwork fits within the circular safe area.
- `assets/kalam-upload-original.png`, `tools/create_logo_assets.py`: supplied source image and reproducible Pillow asset generation.
- Shared branding, intro, favicon/manifest, PDF watermark path and aspect ratio, and service-worker cache version were updated. Existing filenames were versioned to reduce stale-cache problems. Cached app icons can still be subject to platform/browser update behavior.

## Verification

13/13 Node tests pass; build passes with an existing large-chunk advisory. Chromium on a disconnected local preview checked intro and shared logos on 15 routes at 320, 390, 768, 900 and 1280 pixels, loaded images, horizontal overflow and uncaught page errors. A fictional browser PDF downloaded with the new asset. Browser smoke did not exercise production Auth or live data; external fonts were intentionally blocked during the checks. Android/iOS installation, visual PDF inspection in desktop viewers, and a service-worker upgrade from a previous real installation are not verified.

## Release

No production database, GitHub or Vercel changes were made. Review the local preview and request separate approval before merging or deploying. Use a fresh branch based on the actual current production main; verify it still matches the base commit and review the diff. Do not copy any `.env` or secrets. The preview runs without Supabase, so live data/admin modules are intentionally unavailable there.
