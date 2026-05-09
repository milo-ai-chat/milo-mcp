/**
 * Map User-Agent → canonical Milo source identifier.
 * Used by the backend to attribute KnowledgeEntity origin.
 */
export function detectSource(userAgent: string | undefined): string {
  if (!userAgent) return 'mcp:unknown';
  const ua = userAgent.toLowerCase();

  if (ua.includes('claude-code')) return 'mcp:claude_code';
  if (ua.includes('claude.ai') || ua.includes('claude-web')) return 'mcp:claude_ai';
  if (ua.includes('claude')) return 'mcp:claude';
  if (ua.includes('chatgpt') || ua.includes('openai')) return 'mcp:chatgpt';
  if (ua.includes('cursor')) return 'mcp:cursor';
  if (ua.includes('windsurf')) return 'mcp:windsurf';
  if (ua.includes('zed')) return 'mcp:zed';
  if (ua.includes('continue')) return 'mcp:continue';

  return 'mcp:unknown';
}
