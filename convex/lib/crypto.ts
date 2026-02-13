/**
 * Encryption Utility for Sensitive Data
 *
 * Provides AES-256-GCM encryption for sensitive data like OAuth tokens.
 * Uses a server-side encryption key from environment variables.
 *
 * Security considerations:
 * - Uses AES-256-GCM (authenticated encryption)
 * - Generates unique IV for each encryption
 * - Stores IV alongside ciphertext for decryption
 * - Key must be 32 bytes (256 bits) for AES-256
 * - Per-user keys derived using HKDF for isolation
 */

// Note: This module uses Web Crypto API available in Convex runtime

// =============================================================================
// KEY DERIVATION (Per-User Keys)
// =============================================================================

/**
 * Derive a user-specific encryption key from the master key using HKDF
 *
 * This ensures each user has a unique encryption key derived from:
 * - The master TOKEN_ENCRYPTION_KEY
 * - A fixed salt for this application
 * - The user's unique identifier (userId or email)
 *
 * Benefits:
 * - Compromising one user's derived key doesn't expose others
 * - No need to store per-user keys in the database
 * - Deterministic: same input always produces same derived key
 *
 * @param masterKey - The master encryption key (32 bytes as hex)
 * @param userIdentifier - Unique user identifier (userId, clerkId, or email)
 * @returns Derived 32-byte key as hex string
 */
export async function deriveUserKey(
	masterKey: string,
	userIdentifier: string,
): Promise<string> {
	const encoder = new TextEncoder();

	// Import master key for HKDF
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		hexToBytes(masterKey) as BufferSource,
		"HKDF",
		false,
		["deriveBits"],
	);

	// Derive 256 bits (32 bytes) using HKDF
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "HKDF",
			hash: "SHA-256",
			salt: encoder.encode("alecia-oauth-token-encryption-v1"), // Fixed application salt
			info: encoder.encode(userIdentifier), // User-specific context
		},
		keyMaterial,
		256, // 32 bytes = 256 bits
	);

	return bytesToHex(new Uint8Array(derivedBits));
}

/**
 * Get the encryption key for a specific user
 *
 * @param userIdentifier - Unique user identifier
 * @returns Derived encryption key or null if master key not configured
 */
export async function getUserEncryptionKey(
	userIdentifier: string,
): Promise<string | null> {
	const masterKey = process.env.TOKEN_ENCRYPTION_KEY;
	if (!masterKey) {
		return null;
	}
	return deriveUserKey(masterKey, userIdentifier);
}

/**
 * Encrypt a string value using AES-256-GCM
 *
 * @param plaintext - The string to encrypt
 * @param encryptionKey - 32-byte key as hex string (64 chars)
 * @returns Base64 encoded string containing IV + ciphertext
 */
export async function encrypt(
	plaintext: string,
	encryptionKey: string,
): Promise<string> {
	// Convert hex key to bytes
	const keyBytes = hexToBytes(encryptionKey);
	if (keyBytes.length !== 32) {
		throw new Error("Encryption key must be 32 bytes (64 hex characters)");
	}

	// Import key for AES-GCM
	const key = await crypto.subtle.importKey(
		"raw",
		keyBytes as BufferSource,
		{ name: "AES-GCM" },
		false,
		["encrypt"],
	);

	// Generate random 12-byte IV (recommended for GCM)
	const iv = crypto.getRandomValues(new Uint8Array(12));

	// Encode plaintext to bytes
	const encoder = new TextEncoder();
	const plaintextBytes = encoder.encode(plaintext);

	// Encrypt
	const ciphertext = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		plaintextBytes,
	);

	// Combine IV + ciphertext and encode as base64
	const combined = new Uint8Array(iv.length + ciphertext.byteLength);
	combined.set(iv, 0);
	combined.set(new Uint8Array(ciphertext), iv.length);

	return bytesToBase64(combined);
}

/**
 * Decrypt a string value encrypted with AES-256-GCM
 *
 * @param encrypted - Base64 encoded string containing IV + ciphertext
 * @param encryptionKey - 32-byte key as hex string (64 chars)
 * @returns The original plaintext string
 */
