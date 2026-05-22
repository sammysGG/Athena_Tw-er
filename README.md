# Tw@er

A mock social media platform inspired by X / Twitter, built for a scenario simulation around a fictional Estonia / Donovia / NATO situation. Built on Next.js 15 (App Router), NextAuth (credentials), Prisma + SQLite, Tailwind v4. Started from the [blog-forge](https://github.com/GetNextjsTemplates/blog-forge) template and rebuilt around a social feed.

## Features

- **Public feed** — browse posts without logging in. Pinned admin posts surface to the top.
- **Email/password auth** — `Sign Up` creates an account; `Sign In` issues a JWT session cookie via NextAuth credentials.
- **Authenticated actions** — posting, liking, and commenting all require a session; the API enforces this and the UI nudges signed-out users to sign in.
- **Media** — paste an image / video / YouTube URL, or upload a file (8 MB cap, image/video MIME types).
- **Profiles** — `/u/<username>` shows bio, location, gender, website, join date and post history.
- **Edit profile** — `/settings` lets you change display name, bio, location, gender, website and avatar.
- **Trending sidebar** — top 5 posts by likes in the last 7 days.
- **Search** — `/search?q=…` searches post content and user names.
- **Admin role** — admins see an `Admin` link in the header, can delete any post / comment / user, and can pin posts.
- **Seed scenario** — `npm run db:seed` creates an admin, a Donovian propaganda account (`donoviadabest`), a `tw@er News` account, several civilian/analyst accounts and ~20 themed posts using the scenario's feeder words (Estonia, NATO, Donovia, Ariana, Tallinn port, British/US forces, sub-threshold warfare, greyzone, cyber).

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, Turbopack dev) |
| Styling | Tailwind v4, `next-themes` |
| Auth | NextAuth.js, Credentials provider, JWT sessions |
| DB | SQLite via Prisma |
| Passwords | bcryptjs |

## Getting started

```bash
cp .env.example .env       # then edit NEXTAUTH_SECRET
npm install
npx prisma migrate dev     # creates prisma/dev.db
npm run db:seed            # optional: scenario users + posts
npm run dev                # http://localhost:3000
```

Default seeded admin: `admin@twater.local` / `admin1234` (change in production).

## API quick reference

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | — | `{ email, username, displayName, password }` |
| `POST` | `/api/auth/callback/credentials` | — | NextAuth login |
| `GET`  | `/api/posts` | — | Latest 50 posts (pinned first) |
| `POST` | `/api/posts` | required | `{ content, mediaUrl? }` — content ≤ 280 chars |
| `DELETE` | `/api/posts/:id` | author or admin | |
| `PATCH` | `/api/posts/:id` | admin | `{ pinned: boolean }` |
| `POST` | `/api/posts/:id/like` | required | toggles like, returns `{ liked, count }` |
| `GET`  | `/api/posts/:id/comments` | — | full thread |
| `POST` | `/api/posts/:id/comments` | required | `{ content }` |
| `DELETE` | `/api/comments/:id` | author or admin | |
| `GET`  | `/api/me` | required | current user record |
| `PATCH` | `/api/me` | required | update profile fields |
| `POST` | `/api/upload` | required | multipart, `file` + `kind` (`avatar` \| `post`) |
| `DELETE` | `/api/users/:id` | admin | cascades posts/likes/comments |
| `GET`  | `/api/users/by-username/:username` | — | profile + recent posts |
| `GET`  | `/api/search?q=…` | — | posts + users |
| `GET`  | `/api/trending` | — | top 5 posts by likes (last 7 days) |
| `GET`  | `/api/admin/overview` | admin | all users + recent posts for moderation |

## Notes

- The "random posting bot" (background scenario chatter on a timer) is still TODO. The seed script is the closest thing right now.
- SQLite is local-file storage; ship Postgres before deploying multi-instance.
- `NEXTAUTH_SECRET` must be set in production.
- Uploads land in `public/uploads/{avatars,posts}/`. In a real deployment you'd want an object store + virus scanning.
