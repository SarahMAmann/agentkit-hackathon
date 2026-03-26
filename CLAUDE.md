# Credence: Fix the Frontend Flow + XMTP Framing

## Context

The frontend at localhost:3000 currently shows three steps:
1. Connect your Mirror proof (paste proof_id)
2. Verify with World ID (IDKit widget → returns nullifier_hash)
3. "Get your credential" button (greyed out)

...followed by an **"Or: Message the Credence Agent"** section showing the XMTP agent address and the `verify {proof_id} {world_nullifier}` command.

**This framing is wrong.** The "Or" implies XMTP is an alternative path. It's not — it's the primary path and the whole point of the product. The frontend exists purely to generate the two inputs (`proof_id` and `nullifier_hash`) that the user then hands to the XMTP agent.

The "Verify & Issue Credential" button should be removed or replaced. The XMTP message IS the verification step.

---

## What a nullifier_hash is (important for copy/UX)

When a user completes World ID verification via IDKit, they don't get back their identity — that would defeat the privacy purpose. Instead IDKit returns a `nullifier_hash`: a unique, deterministic identifier specific to *this person + this app*. The same person verifying in a different app gets a different nullifier. It's World's ZK proof output — proof that a unique human verified here, with no link to who they actually are.

So the two things the user collects from the frontend are:
- `proof_id` — from Mirror (proves financial standing without revealing balance)
- `nullifier_hash` — from World ID (proves unique humanness without revealing identity)

Together these go into the XMTP message to the Credence agent.

---

## Changes Required

### 1. Restructure the page flow from "steps + or" to a clear 3-step funnel

Remove the separate "Or: Message the Credence Agent" section entirely. Fold XMTP into the main numbered flow as the final step. The page should read:

**Step 1: Generate your Mirror proof**
> Go to [app.mirrorzkp.com](https://app.mirrorzkp.com), connect your bank account, and generate a balance proof. Come back with your proof ID.
> 
> [input: Proof ID]

**Step 2: Verify with World ID**
> Prove you're a unique human. This returns a nullifier — a privacy-preserving identifier that proves humanness without revealing your identity.
>
> [Verify with World ID button → on success, show "✓ World ID verified" + display the nullifier_hash]

**Step 3: Message the Credence agent**
> Send both to the Credence verification agent over XMTP. The agent verifies your proof and World ID, pays a micropayment via x402, and issues your credential.
>
> [show the pre-filled message, copyable]:
> ```
> verify {proof_id} {nullifier_hash}
> ```
> [Copy message button] [Open xmtp.chat button → links to xmtp.chat with agent address pre-filled if possible]
>
> Agent address: `0xadb866f13a1a07c6259b7c950049e82d1abe7b9b`
>
> The agent will reply with your `credential_id`. Present it to any Credence-gated API as:
> `X-Credence-Credential: {credential_id}`

### 2. After World ID verification succeeds

When IDKit's `onSuccess` fires and returns the `proof` object:
- Store `proof.nullifier_hash` in state
- Show a green "✓ World ID verified" badge replacing the button
- Show the nullifier_hash in a small monospace display (truncated: first 10 chars + "...")
- If proof_id is also filled in, auto-populate the full `verify {proof_id} {nullifier_hash}` message so it's ready to copy

### 3. Remove the "Verify & Issue Credential" button

This button implies there's a web2-style form submission path. There isn't — or if there is, it's secondary. Remove it for now. The XMTP agent is the canonical verification path.

If you want to keep a direct API path for non-XMTP use cases later, it can be added back as a developer/API option, not the primary UX.

### 4. Update the page title and subtitle

Current:
> **Credence**
> Prove you are a verified human with financial standing, no account data exposure. Powered by World ID, Mirror, and x402 micropayments.

Change to something that leads with the agentic use case:
> **Credence**
> The verification layer for the agentic internet. Prove you're a real human with financial standing — then let your agents carry that credential automatically.

Or shorter:
> **Credence**
> Verify once. Your agents carry the proof.

Pick whichever reads better in context.

### 5. Add a brief explainer under Step 3

After the XMTP message block, add a small explainer (grey text, small font):

> **Why XMTP?** Once you have a credential, any AI agent acting on your behalf can present it to Credence-gated APIs automatically — no browser needed. XMTP is the messaging layer agents use to communicate. Your credential travels with your agents.

---

## What NOT to change

- The proof_id input field (keep as-is)
- The World ID button and IDKit integration (keep as-is, just restyle the success state)
- The agent address (keep: `0xadb866f13a1a07c6259b7c950049e82d1abe7b9b`)
- The command format (`verify {proof_id} {world_nullifier}`)
- The link to app.mirrorzkp.com

---

## Summary of what this fixes

The old flow said: "do steps 1-2, then optionally use XMTP."
The new flow says: "do steps 1-2 to collect your inputs, then step 3 is sending them to the agent."

XMTP is not the alternative. It's the product.
