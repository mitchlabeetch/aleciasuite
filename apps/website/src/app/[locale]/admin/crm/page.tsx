"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Plus, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CRMSkeleton } from "@/components/admin/AdminSkeleton";
import { getCompanies, getContacts } from "@/actions";

interface Company {
	id: string;
	name: string;
	siren?: string;
	financials?: {
		revenue?: number;
		ebitda?: number;
	};
}

interface Contact {
	id: string;
	fullName: string;
	companyName?: string;
	role?: string;
	email?: string;
}

/**
 * CRM Overview Page
 *
 * Quick access to companies and contacts from server actions
 */
export default function CRMPage() {
	const [companies, setCompanies] = useState<Company[] | null>(null);
	const [contacts, setContacts] = useState<Contact[] | null>(null);

	// Fetch companies and contacts on mount
	useEffect(() => {
		getCompanies().then(data => setCompanies(data as unknown as Company[]));
		getContacts().then(data => setContacts(data as unknown as Contact[]));
	}, []);

	// Loading state
	if (companies === null || contacts === null) {
		return <CRMSkeleton />;
	}

	// Calculate stats
	const companiesCount = companies?.length || 0;
	const contactsCount = contacts?.length || 0;

	// Get recent items (last 5)
	const recentCompanies = companies?.slice(0, 5) || [];
	const recentContacts = contacts?.slice(0, 5) || [];

	return (
		<div className="p-6 space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-alecia-midnight dark:text-white">
					CRM
				</h1>
				<p className="text-muted-foreground">
					Gestion des sociétés et contacts
				</p>
			</div>

			{/* Quick Stats */}
			<div className="grid gap-6 sm:grid-cols-2">
				<StatCard
					title="Sociétés"
					value={companiesCount}
					icon={Building2}
					href="/admin/crm/companies"
					color="blue"
				/>
				<StatCard
					title="Contacts"
					value={contactsCount}
					icon={Users}
					href="/admin/crm/contacts"
					color="purple"
				/>
			</div>

			{/* Actions */}
			<div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
				{/* Companies Section */}
				<div className="rounded-2xl border border-border bg-card p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-semibold text-alecia-midnight dark:text-white flex items-center gap-2">
							<Building2 className="w-5 h-5 text-blue-500" />
							Sociétés
						</h3>
						<Link
							href="/admin/crm/companies/new"
							className="flex items-center gap-1 text-sm text-alecia-mid-blue hover:underline"
						>
							<Plus className="w-4 h-4" />
							Ajouter
						</Link>
					</div>

					{/* Recent Companies */}
					<div className="space-y-2 mb-4">
						{recentCompanies.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Aucune société enregistrée.
							</p>
						) : (
							recentCompanies.map((company) => (
								<div
									key={company.id}
									className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
								>
									<div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
										<Building2 className="w-4 h-4 text-blue-600" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-alecia-midnight dark:text-white truncate">
											{company.name}
										</p>
										{company.siren && (
											<p className="text-xs text-muted-foreground">
												SIREN: {company.siren}
											</p>
										)}
									</div>
								</div>
							))
						)}
					</div>

					<Link
						href="/admin/crm/companies"
						className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
					>
						<Search className="w-4 h-4" />
						Voir toutes les sociétés
					</Link>
				</div>

				{/* Contacts Section */}
				<div className="rounded-2xl border border-border bg-card p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-semibold text-alecia-midnight dark:text-white flex items-center gap-2">
							<Users className="w-5 h-5 text-purple-500" />
							Contacts
						</h3>
						<Link
							href="/admin/crm/contacts/new"
							className="flex items-center gap-1 text-sm text-alecia-mid-blue hover:underline"
						>
							<Plus className="w-4 h-4" />
							Ajouter
						</Link>
					</div>

					{/* Recent Contacts */}
					<div className="space-y-2 mb-4">
						{recentContacts.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Aucun contact enregistré.
							</p>
						) : (
							recentContacts.map((contact) => (
								<div
									key={contact.id}
									className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
								>
									<div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
										<Users className="w-4 h-4 text-purple-600" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-alecia-midnight dark:text-white truncate">
											{contact.fullName}
										</p>
										<p className="text-xs text-muted-foreground truncate">
											{contact.companyName || contact.role || contact.email}
										</p>
									</div>
								</div>
							))
						)}
					</div>

					<Link
						href="/admin/crm/contacts"
						className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
					>
						<Search className="w-4 h-4" />
						Voir tous les contacts
					</Link>
				</div>
			</div>
		</div>
	);
}

// --- Components ---

function StatCard({
	title,
	value,
	icon: Icon,
	href,
	color,
}: {
	title: string;
	value: number;
	icon: React.ComponentType<{ className?: string }>;
	href: string;
	color: "blue" | "purple" | "green" | "emerald";
}) {
	const colorClasses = {
		blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
		purple:
			"bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
		green:
			"bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
		emerald:
			"bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
	};

	return (
		<Link
			href={href}
			className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow block"
		>
			<div className="mb-4 flex items-center justify-between">
				<h3 className="font-semibold text-alecia-midnight dark:text-white">
					{title}
				</h3>
				<div className={`rounded-full p-2 ${colorClasses[color]}`}>
					<Icon className="h-5 w-5" />
				</div>
			</div>
			<div className="text-4xl font-bold text-alecia-midnight dark:text-white">
				{value}
			</div>
		</Link>
	);
}
