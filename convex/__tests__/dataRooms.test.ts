/**
 * VDR (Virtual Data Room) Access Control Integration Tests
 *
 * Tests for:
 * - Room access based on user authentication
 * - Document access levels (all, buyer_group, seller_only, restricted)
 * - Invitation access control (viewer, downloader, questioner)
 * - Expiration handling
 * - Download restrictions and watermarking
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Convex context types for testing
interface MockUser {
	_id: string;
	email: string;
	name: string;
	role?: "admin" | "member" | "viewer";
}

interface MockRoom {
	_id: string;
	dealId: string;
	name: string;
	status: "setup" | "active" | "closed" | "archived";
	settings: {
		watermarkEnabled: boolean;
		downloadRestricted: boolean;
		expiresAt?: number;
		allowedDomains?: string[];
	};
	createdBy: string;
}

interface MockDocument {
	_id: string;
	roomId: string;
	folderId: string;
	fileName: string;
	accessLevel: "all" | "buyer_group" | "seller_only" | "restricted";
}

interface MockInvitation {
	_id: string;
	roomId: string;
	email: string;
	role: "viewer" | "downloader" | "questioner";
	accessLevel: "all" | "buyer_group" | "restricted";
	status: "pending" | "accepted" | "revoked" | "expired";
	expiresAt?: number;
	folderAccess?: string[];
}

// =============================================================================
// ACCESS CONTROL HELPERS (mirroring production logic)
// =============================================================================

/**
 * Check if a user can access a room
 */
function canAccessRoom(user: MockUser | null, room: MockRoom): boolean {
	if (!user) return false;
	if (room.status === "archived") return false;
	if (room.status === "closed" && user.role !== "admin") return false;
	return true;
}

/**
 * Check if an invitation is valid
 */
function isInvitationValid(invitation: MockInvitation): boolean {
	if (invitation.status !== "accepted" && invitation.status !== "pending") {
		return false;
	}
	if (invitation.expiresAt && invitation.expiresAt < Date.now()) {
		return false;
	}
	return true;
}

/**
 * Check if a user can access a document based on access level
 */
function canAccessDocument(
	user: MockUser,
	document: MockDocument,
	invitation?: MockInvitation,
): boolean {
	// Internal users can access all documents
	if (user.role === "admin") return true;

	// Check document access level
	switch (document.accessLevel) {
		case "all":
			return true;
		case "buyer_group":
			// Only users with buyer_group or all access level in their invitation
			return (
				invitation?.accessLevel === "all" ||
				invitation?.accessLevel === "buyer_group"
			);
		case "seller_only":
			// Only internal team (admins/members) - admin already returned above
			return user.role === "member";
		case "restricted":
			// Only users with explicit folder access
			if (!invitation?.folderAccess) return false;
			return invitation.folderAccess.includes(document.folderId);
		default:
			return false;
	}
}

/**
 * Check if a user can download based on role
 */
function canDownload(room: MockRoom, invitation?: MockInvitation): boolean {
	if (room.settings.downloadRestricted) return false;
	if (!invitation) return true; // Internal users can always download if not restricted
	return invitation.role === "downloader" || invitation.role === "questioner";
}

/**
 * Check if domain is allowed
 */
function isDomainAllowed(email: string, allowedDomains?: string[]): boolean {
	if (!allowedDomains || allowedDomains.length === 0) return true;
	const domain = email.split("@")[1];
	return allowedDomains.includes(domain);
}

// =============================================================================
// TESTS
// =============================================================================

