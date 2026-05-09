import type { Prompt } from '@modelcontextprotocol/sdk/types.js';
import { miloPrompt } from './milo-client.js';

export const PROMPT_DEFS: Prompt[] = [
  {
    name: 'milo_capture',
    description: 'Passive capture instructions — add to system prompt to enable automatic knowledge capture',
  },
  {
    name: 'milo_briefing',
    description: 'Session start briefing — instructs Claude to call milo_recent and summarise recent org decisions',
  },
];

export async function handlePrompt(name: string, token: string): Promise<string> {
  const result = await miloPrompt(token, name);
  return result.text;
}
