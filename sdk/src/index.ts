import type { Request, Response, NextFunction } from "express";

export interface CredenceCredential {
  credential_id: string;
  human: boolean;
  financial_standing: boolean;
  proof_id: string;
  world_nullifier: string;
  expires_at: string;
}

export interface CredenceGateOptions {
  /** Credence API URL (default: https://api.credence.xyz) */
  apiUrl?: string;

  /** Header name to read the credential ID from (default: x-credence-credential) */
  header?: string;

  /** Require the user to be a verified human (default: true) */
  requireHuman?: boolean;

  /** Require the user to have proven financial standing (default: true) */
  requireFinancialStanding?: boolean;

  /** Custom error handler — called instead of the default 403 response */
  onDenied?: (req: Request, res: Response, reason: string) => void;
}

declare global {
  namespace Express {
    interface Request {
      credence?: CredenceCredential;
    }
  }
}

/**
 * Express middleware that gates an endpoint with a Credence credential.
 *
 * Usage:
 * ```typescript
 * import { credenceGate } from 'credence-gate';
 *
 * app.get('/api/premium-data', credenceGate(), (req, res) => {
 *   // req.credence contains the verified credential
 *   res.json({ data: '...', user: req.credence });
 * });
 * ```
 *
 * The middleware:
 * 1. Reads the credential ID from the `X-Credence-Credential` header
 * 2. Calls Credence's `/v1/credentials/:id/verify` endpoint (x402-gated, $0.001 USDC)
 * 3. Attaches the credential to `req.credence` and calls next(), or returns 403
 */
export function credenceGate(options: CredenceGateOptions = {}) {
  const {
    apiUrl = process.env.CREDENCE_API_URL || "https://api.credence.xyz",
    header = "x-credence-credential",
    requireHuman = true,
    requireFinancialStanding = true,
    onDenied,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const credentialId = req.headers[header] as string;

    if (!credentialId) {
      const reason = "Missing credential";
      if (onDenied) return onDenied(req, res, reason);
      return res.status(403).json({
        error: reason,
        hint: `Set the ${header} header to a valid Credence credential ID`,
        docs: "https://github.com/SarahMAmann/agentkit-hackathon",
      });
    }

    try {
      // Call Credence's x402-gated verification endpoint
      // In production, this call costs $0.001 USDC on Base via x402
      const verifyRes = await fetch(
        `${apiUrl}/v1/credentials/${credentialId}/verify`
      );

      if (!verifyRes.ok) {
        const reason = "Credential verification failed";
        if (onDenied) return onDenied(req, res, reason);
        return res.status(403).json({ error: reason });
      }

      const result = await verifyRes.json();

      if (!result.valid) {
        const reason = result.reason || "Invalid credential";
        if (onDenied) return onDenied(req, res, reason);
        return res.status(403).json({ error: reason });
      }

      const credential = result.credential as CredenceCredential;

      if (requireHuman && !credential.human) {
        const reason = "Credential holder is not a verified human";
        if (onDenied) return onDenied(req, res, reason);
        return res.status(403).json({ error: reason });
      }

      if (requireFinancialStanding && !credential.financial_standing) {
        const reason = "Credential holder does not have verified financial standing";
        if (onDenied) return onDenied(req, res, reason);
        return res.status(403).json({ error: reason });
      }

      // Attach credential to request and proceed
      req.credence = credential;
      next();
    } catch (err: any) {
      const reason = `Credence API error: ${err.message}`;
      if (onDenied) return onDenied(req, res, reason);
      return res.status(502).json({ error: reason });
    }
  };
}
