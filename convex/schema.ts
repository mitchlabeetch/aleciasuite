import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /**
   * Table des utilisateurs et gestion des rôles (RBAC).
   * Contient les informations d'identité synchronisées avec Clerk.
   */
  // 1. Identity & RBAC
  // Mise à jour pour la synchronisation d'identité utilisateur (Batch 7)
  users: defineTable({
    tokenIdentifier: v.string(), // Identifiant Clerk (ancien nom de champ, conservé pour compatibilité)
    clerkId: v.optional(v.string()), // Identifiant Clerk (nouvel alias pour cohérence)
    role: v.union(
      v.literal("sudo"), // Accès total au système (super-administrateur)
      v.literal("partner"), // Associé avec permissions élevées
      v.literal("advisor"), // Conseiller avec permissions modérées
      v.literal("user"), // Rôle par défaut pour les nouveaux utilisateurs
    ),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()), // Alias for Clerk compatibility
    signature: v.optional(v.string()), // Signature pour la signature de documents
    // Suivi de synchronisation (Batch 7)
    lastSeen: v.optional(v.number()), // Horodatage de la dernière activité
    createdAt: v.optional(v.number()),
    // Digest preferences
    digestEnabled: v.optional(v.boolean()), // Activation du digest email
    digestFrequency: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("none")),
    ), // Fréquence d'envoi : quotidien, hebdomadaire ou aucun
    lastDigestSent: v.optional(v.number()), // Horodatage du dernier digest envoyé
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]), // Pour les requêtes par rôle

  /**
   * Table des entreprises (CRM intelligent).
   * Intégration avec Pappers et préparation à la migration OAuth.
   */
  // 2. Smart CRM (Pappers & Migration Ready)
  // Mise à jour pour la synchronisation OAuth (Batch 7)
  companies: defineTable({
    // Basic
    name: v.string(),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    logoUrl: v.optional(v.string()),

    // Legal (France)
    siren: v.optional(v.string()), // Numéro SIREN français (indexé pour les recherches)
    nafCode: v.optional(v.string()), // Code NAF (nomenclature d'activité française)
    vatNumber: v.optional(v.string()), // Numéro de TVA intracommunautaire
    address: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        zip: v.string(),
        country: v.string(),
      }),
    ),

    // Financials (JSON Object for raw data)
    financials: v.optional(
      v.object({
        revenue: v.optional(v.number()),
        ebitda: v.optional(v.number()),
        netDebt: v.optional(v.number()),
        valuationAsk: v.optional(v.number()),
        year: v.optional(v.number()),
        currency: v.optional(v.string()),
      }),
    ),

    // Source et synchronisation externe (Batch 4 & 7)
    pappersId: v.optional(v.string()), // Identifiant Pappers pour la synchronisation
    pipedriveId: v.optional(v.string()), // Identifiant organisation Pipedrive
    externalId: v.optional(v.string()), // Identifiant générique pour synchronisation externe
    source: v.optional(v.string()), // Source des données : "pipedrive", "pappers", "manual"
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_siren", ["siren"])
    .index("by_pipedriveId", ["pipedriveId"])
    .index("by_externalId", ["externalId"]) // Pour la synchronisation OAuth
    .index("by_name", ["name"]), // Pour les recherches

  /**
   * Table des contacts关联 aux entreprises.
   * Synchronisation avec Microsoft et Pipedrive.
   */
  // Mise à jour pour la synchronisation OAuth (Batch 7)
  contacts: defineTable({
    companyId: v.optional(v.id("companies")), // Made optional for imported contacts
    fullName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    // Identifiants de synchronisation externe (Batch 4 & 7)
    externalId: v.optional(v.string()), // Identifiant contact Microsoft/Pipedrive
    source: v.optional(v.string()), // Source : "microsoft", "pipedrive", "manual"
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_companyId", ["companyId"])
    .index("by_email", ["email"]) // NEW: For dedup on sync
    .index("by_externalId", ["externalId"]), // NEW: For OAuth sync

  /**
   * Table des deals (fusions et acquisitions).
   * Schéma unifié combinant alepanel/deals + colab_deals pour une utilisation inter-applications.
   * Compatible avec Pipedrive (Panel) et visualisation de flux (Colab).
   */
  // 3. Deal Flow & Intelligence (The Engine)
  // Schéma unifié : fusion de alepanel/deals + colab_deals pour une utilisation inter-applications
  // - Compatible synchronisation Pipedrive (Panel)
  // - Compatible visualisation de flux (Colab)
  // - Source de vérité unique pour tous les deals M&A
  deals: defineTable({
    // Core identification
    title: v.string(), // Deal name (was "company" in Colab)
    description: v.optional(v.string()), // Merged from Colab

    // Étapes du pipeline (union stricte pour sécurité du type, compatible Pipedrive)
    stage: v.union(
      // Étapes M&A Alecia
      v.literal("sourcing"), // Identification et sourcing de cibles
      v.literal("qualification"), // Qualification initiale du deal
      v.literal("initial_meeting"), // Première réunion avec les parties
      v.literal("analysis"), // Analyse approfondie
      v.literal("valuation"), // Évaluation et valorisation
      v.literal("due_diligence"), // Due diligence (audit)
      v.literal("negotiation"), // Négociation des termes
      v.literal("closing"), // Clôture en cours
      v.literal("closed_won"), // Deal gagné
      v.literal("closed_lost"), // Deal perdu
      // Étapes legacy pour compatibilité
      v.literal("Lead"),
      v.literal("NDA Signed"),
      v.literal("Offer Received"),
      v.literal("Due Diligence"),
      v.literal("Closing"),
      v.literal("completed"),
    ),

    // Données financières (Panel + Colab fusionnées)
    amount: v.optional(v.number()), // Valeur du deal en centimes/unité minimale
    currency: v.optional(v.string()), // Devise : EUR, USD, etc.
    probability: v.optional(v.number()), // Probabilité de succès (0-100)

    // Ownership & assignment
    ownerId: v.optional(v.id("users")), // Deal owner (Panel users table)
    leadName: v.optional(v.string()), // Lead contact name (from Colab)
    companyId: v.optional(v.id("companies")), // Linked company

    // Priority & categorization
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    tags: v.optional(v.array(v.string())), // From Colab

    // Dates
    expectedCloseDate: v.optional(v.number()), // Unified from dueDate + expectedCloseDate
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),

    // External sync (Panel - Pipedrive/Microsoft)
    pipedriveId: v.optional(v.number()),
    externalId: v.optional(v.string()),
    source: v.optional(v.string()), // "pipedrive", "microsoft", "manual", "colab"

    // Fonctionnalités de collaboration (issues de Colab)
    notes: v.optional(v.string()), // Notes internes
    isArchived: v.optional(v.boolean()), // Soft delete (archivage)
    nodePosition: v.optional(
      v.object({
        // Position pour la visualisation du flux
        x: v.number(), // Coordonnée X
        y: v.number(), // Coordonnée Y
      }),
    ),
    customProperties: v.optional(
      v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean(), v.null()),
      ),
    ), // Propriétés personnalisées flexibles
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_companyId", ["companyId"])
    .index("by_pipedriveId", ["pipedriveId"])
    .index("by_stage", ["stage"])
    .index("by_externalId", ["externalId"])
    .index("by_priority", ["priority"])
    .index("by_createdAt", ["createdAt"])
    .index("by_updatedAt", ["updatedAt"])
    .index("by_expectedCloseDate", ["expectedCloseDate"])
    .index("by_isArchived", ["isArchived"]) // Pour filtrer les deals actifs
    .index("by_source", ["source"]), // Pour les requêtes de synchronisation

  // PIPELINE ANALYTICS - Stage History Tracking (Phase 2.1)
  deal_stage_history: defineTable({
    dealId: v.id("deals"),
    fromStage: v.string(),
    toStage: v.string(),
    changedBy: v.id("users"),
    changedAt: v.number(),
    // Snapshot of deal state at transition
    dealValue: v.optional(v.number()),
    probability: v.optional(v.number()),
    notes: v.optional(v.string()),
    // Duration in previous stage (calculated)
    durationInPreviousStage: v.optional(v.number()), // milliseconds
  })
    .index("by_deal", ["dealId"])
    .index("by_deal_date", ["dealId", "changedAt"])
    .index("by_date", ["changedAt"])
    .index("by_from_stage", ["fromStage"])
    .index("by_to_stage", ["toStage"]),

  // APPROVAL WORKFLOWS (Phase 2.2)
  // Generic approval request system for documents, teasers, LOIs, emails
  approval_requests: defineTable({
    // What needs approval
    entityType: v.union(
      v.literal("document"),
      v.literal("teaser"),
      v.literal("loi"),
      v.literal("email"),
      v.literal("data_room"),
      v.literal("deal_stage"), // For stage transitions requiring approval
    ),
    entityId: v.string(), // ID of the entity (polymorphic)
    dealId: v.optional(v.id("deals")), // Associated deal if applicable

    // Request metadata
    title: v.string(), // Human-readable title for the request
    description: v.optional(v.string()), // Additional context

    // Requester
    requesterId: v.id("users"),

    // Approval configuration
    requiredApprovals: v.number(), // Number of approvals needed (e.g., 1 for single, 2 for dual)
    approvalType: v.union(
      v.literal("any"), // Any N approvers can approve
      v.literal("all"), // All designated approvers must approve
      v.literal("sequential"), // Approvers must approve in order
    ),
    assignedReviewers: v.array(v.id("users")), // Users who can approve
    currentSequenceIndex: v.optional(v.number()), // For sequential approvals

    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("in_review"), // At least one reviewer has seen it
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled"),
      v.literal("expired"),
    ),

    // Priority and timing
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent"),
    ),
    dueDate: v.optional(v.number()),
    expiresAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),

    // Result tracking
    finalDecision: v.optional(
      v.union(v.literal("approved"), v.literal("rejected")),
    ),
    finalDecisionBy: v.optional(v.id("users")),

    // Snapshot of entity state at request time (for audit)
    entitySnapshot: v.optional(v.string()), // JSON stringified snapshot
  })
    .index("by_status", ["status"])
    .index("by_requester", ["requesterId"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_deal", ["dealId"])
    .index("by_created", ["createdAt"])
    .index("by_due_date", ["dueDate"]),

  // Individual approval reviews/votes
  approval_reviews: defineTable({
    requestId: v.id("approval_requests"),
    reviewerId: v.id("users"),

    // Decision
    decision: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("request_changes"), // Ask for modifications before approving
    ),

    // Feedback
    comment: v.optional(v.string()),

    // For sequential approvals
    sequenceIndex: v.optional(v.number()),

    // Timestamps
    reviewedAt: v.number(),
  })
    .index("by_request", ["requestId"])
    .index("by_reviewer", ["reviewerId"])
    .index("by_request_reviewer", ["requestId", "reviewerId"]),

  // Approval workflow templates (reusable configurations)
  approval_templates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),

    // Which entity types this template applies to
    entityTypes: v.array(
      v.union(
        v.literal("document"),
        v.literal("teaser"),
        v.literal("loi"),
        v.literal("email"),
        v.literal("data_room"),
        v.literal("deal_stage"),
      ),
    ),

    // Default configuration
    requiredApprovals: v.number(),
    approvalType: v.union(
      v.literal("any"),
      v.literal("all"),
      v.literal("sequential"),
    ),
    defaultReviewerRoles: v.array(v.string()), // e.g., ["partner", "sudo"]
    defaultPriority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent"),
    ),
    defaultDueDays: v.optional(v.number()), // Days until due
    autoExpireDays: v.optional(v.number()), // Days until auto-expire

    // Flags
    isDefault: v.boolean(), // Use as default for entity type
    isActive: v.boolean(),

    // Metadata
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_entity_type", ["isActive"])
    .index("by_name", ["name"]),

  embeddings: defineTable({
    targetId: v.string(), // ID of the deal or buyer/contact
    targetType: v.union(v.literal("deal"), v.literal("buyer")),
    vector: v.array(v.float64()), // Vector embedding
  }).vectorIndex("by_vector", {
    vectorField: "vector",
    dimensions: 1536, // Standard OpenAI dimensions, adjust if needed
    filterFields: ["targetType"],
  }),

  buyer_criteria: defineTable({
    contactId: v.id("contacts"),
    // Investment size range
    minValuation: v.optional(v.number()),
    maxValuation: v.optional(v.number()),
    // Revenue range for targets
    minRevenue: v.optional(v.number()),
    maxRevenue: v.optional(v.number()),
    // EBITDA range for targets
    minEbitda: v.optional(v.number()),
    maxEbitda: v.optional(v.number()),
    // Target sectors (industries)
    sectors: v.array(v.string()),
    // Geographic preferences
    geographies: v.optional(v.array(v.string())),
    // Additional notes
    notes: v.optional(v.string()),
    // Timestamps
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_contactId", ["contactId"]),

  // 4. CMS & Governance ("Edit Everything")
  global_settings: defineTable({
    theme: v.object({
      primaryColor: v.string(),
      radius: v.number(),
      font: v.string(),
    }),
    governance: v.object({
      quorumPercentage: v.number(),
    }),
  }), // Singleton pattern usually implies checking for a single doc

  site_pages: defineTable({
    slug: v.string(),
    title: v.string(), // Added title for easier management
    content: v.string(), // Changed to string for Tiptap HTML/JSON stringified storage for easier diffing
    isPublished: v.boolean(),
    seo: v.optional(
      v.object({
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        keywords: v.optional(v.array(v.string())),
      }),
    ),
  }).index("by_slug", ["slug"]),

  proposals: defineTable({
    targetPageId: v.id("site_pages"),
    title: v.string(), // Commit message
    diffSnapshot: v.string(), // Stringified diff or new content
    aiSummary: v.optional(v.string()), // AI generated summary
    authorId: v.id("users"),
    votesFor: v.array(v.id("users")),
    votesAgainst: v.array(v.id("users")), // Added votesAgainst
    status: v.union(
      v.literal("voting"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("merged"),
    ),
  })
    .index("by_targetPageId", ["targetPageId"])
    .index("by_status", ["status"]),

  // 5. Tools & Assets
  whiteboards: defineTable({
    roomId: v.string(),
    snapshot: v.string(), // Stringified Tldraw store
  }).index("by_roomId", ["roomId"]),

  voice_notes: defineTable({
    audioFileId: v.string(), // Storage ID
    transcription: v.optional(v.string()),
    summary: v.optional(v.string()),
  }),

  valuation_models: defineTable({
    name: v.string(),
    formula: v.string(), // string for mathjs
    variables: v.array(v.string()),
  }),

  // Comments for entities (deals, companies, contacts)
  comments: defineTable({
    entityType: v.union(
      v.literal("deal"),
      v.literal("company"),
      v.literal("contact"),
    ),
    entityId: v.string(),
    content: v.string(),
    authorId: v.id("users"),
    mentions: v.optional(v.array(v.id("users"))),
    isEdited: v.optional(v.boolean()),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_authorId", ["authorId"]),

  // Notifications system
  notifications: defineTable({
    recipientId: v.id("users"),
    triggerId: v.optional(v.id("users")),
    type: v.string(), // e.g. "mention"
    entityType: v.string(), // e.g. "comment", "deal"
    entityId: v.string(), // ID of the related object
    isRead: v.boolean(),
    payload: v.optional(v.any()), // Extra data
  })
    .index("by_recipientId", ["recipientId"])
    .index("by_recipient_read", ["recipientId", "isRead"]),

  // Real-time presence tracking
  presence: defineTable({
    userId: v.id("users"),
    currentPage: v.string(),
    lastSeen: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_lastSeen", ["lastSeen"]),

  // 6. Custom Pipeline Configuration
  kanban_columns: defineTable({
    boardId: v.optional(v.string()), // null = default board
    name: v.string(),
    color: v.optional(v.string()),
    order: v.number(),
    isDefault: v.optional(v.boolean()),
  }).index("by_boardId", ["boardId"]),

  // 7. Activity & Events Timeline
  project_events: defineTable({
    dealId: v.optional(v.id("deals")),
    companyId: v.optional(v.id("companies")),
    contactId: v.optional(v.id("contacts")),
    eventType: v.union(
      v.literal("status_change"),
      v.literal("note_added"),
      v.literal("document_uploaded"),
      v.literal("meeting_scheduled"),
      v.literal("email_sent"),
      v.literal("call_logged"),
    ),
    title: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    metadata: v.optional(v.any()), // Flexible JSON for event-specific data
  })
    .index("by_dealId", ["dealId"])
    .index("by_companyId", ["companyId"])
    .index("by_userId", ["userId"]),

  // ============================================
  // PHASE 2: Collaboration Features
  // ============================================

  // 8. Forum / Internal Discussions
  forum_threads: defineTable({
    title: v.string(),
    category: v.optional(v.string()), // e.g., "General", "Deal-Specific", "Announcements"
    dealId: v.optional(v.id("deals")), // Link to specific deal if applicable
    authorId: v.id("users"),
    isPinned: v.optional(v.boolean()),
    isLocked: v.optional(v.boolean()),
  })
    .index("by_authorId", ["authorId"])
    .index("by_dealId", ["dealId"])
    .index("by_category", ["category"]),

  forum_posts: defineTable({
    threadId: v.id("forum_threads"),
    content: v.string(), // Tiptap HTML or plain text
    authorId: v.id("users"),
    parentPostId: v.optional(v.id("forum_posts")), // For nested replies
    isEdited: v.optional(v.boolean()),
  })
    .index("by_threadId", ["threadId"])
    .index("by_authorId", ["authorId"]),

  // 9. Blog / Content Publishing
  blog_posts: defineTable({
    title: v.string(),
    slug: v.string(),
    content: v.string(), // Tiptap JSON/HTML
    excerpt: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    coverImage: v.optional(v.string()), // For Neon migration compatibility
    authorId: v.optional(v.id("users")), // Optional for imported posts
    category: v.optional(v.string()), // From Neon
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),
    publishedAt: v.optional(v.number()),
    seo: v.optional(
      v.object({
        metaTitle: v.optional(v.string()),
        metaDescription: v.optional(v.string()),
        keywords: v.optional(v.array(v.string())),
      }),
    ),
    seoTitle: v.optional(v.string()), // Direct fields from Neon
    seoDescription: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_slug", ["slug"])
    .index("by_authorId", ["authorId"])
    .index("by_status", ["status"]),

  // 10. Document Signing Workflow
  sign_requests: defineTable({
    title: v.string(),
    documentUrl: v.optional(v.string()), // File storage reference
    documentType: v.union(
      v.literal("nda"),
      v.literal("loi"),
      v.literal("mandate"),
      v.literal("contract"),
      v.literal("other"),
    ),
    dealId: v.optional(v.id("deals")),
    requesterId: v.id("users"),
    signerId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("signed"),
      v.literal("rejected"),
      v.literal("expired"),
    ),
    signedAt: v.optional(v.number()),
    signatureData: v.optional(v.string()), // Base64 signature image
    expiresAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_dealId", ["dealId"])
    .index("by_requesterId", ["requesterId"])
    .index("by_signerId", ["signerId"])
    .index("by_status", ["status"]),

  // 11. Research Tasks
  research_tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    dealId: v.optional(v.id("deals")),
    companyId: v.optional(v.id("companies")),
    assigneeId: v.optional(v.id("users")),
    creatorId: v.id("users"),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
    ),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_assigneeId", ["assigneeId"])
    .index("by_dealId", ["dealId"])
    .index("by_status", ["status"]),

  // ============================================
  // MARKETING WEBSITE CONTENT (Migrated from Neon)
  // ============================================

  // Transaction Showcase (M&A Track Record)
  transactions: defineTable({
    slug: v.string(),
    clientName: v.string(),
    clientLogo: v.optional(v.string()),
    acquirerName: v.optional(v.string()),
    acquirerLogo: v.optional(v.string()),
    sector: v.string(),
    region: v.optional(v.string()),
    year: v.number(),
    mandateType: v.string(), // "Sell-side", "Buy-side", etc.
    description: v.optional(v.string()),
    isConfidential: v.boolean(), // Legacy: kept for backward compatibility
    isClientConfidential: v.optional(v.boolean()), // Client-specific confidentiality
    isAcquirerConfidential: v.optional(v.boolean()), // Acquirer-specific confidentiality
    isPriorExperience: v.boolean(),
    context: v.optional(v.string()),
    intervention: v.optional(v.string()),
    result: v.optional(v.string()),
    testimonialText: v.optional(v.string()),
    testimonialAuthor: v.optional(v.string()),
    roleType: v.optional(v.string()),
    dealSize: v.optional(v.string()),
    dealId: v.optional(v.id("deals")), // Link to source deal for cross-referencing
    keyMetrics: v.optional(v.any()), // JSON object
    // V3 Fields
    isCaseStudy: v.optional(v.boolean()),
    displayOrder: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_sector", ["sector"])
    .index("by_year", ["year"])
    .index("by_deal", ["dealId"])
    .index("by_isCaseStudy", ["isCaseStudy"]), // Added index

  // Team Members (About Page)
  team_members: defineTable({
    slug: v.string(),
    name: v.string(),
    role: v.string(),
    photo: v.optional(v.string()), // Kept for backward compatibility
    photoUrl: v.optional(v.string()), // New field name
    bioFr: v.optional(v.string()),
    bioEn: v.optional(v.string()),
    passion: v.optional(v.string()),
    quote: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    email: v.optional(v.string()),
    sectorsExpertise: v.optional(v.array(v.string())),
    transactionSlugs: v.optional(v.array(v.string())),
    displayOrder: v.number(),
    isActive: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_displayOrder", ["displayOrder"]),

  // Job Offers (Careers Page)
  job_offers: defineTable({
    slug: v.string(),
    title: v.string(),
    type: v.string(), // "CDI", "CDD", "Stage", etc.
    location: v.string(),
    description: v.string(),
    requirements: v.optional(v.union(v.string(), v.array(v.string()))),
    contactEmail: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    isPublished: v.boolean(),
    displayOrder: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_isPublished", ["isPublished"]),

  // Forum Categories
  forum_categories: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.number(),
    isPrivate: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

  // Global App Configuration
  global_config: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // ============================================
  // OAUTH TOKEN STORAGE (Phase 0 Foundation)
  // ============================================

  // Microsoft 365 OAuth tokens
  microsoft_tokens: defineTable({
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(), // Timestamp in milliseconds
    userId: v.optional(v.string()), // Microsoft user ID if available
    scope: v.optional(v.string()), // Granted scopes
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Pipedrive OAuth tokens
  pipedrive_tokens: defineTable({
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(), // Timestamp in milliseconds
    apiDomain: v.string(), // Pipedrive API domain (e.g., "api.pipedrive.com")
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Marketing KPIs (Admin Configurable) - Board Requirement
  // Allows partners to modify KPI values and icons from admin panel
  marketing_kpis: defineTable({
    key: v.string(), // Unique identifier (e.g., "valuations", "operations", "sectors", "offices")
    icon: v.string(), // Lucide icon name (e.g., "TrendingUp", "Briefcase", "Building2", "MapPin")
    value: v.number(), // The numeric value to display
    suffix: v.optional(v.string()), // Text after value (e.g., " m€+", "+")
    prefix: v.optional(v.string()), // Text before value (e.g., "€")
    labelFr: v.string(), // French label
    labelEn: v.string(), // English label
    displayOrder: v.number(), // Order of display (1, 2, 3, 4...)
    isActive: v.boolean(), // Whether to show this KPI
  })
    .index("by_key", ["key"])
    .index("by_displayOrder", ["displayOrder"]),

  // Location Images for Interactive Map - Board Requirement
  // Stores images for each office location on the map
  location_images: defineTable({
    locationId: v.string(), // Office ID (e.g., "paris", "nice", "lorient")
    imageUrl: v.string(), // URL to the location image
    altText: v.optional(v.string()), // Alt text for accessibility
    updatedAt: v.number(),
  }).index("by_locationId", ["locationId"]),

  // ============================================
  // COLAB-SPECIFIC TABLES (Phase 1 Consolidation - 2026-01-22)
  // These tables support the Notion-like collaborative features
  // ============================================

  // Colab Users - Lightweight user records for Colab presence
  // Note: References main `users` table via clerkId for RBAC
  colab_users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
    lastSeen: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Documents for the Notion-like editor
  colab_documents: defineTable({
    title: v.string(),
    content: v.string(),
    markdown: v.optional(v.string()),
    userId: v.optional(v.string()),
    dealId: v.optional(v.id("deals")), // References unified deals table
    createdAt: v.number(),
    updatedAt: v.number(),
    isArchived: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_deal", ["dealId"])
    .index("by_updated", ["updatedAt"]),

  // Document version history for undo/restore
  colab_document_versions: defineTable({
    documentId: v.id("colab_documents"),
    content: v.string(),
    markdown: v.optional(v.string()),
    versionNumber: v.number(),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    changeDescription: v.optional(v.string()),
  })
    .index("by_document", ["documentId"])
    .index("by_version", ["documentId", "versionNumber"]),

  // File storage for Colab (uses Vercel Blob)
  colab_files: defineTable({
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    size: v.number(),
    folderId: v.optional(v.string()),
    userId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_folder", ["folderId"])
    .index("by_user", ["userId"]),

  // Custom property definitions (Notion-style properties)
  colab_property_definitions: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("number"),
      v.literal("date"),
      v.literal("select"),
      v.literal("multiselect"),
      v.literal("checkbox"),
    ),
    options: v.optional(
      v.array(
        v.object({
          id: v.string(),
          label: v.string(),
          color: v.string(),
        }),
      ),
    ),
    order: v.number(),
  }).index("by_order", ["order"]),

  // Real-time presence for collaborative editing
  colab_presence: defineTable({
    resourceType: v.union(v.literal("document"), v.literal("deal")),
    resourceId: v.string(),
    userId: v.string(),
    userName: v.optional(v.string()),
    userColor: v.optional(v.string()),
    cursorPosition: v.optional(
      v.object({
        x: v.number(),
        y: v.number(),
      }),
    ),
    lastActiveAt: v.number(),
  })
    .index("by_resource", ["resourceType", "resourceId"])
    .index("by_resource_user", ["resourceType", "resourceId", "userId"]),

  // AI-Powered Presentations
  colab_presentations: defineTable({
    title: v.string(),
    userId: v.string(),
    workspaceId: v.optional(v.string()),
    theme: v.string(),
    language: v.string(), // 'fr-FR' default
    slides: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        content: v.any(), // Block content - intentionally flexible
        notes: v.optional(v.string()),
        rootImage: v.optional(
          v.object({
            url: v.string(),
            query: v.string(),
          }),
        ),
      }),
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("generating"),
      v.literal("complete"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_updated", ["updatedAt"]),

  // Advanced Kanban - Boards
  colab_boards: defineTable({
    name: v.string(),
    workspaceId: v.optional(v.string()),
    visibility: v.union(
      v.literal("private"),
      v.literal("workspace"),
      v.literal("public"),
    ),
    backgroundUrl: v.optional(v.string()),
    createdBy: v.string(),
    publicId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["createdBy"]),

  // Kanban - Lists (columns)
  colab_lists: defineTable({
    name: v.string(),
    boardId: v.id("colab_boards"),
    index: v.number(),
    createdAt: v.number(),
  }).index("by_board", ["boardId"]),

  // Kanban - Cards
  colab_cards: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    listId: v.id("colab_lists"),
    index: v.number(),
    labelIds: v.optional(v.array(v.id("colab_labels"))),
    assigneeIds: v.optional(v.array(v.string())),
    dueDate: v.optional(v.number()),
    dueDateCompleted: v.optional(v.boolean()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    dependsOn: v.optional(v.array(v.id("colab_cards"))),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_list", ["listId"]),

  // Kanban - Labels
  colab_labels: defineTable({
    name: v.string(),
    colorCode: v.string(),
    boardId: v.id("colab_boards"),
  }).index("by_board", ["boardId"]),

  // Kanban - Checklists
  colab_checklists: defineTable({
    name: v.string(),
    cardId: v.id("colab_cards"),
    order: v.number(),
  }).index("by_card", ["cardId"]),

  // Kanban - Checklist Items
  colab_checklist_items: defineTable({
    content: v.string(),
    completed: v.boolean(),
    checklistId: v.id("colab_checklists"),
    order: v.number(),
  }).index("by_checklist", ["checklistId"]),

  // Kanban - Card Activity Log
  colab_card_activities: defineTable({
    cardId: v.id("colab_cards"),
    userId: v.string(),
    action: v.string(),
    details: v.optional(v.any()), // Flexible activity details
    createdAt: v.number(),
  }).index("by_card", ["cardId"]),

  // ============================================
  // VISUAL WEBSITE EDITOR (Phase 4)
  // ============================================

  // Store editable page content
  page_content: defineTable({
    path: v.string(), // e.g., "/expertises", "/", "/operations"
    locale: v.string(), // "fr" or "en"

    // Page sections (flexible structure for different page types)
    sections: v.array(
      v.object({
        id: v.string(), // Unique section ID
        type: v.string(), // "hero", "text", "image", "cards", "testimonials", etc.
        content: v.any(), // Flexible content structure based on type
        order: v.number(), // Display order
        visible: v.optional(v.boolean()), // Toggle section visibility
      }),
    ),

    // Theme customization per page
    theme: v.optional(
      v.object({
        colors: v.optional(
          v.object({
            primary: v.optional(v.string()),
            secondary: v.optional(v.string()),
            accent: v.optional(v.string()),
          }),
        ),
        fonts: v.optional(
          v.object({
            heading: v.optional(v.string()),
            body: v.optional(v.string()),
          }),
        ),
        spacing: v.optional(v.string()), // "compact", "normal", "spacious"
      }),
    ),

    // Versioning
    version: v.number(),
    publishedAt: v.optional(v.number()),
    publishedBy: v.optional(v.id("users")),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_path", ["path", "locale"])
    .index("by_published", ["publishedAt"])
    .index("by_version", ["path", "version"]),

  // Store pending changes awaiting approval
  pending_changes: defineTable({
    pageContentId: v.id("page_content"),
    pagePath: v.string(), // Denormalized for easier queries
    pageLocale: v.string(),

    // Change metadata
    changedBy: v.id("users"),
    changedByName: v.string(), // Denormalized for display
    changeType: v.string(), // "content", "theme", "structure", "mixed"
    description: v.optional(v.string()), // User-provided description

    // Store both visual and code representations
    visualDiff: v.object({
      before: v.string(), // Human-readable description or rendered HTML
      after: v.string(),
      changesSummary: v.array(v.string()), // List of changes for quick review
    }),

    codeDiff: v.object({
      before: v.any(), // Original content/sections object
      after: v.any(), // Modified content/sections object
      delta: v.optional(v.any()), // JSON diff delta (from jsondiffpatch)
    }),

    // Approval workflow
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled"),
    ),
    requiredApprovals: v.number(), // Number of approvals needed

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    approvedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_page", ["pageContentId"])
    .index("by_created", ["createdAt"])
    .index("by_changed_by", ["changedBy"]),

  // Track individual approvals/rejections
  change_approvals: defineTable({
    changeId: v.id("pending_changes"),
    userId: v.id("users"),
    userName: v.string(), // Denormalized for display

    // Approval decision
    approved: v.boolean(),
    comment: v.optional(v.string()), // Optional feedback

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_change", ["changeId"])
    .index("by_user_change", ["userId", "changeId"])
    .index("by_user", ["userId"]),

  // Version history for rollback capability
  page_versions: defineTable({
    pageContentId: v.id("page_content"),
    pagePath: v.string(), // Denormalized

    // Full snapshot at this version
    version: v.number(),
    sections: v.any(), // Full sections array snapshot
    theme: v.optional(v.any()), // Full theme object snapshot

    // Metadata
    publishedBy: v.id("users"),
    publishedByName: v.string(), // Denormalized
    publishedAt: v.number(),

    // Change summary for this version
    changeDescription: v.optional(v.string()),
  })
    .index("by_page", ["pageContentId"])
    .index("by_page_version", ["pageContentId", "version"])
    .index("by_published", ["publishedAt"]),

  // Track user activity in the visual editor
  editor_sessions: defineTable({
    userId: v.id("users"),
    pageContentId: v.id("page_content"),

    // Session info
    action: v.string(), // "started_editing", "saved_draft", "submitted_for_approval"
    sectionId: v.optional(v.string()), // Which section was edited

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_page", ["pageContentId"])
    .index("by_user_page", ["userId", "pageContentId"]),

  // Logo Management for Operations
  // High-quality white-on-transparent SVG logos
  company_logos: defineTable({
    // Company identification
    companyName: v.string(),
    companyId: v.optional(v.id("companies")), // Link to CRM if exists
    transactionId: v.optional(v.string()), // Link to transaction/operation

    // Logo assets
    originalUrl: v.optional(v.string()), // Original low-quality logo URL
    originalStorageId: v.optional(v.id("_storage")), // Original in Convex storage
    optimizedStorageId: v.optional(v.id("_storage")), // Optimized SVG in Convex storage
    optimizedUrl: v.optional(v.string()), // Public URL of optimized logo

    // Quality & Processing
    format: v.union(
      v.literal("svg"),
      v.literal("png"),
      v.literal("jpg"),
      v.literal("webp"),
    ),
    originalSize: v.optional(
      v.object({
        width: v.number(),
        height: v.number(),
      }),
    ),
    quality: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),

    // Status tracking
    status: v.union(
      v.literal("pending"), // Needs processing
      v.literal("auto_processed"), // Automatically optimized
      v.literal("needs_review"), // Flagged for manual review (low quality)
      v.literal("manual_required"), // Failed auto-processing
      v.literal("approved"), // Reviewed and approved
      v.literal("rejected"), // Needs replacement
    ),

    // Processing metadata
    processingMetadata: v.optional(
      v.object({
        source: v.string(), // "auto_vectorization", "clearbit", "manual", "brandfetch"
        processedAt: v.number(),
        processedBy: v.optional(v.id("users")), // For manual reviews
        algorithm: v.optional(v.string()), // "potrace", "vectorizer-ai", etc.
        notes: v.optional(v.string()),
      }),
    ),

    // Audit trail
    createdAt: v.number(),
    updatedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
  })
    .index("by_company", ["companyName"])
    .index("by_company_id", ["companyId"])
    .index("by_status", ["status"])
    .index("by_quality", ["quality"])
    .index("by_transaction", ["transactionId"]),

  // ============================================
  // VIRTUAL DATA ROOMS (Phase 1.1 - VDR)
  // Secure document sharing for M&A deals
  // ============================================

  // Data Room container - one per deal
  deal_rooms: defineTable({
    dealId: v.id("deals"),
    name: v.string(),
    status: v.union(
      v.literal("setup"),
      v.literal("active"),
      v.literal("closed"),
      v.literal("archived"),
    ),
    settings: v.object({
      watermarkEnabled: v.boolean(),
      downloadRestricted: v.boolean(),
      expiresAt: v.optional(v.number()),
      allowedDomains: v.optional(v.array(v.string())),
    }),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_deal", ["dealId"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"]),

  // Folder structure within room
  deal_room_folders: defineTable({
    roomId: v.id("deal_rooms"),
    parentId: v.optional(v.id("deal_room_folders")),
    name: v.string(),
    order: v.number(),
    // Standard DD categories
    category: v.optional(
      v.union(
        v.literal("legal"),
        v.literal("financial"),
        v.literal("tax"),
        v.literal("hr"),
        v.literal("ip"),
        v.literal("commercial"),
        v.literal("it"),
        v.literal("environmental"),
        v.literal("other"),
      ),
    ),
    createdAt: v.optional(v.number()),
  })
    .index("by_room", ["roomId"])
    .index("by_parent", ["parentId"])
    .index("by_room_parent", ["roomId", "parentId"]),

  // Documents in data room
  deal_room_documents: defineTable({
    roomId: v.id("deal_rooms"),
    folderId: v.id("deal_room_folders"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    version: v.number(),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
    // Access control
    accessLevel: v.union(
      v.literal("all"),
      v.literal("buyer_group"),
      v.literal("seller_only"),
      v.literal("restricted"),
    ),
    restrictedTo: v.optional(v.array(v.string())), // User IDs or email domains
    // Metadata
    ddChecklistItemId: v.optional(v.id("dd_checklist_items")),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_room", ["roomId"])
    .index("by_folder", ["folderId"])
    .index("by_checklist_item", ["ddChecklistItemId"])
    .index("by_uploadedBy", ["uploadedBy"]),

  // Access audit log - tracks every view/download
  deal_room_access_log: defineTable({
    roomId: v.id("deal_rooms"),
    documentId: v.optional(v.id("deal_room_documents")),
    userId: v.string(),
    userEmail: v.string(),
    action: v.union(
      v.literal("view"),
      v.literal("download"),
      v.literal("print"),
      v.literal("share"),
    ),
    timestamp: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    duration: v.optional(v.number()), // View duration in seconds
  })
    .index("by_room", ["roomId"])
    .index("by_document", ["documentId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // Q&A within data room
  deal_room_questions: defineTable({
    roomId: v.id("deal_rooms"),
    documentId: v.optional(v.id("deal_room_documents")),
    folderId: v.optional(v.id("deal_room_folders")),
    question: v.string(),
    askedBy: v.string(), // External user email or internal user ID
    askedByName: v.string(),
    askedAt: v.number(),
    answer: v.optional(v.string()),
    answeredBy: v.optional(v.id("users")),
    answeredAt: v.optional(v.number()),
    status: v.union(
      v.literal("open"),
      v.literal("answered"),
      v.literal("clarification_needed"),
      v.literal("declined"),
    ),
    isPrivate: v.boolean(), // Only visible to asker and sellers
    attachments: v.optional(v.array(v.id("deal_room_documents"))),
  })
    .index("by_room", ["roomId"])
    .index("by_status", ["status"])
    .index("by_asker", ["askedBy"])
    .index("by_document", ["documentId"]),

  // External user invitations
  deal_room_invitations: defineTable({
    roomId: v.id("deal_rooms"),
    email: v.string(),
    name: v.string(),
    company: v.optional(v.string()),
    role: v.union(
      v.literal("viewer"),
      v.literal("downloader"),
      v.literal("questioner"),
    ),
    accessLevel: v.union(
      v.literal("all"),
      v.literal("buyer_group"),
      v.literal("restricted"),
    ),
    folderAccess: v.optional(v.array(v.id("deal_room_folders"))),
    invitedBy: v.id("users"),
    invitedAt: v.number(),
    acceptedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("revoked"),
    ),
    // Access token for magic link
    accessToken: v.optional(v.string()),
  })
    .index("by_room", ["roomId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_token", ["accessToken"]),

  // ============================================
  // DUE DILIGENCE CHECKLISTS (Phase 1.3)
  // ============================================

  // DD Checklist templates
  dd_checklist_templates: defineTable({
    name: v.string(),
    category: v.union(
      v.literal("buy_side"),
      v.literal("sell_side"),
      v.literal("merger"),
    ),
    items: v.array(
      v.object({
        id: v.string(),
        section: v.string(), // "Legal", "Financial", etc.
        item: v.string(),
        description: v.optional(v.string()),
        priority: v.union(
          v.literal("critical"),
          v.literal("important"),
          v.literal("standard"),
        ),
        suggestedDocuments: v.optional(v.array(v.string())),
      }),
    ),
    createdBy: v.id("users"),
    isDefault: v.boolean(),
    createdAt: v.optional(v.number()),
  })
    .index("by_category", ["category"])
    .index("by_isDefault", ["isDefault"]),

  // DD Checklists per deal
  dd_checklists: defineTable({
    dealId: v.id("deals"),
    templateId: v.optional(v.id("dd_checklist_templates")),
    name: v.string(),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("complete"),
    ),
    progress: v.number(), // 0-100
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_deal", ["dealId"]),

  // Individual DD checklist items
  dd_checklist_items: defineTable({
    checklistId: v.id("dd_checklists"),
    section: v.string(),
    item: v.string(),
    description: v.optional(v.string()),
    priority: v.union(
      v.literal("critical"),
      v.literal("important"),
      v.literal("standard"),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("received"),
      v.literal("reviewed"),
      v.literal("issue_found"),
      v.literal("not_applicable"),
    ),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    documents: v.optional(v.array(v.id("deal_room_documents"))),
    notes: v.optional(v.string()),
    issueDescription: v.optional(v.string()),
    issueSeverity: v.optional(
      v.union(v.literal("blocker"), v.literal("major"), v.literal("minor")),
    ),
    completedAt: v.optional(v.number()),
    completedBy: v.optional(v.id("users")),
    order: v.optional(v.number()),
  })
    .index("by_checklist", ["checklistId"])
    .index("by_status", ["status"])
    .index("by_assignee", ["assignedTo"])
    .index("by_section", ["checklistId", "section"]),

  // ============================================
  // REAL-TIME COLLABORATIVE EDITING (Phase 1.2)
  // Yjs CRDT sync for TipTap editor
  // ============================================

  // Store Yjs document state - binary encoded as array of numbers
  colab_yjs_documents: defineTable({
    documentId: v.id("colab_documents"), // Reference to parent document
    // Yjs state vector for awareness
    stateVector: v.optional(v.array(v.number())),
    // Full Yjs document state (encoded Y.Doc)
    documentState: v.array(v.number()),
    // Track last update for efficient syncing
    version: v.number(),
    updatedAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_version", ["documentId", "version"]),

  // Store incremental Yjs updates (for efficient sync)
  // These get merged periodically into the main state
  colab_yjs_updates: defineTable({
    documentId: v.id("colab_documents"),
    // Binary update data as array of numbers
    update: v.array(v.number()),
    // Track ordering
    version: v.number(),
    // Who made this update
    clientId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_document_version", ["documentId", "version"]),

  // Cursor/selection awareness for collaborative editing
  colab_yjs_awareness: defineTable({
    documentId: v.id("colab_documents"),
    clientId: v.string(),
    userId: v.optional(v.string()),
    userName: v.optional(v.string()),
    userColor: v.optional(v.string()),
    // Cursor position (TipTap selection)
    cursor: v.optional(
      v.object({
        anchor: v.number(),
        head: v.number(),
      }),
    ),
    lastSeen: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_document_client", ["documentId", "clientId"])
    .index("by_lastSeen", ["lastSeen"]),

  // ============================================
  // CALENDAR SYNC (Phase 2.3)
  // Microsoft 365 + Google Calendar integration
  // ============================================

  // Calendar events from external sources
  calendar_events: defineTable({
    // Event details
    title: v.string(),
    description: v.optional(v.string()),
    startDateTime: v.number(), // Timestamp in ms
    endDateTime: v.number(), // Timestamp in ms
    isAllDay: v.optional(v.boolean()),
    location: v.optional(v.string()),

    // Integration metadata
    source: v.union(
      v.literal("microsoft"),
      v.literal("google"),
      v.literal("manual"),
    ),
    externalId: v.string(), // Provider's event ID

    // Relationships
    dealId: v.optional(v.id("deals")),
    companyId: v.optional(v.id("companies")),
    contactIds: v.optional(v.array(v.id("contacts"))),
    ownerId: v.optional(v.id("users")), // Which user synced this

    // Attendees (email addresses)
    organizer: v.optional(
      v.object({
        name: v.optional(v.string()),
        email: v.string(),
      }),
    ),
    attendees: v.optional(
      v.array(
        v.object({
          name: v.optional(v.string()),
          email: v.string(),
          responseStatus: v.optional(
            v.union(
              v.literal("accepted"),
              v.literal("declined"),
              v.literal("tentative"),
              v.literal("needsAction"),
              v.literal("none"),
            ),
          ),
        }),
      ),
    ),

    // Online meeting
    isOnlineMeeting: v.optional(v.boolean()),
    onlineMeetingUrl: v.optional(v.string()),
    onlineMeetingProvider: v.optional(v.string()), // "teams", "zoom", "meet"

    // Event status
    status: v.optional(
      v.union(
        v.literal("confirmed"),
        v.literal("tentative"),
        v.literal("cancelled"),
      ),
    ),

    // Recurrence (store original recurrence rule)
    recurrence: v.optional(v.string()), // iCal RRULE format
    recurringEventId: v.optional(v.string()), // Parent event for instances

    // Microsoft-specific
    iCalUId: v.optional(v.string()),
    changeKey: v.optional(v.string()), // For change detection

    // Google-specific
    htmlLink: v.optional(v.string()),

    // Sync metadata
    lastSyncedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_source", ["source"])
    .index("by_externalId", ["source", "externalId"])
    .index("by_dealId", ["dealId"])
    .index("by_ownerId", ["ownerId"])
    .index("by_startDateTime", ["startDateTime"])
    .index("by_date_range", ["ownerId", "startDateTime"])
    .index("by_lastSynced", ["lastSyncedAt"]),

  // Calendar sync state per user
  calendar_sync_state: defineTable({
    userId: v.id("users"),
    provider: v.union(v.literal("microsoft"), v.literal("google")),

    // Sync configuration
    isEnabled: v.boolean(),
    syncDirection: v.union(
      v.literal("import_only"), // Only import from provider
      v.literal("two_way"), // Bidirectional sync (future)
    ),

    // Sync state
    lastSyncedAt: v.optional(v.number()),
    syncToken: v.optional(v.string()), // Delta sync token for incremental updates

    // Sync range (how far back/forward to sync)
    syncPastDays: v.optional(v.number()), // Default 30
    syncFutureDays: v.optional(v.number()), // Default 90

    // Error tracking
    lastError: v.optional(v.string()),
    lastErrorAt: v.optional(v.number()),
    consecutiveErrors: v.optional(v.number()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_provider", ["userId", "provider"])
    .index("by_provider", ["provider"]),

  // Google OAuth tokens (similar to microsoft_tokens)
  google_tokens: defineTable({
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(), // Timestamp in milliseconds
    userId: v.optional(v.string()), // Google user ID
    email: v.optional(v.string()), // Google email
    scope: v.optional(v.string()), // Granted scopes
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // ============================================
  // USER PREFERENCES (Cross-App Sync)
  // Unified settings synced between Panel and Colab
  // ============================================

  user_preferences: defineTable({
    userId: v.id("users"),

    // Theme and appearance
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    ),
    accentColor: v.optional(v.string()), // Hex color
    sidebarCollapsed: v.optional(v.boolean()),
    compactMode: v.optional(v.boolean()),

    // Notification preferences
    notifications: v.optional(
      v.object({
        emailEnabled: v.boolean(),
        pushEnabled: v.boolean(),
        digestFrequency: v.union(
          v.literal("realtime"),
          v.literal("hourly"),
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("none"),
        ),
        mentionsOnly: v.optional(v.boolean()),
        dealUpdates: v.optional(v.boolean()),
        calendarReminders: v.optional(v.boolean()),
        approvalRequests: v.optional(v.boolean()),
      }),
    ),

    // Regional settings
    locale: v.optional(v.union(v.literal("fr"), v.literal("en"))),
    timezone: v.optional(v.string()), // IANA timezone (e.g., "Europe/Paris")
    dateFormat: v.optional(v.string()), // "DD/MM/YYYY", "MM/DD/YYYY", etc.
    numberFormat: v.optional(v.string()), // "fr-FR", "en-US", etc.

    // Dashboard preferences
    defaultDashboard: v.optional(v.string()), // Which dashboard to show on login
    pinnedDeals: v.optional(v.array(v.id("deals"))),
    favoriteViews: v.optional(v.array(v.string())), // Saved filter/view names

    // Editor preferences
    editorFontSize: v.optional(v.number()),
    editorLineHeight: v.optional(v.number()),
    editorWordWrap: v.optional(v.boolean()),
    spellCheckEnabled: v.optional(v.boolean()),

    // Integration preferences
    defaultCalendarProvider: v.optional(
      v.union(v.literal("microsoft"), v.literal("google"), v.literal("none")),
    ),
    autoLinkEmails: v.optional(v.boolean()), // Auto-link emails to deals

    // Keyboard shortcuts (custom overrides)
    keyboardShortcuts: v.optional(v.record(v.string(), v.string())),

    // Last known state for cross-app sync
    lastActiveApp: v.optional(v.union(v.literal("panel"), v.literal("colab"))),
    lastActiveRoute: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // ============================================
  // FEATURE FLAGS (Gradual Rollout System)
  // Server-side feature flag management
  // ============================================

  feature_flags: defineTable({
    // Flag identification
    key: v.string(), // Unique key (e.g., "vdr_watermarking", "ai_matchmaker")
    name: v.string(), // Human-readable name
    description: v.optional(v.string()),

    // Flag state
    enabled: v.boolean(), // Global on/off

    // Rollout configuration
    rolloutStrategy: v.union(
      v.literal("all"), // All users
      v.literal("none"), // No users (disabled)
      v.literal("percentage"), // Percentage-based rollout
      v.literal("users"), // Specific users only
      v.literal("roles"), // Specific roles only
      v.literal("domains"), // Specific email domains
    ),

    // Strategy-specific config
    rolloutPercentage: v.optional(v.number()), // 0-100 for percentage strategy
    allowedUserIds: v.optional(v.array(v.id("users"))), // For users strategy
    allowedRoles: v.optional(v.array(v.string())), // For roles strategy
    allowedDomains: v.optional(v.array(v.string())), // For domains strategy

    // Environment targeting
    environments: v.optional(
      v.array(
        v.union(
          v.literal("development"),
          v.literal("staging"),
          v.literal("production"),
        ),
      ),
    ),

    // Categorization
    category: v.optional(
      v.union(
        v.literal("feature"),
        v.literal("experiment"),
        v.literal("ops"),
        v.literal("release"),
      ),
    ),

    // Metadata
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.optional(v.number()), // Auto-disable after this date
  })
    .index("by_key", ["key"])
    .index("by_enabled", ["enabled"])
    .index("by_category", ["category"]),

  // Track which users have seen which flags (for percentage rollout consistency)
  feature_flag_assignments: defineTable({
    flagKey: v.string(),
    userId: v.id("users"),
    assigned: v.boolean(), // Whether user is in the rollout
    assignedAt: v.number(),
  })
    .index("by_flag_user", ["flagKey", "userId"])
    .index("by_user", ["userId"]),

  // ============================================
  // RATE LIMITING (Security)
  // Tracks request counts for rate limiting
  // ============================================

  rate_limit_entries: defineTable({
    key: v.string(), // Composite key (e.g., "oauth:192.168.1.1" or "mutation:user123")
    count: v.number(), // Number of requests in current window
    windowStart: v.number(), // Start of the current window (timestamp)
    windowEnd: v.number(), // End of the current window (timestamp)
  })
    .index("by_key", ["key"])
    .index("by_window_end", ["windowEnd"]),

  // ============================================
  // EMAIL UNSUBSCRIBE TOKENS (CAN-SPAM/GDPR Compliance)
  // Cryptographically secure tokens for one-click unsubscribe
  // ============================================

  email_unsubscribe_tokens: defineTable({
    userId: v.id("users"),
    email: v.string(),
    token: v.string(), // Cryptographically secure random token
    createdAt: v.number(),
    expiresAt: v.optional(v.number()), // Optional 90-day expiry
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // ============================================
  // ALECIA NUMBERS - FINANCIAL MODELING TOOLS
  // Spreadsheet and calculation tools for M&A
  // ============================================

  // Saved financial models
  numbers_financial_models: defineTable({
    userId: v.id("users"),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    companyName: v.string(),
    // Financial data stored as JSON
    years: v.array(v.any()), // Array of FinancialYear objects
    // Projection assumptions
    assumptions: v.optional(
      v.object({
        projectionYears: v.number(),
        growthRate: v.number(),
        marginImprovement: v.number(),
      }),
    ),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_deal", ["dealId"])
    .index("by_updated", ["updatedAt"]),

  // Saved comparable analyses
  numbers_comparables: defineTable({
    userId: v.id("users"),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    targetName: v.string(),
    targetMetrics: v.object({
      revenue: v.number(),
      ebitda: v.number(),
      ebit: v.number(),
      netIncome: v.number(),
    }),
    comparables: v.array(v.any()), // Array of ComparableCompany objects
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_deal", ["dealId"]),

  // Deal pipeline snapshots for Numbers
  numbers_pipeline: defineTable({
    userId: v.id("users"),
    name: v.string(),
    deals: v.array(v.any()), // Array of pipeline Deal objects
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Deal timeline/Gantt data
  numbers_timelines: defineTable({
    userId: v.id("users"),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    closingDate: v.optional(v.string()),
    tasks: v.array(v.any()), // Array of TimelineTask objects
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_deal", ["dealId"]),

  // Teaser/IM tracking data
  numbers_teaser_tracking: defineTable({
    userId: v.id("users"),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    buyers: v.array(v.any()), // Array of Buyer objects
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_deal", ["dealId"]),

  // Post-deal integration tracking
  numbers_post_deal: defineTable({
    userId: v.id("users"),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    closingDate: v.optional(v.string()),
    tasks: v.array(v.any()), // Array of IntegrationTask objects
    // Synergy tracking
    totalSynergiesTarget: v.optional(v.number()),
    realizedSynergies: v.optional(v.number()),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_deal", ["dealId"]),

  // Fee calculations history
  numbers_fee_calculations: defineTable({
    userId: v.id("users"),
    dealId: v.optional(v.id("deals")),
    clientName: v.string(),
    missionType: v.string(),
    date: v.string(),
    // Transaction value
    enterpriseValue: v.number(),
    debtAssumed: v.optional(v.number()),
    cashAvailable: v.optional(v.number()),
    // Calculated fees
    transactionValue: v.number(),
    successFee: v.number(),
    retainerTotal: v.optional(v.number()),
    totalFees: v.number(),
    // Custom rates if used
    customRates: v.optional(
      v.object({
        rate1: v.number(),
        rate2: v.number(),
        rate3: v.number(),
        rate4: v.number(),
      }),
    ),
    // Metadata
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_deal", ["dealId"])
    .index("by_created", ["createdAt"]),

  // General spreadsheet saves
  numbers_spreadsheets: defineTable({
    userId: v.id("users"),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    templateId: v.optional(v.string()), // Template used
    // FortuneSheet data
    sheetData: v.string(), // JSON stringified sheet data
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_deal", ["dealId"])
    .index("by_updated", ["updatedAt"]),

  // Valuation multiples analysis
  numbers_valuations: defineTable({
    userId: v.id("users"),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    // Target company data
    targetCompany: v.object({
      name: v.string(),
      sector: v.string(),
      revenue: v.number(),
      ebitda: v.number(),
      ebit: v.number(),
      netIncome: v.number(),
      netDebt: v.number(),
      cash: v.number(),
      equity: v.number(),
    }),
    // Comparable companies array
    comparables: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        country: v.string(),
        ev: v.number(),
        revenue: v.number(),
        ebitda: v.number(),
      }),
    ),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_deal", ["dealId"])
    .index("by_updated", ["updatedAt"]),

  // Due diligence checklists
  numbers_dd_checklists: defineTable({
    userId: v.id("users"),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    // Categories with items
    categories: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        icon: v.string(),
        items: v.array(
          v.object({
            id: v.string(),
            category: v.string(),
            item: v.string(),
            status: v.union(
              v.literal("todo"),
              v.literal("in_progress"),
              v.literal("completed"),
              v.literal("blocked"),
            ),
            priority: v.union(
              v.literal("high"),
              v.literal("medium"),
              v.literal("low"),
            ),
            responsible: v.string(),
            dueDate: v.string(),
            completedDate: v.string(),
            documents: v.string(),
            comments: v.string(),
            redFlag: v.boolean(),
          }),
        ),
      }),
    ),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_deal", ["dealId"])
    .index("by_updated", ["updatedAt"]),

  // ============================================
  // ALECIA ANALYTICS - Website Analytics Hub
  // Receives data from Vercel Web Analytics drain
  // ============================================

  // Individual page view events from Vercel
  analytics_events: defineTable({
    // Event identification
    eventId: v.string(), // Unique event ID from Vercel
    eventType: v.string(), // "pageview", "custom", etc.

    // Page data
    path: v.string(), // URL path
    hostname: v.optional(v.string()),
    referrer: v.optional(v.string()),
    referrerHostname: v.optional(v.string()),

    // Visitor data
    visitorId: v.optional(v.string()), // Anonymous visitor ID
    sessionId: v.optional(v.string()),

    // Device/Browser info
    deviceType: v.optional(v.string()), // "desktop", "mobile", "tablet"
    browser: v.optional(v.string()),
    os: v.optional(v.string()),

    // Geo data
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),

    // UTM parameters
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    utmContent: v.optional(v.string()),

    // Timestamps
    timestamp: v.number(), // Event timestamp
    createdAt: v.number(), // When stored in Convex
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_path", ["path"])
    .index("by_country", ["countryCode"])
    .index("by_device", ["deviceType"])
    .index("by_event_id", ["eventId"]),

  // Aggregated daily stats (computed hourly)
  analytics_daily_stats: defineTable({
    date: v.string(), // YYYY-MM-DD format

    // Core metrics
    visitors: v.number(),
    pageViews: v.number(),
    sessions: v.number(),
    bounceRate: v.optional(v.number()),
    avgSessionDuration: v.optional(v.number()),

    // Top pages (JSON stringified for flexibility)
    topPages: v.optional(v.string()), // JSON: [{path, views, visitors}]

    // Device breakdown
    deviceBreakdown: v.optional(v.string()), // JSON: {desktop: n, mobile: n, tablet: n}

    // Country breakdown
    countryBreakdown: v.optional(v.string()), // JSON: [{country, code, visitors}]

    // OS breakdown
    osBreakdown: v.optional(v.string()), // JSON: [{os, visitors}]

    // Referrer breakdown
    referrerBreakdown: v.optional(v.string()), // JSON: [{referrer, visitors}]

    // Computed at
    computedAt: v.number(),
  }).index("by_date", ["date"]),

  // Cache for analytics API responses
  analytics_cache: defineTable({
    cacheKey: v.string(), // e.g., "summary_7d", "daily_2024-02-04"
    data: v.string(), // JSON stringified response
    expiresAt: v.number(), // When cache expires
    createdAt: v.number(),
  })
    .index("by_key", ["cacheKey"])
    .index("by_expires", ["expiresAt"]),
});
