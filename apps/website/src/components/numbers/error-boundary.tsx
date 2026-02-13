"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class NumbersErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
		console.error("Numbers tool error:", error, errorInfo);
	}

	handleRetry = (): void => {
		this.setState({ hasError: false, error: null });
	};

	render(): ReactNode {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex items-center justify-center min-h-[400px] p-6">
					<Card className="max-w-md w-full border-red-500/50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-red-600">
								<AlertTriangle className="h-5 w-5" />
								Erreur de chargement
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-muted-foreground">
								Une erreur s&apos;est produite lors du chargement de cet outil.
								Veuillez réessayer ou retourner à l&apos;accueil.
							</p>
							{process.env.NODE_ENV === "development" && this.state.error && (
								<pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
									{this.state.error.message}
								</pre>
							)}
							<div className="flex gap-2">
								<Button onClick={this.handleRetry} variant="default">
									<RefreshCw className="h-4 w-4 mr-2" />
									Réessayer
								</Button>
								<Button variant="outline" asChild>
									<Link href="/admin/numbers">
										<Home className="h-4 w-4 mr-2" />
										Retour
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			);
		}

		return this.props.children;
	}
}
