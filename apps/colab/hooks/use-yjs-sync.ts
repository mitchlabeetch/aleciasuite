"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import {
  getYjsState,
  saveYjsState,
  getYjsUpdates,
  pushYjsUpdate,
  updateYjsAwareness,
  removeYjsAwareness,
} from "@/actions/colab/yjs";

const SYNC_INTERVAL = 2000; // Sync every 2 seconds
const SAVE_INTERVAL = 30000; // Save full state every 30 seconds

function savePendingUpdates(documentId: string, updates: Uint8Array[]): void {
  try {
    const key = `yjs-pending-${documentId}`;
    const serializable = updates.map((update) => Array.from(update));
    localStorage.setItem(key, JSON.stringify(serializable));
  } catch (error) {
    console.error("Failed to save pending updates to localStorage:", error);
  }
}

function loadPendingUpdates(documentId: string): Uint8Array[] {
  try {
    const key = `yjs-pending-${documentId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((arr: number[]) => new Uint8Array(arr));
  } catch (error) {
    console.error("Failed to load pending updates from localStorage:", error);
    return [];
  }
}

function clearPendingUpdates(documentId: string): void {
  try {
    const key = `yjs-pending-${documentId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear pending updates from localStorage:", error);
  }
}

interface UseYjsSyncOptions {
  documentId: string;
  enabled?: boolean;
  userId?: string;
  userName?: string;
  userColor?: string;
}

export interface AwarenessState {
  clientId: string;
  userId?: string;
  userName?: string;
  userColor?: string;
  cursor?: { anchor: number; head: number };
}

interface YjsUpdate {
  id: string;
  updateData: Buffer;
  createdAt: Date | null;
  clientId: string | null;
}

export function useYjsSync({
  documentId,
  enabled = true,
  userId,
  userName,
  userColor,
}: UseYjsSyncOptions) {
  const [ydoc] = useState(() => new Y.Doc());
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [awareness, setAwareness] = useState<AwarenessState[]>([]);
  const lastUpdateTimestampRef = useRef(0);
  const clientIdRef = useRef(generateClientId());
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const updatePollRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Uint8Array[]>([]);

  const documentName = documentId;

  useEffect(() => {
    if (!enabled) return;

    const initDoc = async () => {
      try {
        const documentState = await getYjsState(documentName);

        if (documentState && documentState.state && documentState.state.length > 0) {
          const state = new Uint8Array(documentState.state);
          Y.applyUpdate(ydoc, state);
        }

        const savedUpdates = loadPendingUpdates(documentId);
        if (savedUpdates.length > 0) {
          pendingUpdatesRef.current = savedUpdates;
          console.log(
            `Recovered ${savedUpdates.length} pending updates from localStorage`,
          );
        }

        setIsConnected(true);
      } catch (error) {
        console.error("Failed to initialize Yjs document:", error);
      }
    };

    initDoc();
  }, [enabled, documentName, documentId, ydoc]);

  const pollUpdates = useCallback(async () => {
    if (!enabled || !isConnected) return;

    try {
      const since = lastUpdateTimestampRef.current > 0
        ? new Date(lastUpdateTimestampRef.current)
        : undefined;

      const updates = await getYjsUpdates({
        documentName,
        since,
      });

      updates.forEach((update: YjsUpdate) => {
        if (update.clientId !== clientIdRef.current) {
          try {
            const updateData = new Uint8Array(update.updateData);
            Y.applyUpdate(ydoc, updateData, "remote");
            if (update.createdAt) {
              lastUpdateTimestampRef.current = Math.max(
                lastUpdateTimestampRef.current,
                update.createdAt.getTime(),
              );
            }
          } catch (error) {
            console.error("Failed to apply update:", error);
          }
        }
      });
    } catch (error) {
      console.error("Failed to poll updates:", error);
    }
  }, [enabled, isConnected, documentName, ydoc]);

  useEffect(() => {
    if (!enabled || !isConnected) return;

    updatePollRef.current = setInterval(pollUpdates, SYNC_INTERVAL);

    return () => {
      if (updatePollRef.current) clearInterval(updatePollRef.current);
    };
  }, [enabled, isConnected, pollUpdates]);

  useEffect(() => {
    if (!enabled) return;

    const handleUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== "remote") {
        pendingUpdatesRef.current.push(update);
        savePendingUpdates(documentId, pendingUpdatesRef.current);
      }
    };

    ydoc.on("update", handleUpdate);
    return () => {
      ydoc.off("update", handleUpdate);
    };
  }, [enabled, ydoc, documentId]);

  const syncUpdates = useCallback(async () => {
    if (!enabled || !isConnected || pendingUpdatesRef.current.length === 0)
      return;

    setIsSyncing(true);
    try {
      const mergedUpdate = Y.mergeUpdates(pendingUpdatesRef.current);
      pendingUpdatesRef.current = [];

      await pushYjsUpdate({
        documentName,
        updateData: Buffer.from(mergedUpdate),
        clientId: clientIdRef.current,
      });

      clearPendingUpdates(documentId);
    } catch (error) {
      console.error("Failed to sync updates:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [enabled, isConnected, documentName, documentId]);

  const saveState = useCallback(async () => {
    if (!enabled || !isConnected) return;

    try {
      const state = Y.encodeStateAsUpdate(ydoc);

      await saveYjsState({
        documentName,
        state: Buffer.from(state),
      });
    } catch (error) {
      console.error("Failed to save document state:", error);
    }
  }, [enabled, isConnected, documentName, ydoc]);

  useEffect(() => {
    if (!enabled || !isConnected) return;

    syncIntervalRef.current = setInterval(syncUpdates, SYNC_INTERVAL);
    saveIntervalRef.current = setInterval(saveState, SAVE_INTERVAL);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [enabled, isConnected, syncUpdates, saveState]);

  const updateCursor = useCallback(
    async (cursor: { anchor: number; head: number } | null) => {
      if (!enabled) return;

      try {
        await updateYjsAwareness({
          documentName,
          clientId: clientIdRef.current,
          awarenessData: {
            userId,
            userName,
            userColor,
            cursor: cursor ?? undefined,
          },
        });
      } catch (error) {
        console.error("Failed to update awareness:", error);
      }
    },
    [enabled, documentName, userId, userName, userColor],
  );

  useEffect(() => {
    return () => {
      syncUpdates();
      saveState();
      if (enabled) {
        removeYjsAwareness({
          documentName,
          clientId: clientIdRef.current,
        }).catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.debug(
              "Awareness cleanup error (expected on unmount):",
              err,
            );
          }
        });
      }
    };
  }, [enabled, documentName, syncUpdates, saveState]);

  const otherUsers = awareness.filter(
    (a: AwarenessState) => a.clientId !== clientIdRef.current,
  );

  return {
    ydoc,
    isConnected,
    isSyncing,
    awareness: otherUsers,
    updateCursor,
    syncNow: syncUpdates,
    saveNow: saveState,
    clientId: clientIdRef.current,
  };
}

function generateClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getUserColor(userId: string): string {
  const colors = [
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

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}
