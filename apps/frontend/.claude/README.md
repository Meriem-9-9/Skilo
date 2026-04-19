# Skilo Frontend — Dashboard & Profile Module

## File structure

```
src/
├── app/
│   ├── dashboard/page.tsx          ← Main dashboard (matches, stats)
│   ├── profile/page.tsx            ← Own profile edit page
│   └── users/[id]/page.tsx         ← Public profile view
│
├── components/
│   ├── dashboard/
│   │   ├── CreditsCard.tsx         ← Credit balance widget
│   │   ├── DashboardSkeleton.tsx   ← Loading skeleton + EmptyMatches
│   │   ├── MatchCard.tsx           ← Individual match card
│   │   └── ProfileStrengthCard.tsx ← Circular gauge for profile score
│   │
│   └── profile/
│       ├── ReviewList.tsx          ← Review cards with sub-ratings
│       ├── SkillBadge.tsx          ← Pill chip with remove button
│       └── SkillSearch.tsx         ← Debounced autocomplete for skills
│
├── hooks/
│   └── useMe.ts                    ← SWR hooks + mutators for all user/skill/match APIs
│
├── lib/
│   └── api-client.ts               ← Axios instance with traceId logging + 401 redirect
│
└── types/
    └── api.ts                      ← TypeScript types mirroring NestJS models
```

## APIs consumed

| Component | Endpoint | Method |
|---|---|---|
| useMe | `/users/me` | GET |
| updateProfile | `/users/me` | PATCH |
| addSkill | `/users/me/skills` | POST |
| removeSkill | `/users/me/skills/:id` | DELETE |
| updateSkillLevel | `/users/me/skills/:id` | PATCH |
| searchSkills | `/skills/search?q=` | GET |
| useMatches | `/matches` | GET |
| usePublicProfile | `/users/:id` | GET |

## Debugging

Every HTTP request gets a `X-Trace-Id` header (e.g. `AB12CD`).
In dev, the console shows:
```
[API ▶] AB12CD GET /users/me
[API ◀] AB12CD 200 /users/me (43ms)
```
On error:
```
[API ✗] { traceId: 'AB12CD', method: 'PATCH', url: '/users/me', status: 400, ... }
```

## TODOs for onboarding team

- [ ] `api-client.ts` — plug in Sentry at the error interceptor comment
- [ ] `api-client.ts` — add refresh-token interceptor once POST /auth/refresh exists (FC-01-C)
- [ ] `profile/page.tsx` — replace avatar URL input with file upload (FC-02-03)
- [ ] `profile/page.tsx` — wire the onboarding stepper (post-registration flow)
- [ ] `profile/page.tsx` — fetch reviews from a dedicated endpoint or extend GET /users/me
- [ ] `users/[id]/page.tsx` — open SessionProposalModal for `propose_session`
- [ ] `users/[id]/page.tsx` — open Messaging panel for `write_message`
- [ ] `dashboard/MatchCard.tsx` — open SessionProposalModal instead of navigating
- [ ] `types/api.ts` — auto-generate from Swagger once backend adds OpenAPI spec
- [ ] `SkillSearch.tsx` — add "Propose a new skill" flow (POST /skills)

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Dependencies needed

```bash
npm install swr axios react-hook-form @hookform/resolvers zod
# shadcn components (already configured per existing LoginForm):
# badge, button, card, input, textarea, separator, tabs, alert
```
