# Docker

Build and run QueueStorm as one container. The image builds the React UI into `dist/` and runs the Node server that serves the UI plus `GET /health` and `POST /sort-ticket`.

## Build

```bash
docker build -t queuestorm .
```

## Run rules-only

```bash
docker run --rm -p 3001:3001 queuestorm
```

Open:

```text
http://localhost:3001
```

## Run with Gemini

```bash
docker run --rm -p 3001:3001 -e GEMINI_API_KEY=your-key-here queuestorm
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