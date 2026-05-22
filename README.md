# Tw@er

A mock social media platform inspired by X / Twitter. Built on Next.js 15 (App Router), NextAuth (credentials), Prisma + SQLite, Tailwind v4. Started from the [blog-forge](https://github.com/GetNextjsTemplates/blog-forge) template and rebuilt around posts/likes/comments.

## Features

- **Public feed** — browse every post without logging in.
- **Email/password auth** — `Sign Up` creates an account; `Sign In` issues a JWT session cookie via NextAuth credentials.
- **Authenticated actions** — posting, liking, and commenting all require a session; the API enforces this and the UI nudges signed-out users to sign in.
- 280-char post limit, like-toggle, inline comment thread per post.

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
npm run dev                # http://localhost:3000
```

## Project layout

```
prisma/
  schema.prisma            # User / Post / Like / Comment models
src/
  lib/
    auth.ts                # NextAuth options (Credentials + JWT)
    prisma.ts              # Prisma client singleton
  app/
    page.tsx               # Feed (public)
    api/
      auth/[...nextauth]/  # NextAuth handler
      auth/register/       # POST: create account
      posts/               # GET feed, POST new (auth required)
      posts/[id]/like/     # POST: toggle like (auth required)
      posts/[id]/comments/ # GET/POST comments (POST requires auth)
    components/
      feed/                # Feed, Composer, PostCard, Avatar
      auth/                # sign-in / sign-up forms
      layout/              # header, footer, logo, theme toggle
```

## API quick reference

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | — | `{ email, username, displayName, password }` |
| `POST` | `/api/auth/callback/credentials` | — | NextAuth login |
| `GET`  | `/api/posts` | — | Latest 50 posts |
| `POST` | `/api/posts` | required | `{ content }` (≤ 280 chars) |
| `POST` | `/api/posts/:id/like` | required | toggles like, returns `{ liked, count }` |
| `GET`  | `/api/posts/:id/comments` | — | full thread |
| `POST` | `/api/posts/:id/comments` | required | `{ content }` |

## Notes

- The "random posting bot" mentioned in the original brief is not implemented yet — TODO.
- SQLite is local-file storage; ship Postgres before deploying multi-instance.
- `NEXTAUTH_SECRET` must be set in production.
