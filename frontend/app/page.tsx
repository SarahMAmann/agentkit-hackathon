"use client";

import { useState } from "react";
import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit";
import type { ISuccessResult } from "@worldcoin/idkit";

const WORLD_APP_ID =
  process.env.NEXT_PUBLIC_WORLD_APP_ID ||
  "app_c97dde0e27855f7db5536bd76720aba3";
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
  const [copied, setCopied] = useState(false);
  const [credCopied, setCredCopied] = useState(false);

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

  const handleCopyCommand = () => {
    navigator.clipboard.writeText("verify {proof_id} {nullifier_hash}");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyCredential = () => {
    if (result?.credential_id) {
      navigator.clipboard.writeText(result.credential_id);
      setCredCopied(true);
      setTimeout(() => setCredCopied(false), 1500);
    }
  };

  const ready = proofId && worldProof && !result;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Decorative grid texture */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "35%",
          height: "100%",
          opacity: 0.04,
          backgroundImage:
            "repeating-linear-gradient(90deg, #0052FF 0px, #0052FF 1px, transparent 1px, transparent 8px)",
          backgroundSize: "8px 100%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        className="page-container"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "60px 48px 100px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Hero */}
        <header style={{ marginBottom: 64 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--color-text)",
              letterSpacing: "-0.02em",
            }}
          >
            Credence
          </div>
          <p
            className="hero-headline"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 48,
              fontWeight: 900,
              color: "var(--color-text)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginTop: 20,
              maxWidth: 700,
            }}
          >
            Verify once. Your agents carry the proof.
          </p>
          <p
            className="hero-sub"
            style={{
              fontSize: 17,
              color: "var(--color-text-muted)",
              marginTop: 16,
              lineHeight: 1.6,
              maxWidth: 560,
            }}
          >
            Prove you are a verified human with financial standing, no account
            data exposure. Powered by World ID, Mirror, and x402 micropayments.
          </p>
        </header>

        {/* Steps — 3 column grid */}
        <div className="steps-grid">
          {/* Step 1: World ID */}
          <section
            className="step-section"
            style={{ padding: "36px 32px 40px", position: "relative" }}
          >
            <div
              className="step-bg-number"
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                fontFamily: "var(--font-display)",
                fontSize: 120,
                fontWeight: 900,
                color: "var(--color-step-bg)",
                lineHeight: 1,
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              01
            </div>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--color-text-faint)",
                  marginBottom: 8,
                }}
              >
                Step 1
              </div>
              <h2
                className="step-heading"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  marginBottom: 10,
                }}
              >
                Verify with World ID
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--color-text-muted)",
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                Prove you're a unique human. Returns a nullifier — a
                privacy-preserving identifier that proves humanness without
                revealing your identity.
              </p>

              {worldProof ? (
                <div
                  className="success-badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 16px",
                    background: "#f0faf4",
                    border: "1px solid #c8e6d4",
                    borderRadius: 100,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ flexShrink: 0 }}
                  >
                    <circle
                      cx="8"
                      cy="8"
                      r="8"
                      fill="var(--color-success)"
                    />
                    <path
                      d="M5 8.5L7 10.5L11 6"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    Verified
                  </span>
                  <code
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--color-text-faint)",
                    }}
                  >
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
                        padding: "12px 24px",
                        fontSize: 14,
                        fontWeight: 500,
                        fontFamily: "var(--font-body)",
                        background: "var(--color-text)",
                        color: "#fff",
                        border: "2px solid var(--color-text)",
                        borderRadius: 100,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.color = "var(--color-text)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--color-text)";
                        e.currentTarget.style.color = "#fff";
                      }}
                    >
                      Verify with World ID
                    </button>
                  )}
                </IDKitWidget>
              )}
            </div>
          </section>

          {/* Step 2: Mirror Proof */}
          <section
            className="step-section"
            style={{ padding: "36px 32px 40px", position: "relative" }}
          >
            <div
              className="step-bg-number"
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                fontFamily: "var(--font-display)",
                fontSize: 120,
                fontWeight: 900,
                color: "var(--color-step-bg)",
                lineHeight: 1,
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              02
            </div>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--color-text-faint)",
                  marginBottom: 8,
                }}
              >
                Step 2
              </div>
              <h2
                className="step-heading"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  marginBottom: 10,
                }}
              >
                Connect your Mirror proof
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--color-text-muted)",
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                Generate a balance proof at{" "}
                <a
                  href="https://app.mirrorzkp.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "var(--color-accent)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.textDecoration = "underline")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.textDecoration = "none")
                  }
                >
                  app.mirrorzkp.com
                </a>
                , then paste your proof ID below.
              </p>
              <input
                type="text"
                placeholder="Proof ID (e.g. 3fa85f64-5717-...)"
                value={proofId}
                onChange={(e) => setProofId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: 14,
                  fontFamily: "var(--font-mono)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                  outline: "none",
                  background: "transparent",
                  color: "var(--color-text)",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--color-accent)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--color-border)")
                }
              />
            </div>
          </section>

          {/* Step 3: Get Credential */}
          <section
            className="step-section"
            style={{ padding: "36px 32px 40px", position: "relative" }}
          >
            <div
              className="step-bg-number"
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                fontFamily: "var(--font-display)",
                fontSize: 120,
                fontWeight: 900,
                color: "var(--color-step-bg)",
                lineHeight: 1,
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              03
            </div>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--color-text-faint)",
                  marginBottom: 8,
                }}
              >
                Step 3
              </div>
              <h2
                className="step-heading"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  marginBottom: 10,
                }}
              >
                Get your credential
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--color-text-muted)",
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                Credence verifies your World ID and Mirror proof, then issues a
                signed credential you can use to access gated APIs.
              </p>

              {!result && (
                <button
                  onClick={handleVerify}
                  disabled={!ready || loading}
                  style={{
                    padding: "12px 24px",
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: "var(--font-body)",
                    background:
                      ready && !loading ? "var(--color-accent)" : "#ccc",
                    color: "#fff",
                    border: "none",
                    borderRadius: 100,
                    cursor: ready && !loading ? "pointer" : "not-allowed",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (ready && !loading)
                      e.currentTarget.style.background =
                        "var(--color-accent-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (ready && !loading)
                      e.currentTarget.style.background = "var(--color-accent)";
                  }}
                >
                  {loading ? "Verifying..." : "Issue Credential"}
                </button>
              )}

              {error && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#c62828",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 4,
                  }}
                >
                  {error}
                </div>
              )}

              {result && (
                <div className="success-badge">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="8"
                        fill="var(--color-success)"
                      />
                      <path
                        d="M5 8.5L7 10.5L11 6"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>
                      Credential issued
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.9,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    <div>
                      Human:{" "}
                      <strong style={{ color: "var(--color-text)" }}>
                        {result.human ? "Yes" : "No"}
                      </strong>
                    </div>
                    <div>
                      Financial:{" "}
                      <strong style={{ color: "var(--color-text)" }}>
                        {result.financial_standing ? "Yes" : "No"}
                      </strong>
                    </div>
                    <div>
                      Expires:{" "}
                      <strong style={{ color: "var(--color-text)" }}>
                        {new Date(result.expires_at).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--color-text-faint)",
                        marginBottom: 6,
                      }}
                    >
                      Credential ID
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <code
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          padding: "8px 10px",
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 4,
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {result.credential_id}
                      </code>
                      <button
                        onClick={handleCopyCredential}
                        style={{
                          padding: "8px 10px",
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                          background: "transparent",
                          border: "1px solid var(--color-border)",
                          borderRadius: 4,
                          cursor: "pointer",
                          color: "var(--color-text-muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {credCopied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Agent section */}
        <section
          className="agent-section"
          style={{
            marginTop: 48,
            padding: "32px 32px",
            background: "var(--color-surface)",
            borderLeft: "4px solid var(--color-accent)",
            borderRadius: 2,
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 0,
          }}
        >
          <div
            className="agent-inner"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 32,
              alignItems: "start",
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                For AI agents
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--color-text-muted)",
                  lineHeight: 1.6,
                  maxWidth: 480,
                }}
              >
                Agents obtain credentials programmatically by messaging the
                Credence verification agent over XMTP.
              </p>
            </div>
            <div className="agent-right" style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-text-faint)",
                  marginBottom: 4,
                }}
              >
                Agent address
              </div>
              <code
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--color-text-muted)",
                }}
              >
                {XMTP_AGENT_ADDRESS}
              </code>
              <div style={{ marginTop: 6 }}>
                <a
                  href={`https://xmtp.chat/dev/dm/${XMTP_AGENT_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: 13,
                    color: "var(--color-accent)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.textDecoration = "underline")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.textDecoration = "none")
                  }
                >
                  Open in xmtp.chat &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* Terminal block */}
          <div style={{ position: "relative", marginTop: 20 }}>
            <div
              style={{
                background: "var(--color-terminal-bg)",
                borderRadius: 6,
                padding: "16px 20px",
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                color: "var(--color-terminal-text)",
                overflow: "auto",
              }}
            >
              verify {"{"} proof_id {"}"} {"{"} nullifier_hash {"}"}
            </div>
            <button
              onClick={handleCopyCommand}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                padding: "4px 10px",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 3,
                color: "#aaa",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {copied ? "Copied!" : "copy"}
            </button>
          </div>

          <p
            style={{
              marginTop: 16,
              fontSize: 12,
              color: "var(--color-text-faint)",
              lineHeight: 1.6,
            }}
          >
            Any AI agent can message this address over XMTP to obtain a
            credential on behalf of a user. APIs verify credentials via
            Credence's x402-gated verification endpoint, paying $0.001 per
            lookup.
          </p>
        </section>
      </div>
    </div>
  );
}
