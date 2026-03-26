const CREDENCE_API_URL = process.env.MIRROR_API_URL || "http://localhost:3002";

export interface VerificationResult {
  success: boolean;
  credential_id: string;
  human: boolean;
  financial_standing: boolean;
  signed_credential: string;
  expires_at: string;
}

export async function verifyAndIssueCredential(
  proofId: string,
  worldNullifier: string
): Promise<VerificationResult> {
  // Credential issuance is free — no x402 payment needed
  const res = await fetch(`${CREDENCE_API_URL}/v1/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      proof_id: proofId,
      world_id_nullifier: worldNullifier,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Verification failed (${res.status})`);
  }

  return res.json();
}
