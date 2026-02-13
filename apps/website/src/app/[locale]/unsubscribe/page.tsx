/**
 * Email Unsubscribe Page
 *
 * One-click unsubscribe for email notifications.
 * CAN-SPAM/GDPR compliant - no authentication required.
 */

"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
	CheckCircle2,
	XCircle,
	Loader2,
	Mail,
	AlertCircle,
} from "lucide-react";
import { handleUnsubscribe } from "@/actions/unsubscribe";

function UnsubscribeContent() {
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [status, setStatus] = useState<"loading" | "success" | "error">(
		"loading",
	);
	const [message, setMessage] = useState("");
	const [userName, setUserName] = useState("");
	const [userEmail, setUserEmail] = useState("");

	useEffect(() => {
		const processUnsubscribe = async () => {
			if (!token) {
				setStatus("error");
				setMessage("Aucun token de désinscription fourni.");
				return;
			}

			try {
				// Call server action
				const result = await handleUnsubscribe(token);

				if (result.success) {
					setStatus("success");
					setMessage(result.message);
					setUserName(result.userName || "");
					setUserEmail(result.email || "");
				} else {
					setStatus("error");
					setMessage(result.message || "Une erreur s'est produite.");
				}
			} catch (error) {
				console.error("Unsubscribe error:", error);
				setStatus("error");
				setMessage("Une erreur s'est produite. Veuillez réessayer plus tard.");
			}
		};

		processUnsubscribe();
	}, [token]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
			<div className="max-w-md w-full">
				{/* Card */}
				<div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
					{/* Header */}
					<div
						className={`px-8 py-6 ${status === "success" ? "bg-gradient-to-r from-emerald-500 to-teal-600" : status === "error" ? "bg-gradient-to-r from-rose-500 to-pink-600" : "bg-gradient-to-r from-slate-700 to-slate-800"}`}
					>
						<div className="flex items-center justify-center mb-2">
							{status === "loading" && (
								<Loader2 className="w-12 h-12 text-white animate-spin" />
							)}
							{status === "success" && (
								<CheckCircle2 className="w-12 h-12 text-white" />
							)}
							{status === "error" && (
								<XCircle className="w-12 h-12 text-white" />
							)}
						</div>
						<h1 className="text-2xl font-bold text-white text-center">
							{status === "loading" && "Traitement en cours..."}
							{status === "success" && "Désinscription réussie"}
							{status === "error" && "Erreur"}
						</h1>
					</div>

					{/* Content */}
					<div className="px-8 py-8">
						{status === "loading" && (
							<div className="text-center">
								<p className="text-slate-600 mb-4">
									Nous traitons votre demande de désinscription...
								</p>
								<div className="flex justify-center">
									<Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
								</div>
							</div>
						)}

						{status === "success" && (
							<div className="space-y-6">
								<div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
									<div className="flex items-start gap-3">
										<CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
										<div>
											<p className="text-emerald-900 font-medium">{message}</p>
											{userName && (
												<p className="text-emerald-700 text-sm mt-2">
													<strong>Compte:</strong> {userName}
												</p>
											)}
											{userEmail && (
												<p className="text-emerald-700 text-sm">
													<strong>Email:</strong> {userEmail}
												</p>
											)}
										</div>
									</div>
								</div>

								<div className="bg-slate-50 rounded-lg p-4 space-y-2">
									<h3 className="font-semibold text-slate-900 flex items-center gap-2">
										<Mail className="w-4 h-4" />
										Ce qui change
									</h3>
									<ul className="text-sm text-slate-600 space-y-1 list-disc list-inside ml-2">
										<li>Vous ne recevrez plus d&apos;emails de notification</li>
										<li>
											Vous ne recevrez plus de résumés quotidiens ou
											hebdomadaires
										</li>
										<li>
											Les notifications importantes seront visibles dans
											l&apos;application
										</li>
									</ul>
								</div>

								<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
									<div className="flex items-start gap-3">
										<AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
										<div className="text-sm text-blue-900">
											<p className="font-medium mb-1">
												Vous avez changé d&apos;avis ?
											</p>
											<p className="text-blue-700">
												Connectez-vous à votre compte et réactivez les
												notifications email dans vos paramètres.
											</p>
										</div>
									</div>
								</div>
							</div>
						)}

						{status === "error" && (
							<div className="space-y-6">
								<div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
									<div className="flex items-start gap-3">
										<XCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
										<div>
											<p className="text-rose-900 font-medium mb-2">
												{message}
											</p>
											<p className="text-rose-700 text-sm">
												Le lien de désinscription a peut-être expiré ou est
												invalide.
											</p>
										</div>
									</div>
								</div>

								<div className="bg-slate-50 rounded-lg p-4">
									<h3 className="font-semibold text-slate-900 mb-2">
										Que faire ?
									</h3>
									<ul className="text-sm text-slate-600 space-y-2">
										<li className="flex items-start gap-2">
											<span className="text-slate-400">•</span>
											<span>
												Vérifiez que vous utilisez le lien complet depuis
												l&apos;email
											</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="text-slate-400">•</span>
											<span>
												Connectez-vous à votre compte pour modifier vos
												préférences manuellement
											</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="text-slate-400">•</span>
											<span>Contactez le support si le problème persiste</span>
										</li>
									</ul>
								</div>
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="px-8 py-6 bg-slate-50 border-t border-slate-200">
						<div className="flex flex-col sm:flex-row gap-3 justify-center">
							<a
								href="https://panel.alecia.markets"
								className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors text-center"
							>
								Retour à l&apos;application
							</a>
							<a
								href="https://panel.alecia.markets/contact"
								className="px-6 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors text-center"
							>
								Contacter le support
							</a>
						</div>
					</div>
				</div>

				{/* Footer text */}
				<div className="mt-8 text-center">
					<p className="text-sm text-slate-600">
						<strong className="text-slate-900">Alecia</strong> - M&A Operating
						System
					</p>
					<p className="text-xs text-slate-500 mt-2">
						© {new Date().getFullYear()} Alecia. Tous droits réservés.
					</p>
				</div>
			</div>
		</div>
	);
}

export default function UnsubscribePage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
					<Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
				</div>
			}
		>
			<UnsubscribeContent />
		</Suspense>
	);
}
