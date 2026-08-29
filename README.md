# Instagram Content Manager — L.B. English Co.

A single-page Instagram content operations dashboard: content calendar, campaign
tracking, audience insights, workflow automation, webhooks, and a content-ideas
board.

Built with **React 19 + TypeScript + Vite**, styled with **Tailwind CSS** and a
local set of **shadcn/ui-style components**, charts via **Recharts**.

## Features

- **Content calendar** — schedule image/video/reel/story/carousel/live posts,
  track draft → scheduled → published status with mock performance metrics.
- **Campaigns** — plan and monitor campaigns with budgets, audiences and goals.
- **Audience insights** — segmented demographics and engagement analytics.
- **Automation workflows & webhooks** — toggleable rules and trigger/action
  lists.
- **Content ideas board** — submit, approve and implement ideas in a Card grid.

## Tech stack

| Area     | Choice                                                        |
| -------- | ------------------------------------------------------------- |
| Build    | Vite 7 · TypeScript 5.9 · React 19                            |
| Styling  | Tailwind CSS 3.4 + shadcn-style components (`src/components/ui`) |
| Charts   | Recharts 3                                                    |
| Icons    | lucide-react via a local `nucleo-sharp` shim (see below)      |
| CI       | GitHub Actions (`build` on push / PR)                         |

## Getting started

Requires **Node.js ≥ 20.19**.

```bash
npm install
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # type-check + production build into dist/
npm run preview    # preview the production build
```

## Project structure

```
.
├── .github/workflows/ci.yml   # CI: install + build on push/PR
├── index.html
├── vite.config.ts             # "@" and "nucleo-sharp" aliases
├── tailwind.config.ts
└── src/
    ├── main.tsx               # app entry
    ├── App.tsx                # renders the dashboard
    ├── index.css              # Tailwind + shadcn design tokens
    ├── lib/
    │   ├── utils.ts           # cn() helper
    │   └── nucleo-sharp.tsx   # icon shim (see below)
    └── components/
        ├── LBEnglishInstagramManager.tsx   # the dashboard (app code)
        └── ui/                # shadcn-style primitives
            ├── button.tsx  input.tsx  label.tsx  textarea.tsx
            ├── select.tsx  checkbox.tsx  tabs.tsx  dialog.tsx
            ├── sheet.tsx  badge.tsx  progress.tsx  separator.tsx
            ├── table.tsx  card.tsx  toast.tsx  toaster.tsx
```

## ⚠️ Icon note (`nucleo-sharp` shim)

The app imports icons from `nucleo-sharp`, but the real npm package exports
`Icon*`-prefixed names (e.g. `IconCalendar`) — **not** `Calendar`, `BarChart3`,
etc. To keep the original imports working, `nucleo-sharp` is aliased
(vite.config.ts + tsconfig.app.json) to `src/lib/nucleo-sharp.tsx`, which
re-exports 24px line icons from `lucide-react@0.545.x` (the last release that
still ships names like `BarChart3` / `Edit3` / `CheckCircle` / `Share2` /
`LineChart` / `AreaChart`). `Hash` has no lucide equivalent and is drawn
inline. Swap the shim for the official icon set whenever the imports are
migrated to real Nucleo names.

## Deployment

Any static host works (Vercel, Netlify, GitHub Pages, nginx). Build output
lands in `dist/`.

## License

[MIT](./LICENSE) © L.B. English Co.