export async function decrypt(
	encrypted: string,
	encryptionKey: string,
): Promise<string> {
	// Convert hex key to bytes
	const keyBytes = hexToBytes(encryptionKey);
	if (keyBytes.length !== 32) {
		throw new Error("Encryption key must be 32 bytes (64 hex characters)");
	}

	// Import key for AES-GCM
	const key = await crypto.subtle.importKey(
		"raw",
		keyBytes as BufferSource,
		{ name: "AES-GCM" },
		false,
		["decrypt"],
	);

	// Decode from base64
	const combined = base64ToBytes(encrypted);

	// Extract IV (first 12 bytes) and ciphertext (rest)
	const iv = combined.slice(0, 12);
	const ciphertext = combined.slice(12);

	// Decrypt
	const plaintextBytes = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv },
		key,
		ciphertext,
	);

	// Decode to string
	const decoder = new TextDecoder();
	return decoder.decode(plaintextBytes);
}

/**
 * Generate a new 32-byte encryption key
 *
 * @returns Hex-encoded 32-byte key
 */
export function generateEncryptionKey(): string {
	const keyBytes = crypto.getRandomValues(new Uint8Array(32));
	return bytesToHex(keyBytes);
}

/**
 * Hash a value (for non-reversible storage like identifiers)
 *
 * @param value - Value to hash
 * @returns SHA-256 hash as hex string
 */
export async function hash(value: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(value);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	return bytesToHex(new Uint8Array(hashBuffer));
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function hexToBytes(hex: string): Uint8Array {
	if (hex.length % 2 !== 0) {
		throw new Error("Hex string must have even length");
	}
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function bytesToBase64(bytes: Uint8Array): string {
	// Use Buffer in Node.js environment
	if (typeof Buffer !== "undefined") {
		return Buffer.from(bytes).toString("base64");
	}
	// Fallback for browser/edge
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
	// Use Buffer in Node.js environment
	if (typeof Buffer !== "undefined") {
		return new Uint8Array(Buffer.from(base64, "base64"));
	}
	// Fallback for browser/edge
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

// =============================================================================
// TOKEN ENCRYPTION HELPERS (Per-User)
// =============================================================================

/**
 * Encrypt an OAuth token for storage using a user-specific key
 *
 * @param token - The token to encrypt
 * @param userIdentifier - User's unique identifier (userId, clerkId, or email)
 * @returns Encrypted token or original if encryption not configured
 */
export async function encryptToken(
	token: string,
	userIdentifier?: string,
): Promise<string> {
	const masterKey = process.env.TOKEN_ENCRYPTION_KEY;
	if (!masterKey) {
		console.warn(
			"[Crypto] TOKEN_ENCRYPTION_KEY not set - storing tokens unencrypted",
		);
		return token;
	}

	// Use user-specific derived key if identifier provided, otherwise use master key
	const encryptionKey = userIdentifier
		? await deriveUserKey(masterKey, userIdentifier)
		: masterKey;

	return encrypt(token, encryptionKey);
}

/**
 * Decrypt an OAuth token from storage using a user-specific key
 *
 * @param encryptedToken - The encrypted token
 * @param userIdentifier - User's unique identifier (must match what was used for encryption)
 * @returns Decrypted token or original if decryption fails
 */
export async function decryptToken(
	encryptedToken: string,
	userIdentifier?: string,
): Promise<string> {
	const masterKey = process.env.TOKEN_ENCRYPTION_KEY;
	if (!masterKey) {
		// Assume token is unencrypted if no key is set
		return encryptedToken;
	}

	// Use user-specific derived key if identifier provided, otherwise use master key
	const encryptionKey = userIdentifier
		? await deriveUserKey(masterKey, userIdentifier)
		: masterKey;

	try {
		return await decrypt(encryptedToken, encryptionKey);
	} catch (error) {
		// If decryption fails, try with master key (migration from global key)
		if (userIdentifier) {
			try {
				return await decrypt(encryptedToken, masterKey);
			} catch {
				// Still failed, token might be unencrypted
			}
		}
		console.warn(
			"[Crypto] Decryption failed - token may be unencrypted:",
			error,
		);
		return encryptedToken;
	}
}

/**
 * Check if a token appears to be encrypted
 * Encrypted tokens are base64 and contain IV + ciphertext
 */
export function isTokenEncrypted(token: string): boolean {
	// Encrypted tokens are base64 and at least 28 chars (12 byte IV + 16 byte auth tag minimum)
	if (token.length < 28) return false;

	// Check if it's valid base64
	try {
		const decoded = base64ToBytes(token);
		// Should be at least IV (12) + auth tag (16) = 28 bytes
		return decoded.length >= 28;
	} catch {
		return false;
	}
}
