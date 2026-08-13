# AGENTS.md

BoWsNoLlama is a small Node.js chat app: Express 5 + `ws` WebSocket server,
vanilla-JS frontend, streaming responses from a local Ollama
(Bootstrap, WebSocket, Node.js and Ollama, in that order).

## Run
- `npm start` is the only script (`node bin/bowsnollama`). Requires Node >= 20
  (package.json `engines`).
- No tests, lint, or build step exist — verification is manual: start the server
  and open the printed URL in a browser.
- Needs Ollama running at `http://127.0.0.1:11434` (hardcoded in
  `lib/bowsnollama.js`, not configurable). Default model `gemma3`, override via
  env `OLLAMA_MODEL`; port via env `PORT` (default 3000).

## Layout
- `bin/bowsnollama` — entrypoint; just instantiates `BoWsNoLlama` from `lib/`.
- `lib/bowsnollama.js` — all server logic: Express app serving `web/` statically,
  a `ws` WebSocketServer on the same HTTP(S) server, Ollama streaming.
- `web/` — no bundler, no CDN. `js/bowsnollama.js` is the app code (plain
  script); everything else under `web/` (Bootstrap, marked, icons, fonts, maps,
  `color-modes.js`) is vendored third-party — don't edit.

## WebSocket protocol (keep both sides in sync)
- Client → server: `{ "type": "query", "data": "<text>" }`. The server reads
  only `message.data` and ignores `type`; any JSON with `.data` triggers a query.
  Non-JSON input throws inside async `handleQuery` (unhandled rejection, no error
  handling).
- Server → client: one `{ "type": "response", "data": { message, model, done } }`
  per streamed chunk; `done: true` on the last chunk. Client re-renders the
  accumulated markdown per chunk and resets its buffer on `done`.

## Gotchas
- HTTPS is dead code by default: `createServer` tries `config/certificate.pem`
  + `config/key.pem` (cwd-relative), catches any failure and falls back to HTTP.
  `config/` was never committed and doesn't exist. If you add certs, also
  gitignore `config/` (it isn't today); the startup log line says which mode
  you're in.
- Single-user chat by design: `chatHistory` grows unbounded on the instance (one
  entry per streamed chunk, never aggregated or truncated), and each new query
  calls `instance.ollama.abort()`, killing ALL in-flight requests — only one
  query can stream at a time.
- Style: CommonJS (`require`/`module.exports`) with JSDoc on every function —
  keep new server modules in this style. Commits on `develop` are small and
  single-file; package.json version is bumped manually.
- `package-lock.json` is currently untracked (present locally, never committed)
  — decide intentionally whether to commit it.
