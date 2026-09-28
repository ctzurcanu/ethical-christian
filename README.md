# The Ethical Christian

Ethical considerations about Christianity.

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

## Recent edits

Visit `/ethical-christian/recent` (or choose **Recent** in the navigation) to see documents edited after a date, newest first. The default cutoff is 30 days before the site build. The date picker saves the cutoff in the URL, for example `/ethical-christian/recent?after=2026-09-01`.

The cutoff excludes the selected day, using UTC dates. A local Docusaurus plugin reads the latest Git commit date for each published document, honoring Docusaurus `last_update.date` overrides. Drafts, unlisted documents (including the generated compilation), and documents without an available edit date are omitted. Uncommitted edits are reflected after committing and rebuilding. Deployments fetch full Git history so checkout timestamps do not affect ordering.
