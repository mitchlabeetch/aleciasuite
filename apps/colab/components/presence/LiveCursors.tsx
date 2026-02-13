"use client";

/**
 * LiveCursors - Curseurs collaboratifs en temps réel
 * Inspiré des bonnes pratiques Liveblocks
 * Adapté pour Alecia Colab avec Convex
 */

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { heartbeat, getActiveUsers } from "@/actions/colab/presence";

interface CursorPosition {
  x: number;
  y: number;
}

interface UserCursor {
  id: string;
  name: string;
  color: string;
  position: CursorPosition | null;
  lastActive: number;
}

interface LiveCursorsProps {
  roomId: string;
  userId: string;
  userName?: string;
  userColor?: string;
  enabled?: boolean;
  throttleMs?: number; // Défaut 16ms pour 60fps
  className?: string;
}

// Couleurs par défaut pour les curseurs
const CURSOR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

// Générer une couleur cohérente basée sur l'ID utilisateur
function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

/**
 * Composant Curseur individuel
 */
function Cursor({
  name,
  color,
  x,
  y,
}: {
  name: string;
  color: string;
  x: number;
  y: number;
}) {
  return (
    <motion.div
      className="pointer-events-none fixed z-[9999]"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1, x, y }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 500,
        mass: 0.5,
      }}
    >
      {/* Forme du curseur */}
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
      >
        <path
          d="M5.65376 12.4863L0.185547 5.60416L4.72656 0.5L11.6086 5.97421L5.65376 12.4863Z"
          fill={color}
        />
        <path d="M1 5L5 0L11 5L6 12L1 5Z" fill={color} />
      </svg>

      {/* Étiquette utilisateur */}
      <motion.div
        className={cn(
          "absolute left-4 top-4 px-2 py-0.5 rounded-md text-xs font-medium text-white whitespace-nowrap",
          "shadow-sm",
        )}
        style={{ backgroundColor: color }}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {name}
      </motion.div>
    </motion.div>
  );
}

/**
 * Hook principal pour les curseurs en temps réel
 */
export function useLiveCursors({
  roomId,
  userId,
  userName = "Anonyme",
  userColor,
  enabled = true,
  throttleMs = 16, // 60fps
}: Omit<LiveCursorsProps, "className">) {
  const lastUpdateRef = useRef<number>(0);
  const cursorPositionRef = useRef<CursorPosition | null>(null);

  const isConvexConfigured = !!process.env.NEXT_PUBLIC_CONVEX_URL;
  const color = userColor || getUserColor(userId);

  // Récupérer les autres curseurs
  const [otherCursors, setOtherCursors] = useState<any[]>([]);

  useEffect(() => {
    if (!isConvexConfigured || !enabled) return;

    async function loadActiveUsers() {
      try {
        const users = await getActiveUsers(roomId);
        setOtherCursors(users || []);
      } catch (err) {
        console.debug("Failed to load active users:", err);
      }
    }

    loadActiveUsers();
    const interval = setInterval(loadActiveUsers, 2000); // Poll every 2s

    return () => clearInterval(interval);
  }, [isConvexConfigured, enabled, roomId]);

  // Mettre à jour la position du curseur (throttled)
  const updateCursor = useCallback(
    (position: CursorPosition | null) => {
      if (!enabled || !isConvexConfigured) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < throttleMs) return;

      lastUpdateRef.current = now;
      cursorPositionRef.current = position;

      heartbeat({
        documentName: roomId,
        cursorPosition: position ? { x: position.x, y: position.y } : undefined,
      }).catch((err) => {
        // Silently ignore presence update errors - not critical
        if (process.env.NODE_ENV === "development") {
          console.debug("Presence update error:", err);
        }
      });
    },
    [
      enabled,
      isConvexConfigured,
      throttleMs,
      roomId,
      userId,
      userName,
      color,
    ],
  );

  // Handler pour les mouvements de souris
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      updateCursor({ x: e.clientX, y: e.clientY });
    },
    [updateCursor],
  );

  // Handler pour quand le curseur quitte la zone
  const handlePointerLeave = useCallback(() => {
    updateCursor(null);
  }, [updateCursor]);

  // Attacher les événements
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [enabled, handlePointerMove, handlePointerLeave]);

  // Filtrer les autres utilisateurs
  interface PresenceUser {
    userId: string;
    userName?: string;
    userColor?: string;
    cursorPosition?: { x: number; y: number };
    lastActiveAt: number;
  }
  const cursors: UserCursor[] = (otherCursors || [])
    .filter((u: PresenceUser) => u.userId !== userId && u.cursorPosition)
    .map((u: PresenceUser) => ({
      id: u.userId,
      name: u.userName || "Anonyme",
      color: u.userColor || getUserColor(u.userId),
      position: u.cursorPosition as CursorPosition | null,
      lastActive: u.lastActiveAt,
    }));

  return { cursors, updateCursor };
}

/**
 * Composant conteneur pour afficher tous les curseurs
 */
export default function LiveCursors({
  roomId,
  userId,
  userName = "Anonyme",
  userColor,
  enabled = true,
  throttleMs = 16,
  className,
}: LiveCursorsProps) {
  const { cursors } = useLiveCursors({
    roomId,
    userId,
    userName,
    userColor,
    enabled,
    throttleMs,
  });

  return (
    <div className={cn("fixed inset-0 pointer-events-none", className)}>
      <AnimatePresence>
        {cursors.map((cursor) =>
          cursor.position ? (
            <Cursor
              key={cursor.id}
              name={cursor.name}
              color={cursor.color}
              x={cursor.position.x}
              y={cursor.position.y}
            />
          ) : null,
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Composant simplifié pour l'éditeur
 */
export function EditorLiveCursors({
  documentId,
  className,
}: {
  documentId: string;
  className?: string;
}) {
  // Utiliser une version client-safe
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Anonyme");

  useEffect(() => {
    // En production, récupérer depuis BetterAuth
    async function loadUser() {
      try {
        const { useSession } = await import("@alepanel/auth/client");
        const session = useSession();
        if (session.data?.user) {
          setUserId(session.data.user.id);
          setUserName(session.data.user.name || "Anonyme");
        }
      } catch {
        // Fallback pour dev
        setUserId(`user-${Math.random().toString(36).substring(7)}`);
      }
    }
    loadUser();
  }, []);

  if (!userId) return null;

  return (
    <LiveCursors
      roomId={documentId}
      userId={userId}
      userName={userName}
      enabled={true}
      className={className}
    />
  );
}

// Import React pour le composant simplifié
import React from "react";
