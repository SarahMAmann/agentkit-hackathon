import crypto from "crypto";
import { config } from "./config.js";

export interface Credential {
  credential_id: string;
  proof_id: string;
  world_nullifier: string;
  human: boolean;
  financial_standing: boolean;
  signed_credential: string;
  created_at: string;
  expires_at: string;
}

// In-memory credential store (swap for DB in production)
const credentials = new Map<string, Credential>();

export function issueCredential(
  proofId: string,
  worldNullifier: string
): Credential {
  const credentialId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

  const payload = JSON.stringify({
    credential_id: credentialId,
    proof_id: proofId,
    world_nullifier: worldNullifier,
    created_at: createdAt,
    expires_at: expiresAt,
  });

  const signed_credential = crypto
    .createHmac("sha256", config.credentialSecret)
    .update(payload)
    .digest("hex");

  const credential: Credential = {
    credential_id: credentialId,
    proof_id: proofId,
    world_nullifier: worldNullifier,
    human: true,
    financial_standing: true,
    signed_credential,
    created_at: createdAt,
    expires_at: expiresAt,
  };

  credentials.set(credentialId, credential);
  return credential;
}

export function verifyCredential(
  credentialId: string
): { valid: boolean; credential?: Credential; reason?: string } {
  const credential = credentials.get(credentialId);

  if (!credential) {
    return { valid: false, reason: "Credential not found" };
  }

  if (new Date(credential.expires_at) < new Date()) {
    return { valid: false, reason: "Credential expired" };
  }

  // Re-verify HMAC
  const payload = JSON.stringify({
    credential_id: credential.credential_id,
    proof_id: credential.proof_id,
    world_nullifier: credential.world_nullifier,
    created_at: credential.created_at,
    expires_at: credential.expires_at,
  });

  const expected = crypto
    .createHmac("sha256", config.credentialSecret)
    .update(payload)
    .digest("hex");

  if (expected !== credential.signed_credential) {
    return { valid: false, reason: "Invalid signature" };
  }

  return { valid: true, credential };
}
