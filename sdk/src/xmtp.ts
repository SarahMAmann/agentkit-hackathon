import type { Agent } from "@xmtp/agent-sdk";

export interface CredenceXMTPResult {
  valid: boolean;
  credential_id: string;
  human?: boolean;
  financial_standing?: boolean;
  expires_at?: string;
  reason?: string;
}

export interface CredenceXMTPOptions {
  /** Credence agent's XMTP address */
  agentAddress?: string;

  /** Timeout waiting for Credence agent reply (ms, default: 30000) */
  timeout?: number;
}

const DEFAULT_CREDENCE_AGENT =
  process.env.CREDENCE_AGENT_ADDRESS ||
  "0xadb866f13a1a07c6259b7c950049e82d1abe7b9b";

/**
 * Verify a Credence credential by messaging the Credence agent over XMTP.
 *
 * Usage:
 * ```typescript
 * import { verifyCredentialOverXMTP } from 'credence-gate/xmtp';
 *
 * // In your XMTP agent's message handler:
 * const result = await verifyCredentialOverXMTP(agent, credentialId);
 * if (result.valid) {
 *   await ctx.conversation.sendText('Access granted!');
 * }
 * ```
 */
export async function verifyCredentialOverXMTP(
  agent: Agent,
  credentialId: string,
  options: CredenceXMTPOptions = {}
): Promise<CredenceXMTPResult> {
  const {
    agentAddress = DEFAULT_CREDENCE_AGENT,
    timeout = 30000,
  } = options;

  // Open a DM with the Credence agent
  const dm = await agent.createDmWithAddress(agentAddress as `0x${string}`);

  // Mark existing messages as seen
  const existing = await dm.messages({ limit: 50 });
  const seenIds = new Set(existing.map((m: any) => m.id));

  // Send the check-credential command
  await dm.sendText(`check-credential ${credentialId}`);

  // Wait for the reply
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    await dm.sync();
    const messages = await dm.messages({ limit: 50 });

    for (const m of messages) {
      if (seenIds.has(m.id)) continue;
      seenIds.add(m.id);
      if (m.senderInboxId === agent.client.inboxId) continue;

      const text = (m.content as string) || "";

      if (text.startsWith("CREDENTIAL_VALID")) {
        return parseValidResponse(credentialId, text);
      }

      if (text.startsWith("CREDENTIAL_INVALID")) {
        const reason = extractField(text, "reason") || "Invalid credential";
        return { valid: false, credential_id: credentialId, reason };
      }

      if (text.startsWith("CREDENTIAL_ERROR")) {
        const reason = extractField(text, "reason") || "Verification error";
        return { valid: false, credential_id: credentialId, reason };
      }
    }
  }

  return {
    valid: false,
    credential_id: credentialId,
    reason: "Timeout waiting for Credence agent",
  };
}

function parseValidResponse(
  credentialId: string,
  text: string
): CredenceXMTPResult {
  return {
    valid: true,
    credential_id: credentialId,
    human: extractField(text, "human") === "true",
    financial_standing: extractField(text, "financial_standing") === "true",
    expires_at: extractField(text, "expires_at") || undefined,
  };
}

function extractField(text: string, field: string): string | null {
  const match = text.match(new RegExp(`${field}:\\s*(.+)`));
  return match ? match[1].trim() : null;
}
