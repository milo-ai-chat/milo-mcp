# milo-mcp

The open source MCP server for [Milo](https://miloai.chat) — org memory for any AI tool.

Connect Milo to Claude Code, claude.ai, Cursor, Windsurf, ChatGPT, or any
MCP-compatible tool. Decisions, architectural choices, and insights are captured
automatically and made available across your team.

**No installation required.** Add the hosted endpoint to your MCP client and you're done.

## Quick start

Get an API key at [miloai.chat/app/settings/mcp](https://miloai.chat/app/settings/mcp) (free account required).

### Claude Code

Add to `~/.claude/mcp_servers.json`:

```json
{
  "mcpServers": {
    "milo": {
      "type": "http",
      "url": "https://mcp.miloai.chat/mcp",
      "headers": { "Authorization": "Bearer YOUR_KEY" }
    }
  }
}
```

Then add to your `CLAUDE.md`:

```
Use the milo_briefing prompt at the start of each session.
Use the milo_capture prompt instructions throughout.
```

### claude.ai (Pro / Team / Enterprise)

`Settings → Integrations → Add custom integration` → enter `https://mcp.miloai.chat`.

claude.ai will discover the auth server automatically and launch an OAuth flow.

### Cursor / Windsurf

Add to your MCP config:

```json
{
  "mcpServers": {
    "milo": {
      "url": "https://mcp.miloai.chat/mcp",
      "headers": { "Authorization": "Bearer YOUR_KEY" }
    }
  }
}
```

### ChatGPT (Pro / Business / Enterprise)

`Settings → Connectors → Add custom connector`:

| Field | Value |
|-------|-------|
| Name  | Milo  |
| URL   | `https://mcp.miloai.chat/mcp` |
| Auth  | Custom header — `Authorization: Bearer <your key>` |

### Any other MCP client

Use `https://mcp.miloai.chat/mcp` as the endpoint with your API key as a Bearer token.
OAuth-aware clients can discover auth automatically via:

```
GET https://mcp.miloai.chat/.well-known/oauth-protected-resource
GET https://mcp.miloai.chat/.well-known/oauth-authorization-server
```

## Tools

| Tool | Description |
|------|-------------|
| `milo_save` | Save a decision or insight to org memory |
| `milo_search` | Search org knowledge by query |
| `milo_recent` | Get a summary of recent org decisions |
| `milo_context` | Get deep context for a specific topic |

## Prompts

| Prompt | Description |
|--------|-------------|
| `milo_capture` | Passive capture instructions (drop into your system prompt) |
| `milo_briefing` | Session-start briefing template |

## Self-hosting

Run with npx:

```bash
MILO_API_URL=https://api.miloai.chat PUBLIC_URL=https://mcp.your-org.com npx milo-mcp
```

Or with Docker:

```bash
docker run -p 3100:3100 \
  -e MILO_API_URL=https://api.miloai.chat \
  -e PUBLIC_URL=https://mcp.your-org.com \
  ghcr.io/milo-ai-chat/milo-mcp
```

| Variable | Default | Notes |
|----------|---------|-------|
| `MILO_API_URL` | `https://api.miloai.chat` | Backend exposing `/api/mcp/*` and `/oauth/*` |
| `PUBLIC_URL`   | `https://mcp.miloai.chat` | Used in OAuth metadata and `WWW-Authenticate` |
| `PORT`         | `3100` | |

## Local dev

```bash
npm install
MILO_API_URL=http://localhost:8000 npm run dev
```

## License

MIT
