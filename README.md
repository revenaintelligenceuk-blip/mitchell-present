# A present for Mitchelle

An animated birthday present. Tap the box to unwrap it, read the card, and flip to the "Your wins" page.

Plain static site: no build step, no dependencies.

```
index.html        page markup
styles.css        all styles (includes print styles)
script.js         gift opening, sparkles, puzzle-piece burst, photo jigsaw, page flip
assets/           photo and favicon
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Deploy

Import the repo in Vercel with the framework preset set to **Other** and no build command. Every push to `main` redeploys.
