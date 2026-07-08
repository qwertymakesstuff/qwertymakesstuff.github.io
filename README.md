# ScreenType Mobile

This folder is a standalone GitHub Pages version of ScreenType, optimized for iPhone-sized screens. It does not depend on the main app files outside this folder.

## Deploy To GitHub Pages

1. Create a new GitHub repository.
2. Copy the contents of this folder into the repository root.
3. Commit and push.
4. In GitHub, open Settings > Pages.
5. Set Source to the repository branch and root folder.
6. Open the published GitHub Pages URL in Safari on your iPhone.
7. Use Share > Add to Home Screen to install it.

Drafts are stored locally on the device through browser storage. Export `.fountain` files regularly if you need backups outside the phone.

## Files

- `index.html` is the app shell.
- `styles.css` is the mobile-first layout.
- `script.js` is the editor logic.
- `manifest.webmanifest` and `sw.js` make the app installable and cache the app shell.
- `icons/screentype.svg` is the app icon.
