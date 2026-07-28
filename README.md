# Know about Dhruv Doshi

[![GitHub Pages](https://github.com/DhruvDoshi/dhruvdoshi.github.io/actions/workflows/github-pages.yml/badge.svg)](https://github.com/DhruvDoshi/dhruvdoshi.github.io/actions/workflows/github-pages.yml)
[![Node.js CI](https://github.com/DhruvDoshi/dhruvdoshi.github.io/actions/workflows/node.js.yml/badge.svg)](https://github.com/DhruvDoshi/dhruvdoshi.github.io/actions/workflows/node.js.yml)
[![Website-Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fdhruvdoshi.github.io)](https://dhruvdoshi.github.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=popout-square)](https://opensource.org/licenses/MIT)

See: [doshidhruv.com](https://doshidhruv.com) and [dhruvdoshi.github.io](https://dhruvdoshi.github.io/).

Personal website built with React, Vite, React Router, and SCSS. Deploys automatically to **GitHub Pages** (via GitHub Actions) and **Netlify** (on push to `main`).

## Development

```bash
nvm use          # Node 22 (see .nvmrc)
npm ci
npm start

# Run the same lint, test, build, and critical-vulnerability checks as CI
npm run check
```

## Deployment

| Host | Trigger | Output |
|------|---------|--------|
| GitHub Pages | Push to `main` or manual workflow run | GitHub Pages artifact from `dist/` |
| Netlify | Push to `main` | `dist/` directory |

**Netlify:** If builds still use Node 20, open Site configuration → Environment variables and set `NODE_VERSION` to `22`, or remove any dashboard override so `netlify.toml` is used.

**GitHub Pages:** Settings → Pages → source must be **GitHub Actions**. The workflow uses GitHub's artifact-based Pages deployment and does not write generated files back to the repository.

**Analytics:** Define an Actions repository variable named `GA_TRACKING_ID` with a GA4 measurement ID (for example, `G-XXXXXXXXXX`). Netlify can use a `VITE_GA_TRACKING_ID` environment variable. Analytics stays disabled when the value is absent.

## Detach from fork network

To stop showing "forked from mldangelo/personal-site":

1. Open [repository Settings](https://github.com/DhruvDoshi/dhruvdoshi.github.io/settings)
2. Scroll to **Danger Zone** → **Leave fork network**
3. Confirm (this is permanent; the repo becomes standalone)

This cannot be done from the codebase; it requires repo admin access on GitHub.
