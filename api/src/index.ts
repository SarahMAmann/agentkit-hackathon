import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { issueCredential, verifyCredential } from "./credentials.js";
import { credenceGate } from "../../sdk/src/index.js";

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

// --- x402 Payment Setup ---

async function setupX402() {
  if (!config.requirePayment) {
    console.log("[x402] Payments DISABLED (REQUIRE_PAYMENT != true)");
    return;
  }

  if (!config.x402SellerWallet) {
    console.log("[x402] Payments DISABLED (no MIRROR_WALLET_ADDRESS set)");
    return;
  }

  try {
    const { paymentMiddleware, x402ResourceServer } = await import(
      "@x402/express"
    );
    const { HTTPFacilitatorClient } = await import("@x402/core/server");
    const { ExactEvmScheme } = await import("@x402/evm/exact/server");

    const x402Network = config.isProduction
      ? "eip155:8453"
      : "eip155:84532";

    const facilitator = new HTTPFacilitatorClient({
      url: config.x402FacilitatorUrl,
    });

    const resourceServer = new x402ResourceServer(facilitator).register(
      x402Network,
      new ExactEvmScheme()
    );

    await resourceServer.initialize();

    app.use(
      paymentMiddleware(
        {
          "GET /v1/credentials/:id/verify": {
            accepts: {
              scheme: "exact",
              price: "$0.001",
              network: x402Network,
              payTo: config.x402SellerWallet as `0x${string}`,
            },
            description:
              "Credence credential verification — confirm human + financial standing",
          },
        },
        resourceServer
      )
    );

    console.log(
      `[x402] Payments enabled on credential verification → ${config.x402SellerWallet.slice(0, 6)}...`
    );
  } catch (err) {
    console.error("[x402] Failed to initialize:", err);
    console.log("[x402] Server starting without payment gating");
  }
}

// --- Routes ---

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "credence-api" });
});

// POST /v1/verify — Credential issuance (free)
// Verifies a Mirror proof + World ID, issues a signed credential
app.post("/v1/verify", async (req, res) => {
  try {
    const { proof_id, world_id_nullifier } = req.body;

    if (!proof_id || !world_id_nullifier) {
      return res
        .status(400)
        .json({ error: "proof_id and world_id_nullifier are required" });
    }

    // Step 1: Resolve share token to proof UUID if needed
    // Mirror's UI gives users a short share token (e.g. "1cXjytUb") rather than the UUID
    let resolvedProofId = proof_id;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(proof_id);

    if (!isUUID) {
      const shareRes = await fetch(`${config.mirrorApiUrl}/verify/${proof_id}`);
      if (!shareRes.ok) {
        return res.status(400).json({ error: "Invalid proof ID or share token" });
      }
      const shareData = await shareRes.json();
      if (!shareData.proof_id) {
        return res.status(400).json({ error: "Could not resolve share token" });
      }
      resolvedProofId = shareData.proof_id;
    }

    // Step 2: Verify the Mirror proof via the existing Mirror API
    const mirrorRes = await fetch(
      `${config.mirrorApiUrl}/v1/proofs/${resolvedProofId}/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!mirrorRes.ok) {
      const err = await mirrorRes.json().catch(() => ({}));
      return res.status(400).json({
        error: "Mirror proof verification failed",
        details: err,
      });
    }

    const mirrorResult = await mirrorRes.json();
    if (!mirrorResult.valid) {
      return res.status(400).json({
        error: "Mirror proof is invalid",
        details: mirrorResult,
      });
    }

    // Step 2: Verify World ID (for hackathon, we accept the nullifier as-is)
    // In production, you'd call World's verification API:
    //   POST https://developer.worldcoin.org/api/v2/verify/{app_id}
    // For the demo, the frontend verifies via IDKit and passes the nullifier
    const worldVerified = true;

    if (!worldVerified) {
      return res.status(400).json({ error: "World ID verification failed" });
    }

    // Step 3: Issue signed credential
    const credential = issueCredential(proof_id, world_id_nullifier);

    res.json({
      success: true,
      ...credential,
    });
  } catch (err: any) {
    console.error("Verification failed:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// GET /v1/credentials/:id/verify — Check if a credential is valid (x402-gated when enabled)
app.get("/v1/credentials/:id/verify", (req, res) => {
  const result = verifyCredential(req.params.id);
  res.json(result);
});

// GET /api/premium-data — Demo protected endpoint
// Shows how a third-party API uses credence-gate to protect an endpoint.
// This is exactly what a real customer (Agent B) would do:
app.get(
  "/api/premium-data",
  credenceGate({
    apiUrl: `http://localhost:${config.port}`,
  }),
  (req, res) => {
    res.json({
      data: "This is premium financial data, only available to verified humans with proven financial standing.",
      verified_human: req.credence!.human,
      financial_standing: req.credence!.financial_standing,
      timestamp: new Date().toISOString(),
    });
  }
);

// --- Start ---

async function start() {
  await setupX402();

  app.listen(config.port, () => {
    console.log(`Credence API running on port ${config.port}`);
    console.log(`Mirror API upstream: ${config.mirrorApiUrl}`);
  });
}

start().catch(console.error);
