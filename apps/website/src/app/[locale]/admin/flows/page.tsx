import { ExternalLink } from "lucide-react";

export default function FlowsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alecia Flows</h1>
          <p className="text-muted-foreground">Orchestration de workflows et automatisation</p>
        </div>
        <a
          href="https://flows.alecia.markets"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Ouvrir Activepieces
        </a>
      </div>
      <div className="rounded-lg border p-12 text-center text-muted-foreground">
        <p className="text-lg">Interface intégrée en cours de développement</p>
        <p className="text-sm mt-2">En attendant, utilisez le lien direct ci-dessus.</p>
      </div>
    </div>
  );
}
