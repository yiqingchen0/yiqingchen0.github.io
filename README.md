# Personal website

An editorial, animated personal site built with [Astro](https://astro.build),
[GSAP](https://gsap.com) and [Lenis](https://lenis.darkroom.engineering).
It builds to plain static HTML and deploys to GitHub Pages for free.

## Run it locally

```sh
npm install
npm run dev        # http://localhost:4321
```

| Command            | What it does                                   |
| :----------------- | :--------------------------------------------- |
| `npm run dev`      | Start the dev server with live reload          |
| `npm run build`    | Build the site into `dist/`                    |
| `npm run preview`  | Serve the built site locally                   |
| `npm run check`    | Type-check `.astro` and `.ts` files            |
| `npm test`         | Run the unit tests                             |
| `npm run coverage` | Run the tests with a coverage report           |

## Make it yours

Everything marked `TODO` is a placeholder. Replace it before you publish.

| What                         | Where                                         |
| :--------------------------- | :-------------------------------------------- |
| Name, title, email, links    | `src/site.config.ts`                          |
| Education and appointments   | `src/site.config.ts`                          |
| Home-page intro and headline | `src/pages/index.astro`                       |
| Biography and photo          | `src/pages/about.astro`                       |
| Research projects            | `src/content/research/*.md` (one per project) |
| Publications                 | `src/data/publications.yaml`                  |
| Courses                      | `src/content/teaching/*.md` (one per course)  |
| Course labs and handouts     | Files in `public/teaching/<course>/`, listed under `materials:` in the course's Markdown file |
| CV                           | Put a PDF at `public/cv.pdf`; the About page links it automatically |
| Colours and type sizes       | The tokens at the top of `src/styles/global.css` |

Each Markdown file in `src/content/research/` becomes a row on the Research
page and a page of its own at `/research/<file-name>/`. The fields at the top
of each file are checked when the site builds, so a typo in a field name
fails the build with a clear message instead of silently disappearing.

Each Markdown file in `src/content/teaching/` becomes a row on the Teaching
page and a page of its own at `/teaching/<file-name>/`; clicking the course
title opens it. Course materials are listed only on that page, under
`materials:` in the course's file. Each material needs a `title` and an `href`,
which is either a full URL or a file in `public/` written from the site root
(`public/teaching/pheb-602/lab.html` is `/teaching/pheb-602/lab.html`);
`module`, `description` and `kind` (default "Interactive lab") are optional.
`npm test` fails if a listed file is missing from `public/`.

## Animations

Animations are switched on with data attributes, so you can add them to new
markup without touching the scripts:

| Attribute        | Effect                                           |
| :--------------- | :----------------------------------------------- |
| `data-split`     | Heading lines slide up into place                |
| `data-reveal`    | Element fades and rises in                       |
| `data-line`      | Hairline draws in from the left                  |
| `data-scramble`  | Link text scrambles on hover (`data-scramble-text` marks the text) |
| `data-hero`      | Children animate on page load instead of on scroll |

The scripts live in `src/scripts/`. Visitors who ask their system for reduced
motion get the same page without the intro, smooth scrolling or animations.

The home-page figure draws real probability densities (`src/utils/density.ts`)
on a shared scale and blends between them; every in-between frame is itself a
valid mixture density.

## Publish on GitHub Pages

1. Create a GitHub repository and push this folder to its `main` branch.
2. In the repository, open **Settings → Pages** and set **Source** to
   **GitHub Actions**.
3. Every push to `main` now runs `.github/workflows/deploy.yml`: it type-checks,
   runs the tests, builds and deploys.

The workflow works out the site's address itself, so it is right whether the
repository is `<username>.github.io` (served at the root), any other name
(served at `/<repository>/`), or you add a custom domain in the Pages settings.
Internal links go through `withBase()` in `src/utils/url.ts` for this reason;
use it for any new link to a page or file on the site.

StatSense Lab's build fingerprints its CSS and JavaScript and generates a
release manifest. A cached page checks for the current release on entry. An
active session shows a Reload prompt instead of interrupting the student's
work. Local development and offline use continue without release checks.

To host on Cloudflare Pages or Netlify instead, use build command
`npm run build` and output directory `dist`.
