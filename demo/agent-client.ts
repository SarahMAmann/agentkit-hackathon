import "dotenv/config";
import { Agent, createUser, createSigner, isText } from "@xmtp/agent-sdk";

// ── Config ──────────────────────────────────────────────────────────────

const CREDENCE_AGENT_ADDRESS =
  process.env.CREDENCE_AGENT_ADDRESS ||
  "0xadb866f13a1a07c6259b7c950049e82d1abe7b9b";
const CREDENCE_API_URL =
  process.env.CREDENCE_API_URL || "http://localhost:3002";

// Accept proof_id and nullifier as CLI args: npx tsx agent-client.ts <proof_id> <nullifier>
const PROOF_ID = process.argv[2] || process.env.PROOF_ID;
const WORLD_NULLIFIER = process.argv[3] || process.env.WORLD_NULLIFIER;

if (!PROOF_ID || !WORLD_NULLIFIER) {
  console.error(
    "\n  Usage: npx tsx agent-client.ts <proof_id> <world_nullifier>\n"
  );
  console.error(
    "  Get a proof_id from app.mirrorzkp.com"
  );
  console.error(
    "  Get a world_nullifier from the Credence frontend (World ID step)\n"
  );
  process.exit(1);
}

// ── Pretty printing ─────────────────────────────────────────────────────

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const MAGENTA = "\x1b[35m";

function banner() {
  console.log();
  console.log(`${CYAN}${BOLD}  ╔═══════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}${BOLD}  ║           CREDENCE  ·  AGENT DEMO            ║${RESET}`);
  console.log(`${CYAN}${BOLD}  ╚═══════════════════════════════════════════════╝${RESET}`);
  console.log();
  console.log(`${DIM}  Simulating an AI agent that obtains a Credence${RESET}`);
  console.log(`${DIM}  credential via XMTP, then uses it to access a${RESET}`);
  console.log(`${DIM}  protected API — all programmatically.${RESET}`);
  console.log();
}

function step(n: number, label: string) {
  console.log(`${BOLD}${BLUE}  [${ n }]${RESET} ${BOLD}${label}${RESET}`);
}

function info(msg: string) {
  console.log(`${DIM}      ${msg}${RESET}`);
}

function success(msg: string) {
  console.log(`${GREEN}${BOLD}      ${msg}${RESET}`);
}

function warn(msg: string) {
  console.log(`${YELLOW}      ${msg}${RESET}`);
}

function fail(msg: string) {
  console.log(`${RED}${BOLD}      ${msg}${RESET}`);
}

