import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3002"),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Mirror API
  mirrorApiUrl: process.env.MIRROR_API_URL || "http://localhost:3001",

  // x402 Payment
  x402SellerWallet: process.env.MIRROR_WALLET_ADDRESS || "",
  x402FacilitatorUrl:
    process.env.X402_FACILITATOR_URL || "https://www.x402.org/facilitator",
  requirePayment: process.env.REQUIRE_PAYMENT === "true",

  // Credential signing
  credentialSecret: process.env.CREDENTIAL_SECRET || "dev-secret",

  // Environment
  isProduction: process.env.NODE_ENV === "production",
};
