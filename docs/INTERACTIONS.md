# Website motion and interactions

`client/src/SiteInteractions.tsx` provides the public site's scroll reveals, route entrances, header scroll state, reading progress and back-to-top control. `client/src/interactions.css` adds card, navigation, button, form, gallery and accordion feedback. The staff workspace is excluded from the page/scroll effects.

Reveals run once per element, with a short stagger for neighboring cards. Newly loaded API content and filtered galleries are observed automatically. The initial hero is not faded out or delayed. Content remains visible when animation APIs are unavailable. Scroll progress uses a passive listener and animation-frame updates rather than rerendering the page on each scroll event.

Reduced-motion preferences disable entrance animations and animated hover movement. Back-to-top becomes immediate and moves keyboard focus to the main content. Observer, event and animation cleanup runs on navigation and preference changes.

The existing hero slideshow and its pause controls are retained. There is no forced scrolling, perpetual card movement or new autoplay behavior.

Run the focused browser checks against a running built site with:

```sh
node node_modules/@playwright/test/cli.js test tests/interactions.spec.ts
```

For Vite, set `PLAYWRIGHT_BASE_URL=http://localhost:5173` first (PowerShell: `$env:PLAYWRIGHT_BASE_URL='http://localhost:5173'`). Tests cover desktop/mobile scrolling, reveals, navigation, back-to-top and reduced-motion visibility.
