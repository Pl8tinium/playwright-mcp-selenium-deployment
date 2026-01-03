# Playwright MCP + Selenium Chrome

Docker Compose stack that runs a Playwright MCP server against a Selenium-managed Chrome with a persisted profile, so automation/scraping can reuse session/storage instead of starting from a blank browser each time.

In practice, this means you can bring up a single headful Chrome that:

- keeps cookies/localStorage across restarts
- avoids repeated logins/consent flows
- stays running so clients can attach over CDP via the MCP server

Services:

- `chrome`: `selenium/standalone-chrome` (CDP on `9222`, persisted profile volume)
- `bootstrap`: creates a WebDriver session + keepalive (`bootstrap-session.js`)
- `mcp`: `mcp/playwright` server on `:3000`, attaches to `http://localhost:9222`

## Run

```bash
docker compose up -d
```

## Endpoints

- Selenium: `http://localhost:4444`
- CDP: `http://localhost:9222`
- MCP: `http://localhost:3000`
- VNC: `localhost:5900` (recommended client: TigerVNC https://github.com/TigerVNC/tigervnc)

## Use from VS Code (MCP)

1. Start the stack:

	 ```bash
	 docker compose up -d
	 ```

2. In VS Code, add a new MCP server that points at:

	 - `http://localhost:3000/sse`

## Persistence

Profile data is stored in the `chrome-profile` volume.

```bash
docker compose down -v
```

## Knobs

- `KEEPALIVE_INTERVAL_MS` (bootstrap; default `60000`)
- `SE_NODE_SESSION_TIMEOUT` (selenium; default `3600` in compose)