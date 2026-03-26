"use client";

import { useState } from "react";
import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit";
import type { ISuccessResult } from "@worldcoin/idkit";

const WORLD_APP_ID =
  process.env.NEXT_PUBLIC_WORLD_APP_ID || "app_c97dde0e27855f7db5536bd76720aba3";
const CREDENCE_API_URL =
  process.env.NEXT_PUBLIC_MIRROR_API_URL || "http://localhost:3002";
const XMTP_AGENT_ADDRESS =
  process.env.NEXT_PUBLIC_XMTP_AGENT_ADDRESS ||
  "0xadb866f13a1a07c6259b7c950049e82d1abe7b9b";

export default function Home() {
  const [proofId, setProofId] = useState("");
  const [worldProof, setWorldProof] = useState<ISuccessResult | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleWorldSuccess = (proof: ISuccessResult) => {
    setWorldProof(proof);
    setError("");
  };

  const handleVerify = async () => {
    if (!proofId || !worldProof) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${CREDENCE_API_URL}/v1/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof_id: proofId,
          world_id_nullifier: worldProof.nullifier_hash,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ready = proofId && worldProof && !result;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      <h1>Credence</h1>
      <p style={{ color: "#666", fontSize: "1.1rem", lineHeight: 1.5 }}>
        Verify once. Your agents carry the proof.
      </p>

      {/* Step 1: World ID */}
      <section style={{ marginTop: "2.5rem" }}>
        <h2>1. Verify with World ID</h2>
        <p>
          Prove you're a unique human. This returns a nullifier — a
          privacy-preserving identifier that proves humanness without revealing
          your identity.
        </p>
        {worldProof ? (
          <div
            style={{
              padding: "0.75rem",
              background: "#e8f5e9",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>World ID verified</span>
            <code style={{ fontSize: "0.85rem", color: "#555" }}>
              {worldProof.nullifier_hash.slice(0, 10)}...
            </code>
          </div>
        ) : (
          <IDKitWidget
            app_id={WORLD_APP_ID as `app_${string}`}
            action="mirror-verify"
            verification_level={VerificationLevel.Device}
            onSuccess={handleWorldSuccess}
          >
            {({ open }) => (
              <button
                onClick={open}
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  background: "#000",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Verify with World ID
              </button>
            )}
          </IDKitWidget>
        )}
      </section>

      {/* Step 2: Mirror Proof */}
      <section style={{ marginTop: "2.5rem" }}>
        <h2>2. Connect your Mirror proof</h2>
        <p>
          Go to{" "}
          <a href="https://app.mirrorzkp.com" target="_blank" rel="noreferrer">
            app.mirrorzkp.com
          </a>
          , connect your bank account, and generate a balance proof. Come back
          with your proof ID.
        </p>
        <input
          type="text"
          placeholder="Proof ID (e.g. 3fa85f64-5717-...)"
          value={proofId}
          onChange={(e) => setProofId(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            fontSize: "1rem",
            border: "1px solid #ccc",
            borderRadius: 4,
            boxSizing: "border-box",
          }}
        />
      </section>

      {/* Step 3: Get Credential */}
      <section style={{ marginTop: "2.5rem" }}>
        <h2>3. Get your credential</h2>
        <p>
          Credence verifies your World ID and Mirror proof, then issues a signed
          credential you can use to access gated APIs.
        </p>

        <button
          onClick={handleVerify}
          disabled={!ready || loading}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            background: ready ? "#1a73e8" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: ready ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Verifying..." : "Issue Credential"}
        </button>

        {error && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              background: "#ffebee",
              borderRadius: 4,
              color: "#c62828",
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "#e8f5e9",
              borderRadius: 4,
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem" }}>Credential Issued</h3>
            <p>
              <strong>Human:</strong> {result.human ? "Yes (World ID)" : "No"}
            </p>
            <p>
              <strong>Financial standing:</strong>{" "}
              {result.financial_standing ? "Yes (Mirror proof)" : "No"}
            </p>
            <p>
              <strong>Credential ID:</strong>{" "}
              <code>{result.credential_id}</code>
            </p>
            <p>
              <strong>Expires:</strong> {result.expires_at}
            </p>
            <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
              Present this to any Credence-gated API as:
            </p>
            <code
              style={{
                display: "block",
                padding: "0.5rem 0.75rem",
                background: "#fff",
                border: "1px solid #c8e6c9",
                borderRadius: 4,
                fontSize: "0.85rem",
              }}
            >
              X-Credence-Credential: {result.credential_id}
            </code>
          </div>
        )}
      </section>

      {/* For Agents: XMTP */}
      <section
        style={{
          marginTop: "3rem",
          padding: "1.25rem",
          background: "#f8f9fa",
          borderRadius: 8,
          borderLeft: "3px solid #1a73e8",
        }}
      >
        <h3 style={{ marginTop: 0 }}>For AI agents</h3>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
          Agents can obtain credentials programmatically by messaging the
          Credence verification agent over XMTP:
        </p>
        <code
          style={{
            display: "block",
            padding: "0.5rem 0.75rem",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 4,
            fontSize: "0.85rem",
            wordBreak: "break-all",
          }}
        >
          verify {"{"} proof_id {"}"} {"{"} nullifier_hash {"}"}
        </code>
        <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: 0 }}>
          Agent address:{" "}
          <code style={{ fontSize: "0.8rem" }}>{XMTP_AGENT_ADDRESS}</code>
        </p>
        <p
          style={{
            fontSize: "0.8rem",
            color: "#888",
            lineHeight: 1.5,
            marginBottom: 0,
          }}
        >
          Any AI agent can message this address over XMTP to get a credential on
          behalf of a user — no browser needed. APIs verify credentials via
          Credence's x402-gated verification endpoint, paying $0.001 per lookup.
        </p>
      </section>
    </div>
  );
}
