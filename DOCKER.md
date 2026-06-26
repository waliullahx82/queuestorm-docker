# Docker

Build and run QueueStorm as one container. The image builds the React UI into `dist/` and runs the Node server that serves the UI plus `GET /health` and `POST /sort-ticket`.

## API key

Keep your Gemini key in local `.env.local`:

```text
GEMINI_API_KEY=your-key-here
```

`.env.local` is ignored by Git and Docker build context, so the key is not baked into the image or pushed to GitHub.

## Recommended: Docker Compose

Build and run with the API key loaded from `.env.local`:

```bash
docker compose up --build -d
```

On Windows, you can also run:

```bat
docker-up.bat
```

Stop it:

```bash
docker compose down
```

Open:

```text
http://localhost:3001
```

## Plain Docker

Build:

```bash
docker build -t queuestorm .
```

Run rules-only:

```bash
docker run --rm -p 3001:3001 queuestorm
```

Run with Gemini using `.env.local`:

```bash
docker run --rm -p 3001:3001 --env-file .env.local queuestorm
```

Optional environment variables:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Enables Gemini escalation. If unset, service runs rules-only. |
| `USE_LLM=false` | Forces rules-only mode even when a key is present. |
| `GEMINI_MODEL` | Primary Gemini model override. |
| `GEMINI_FALLBACK_MODEL` | Fallback Gemini model override. |
| `LLM_TIMEOUT_MS` | LLM escalation timeout in milliseconds. |
| `PORT` | Container listen port. Defaults to `3001`. |

## Smoke test

```bash
curl http://localhost:3001/health

curl -X POST http://localhost:3001/sort-ticket \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"T-001","channel":"app","locale":"en","message":"I sent 3000 to wrong number"}'
```