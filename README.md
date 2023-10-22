# newscast

Generate news broadcasts automatically w/ AI.

## Requirements

- [Bun](https://bun.sh/)

## Setup

### Configuration

Create a `.env.local` file (sample provided) and fill in required env vars.

```bash
cp .env.local.sample .env.local
```

### Install dependencies

```bash
bun install
```

### Database

Generate client:

```bash
bunx prisma generate
```

Initialize database:

```bash
bunx prisma db push
```

## Scripts

- `bin/createBroadcast.ts`
  - Creates a new broadcast
  - Queues a `gatherNews` job for the broadcast
- `bin/gatherNews.ts`
  - Runs outstanding `gatherNews` jobs
  - Each job:
    - Gathers a set of topics & articles for the broadcast
    - Queues a `summarize` job for the broadcast
- `bin/summarize.ts`
  - Runs outstanding `summarize` jobs
  - Each job:
    - Generates an article summary for each article in the broadcast
    - Generate a topic summary for each topic in the broadcast by merging the article summaries

### Example workflow

```bash
bun run bin/createBroadcast.ts
bun run bin/gatherNews.ts
bun run bin/summarize.ts
```