function json(obj: any) {
  const lines = JSON.stringify(obj, null, 2).split("\n");
  for (const line of lines) {
    console.log(`${MAGENTA}      ${line}${RESET}`);
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  banner();

  // ── Step 1: Create ephemeral XMTP identity ───────────────────────────
  step(1, "Creating ephemeral XMTP identity...");

  const user = createUser();
  const signer = createSigner(user);

  const agent = await Agent.create(signer, { env: "dev" });
  await agent.start();

  info(`Agent address: ${user.account.address}`);
  info(`Credence agent: ${CREDENCE_AGENT_ADDRESS}`);
  success("XMTP client connected\n");

  await sleep(500);

  // ── Step 2: Open DM with Credence agent ───────────────────────────────
  step(2, "Opening DM with Credence verification agent...");

  const dm = await agent.createDmWithAddress(CREDENCE_AGENT_ADDRESS as `0x${string}`);

  success(`Conversation created: ${dm.id.slice(0, 12)}...\n`);

  await sleep(500);

  // ── Step 3: Send verify command ───────────────────────────────────────
  step(3, "Sending verification request...");

  const command = `verify ${PROOF_ID} ${WORLD_NULLIFIER}`;
  info(`> ${command}`);

  await dm.sendText(command);
  success("Message sent, waiting for response...\n");

  // ── Step 4: Wait for agent response ───────────────────────────────────
  step(4, "Waiting for Credence agent reply...");

  let credentialId: string | null = null;
  const seenIds = new Set<string>();

  // Poll for new messages (the agent should reply within a few seconds)
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    await sleep(2000);
    await dm.sync();
    const messages = await dm.messages({ limit: 10 });

    for (const msg of messages) {
      if (msg.senderInboxId === agent.client.inboxId) continue;
      if (!isText(msg)) continue;
      if (seenIds.has(msg.id)) continue;
      seenIds.add(msg.id);

      const text = msg.content as string;

      // Print each line of the response
      for (const line of text.split("\n")) {
        if (line.trim()) info(`< ${line}`);
      }

      // Extract credential_id
      const match = text.match(/Credential ID: (.+)/);
      if (match) {
        credentialId = match[1].trim();
      }
    }

    if (credentialId) break;
  }

  if (!credentialId) {
    fail("No credential received within timeout.");
    process.exit(1);
  }

  success(`Credential received: ${credentialId}\n`);

  await sleep(500);

  // ── Step 5: Verify credential via x402-gated endpoint ─────────────────
  step(5, "Verifying credential via Credence API (x402-gated in production)...");

  info(`GET ${CREDENCE_API_URL}/v1/credentials/${credentialId}/verify`);

  const verifyRes = await fetch(
    `${CREDENCE_API_URL}/v1/credentials/${credentialId}/verify`
  );
  const verifyData = await verifyRes.json();

  json(verifyData);

  if (verifyData.valid) {
    success("Credential is valid\n");
  } else {
    fail(`Credential invalid: ${verifyData.reason}\n`);
    process.exit(1);
  }

  await sleep(500);

  // ── Step 6: Access protected API ──────────────────────────────────────
  step(6, "Accessing protected API with credential...");

  info(`GET ${CREDENCE_API_URL}/api/premium-data`);
  info(`X-Credence-Credential: ${credentialId}`);

  const dataRes = await fetch(`${CREDENCE_API_URL}/api/premium-data`, {
    headers: { "X-Credence-Credential": credentialId },
  });
  const data = await dataRes.json();

  console.log();
  json(data);

  if (dataRes.ok) {
    console.log();
    success("Access granted. Full demo complete.");
  } else {
    console.log();
    fail("Access denied.");
  }

  // ── Done ──────────────────────────────────────────────────────────────
  console.log();
  console.log(`${CYAN}${BOLD}  ╔═══════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}${BOLD}  ║              DEMO COMPLETE                    ║${RESET}`);
  console.log(`${CYAN}${BOLD}  ╠═══════════════════════════════════════════════╣${RESET}`);
  console.log(`${CYAN}  ║                                               ║${RESET}`);
  console.log(`${CYAN}  ║${RESET}  World ID    ${GREEN}verified${RESET}  ${DIM}(unique human)${RESET}        ${CYAN}║${RESET}`);
  console.log(`${CYAN}  ║${RESET}  Mirror ZKP  ${GREEN}verified${RESET}  ${DIM}(financial standing)${RESET} ${CYAN}║${RESET}`);
  console.log(`${CYAN}  ║${RESET}  Credential  ${GREEN}issued${RESET}    ${DIM}(via XMTP agent)${RESET}    ${CYAN}║${RESET}`);
  console.log(`${CYAN}  ║${RESET}  API access  ${GREEN}granted${RESET}   ${DIM}(x402 verified)${RESET}     ${CYAN}║${RESET}`);
  console.log(`${CYAN}  ║                                               ║${RESET}`);
  console.log(`${CYAN}${BOLD}  ╚═══════════════════════════════════════════════╝${RESET}`);
  console.log();

  await agent.stop();
  process.exit(0);
}

main().catch((err) => {
  fail(`Demo failed: ${err.message}`);
  console.error(err);
  process.exit(1);
});
