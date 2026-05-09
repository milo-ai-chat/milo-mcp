import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { miloSave, miloSearch, miloRecent, miloContext } from './milo-client.js';

export const TOOLS: Tool[] = [
  {
    name: 'milo_save',
    description:
      'Save a decision, insight, or piece of knowledge to your org memory. Use this for architectural decisions, tradeoffs, chosen approaches, and non-obvious insights. Do NOT use for personal content.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The insight or decision to save' },
        topic: { type: 'string', description: 'Optional topic tag' },
        importance: { type: 'string', enum: ['high', 'normal'], description: 'Defaults to normal' },
      },
      required: ['content'],
    },
  },
  {
    name: 'milo_search',
    description: 'Search your org knowledge on demand. Use mid-conversation once the topic is clear.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results (default 5, max 20)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'milo_recent',
    description: 'Get a briefing of recent org decisions and insights. Call at the start of a new session.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Days to look back (default 7)' },
      },
    },
  },
  {
    name: 'milo_context',
    description: 'Get deep context on a specific topic from org knowledge.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic to retrieve context for' },
        include_tacit: { type: 'boolean', description: 'Include tacit knowledge (default true)' },
      },
      required: ['topic'],
    },
  },
];

function fmtAttribution(owner_name?: string | null, captured_at?: string | null): string {
  if (!owner_name && !captured_at) return '';
  const parts: string[] = [];
  if (owner_name) parts.push(owner_name);
  if (captured_at) {
    const d = new Date(captured_at);
    if (!isNaN(d.getTime())) parts.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
  }
  return parts.length ? ` _(captured by ${parts.join(', ')})_` : '';
}

export async function handleTool(
  name: string,
  args: Record<string, unknown>,
  token: string,
  source: string
): Promise<string> {
  switch (name) {
    case 'milo_save': {
      const result = await miloSave(token, {
        content: args.content as string,
        topic: args.topic as string | undefined,
        importance: args.importance as 'high' | 'normal' | undefined,
      }, source);
      if (!result.saved) {
        return result.reason
          ? `Save skipped: ${result.reason}`
          : 'Save skipped (not org-relevant).';
      }
      return `Saved to org memory (id: ${result.id})`;
    }
    case 'milo_search': {
      const result = await miloSearch(
        token,
        args.query as string,
        (args.limit as number | undefined) ?? 5
      );
      if (result.results.length === 0) return 'No results found.';
      return result.results
        .map((r) => `**${r.name}**: ${r.summary}${fmtAttribution(r.owner_name, r.captured_at)}`)
        .join('\n\n');
    }
    case 'milo_recent': {
      const result = await miloRecent(token, (args.days as number | undefined) ?? 7);
      return result.summary;
    }
    case 'milo_context': {
      const result = await miloContext(
        token,
        args.topic as string,
        (args.include_tacit as boolean | undefined) ?? true
      );
      const parts: string[] = [`**Context for "${result.topic}"**`];
      result.entities.forEach((e) =>
        parts.push(`- **${e.name}**: ${e.summary}${fmtAttribution(e.owner_name, e.captured_at)}`)
      );
      if (result.tacit.length > 0) {
        parts.push('\n**Team knowledge:**');
        result.tacit.forEach((t) => parts.push(`- ${t.fact}`));
      }
      if (parts.length === 1) parts.push('_No org context found for this topic yet._');
      return parts.join('\n');
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
