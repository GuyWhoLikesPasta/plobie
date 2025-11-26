/**
 * QR Claim Token Utilities
 * 
 * Generates and verifies JWT tokens for pot claiming.
 * Tokens have a 10-minute TTL and include pot_code.
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const TOKEN_TTL = 10 * 60; // 10 minutes in seconds

export interface ClaimTokenPayload {
  pot_code: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a claim token for a pot code
 * @param potCode - The pot code (e.g., "TEST001")
 * @returns JWT token string
 */
export function generateClaimToken(potCode: string): string {
  const payload: ClaimTokenPayload = {
    pot_code: potCode,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

/**
 * Verify and decode a claim token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid/expired
 */
export function verifyClaimToken(token: string): ClaimTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ClaimTokenPayload;
    return decoded;
  } catch (error) {
    // Token invalid, expired, or malformed
    return null;
  }
}

/**
 * Decode token without verification (for debugging)
 * @param token - JWT token string
 * @returns Decoded payload or null
 */
export function decodeClaimToken(token: string): ClaimTokenPayload | null {
  try {
    const decoded = jwt.decode(token) as ClaimTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

