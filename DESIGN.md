# Credence: Frontend Redesign

## Inspiration

The Base landing page (base.org) — study it closely:
- Pure white background, near-black text (#0a0a0a), electric blue (#0052FF) as the sole accent
- Massive, confident typography — the headline dominates the page without apology
- Extreme negative space — things breathe, nothing crowds
- A subtle generative visual (the waveform/barcode pattern) as texture, not decoration
- Navigation is sparse and flat — no gradients, no shadows, no cards with borders
- Everything feels like it belongs to a serious financial/infrastructure company, not a startup trying to look cool

The current Credence page looks like a default HTML form with some padding. We need it to feel like infrastructure that serious people would trust with their financial credentials.

---

## Aesthetic Direction

**Tone:** Authoritative minimal. Think: financial infrastructure meets cryptographic precision.
Not cold, not clinical — but serious. Like if Linear and Coinbase had a baby.

**NOT:** 
- Purple gradients
- Glassmorphism cards
- Rounded everything
- SaaS dashboard vibes
- Dark mode with neon accents
- Generic sans-serif body copy

**YES:**
- White background, near-black text
- One accent color only: electric blue (#0052FF — same as Base/Coinbase)
- Large, commanding display typography for headings
- Generous whitespace — the kind that communicates confidence
- Step numbers as large, faint background numerals (editorial style)
- Monospace elements for credential IDs, addresses, and code — treated as design features
- Subtle geometric or grid-based texture in the hero area (inspired by Base's waveform)
- Thin divider lines between sections, no card borders

---

## Typography

- **Display/headings:** A geometric sans with real character — try `DM Sans`, `Cabinet Grotesk`, `Syne`, or `Bricolage Grotesque` (load from Google Fonts). Heavy weight for h1, medium for h2.
- **Body:** `DM Sans` regular or `Instrument Sans` — clean but not generic
- **Monospace:** `JetBrains Mono` or `IBM Plex Mono` for addresses, credential IDs, commands
- h1: 56–64px, black weight, tight letter-spacing
- h2: 28–32px, semibold
- Body: 16–17px, #4a4a4a (not pure black — slightly softened)
- Step labels: 13px uppercase, tracked wide, #999

---

## Layout & Structure

The page is a single vertical flow. No sidebar, no nav bar needed for the hackathon demo.

### Hero section (top)
- Logo/wordmark: "Credence" in the display font, left-aligned, ~28px, near-black
- A single line tagline directly below: "Verify once. Your agents carry the proof." — in body text, grey
- Large decorative background element: a faint grid or waveform texture (CSS-generated, similar to Base's barcode pattern) — right-aligned, bleeds off the edge, opacity ~0.06

### Steps section
Each step is a full-width horizontal band separated by thin 1px lines (#e8e8e8).

Layout per step:
```
[LARGE FAINT STEP NUMBER]   [Step title]
                             [Description]
                             [Interactive element]
```

The step number (01, 02, 03) is enormous — 120–160px, font-weight 800, color #f0f0f0, 
positioned as a background element behind the step content. Editorial, not functional.

Step 1 — Verify with World ID
- Heading: "Verify with World ID"
- Body: "Prove you're a unique human. Returns a nullifier — a privacy-preserving identifier that proves humanness without revealing your identity."
- Button: Black pill button, white text, "Verify with World ID"
- Success state: Replace button with a green checkmark badge + truncated nullifier in monospace

Step 2 — Connect your Mirror proof
- Heading: "Connect your Mirror proof"  
- Body: "Generate a balance proof at app.mirrorzkp.com, then paste your proof ID below."
- Input: Clean, minimal input — 1px border, no background fill, placeholder in #bbb
- The "app.mirrorzkp.com" link: blue (#0052FF), no underline by default, underline on hover

Step 3 — Get your credential
- Heading: "Get your credential"
- Body: "Credence verifies your World ID and Mirror proof, then issues a signed credential you can use to access gated APIs."
- Button: Blue (#0052FF) pill button, white text, "Issue Credential"
- Disabled state: same button but #ccc background, not blue
- Success state: Show credential_id in a monospace block with a copy button

### Agent section (bottom)
This is a distinct band — light grey background (#f7f7f7), left blue border accent (4px, #0052FF).

Heading: "For AI agents" — smaller, 20px, semibold
Body: "Agents obtain credentials programmatically by messaging the Credence verification agent over XMTP."

Command block — styled like a terminal:
- Background: #0a0a0a (near black)
- Text: #00ff88 (terminal green) in JetBrains Mono
- Content: `verify { proof_id } { nullifier_hash }`
- Small "copy" icon top-right

Below the command block, two small items in grey monospace text:
- Agent address: 0xadb866f13a1a07c6259b7c950049e82d1abe7b9b
- A link: "Open in xmtp.chat →"

Small fine print below (12px, #999):
"Any AI agent can message this address over XMTP to obtain a credential on behalf of a user. APIs verify credentials via Credence's x402-gated verification endpoint, paying $0.001 per lookup."

---

## Interactions & Micro-animations

- Page load: Steps stagger in from below with opacity — 0.15s delay between each, 0.4s ease-out. Subtle, not dramatic.
- Button hover: Black button inverts to white/black border. Blue button darkens 10%.
- Input focus: Border turns blue (#0052FF), no box-shadow — just the color change.
- Step success states: Green checkmark fades in with a quick scale(0.8→1) pop.
- Copy button: Briefly shows "Copied!" text on click, reverts after 1.5s.

---

## What to preserve functionally

Keep all existing logic intact:
- IDKit World ID integration and onSuccess handler
- proof_id input and state
- Issue Credential button and its disabled/enabled logic
- The agent address and XMTP command text
- The link to app.mirrorzkp.com

Only the visual presentation changes — no functional regressions.

---

## Colors (full palette)

```css
--color-bg: #ffffff;
--color-text: #0a0a0a;
--color-text-muted: #666666;
--color-text-faint: #999999;
--color-accent: #0052FF;       /* Base/Coinbase blue */
--color-accent-hover: #0040cc;
--color-border: #e8e8e8;
--color-surface: #f7f7f7;
--color-success: #00a550;
--color-step-bg: #f4f4f4;      /* faint step number color */
--color-terminal-bg: #0a0a0a;
--color-terminal-text: #00ff88;
```

---

## Deliverable

Restyle the existing Credence frontend page in place. Preserve all functionality.
The result should feel like it belongs alongside base.org — serious, confident, minimal,
with electric blue as the only color that isn't black, white, or grey.