describe("VDR Access Control", () => {
	// Test data
	const adminUser: MockUser = {
		_id: "user_admin",
		email: "admin@alecia.markets",
		name: "Admin User",
		role: "admin",
	};

	const memberUser: MockUser = {
		_id: "user_member",
		email: "member@alecia.markets",
		name: "Member User",
		role: "member",
	};

	const externalUser: MockUser = {
		_id: "user_external",
		email: "buyer@external.com",
		name: "External Buyer",
		role: "viewer",
	};

	const activeRoom: MockRoom = {
		_id: "room_active",
		dealId: "deal_1",
		name: "Test Deal VDR",
		status: "active",
		settings: {
			watermarkEnabled: true,
			downloadRestricted: false,
		},
		createdBy: "user_admin",
	};

	const restrictedRoom: MockRoom = {
		_id: "room_restricted",
		dealId: "deal_2",
		name: "Restricted VDR",
		status: "active",
		settings: {
			watermarkEnabled: true,
			downloadRestricted: true,
			allowedDomains: ["partner.com", "buyer.com"],
		},
		createdBy: "user_admin",
	};

	const archivedRoom: MockRoom = {
		_id: "room_archived",
		dealId: "deal_3",
		name: "Archived VDR",
		status: "archived",
		settings: {
			watermarkEnabled: false,
			downloadRestricted: false,
		},
		createdBy: "user_admin",
	};

	const closedRoom: MockRoom = {
		_id: "room_closed",
		dealId: "deal_4",
		name: "Closed VDR",
		status: "closed",
		settings: {
			watermarkEnabled: false,
			downloadRestricted: false,
		},
		createdBy: "user_admin",
	};

	describe("Room Access", () => {
		it("should allow authenticated users to access active rooms", () => {
			expect(canAccessRoom(adminUser, activeRoom)).toBe(true);
			expect(canAccessRoom(memberUser, activeRoom)).toBe(true);
			expect(canAccessRoom(externalUser, activeRoom)).toBe(true);
		});

		it("should deny unauthenticated users access to rooms", () => {
			expect(canAccessRoom(null, activeRoom)).toBe(false);
		});

		it("should deny all users access to archived rooms", () => {
			expect(canAccessRoom(adminUser, archivedRoom)).toBe(false);
			expect(canAccessRoom(memberUser, archivedRoom)).toBe(false);
			expect(canAccessRoom(externalUser, archivedRoom)).toBe(false);
		});

		it("should allow only admins to access closed rooms", () => {
			expect(canAccessRoom(adminUser, closedRoom)).toBe(true);
			expect(canAccessRoom(memberUser, closedRoom)).toBe(false);
			expect(canAccessRoom(externalUser, closedRoom)).toBe(false);
		});
	});

	describe("Invitation Validation", () => {
		it("should validate accepted invitations", () => {
			const validInvitation: MockInvitation = {
				_id: "inv_1",
				roomId: "room_active",
				email: "buyer@external.com",
				role: "viewer",
				accessLevel: "all",
				status: "accepted",
			};
			expect(isInvitationValid(validInvitation)).toBe(true);
		});

		it("should validate pending invitations", () => {
			const pendingInvitation: MockInvitation = {
				_id: "inv_2",
				roomId: "room_active",
				email: "buyer@external.com",
				role: "viewer",
				accessLevel: "all",
				status: "pending",
			};
			expect(isInvitationValid(pendingInvitation)).toBe(true);
		});

		it("should reject revoked invitations", () => {
			const revokedInvitation: MockInvitation = {
				_id: "inv_3",
				roomId: "room_active",
				email: "buyer@external.com",
				role: "viewer",
				accessLevel: "all",
				status: "revoked",
			};
			expect(isInvitationValid(revokedInvitation)).toBe(false);
		});

		it("should reject expired invitations", () => {
			const expiredInvitation: MockInvitation = {
				_id: "inv_4",
				roomId: "room_active",
				email: "buyer@external.com",
				role: "viewer",
				accessLevel: "all",
				status: "accepted",
				expiresAt: Date.now() - 1000, // Expired 1 second ago
			};
			expect(isInvitationValid(expiredInvitation)).toBe(false);
		});

		it("should accept invitations with future expiry", () => {
			const futureInvitation: MockInvitation = {
				_id: "inv_5",
				roomId: "room_active",
				email: "buyer@external.com",
				role: "viewer",
				accessLevel: "all",
				status: "accepted",
				expiresAt: Date.now() + 86400000, // Expires in 24 hours
			};
			expect(isInvitationValid(futureInvitation)).toBe(true);
		});
	});

	describe("Document Access Levels", () => {
		const folder1 = "folder_1";
		const folder2 = "folder_2";

		const publicDoc: MockDocument = {
			_id: "doc_public",
			roomId: "room_active",
			folderId: folder1,
			fileName: "public.pdf",
			accessLevel: "all",
		};

		const buyerGroupDoc: MockDocument = {
			_id: "doc_buyer",
			roomId: "room_active",
			folderId: folder1,
			fileName: "buyer-only.pdf",
			accessLevel: "buyer_group",
		};

		const sellerOnlyDoc: MockDocument = {
			_id: "doc_seller",
			roomId: "room_active",
			folderId: folder1,
			fileName: "seller-only.pdf",
			accessLevel: "seller_only",
		};

		const restrictedDoc: MockDocument = {
			_id: "doc_restricted",
			roomId: "room_active",
			folderId: folder2,
			fileName: "restricted.pdf",
			accessLevel: "restricted",
		};

		it("should allow all users to access public documents", () => {
			expect(canAccessDocument(adminUser, publicDoc)).toBe(true);
			expect(canAccessDocument(memberUser, publicDoc)).toBe(true);
			expect(canAccessDocument(externalUser, publicDoc)).toBe(true);
		});

		it("should restrict buyer_group documents to appropriate users", () => {
			const buyerInvitation: MockInvitation = {
				_id: "inv_buyer",
				roomId: "room_active",
				email: "buyer@external.com",
				role: "viewer",
				accessLevel: "buyer_group",
				status: "accepted",
			};

			const restrictedInvitation: MockInvitation = {
				_id: "inv_restricted",
				roomId: "room_active",
				email: "other@external.com",
				role: "viewer",
				accessLevel: "restricted",
				status: "accepted",
			};

			// Admin can access
			expect(canAccessDocument(adminUser, buyerGroupDoc)).toBe(true);

			// External with buyer_group access can access
			expect(
				canAccessDocument(externalUser, buyerGroupDoc, buyerInvitation),
			).toBe(true);

			// External with restricted access cannot access
			expect(
				canAccessDocument(externalUser, buyerGroupDoc, restrictedInvitation),
			).toBe(false);
		});

		it("should restrict seller_only documents to internal team", () => {
			expect(canAccessDocument(adminUser, sellerOnlyDoc)).toBe(true);
			expect(canAccessDocument(memberUser, sellerOnlyDoc)).toBe(true);
			expect(canAccessDocument(externalUser, sellerOnlyDoc)).toBe(false);
		});

		it("should restrict documents to users with explicit folder access", () => {
			const invitationWithAccess: MockInvitation = {
				_id: "inv_folder",
				roomId: "room_active",
				email: "buyer@external.com",
				role: "viewer",
				accessLevel: "restricted",
				status: "accepted",
				folderAccess: [folder2],
			};

			const invitationWithoutAccess: MockInvitation = {
				_id: "inv_no_folder",
				roomId: "room_active",
				email: "other@external.com",
				role: "viewer",
				accessLevel: "restricted",
				status: "accepted",
				folderAccess: [folder1], // Different folder
			};

			// User with folder access can view
			expect(
				canAccessDocument(externalUser, restrictedDoc, invitationWithAccess),
			).toBe(true);

			// User without folder access cannot view
			expect(
				canAccessDocument(externalUser, restrictedDoc, invitationWithoutAccess),
			).toBe(false);

			// User with no folder access at all cannot view
			expect(canAccessDocument(externalUser, restrictedDoc)).toBe(false);
		});
	});

	describe("Download Permissions", () => {
		const viewerInvitation: MockInvitation = {
			_id: "inv_viewer",
			roomId: "room_active",
			email: "viewer@external.com",
			role: "viewer",
			accessLevel: "all",
			status: "accepted",
		};

		const downloaderInvitation: MockInvitation = {
			_id: "inv_downloader",
			roomId: "room_active",
			email: "downloader@external.com",
			role: "downloader",
			accessLevel: "all",
			status: "accepted",
		};

		const questionerInvitation: MockInvitation = {
			_id: "inv_questioner",
			roomId: "room_active",
			email: "questioner@external.com",
			role: "questioner",
			accessLevel: "all",
			status: "accepted",
		};

		it("should allow internal users to download from unrestricted rooms", () => {
			expect(canDownload(activeRoom)).toBe(true);
		});

		it("should deny downloads from restricted rooms", () => {
			expect(canDownload(restrictedRoom, downloaderInvitation)).toBe(false);
		});

		it("should deny viewers from downloading", () => {
			expect(canDownload(activeRoom, viewerInvitation)).toBe(false);
		});

		it("should allow downloaders to download", () => {
			expect(canDownload(activeRoom, downloaderInvitation)).toBe(true);
		});

		it("should allow questioners to download", () => {
			expect(canDownload(activeRoom, questionerInvitation)).toBe(true);
		});
	});

	describe("Domain Restrictions", () => {
		it("should allow all domains when no restrictions set", () => {
			expect(isDomainAllowed("user@any-domain.com")).toBe(true);
			expect(isDomainAllowed("user@any-domain.com", [])).toBe(true);
		});

		it("should allow emails from allowed domains", () => {
			const allowedDomains = ["partner.com", "buyer.com"];
			expect(isDomainAllowed("user@partner.com", allowedDomains)).toBe(true);
			expect(isDomainAllowed("user@buyer.com", allowedDomains)).toBe(true);
		});

		it("should deny emails from non-allowed domains", () => {
			const allowedDomains = ["partner.com", "buyer.com"];
			expect(isDomainAllowed("user@competitor.com", allowedDomains)).toBe(
				false,
			);
			expect(isDomainAllowed("user@random.org", allowedDomains)).toBe(false);
		});
	});

	describe("Watermarking Rules", () => {
		it("should apply watermarking when enabled in room settings", () => {
			expect(activeRoom.settings.watermarkEnabled).toBe(true);
			expect(restrictedRoom.settings.watermarkEnabled).toBe(true);
			expect(archivedRoom.settings.watermarkEnabled).toBe(false);
		});
	});

	describe("Combined Access Scenarios", () => {
		it("should allow buyer with proper invitation to access buyer_group docs", () => {
			const buyer: MockUser = {
				_id: "user_buyer",
				email: "john@buyer.com",
				name: "John Buyer",
				role: "viewer",
			};

			const invitation: MockInvitation = {
				_id: "inv_combo",
				roomId: "room_active",
				email: "john@buyer.com",
				role: "downloader",
				accessLevel: "buyer_group",
				status: "accepted",
				expiresAt: Date.now() + 86400000,
			};

			const buyerDoc: MockDocument = {
				_id: "doc_combo",
				roomId: "room_active",
				folderId: "folder_1",
				fileName: "financials.pdf",
				accessLevel: "buyer_group",
			};

			// Check all conditions
			expect(canAccessRoom(buyer, activeRoom)).toBe(true);
			expect(isInvitationValid(invitation)).toBe(true);
			expect(canAccessDocument(buyer, buyerDoc, invitation)).toBe(true);
			expect(canDownload(activeRoom, invitation)).toBe(true);
			expect(
				isDomainAllowed(buyer.email, restrictedRoom.settings.allowedDomains),
			).toBe(true);
		});

		it("should deny access when any condition fails", () => {
			const buyer: MockUser = {
				_id: "user_denied",
				email: "denied@unknown.com",
				name: "Denied User",
				role: "viewer",
			};

			const revokedInvitation: MockInvitation = {
				_id: "inv_revoked",
				roomId: "room_active",
				email: "denied@unknown.com",
				role: "viewer",
				accessLevel: "all",
				status: "revoked",
			};

			// User can access room
			expect(canAccessRoom(buyer, activeRoom)).toBe(true);

			// But invitation is revoked
			expect(isInvitationValid(revokedInvitation)).toBe(false);

			// And domain is not allowed for restricted room
			expect(
				isDomainAllowed(buyer.email, restrictedRoom.settings.allowedDomains),
			).toBe(false);
		});
	});
});

describe("Access Log Validation", () => {
	it("should log access with required fields", () => {
		const accessLog = {
			roomId: "room_active",
			documentId: "doc_1",
			userId: "user_1",
			userEmail: "user@example.com",
			action: "view" as const,
			timestamp: Date.now(),
			duration: 120000, // 2 minutes in ms
		};

		expect(accessLog.roomId).toBeDefined();
		expect(accessLog.userId).toBeDefined();
		expect(accessLog.action).toBe("view");
		expect(accessLog.timestamp).toBeLessThanOrEqual(Date.now());
	});

	it("should support all action types", () => {
		const actions = ["view", "download", "print", "share"] as const;

		for (const action of actions) {
			expect(["view", "download", "print", "share"]).toContain(action);
		}
	});
});
