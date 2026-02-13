"use client";

import { useState } from "react";
import { signIn } from "@alepanel/auth/client";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

/**
 * Admin Sign In Page - Better Auth
 * 
 * Authenticates Alecia team members (sudo, partner, advisor roles)
 * Redirects to /admin/dashboard after successful login
 */
export default function AdminSignInPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const result = await signIn.email({
				email,
				password,
				callbackURL: "/admin/dashboard",
			});

			if (result.error) {
				setError(result.error.message || "Échec de la connexion");
			} else {
				// Success - redirect happens automatically via callbackURL
				router.push("/admin/dashboard");
			}
		} catch (err: any) {
			setError(err.message || "Une erreur est survenue");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-alecia-midnight via-alecia-mid-blue to-alecia-corporate p-4">
			{/* Background Pattern */}
			<div
				className="absolute inset-0 opacity-10"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
				}}
			/>

			<div className="relative w-full max-w-md">
				{/* Logo */}
				<div className="text-center mb-8">
					<img
						src="/assets/alecia_logo_white.svg"
						alt="Alecia"
						className="h-10 mx-auto mb-4"
					/>
					<h1 className="text-3xl font-bold text-white mb-2">
						Espace Associés
					</h1>
					<p className="text-white/80">
						Connectez-vous pour accéder au dashboard
					</p>
				</div>

				{/* Sign In Form */}
				<div className="bg-white rounded-2xl shadow-2xl p-8">
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Email Field */}
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Email
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alecia-mid-blue focus:border-transparent outline-none transition-all"
									placeholder="votre.email@alecia.markets"
									disabled={loading}
								/>
							</div>
						</div>

						{/* Password Field */}
						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Mot de passe
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alecia-mid-blue focus:border-transparent outline-none transition-all"
									placeholder="••••••••"
									disabled={loading}
								/>
							</div>
						</div>

						{/* Error Message */}
						{error && (
							<div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
								<AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
								<p className="text-sm text-red-600">{error}</p>
							</div>
						)}

						{/* Submit Button */}
						<button
							type="submit"
							disabled={loading}
							className="w-full bg-gradient-to-r from-alecia-mid-blue to-alecia-corporate text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{loading ? (
								<>
									<Loader2 className="w-5 h-5 animate-spin" />
									Connexion en cours...
								</>
							) : (
								"Se connecter"
							)}
						</button>
					</form>

					{/* Additional Info */}
					<div className="mt-6 text-center">
						<p className="text-sm text-gray-500">
							Besoin d'aide ?{" "}
							<a
								href="mailto:admin@alecia.markets"
								className="text-alecia-mid-blue hover:underline"
							>
								Contactez l'administrateur
							</a>
						</p>
					</div>
				</div>

				{/* Security Badge */}
				<div className="mt-6 text-center">
					<p className="text-white/60 text-xs flex items-center justify-center gap-2">
						<Lock className="w-4 h-4" />
						Connexion sécurisée via Better Auth
					</p>
				</div>
			</div>
		</div>
	);
}
