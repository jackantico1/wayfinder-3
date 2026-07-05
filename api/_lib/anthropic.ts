import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const CLAUDE_MODEL = "claude-sonnet-5";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createMessageWithRetry(
  params: Anthropic.MessageCreateParamsNonStreaming,
): Promise<Anthropic.Message> {
  const anthropic = getAnthropicClient();
  try {
    return await anthropic.messages.create(params);
  } catch (error) {
    if (error instanceof Anthropic.APIError && (error.status === 429 || error.status === 529)) {
      await sleep(1000);
      return anthropic.messages.create(params);
    }
    throw error;
  }
}
