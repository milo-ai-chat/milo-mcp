# milo-mcp

The open source MCP server for [Milo](https://miloai.chat) — org memory for any AI tool.

Connect Milo to Claude Code, claude.ai, Cursor, Windsurf, ChatGPT, or any
MCP-compatible tool. Decisions, architectural choices, and insights are captured
automatically and made available across your team.

## Endpoint

The hosted server lives at `https://mcp.miloai.chat/mcp` and speaks the
**Streamable HTTP** MCP transport. The same endpoint handles both the GET
stream upgrade and the POST JSON-RPC messages.

For OAuth-aware MCP clients the discovery documents are exposed at:

```
GET /.well-known/oauth-protected-resource
GET /.well-known/oauth-authorization-server
```

## Quick start

### Claude Code

1. Get your API key from <https://miloai.chat/app/settings/mcp>
2. Add to `~/.claude/mcp_servers.json`:

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

3. Add to your `CLAUDE.md`:

```
Use the milo_briefing prompt at the start of each session.
Use the milo_capture prompt instructions throughout.
```

### claude.ai (Pro/Team/Enterprise)

`Settings → Integrations → Add custom integration` → enter
`https://mcp.miloai.chat`. claude.ai will discover the auth server automatically
and launch an OAuth consent flow against `api.miloai.chat`.

### ChatGPT (Custom Connector)

ChatGPT Pro, Business, Enterprise, and Edu support custom MCP connectors:

`Settings → Connectors → Add custom connector` →

| Field | Value |
|-------|-------|
| Name  | Milo  |
| URL   | `https://mcp.miloai.chat/mcp` |
| Auth  | Custom header — `Authorization: Bearer <your key>` |

### Other tools

Any tool supporting MCP over Streamable HTTP works. Use
`https://mcp.miloai.chat/mcp` as the endpoint with your API key as a Bearer
token.

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

```bash
docker run -p 3100:3100 \
  -e MILO_API_URL=https://api.miloai.chat \
  -e PUBLIC_URL=https://mcp.your-org.com \
  ghcr.io/milo-ai/milo-mcp
```

Environment variables:

| Var | Default | Notes |
|-----|---------|-------|
| `MILO_API_URL` | `https://api.miloai.chat` | Backend that exposes `/api/mcp/*` and `/oauth/*` |
| `PUBLIC_URL`   | `https://mcp.miloai.chat` | Used in OAuth metadata / `WWW-Authenticate` |
| `PORT`         | `3100`                    |  |

## Local dev

```bash
npm install
MILO_API_URL=http://localhost:8000 npm run dev
```

## License

MIT
