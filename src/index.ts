#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import http from 'node:http';
import { TOOLS, handleTool } from './tools.js';
import { PROMPT_DEFS, handlePrompt } from './prompts.js';
import { detectSource } from './source.js';

const PORT = parseInt(process.env.PORT ?? '3100', 10);
const MILO_API_URL = process.env.MILO_API_URL ?? 'https://api.miloai.chat';
const PUBLIC_URL = process.env.PUBLIC_URL ?? 'https://mcp.miloai.chat';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, MCP-Session-Id, MCP-Protocol-Version',
  'Access-Control-Expose-Headers': 'MCP-Session-Id',
} as const;

function applyCors(res: http.ServerResponse): void {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
}

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

function buildServer(token: string, source: string): Server {
  const server = new Server(
    { name: 'milo-mcp', version: '0.1.0' },
    { capabilities: { tools: {}, prompts: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const text = await handleTool(request.params.name, request.params.arguments ?? {}, token, source);
    return { content: [{ type: 'text' as const, text }] };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: PROMPT_DEFS }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const text = await handlePrompt(request.params.name, token);
    return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text } }] };
  });

  return server;
}

async function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : undefined);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const httpServer = http.createServer(async (req, res) => {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
    return;
  }

  // OAuth discovery — required for MCP clients (claude.ai, ChatGPT) to negotiate auth
  if (req.method === 'GET' && url.pathname === '/.well-known/oauth-protected-resource') {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
      resource: PUBLIC_URL,
      authorization_servers: [MILO_API_URL],
      bearer_methods_supported: ['header'],
      scopes_supported: ['mcp'],
    }));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/.well-known/oauth-authorization-server') {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
      issuer: MILO_API_URL,
      authorization_endpoint: `${MILO_API_URL}/oauth/authorize`,
      token_endpoint: `${MILO_API_URL}/oauth/token`,
      userinfo_endpoint: `${MILO_API_URL}/oauth/userinfo`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: ['mcp'],
    }));
    return;
  }

  if (url.pathname !== '/mcp' && url.pathname !== '/sse') {
    res.writeHead(404, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const token = extractToken(req.headers['authorization'] as string | undefined);
  if (!token) {
    res.writeHead(401, {
      'Content-Type': 'application/json',
      // RFC 6750: tell the client where to authenticate so claude.ai/ChatGPT can start OAuth
      'WWW-Authenticate': `Bearer realm="${PUBLIC_URL}", resource_metadata="${PUBLIC_URL}/.well-known/oauth-protected-resource"`,
    }).end(JSON.stringify({ error: 'Missing Bearer token' }));
    return;
  }

  const source = detectSource(req.headers['user-agent'] as string | undefined);

  try {
    const transport = new StreamableHTTPServerTransport({
      // Stateless: each request stands alone. Simpler to scale; matches our short tool-call lifecycle.
      sessionIdGenerator: undefined,
    });
    const server = buildServer(token, source);
    await server.connect(transport);
    const body = req.method === 'POST' ? await readJsonBody(req).catch(() => undefined) : undefined;
    await transport.handleRequest(req, res, body);
  } catch (err) {
    console.error('mcp_request_failed', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({
        error: 'Internal server error',
        message: err instanceof Error ? err.message : String(err),
      }));
    }
  }
});

httpServer.listen(PORT, () => {
  console.log(`milo-mcp listening on port ${PORT} (api: ${MILO_API_URL})`);
});
