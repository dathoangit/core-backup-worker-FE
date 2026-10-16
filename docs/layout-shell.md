# Layout & shell

Chrome around authenticated pages: header, footer, account menu, branding.

Related: [auth.md](./auth.md) (`AuthGate`).

---

## Where logic lives

| Concern | File |
|---------|------|
| Page wrapper (header + main + footer) | `src/components/layout/AppShell.tsx` |
| Brand bar | `src/components/layout/AppHeader.tsx` |
| Footer | `src/components/layout/AppFooter.tsx` |
| Account dropdown / logout / admin link | `src/components/layout/UserAccountMenu.tsx` |
| Session route gate | `src/components/layout/AuthGate.tsx` |
| Brand tokens (name, favicon helpers) | `src/constants/branding.ts` |
| Document favicon | `pages/_document.tsx` |
| Home composition | `pages/index.tsx` → `src/components/home/HomePageContent.tsx` |

**Change brand name/logo →** `branding.ts` + `public/` assets + `_document.tsx`.  
**Change header actions →** `AppHeader.tsx` / `UserAccountMenu.tsx`.  
**Wrap a new authenticated page →** use `AppShell` from the page (see `pages/index.tsx`, `pages/admin/users.tsx`).

---

## Typical page pattern

```tsx
// pages/example.tsx
import { AppShell } from 'src/components/layout/AppShell';

export default function ExamplePage() {
  return (
    <AppShell>
      {/* page content */}
    </AppShell>
  );
}
```

`AuthGate` already wraps the tree in `_app.tsx` — pages do not re-mount the gate.
