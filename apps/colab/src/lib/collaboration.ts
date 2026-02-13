// apps/colab/src/lib/collaboration.ts
// Hocuspocus WebSocket provider for real-time Yjs collaboration
// Replaces Convex Yjs polling (1-3s latency → sub-100ms)

import { HocuspocusProvider } from "@hocuspocus/provider";

export function createCollaborationProvider(
  documentName: string,
  token: string
) {
  return new HocuspocusProvider({
    url: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || "ws://localhost:1234",
    name: documentName,
    token,
    onAuthenticated: () => {
      console.log("[Hocuspocus] Connected and authenticated");
    },
    onDisconnect: () => {
      console.log("[Hocuspocus] Disconnected");
    },
  });
}

// Usage in TipTap editor:
//
// import Collaboration from "@tiptap/extension-collaboration";
// import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
//
// const provider = createCollaborationProvider(documentId, sessionToken);
//
// const editor = useEditor({
//   extensions: [
//     Collaboration.configure({ document: provider.document }),
//     CollaborationCursor.configure({
//       provider,
//       user: { name: currentUser.name, color: "#4370a7" },
//     }),
//   ],
// });
