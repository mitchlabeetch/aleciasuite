"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColabDocument, ColabDeal } from "../lib/types";
import {
  listDocuments,
  getDocument,
  createDocument as createDocumentAction,
  updateDocument as updateDocumentAction,
  archiveDocument as archiveDocumentAction,
} from "@/actions/colab/documents";
import {
  listDeals,
  getDeal,
  createDeal as createDealAction,
  updateDeal as updateDealAction,
} from "@/actions/deals";

export function useDocuments(userId?: string): {
  documents: ColabDocument[];
  isLoading: boolean;
  error: Error | null;
  createDocument: (params: {
    title: string;
    content?: any;
    dealId?: string;
  }) => Promise<string>;
  updateDocument: (params: {
    id: string;
    title?: string;
    content?: any;
  }) => Promise<void>;
  archiveDocument: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  isConvexAvailable: boolean;
} {
  const [documents, setDocuments] = useState<ColabDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createDocument = useCallback(
    async (params: { title: string; content?: any; dealId?: string }) => {
      const docId = await createDocumentAction(params);
      await refresh();
      return docId;
    },
    [refresh],
  );

  const updateDocument = useCallback(
    async (params: {
      id: string;
      title?: string;
      content?: any;
    }) => {
      await updateDocumentAction(params);
      await refresh();
    },
    [refresh],
  );

  const archiveDocument = useCallback(
    async (id: string) => {
      await archiveDocumentAction(id);
      await refresh();
    },
    [refresh],
  );

  return {
    documents,
    isLoading,
    error,
    createDocument,
    updateDocument,
    archiveDocument,
    refresh,
    isConvexAvailable: false,
  };
}

export function useDocument(documentId?: string) {
  const [document, setDocument] = useState<ColabDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!documentId) {
      setIsLoading(false);
      return;
    }

    try {
      const doc = await getDocument(documentId);
      setDocument(doc);
    } catch (error) {
      console.error("Failed to fetch document:", error);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveContent = useCallback(
    async (content: any, markdown?: string, title?: string) => {
      if (!documentId) return;
      setSaveError(null);
      setIsSaving(true);

      try {
        await updateDocumentAction({
          id: documentId,
          content,
          title,
        });
        await refresh();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setSaveError(error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [documentId, refresh],
  );

  return {
    document,
    isLoading,
    isSaving,
    saveError,
    saveContent,
    clearSaveError: () => setSaveError(null),
    refresh,
  };
}

export function useDeals(_userId?: string) {
  const [deals, setDeals] = useState<ColabDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const dealsList = await listDeals();
      setDeals(dealsList);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to fetch deals:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createDeal = useCallback(
    async (data: any) => {
      const deal = await createDealAction(data);
      await refresh();
      return deal;
    },
    [refresh],
  );

  const updateDeal = useCallback(
    async (id: string, data: any) => {
      const deal = await updateDealAction(id, data);
      await refresh();
      return deal;
    },
    [refresh],
  );

  return {
    deals,
    dealsByStage: null,
    isLoading,
    error,
    createDeal,
    updateDeal,
    moveDealStage: async () => {
      throw new Error("moveDealStage not implemented");
    },
    archiveDeal: async () => {
      throw new Error("archiveDeal not implemented");
    },
    refresh,
    isConvexAvailable: false,
  };
}

export function useDeal(dealId?: string) {
  const [deal, setDeal] = useState<ColabDeal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!dealId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const dealData = await getDeal(dealId);
      setDeal(dealData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to fetch deal:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateDeal = useCallback(
    async (data: any) => {
      if (!dealId) return;
      const updatedDeal = await updateDealAction(dealId, data);
      await refresh();
      return updatedDeal;
    },
    [dealId, refresh],
  );

  return {
    deal,
    isLoading,
    error,
    updateDeal,
    moveDealStage: async () => {
      throw new Error("moveDealStage not implemented");
    },
    refresh,
  };
}
