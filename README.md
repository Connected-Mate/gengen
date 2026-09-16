# GenGen

A standalone website for **generative generation**: the people experimenting, learning and building with AI. The GenGen certificate describes recorded AI activity; it is not an independently audited qualification or a measure of skill.

Public site: <https://connected-mate.github.io/gengen/>

## Development

Requires Node.js 22 or later. No package dependencies. The editorial page is static; the studio uses local browser canvas rendering.

```sh
npm ci
npm run build
npm run check
npm test
```

The build writes pre-rendered HTML, CSS and public assets to `dist/`, with `/gengen/` as the GitHub Pages project base. Serve `dist/` under `/gengen/` when previewing locally. The site source is `src/index.html` and `src/styles.css`. `public/assets/gengen-seal.png` is a reusable transparent 2048 × 2048 label illustration, not a personalised issued credential.

## Eligibility

Either 100 billion lifetime recorded tokens, or two calendar months after a known, recorded 10 billion-token Graphite crossing. Unknown dates remain unknown. Elapsed time does not imply daily or ongoing use. Builder Nutch reads retained local Claude Code and Codex history; sharing is always manual.

## Credits and licensing

The page, certificate composition and graphite/silver seal are adapted from [Builder Nutch / Codenotch](https://github.com/Connected-Mate/builder-nutch), by Connected Mate, built on Codenotch by Vinz. The original MIT copyright and permission notice are preserved in `LICENSE`; the website and seal illustration are distributed under that licence.

The bundled **Bricolage Grotesque** font is copyright 2022 The Bricolage Grotesque Project Authors, licensed under SIL Open Font License 1.1. Its complete licence and attribution are in `public/fonts/OFL.txt`. The font is unmodified.

Small inline arrow and download icons are adapted from Lucide/Feather. The ISC/MIT notices are preserved in `public/licenses/lucide.txt` and included in the published site, alongside the website’s MIT licence.

## GenGen Studio

Open `/gengen/studio/`. In Builder Nutch 0.21.0 or later, open Usage → Share → GenGen certificate. Eligible saved history exports a small JSON file. Import it into the studio; choose a photo and optional display name, adjust the crop and download a profile image, LinkedIn banner, X banner or certificate post.

Photos and certificates remain in browser memory; the studio sends no uploads and stores no personal data. Reset or reload clears the session. Before import, previews are marked as samples and export stays locked. The certificate contains only recorded totals, eligibility dates, a random reference and the app name—no accounts, emails, paths or conversation content. It is an unsigned local-history attestation, not independently audited identity or tamper-proof proof of consumption.

Banner dimensions follow [LinkedIn Help](https://www.linkedin.com/help/linkedin/answer/a568217/add-or-change-the-background-photo-on-your-profile) (1584 × 396) and [X Help](https://help.x.com/en/managing-your-account/common-issues-when-uploading-profile-photo) (1500 × 500); profile output is 800 × 800. Sharing is always manual.
