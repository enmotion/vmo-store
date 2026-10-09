# GitHub Pages deployment

## Site and branch

This repository uses the GitHub remote `https://github.com/enmotion/vmo-store` and the `master` branch. The site is configured for:

```text
https://enmotion.github.io/vmo-store/
```

VitePress `base` is `/vmo-store/`. English lives at the site root; Chinese lives at `/zh/`. HTML URLs are retained for static-host deep-link compatibility.

## Enable Pages

In repository **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**. The workflow needs `pages: write` and `id-token: write` for its deployment job.

Push verified changes to `master`, or run the workflow manually on `master`. Pull requests run checks without deploying. The workflow builds the site, verifies it in real browsers, uploads `docs/.vitepress/dist`, and deploys through the `github-pages` environment.

```sh
npm run docs:build
npm run docs:preview
```

Preview the built site at `/vmo-store/`, including deep pages, before publishing. The browser suite provides its own static server and tests this exact base path.

## Another repository or domain

Change `base`, sitemap hostname, GitHub/edit links and deployment branch before reusing the docs. For a custom root domain, set `base: '/'` and configure the domain in GitHub Pages. Do not commit `.vitepress/dist` or publish the source directory as the static artifact.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Pages configuration error | Source must be GitHub Actions and repository/account must support Pages |
| Missing CSS or scripts | `base` must match the repository sub-path |
| Deep links return 404 | Keep generated `.html` links and upload the entire output directory |
| Workflow cannot deploy | Repository Actions permissions and `github-pages` environment protection rules |
| Browser job cannot launch | Run Playwright's browser/dependency installation step |

Reference: [VitePress deployment guide](https://vuejs.github.io/vitepress/v1/guide/deploy).
