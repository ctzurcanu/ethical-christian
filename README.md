# Ethical Christian

Ethical considerations about the Biblical New Testament.

This repository contains the Docusaurus site for reconstructing Christian ethoses from Jesus through their later developments. Documentation source files live in [`docs/`](docs/), and pushes to `main` are deployed automatically to GitHub Pages.

## Local development

```bash
npm install
npm start
```

Create a production build with `npm run build` and preview it with `npm run serve`.

Generate the portable, complete Markdown compilation separately with `npm run build:whole`. A normal production build also refreshes it automatically.

## GitHub Pages

In the repository settings, go to **Pages** and set **Source** to **GitHub Actions**. After that one-time setup, every push to `main` deploys the site automatically.
