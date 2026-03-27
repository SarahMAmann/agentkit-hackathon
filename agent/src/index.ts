import "dotenv/config";
import { Agent, getTestUrl } from "@xmtp/agent-sdk";
import { verifyAndIssueCredential } from "./verify.js";

const agent = await Agent.createFromEnv();

agent.on("text", async (ctx) => {
  const text = ctx.message.content.trim();

  if (text.toLowerCase() === "help") {
    await ctx.conversation.sendText(
      `Credence Verification Agent\n\n` +
        `Commands:\n` +
        `  verify {proof_id} {world_nullifier} — issue a credential (World ID + Mirror proof)\n` +
        `  check-credential {credential_id} — verify an existing credential (for API agents)\n` +
        `  status — check agent status\n` +
        `  help — show this message\n\n` +
        `Get your proof_id from app.mirrorzkp.com\n` +
        `Get your World ID nullifier by verifying at our demo page.`
    );
    return;
  }

  if (text.toLowerCase() === "status") {
    await ctx.conversation.sendText(
      "Credence agent online. Ready to verify."
    );
    return;
  }

  if (text.toLowerCase().startsWith("verify ")) {
    const parts = text.split(/\s+/);
    const proofId = parts[1];
    const worldNullifier = parts[2];

    if (!proofId || !worldNullifier) {
      await ctx.conversation.sendText(
        "Usage: verify {proof_id} {world_nullifier}"
      );
      return;
    }

    await ctx.conversation.sendText(
      "Verifying... (checking World ID + Mirror proof)"
    );

    try {
      const result = await verifyAndIssueCredential(proofId, worldNullifier);

      await ctx.conversation.sendText(
        `Verified!\n\n` +
          `Human: ${result.human ? "Yes (World ID)" : "No"}\n` +
          `Financial standing: ${result.financial_standing ? "Yes (Mirror proof)" : "No"}\n` +
          `Credential ID: ${result.credential_id}\n` +
          `Expires: ${result.expires_at}\n\n` +
          `Present this credential to access gated APIs:\n` +
          `X-Credence-Credential: ${result.credential_id}`
      );
    } catch (err: any) {
      await ctx.conversation.sendText(
        `Verification failed: ${err.message}`
      );
    }
    return;
  }

  // check-credential: called by API agents to verify a user's credential
  // This is the agent-to-agent verification path (x402 payment on the HTTP side)
  if (text.toLowerCase().startsWith("check-credential ")) {
    const credentialId = text.split(/\s+/)[1];

    if (!credentialId) {
      await ctx.conversation.sendText(
        "Usage: check-credential {credential_id}"
      );
      return;
    }

    try {
      const CREDENCE_API_URL = process.env.MIRROR_API_URL || "http://localhost:3002";
      const res = await fetch(
        `${CREDENCE_API_URL}/v1/credentials/${credentialId}/verify`
      );
      const result = await res.json();

      if (!result.valid) {
        await ctx.conversation.sendText(
          `CREDENTIAL_INVALID\n` +
            `credential_id: ${credentialId}\n` +
            `reason: ${result.reason}`
        );
        return;
      }

      await ctx.conversation.sendText(
        `CREDENTIAL_VALID\n` +
          `credential_id: ${credentialId}\n` +
          `human: ${result.credential.human}\n` +
          `financial_standing: ${result.credential.financial_standing}\n` +
          `expires_at: ${result.credential.expires_at}`
      );
    } catch (err: any) {
      await ctx.conversation.sendText(
        `CREDENTIAL_ERROR\nreason: ${err.message}`
      );
    }
    return;
  }

  await ctx.conversation.sendText(
    'Unknown command. Type "help" for available commands.'
  );
});

agent.on("start", () => {
  console.log("Credence verification agent online");
  console.log(`Address: ${agent.address}`);
  console.log(`Test: ${getTestUrl(agent.client)}`);
});

await agent.start();
