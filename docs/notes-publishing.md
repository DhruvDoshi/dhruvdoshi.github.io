# Technical note publishing

The first note in the new series was published immediately on 2026-07-28. The remaining editorial calendar publishes one technical note on the 1st and 16th of each month. Scheduled notes use `status: scheduled` and are excluded from the website, search, topic indexes, prerendered pages, RSS, sitemap, and LLM discovery files.

The `Publish scheduled notes` GitHub Actions workflow runs daily at 13:15 UTC. When a note is due, it:

1. changes its status to `published`;
2. runs the complete lint, test, build, site-validation, and dependency-audit suite;
3. commits the publication and regenerated discovery files to `main`;
4. deploys the generated site to GitHub Pages.

The push to `main` is also observed by the existing Netlify Git integration, which rebuilds `doshidhruv.com` from the same commit.

## Commands

Preview which notes are due today without changing files:

```sh
npm run publish:notes -- --dry-run
```

Test a future publication date:

```sh
npm run publish:notes -- --dry-run --date 2026-08-01
```

Publish every note due on or before a specific date:

```sh
npm run publish:notes -- --date 2026-08-01
```

The workflow runs every day rather than only twice a month so a delayed or missed scheduled run is recovered automatically.
