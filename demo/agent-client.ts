import "dotenv/config";
import { Agent, createUser, createSigner } from "@xmtp/agent-sdk";
import { verifyCredentialOverXMTP } from "../sdk/src/xmtp.js";

// ── Config ──────────────────────────────────────────────────────────────

const CREDENCE_AGENT_ADDRESS =
  process.env.CREDENCE_AGENT_ADDRESS ||
  "0xadb866f13a1a07c6259b7c950049e82d1abe7b9b";

const CREDENTIAL_ID = process.argv[2] || process.env.CREDENTIAL_ID;

if (!CREDENTIAL_ID) {
  console.error(
    "\n  Usage: npx tsx agent-client.ts <credential_id>\n"
  );
  console.error(
    "  Get a credential_id by completing the flow at http://localhost:3000\n"
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
const WHITE = "\x1b[37m";

function banner() {
  console.log();
  console.log(
    `${CYAN}${BOLD}  ╔═══════════════════════════════════════════════════════════╗${RESET}`
  );
  console.log(
    `${CYAN}${BOLD}  ║                CREDENCE  ·  AGENT DEMO                   ║${RESET}`
  );
  console.log(
    `${CYAN}${BOLD}  ╚═══════════════════════════════════════════════════════════╝${RESET}`
  );
  console.log();
  console.log(
    `${DIM}  Three AI agents communicate over XMTP:${RESET}`
  );
  console.log(
    `${DIM}  ${RESET}${BOLD}Agent A${RESET}${DIM} (user's agent) wants access to a premium API${RESET}`
  );
  console.log(
    `${DIM}  ${RESET}${BOLD}Agent B${RESET}${DIM} (API provider) gates access with Credence${RESET}`
  );
  console.log(
    `${DIM}  ${RESET}${BOLD}Agent C${RESET}${DIM} (Credence) verifies credentials for $0.001 via x402${RESET}`
  );
  console.log();
}

function agentLabel(name: string, color: string) {
  return `${color}${BOLD}[${name}]${RESET}`;
}

function msg(from: string, to: string, fromColor: string, toColor: string, text: string) {
  console.log(
    `  ${fromColor}${BOLD}${from}${RESET} ${DIM}→${RESET} ${toColor}${BOLD}${to}${RESET}${DIM} (XMTP)${RESET}`
  );
  console.log(`  ${DIM}  "${text}"${RESET}`);
  console.log();
}

function status(agent: string, color: string, text: string) {
  console.log(`  ${color}${BOLD}[${agent}]${RESET} ${text}`);
}

function data(obj: any) {
  const lines = JSON.stringify(obj, null, 2).split("\n");
  for (const line of lines) {
    console.log(`  ${MAGENTA}  ${line}${RESET}`);
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  banner();

  const A_COLOR = BLUE;
  const B_COLOR = YELLOW;
  const C_COLOR = CYAN;

  // ── Create agents A and B ─────────────────────────────────────────────

  status("Setup", DIM, "Creating ephemeral XMTP agents...");
  console.log();

  const userA = createUser();
  const signerA = createSigner(userA);
  const agentA = await Agent.create(signerA, { env: "dev" });
  await agentA.start();

  const userB = createUser();
  const signerB = createSigner(userB);
  const agentB = await Agent.create(signerB, { env: "dev" });
  await agentB.start();

  status("Agent A", A_COLOR, `User's agent — ${userA.account.address.slice(0, 10)}...`);
  status("Agent B", B_COLOR, `API provider — ${userB.account.address.slice(0, 10)}...`);
  status("Agent C", C_COLOR, `Credence agent — ${CREDENCE_AGENT_ADDRESS.slice(0, 10)}...`);
  console.log();

  await sleep(1000);

  // ── Step 1: A → B ─────────────────────────────────────────────────────

  console.log(
    `${BOLD}  ── Step 1: Agent A requests access from Agent B ──${RESET}`
  );
  console.log();

  const dmAB = await agentA.createDmWithAddress(
    userB.account.address as `0x${string}`
  );

  const requestMsg = `access premium-data ${CREDENTIAL_ID}`;
  msg("Agent A", "Agent B", A_COLOR, B_COLOR, requestMsg);

  await dmAB.sendText(requestMsg);

  await sleep(1500);

  // ── Step 2: B verifies credential with Credence via XMTP ───────────

  console.log(
    `${BOLD}  ── Step 2: Agent B verifies credential with Credence ──${RESET}`
  );
  console.log();

  status("Agent B", B_COLOR, "Received access request. Verifying credential with Credence...");
  status("Agent B", B_COLOR, `Using ${CYAN}verifyCredentialOverXMTP()${RESET} from credence-gate SDK`);
  console.log();

  msg("Agent B", "Agent C", B_COLOR, C_COLOR, `check-credential ${CREDENTIAL_ID}`);

  status("Agent B", B_COLOR, `${DIM}(In production, B pays $0.001 USDC via x402 for this verification)${RESET}`);
  console.log();

  // This is the SDK call — one line for Agent B to verify via Credence over XMTP
  const verification = await verifyCredentialOverXMTP(
    agentB,
    CREDENTIAL_ID,
    { agentAddress: CREDENCE_AGENT_ADDRESS }
  );

  // ── Step 3: Credence responds ─────────────────────────────────────────

  console.log(
    `${BOLD}  ── Step 3: Credence verifies and responds ──${RESET}`
  );
  console.log();

  if (!verification.valid) {
    msg("Agent C", "Agent B", C_COLOR, B_COLOR, `CREDENTIAL_INVALID: ${verification.reason}`);
    status("Agent B", B_COLOR, `${RED}Credential invalid. Denying access to Agent A.${RESET}`);
    await agentA.stop();
    await agentB.stop();
    process.exit(1);
  }

  msg("Agent C", "Agent B", C_COLOR, B_COLOR, "CREDENTIAL_VALID");
  console.log(`  ${GREEN}  human: ${verification.human}${RESET}`);
  console.log(`  ${GREEN}  financial_standing: ${verification.financial_standing}${RESET}`);
  console.log(`  ${GREEN}  expires_at: ${verification.expires_at}${RESET}`);
  console.log();

  await sleep(1000);

  // ── Step 4: B grants access and sends data to A ───────────────────────

  console.log(
    `${BOLD}  ── Step 4: Agent B grants access to Agent A ──${RESET}`
  );
  console.log();

  status("Agent B", B_COLOR, "Credential verified. Preparing premium data...");
  console.log();

  const premiumData = {
    status: "access_granted",
    data: "Premium financial data — only for verified humans with proven financial standing.",
    verified: { human: true, financial_standing: true },
    timestamp: new Date().toISOString(),
  };

  const responseMsg = `ACCESS_GRANTED\n${JSON.stringify(premiumData, null, 2)}`;

  // B sends response to A via XMTP
  const dmBA = await agentB.createDmWithAddress(
    userA.account.address as `0x${string}`
  );
  await dmBA.sendText(responseMsg);

  msg("Agent B", "Agent A", B_COLOR, A_COLOR, "ACCESS_GRANTED");
  data(premiumData);
  console.log();

  await sleep(800);

  // ── Summary ───────────────────────────────────────────────────────────

  console.log(
    `${CYAN}${BOLD}  ╔═══════════════════════════════════════════════════════════╗${RESET}`
  );
  console.log(
    `${CYAN}${BOLD}  ║                      FLOW COMPLETE                        ║${RESET}`
  );
  console.log(
    `${CYAN}${BOLD}  ╠═══════════════════════════════════════════════════════════╣${RESET}`
  );
  console.log(
    `${CYAN}  ║                                                             ║${RESET}`
  );
  console.log(
    `${CYAN}  ║${RESET}  ${A_COLOR}Agent A${RESET} requested access from ${B_COLOR}Agent B${RESET}         ${DIM}(XMTP)${RESET}  ${CYAN}║${RESET}`
  );
  console.log(
    `${CYAN}  ║${RESET}  ${B_COLOR}Agent B${RESET} asked ${C_COLOR}Credence${RESET} to verify credential  ${DIM}(XMTP)${RESET}  ${CYAN}║${RESET}`
  );
  console.log(
    `${CYAN}  ║${RESET}  ${C_COLOR}Credence${RESET} confirmed: human + financial standing ${DIM}(x402)${RESET}  ${CYAN}║${RESET}`
  );
  console.log(
    `${CYAN}  ║${RESET}  ${B_COLOR}Agent B${RESET} granted access to ${A_COLOR}Agent A${RESET}             ${DIM}(XMTP)${RESET}  ${CYAN}║${RESET}`
  );
  console.log(
    `${CYAN}  ║                                                             ║${RESET}`
  );
  console.log(
    `${CYAN}  ║${RESET}  ${DIM}3 agents · 3 XMTP conversations · 1 x402 micropayment${RESET}    ${CYAN}║${RESET}`
  );
  console.log(
    `${CYAN}  ║                                                             ║${RESET}`
  );
  console.log(
    `${CYAN}${BOLD}  ╚═══════════════════════════════════════════════════════════╝${RESET}`
  );
  console.log();

  await agentA.stop();
  await agentB.stop();
  process.exit(0);
}

main().catch((err) => {
  console.error(`${RED}${BOLD}  Demo failed: ${err.message}${RESET}`);
  console.error(err);
  process.exit(1);
});
