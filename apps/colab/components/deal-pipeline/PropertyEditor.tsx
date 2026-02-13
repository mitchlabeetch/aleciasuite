"use client";

/**
 * PropertyEditor - Éditeur de propriétés personnalisées pour deals
 * Adapté pour Alecia Colab - Interface française
 */

import { cn } from "@/lib/utils";
import { ChevronDown, GripVertical, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState, useEffect } from "react";
import {
	createProperty as createPropertyAction,
	updateProperty as updatePropertyAction,
	deleteProperty as deletePropertyAction,
	addPropertyOption as addPropertyOptionAction,
	listProperties
} from "@/actions/colab/property-definitions";

type PropertyType =
	| "text"
	| "number"
	| "date"
	| "select"
	| "multiselect"
	| "checkbox";

interface PropertyOption {
	id: string;
	label: string;
	color: string;
}

interface PropertyDefinition {
	id: string;
	name: string;
	type: PropertyType;
	options?: PropertyOption[];
	order: number;
}

interface PropertyEditorProps {
	isOpen: boolean;
	onClose: () => void;
}

const propertyTypeLabels: Record<PropertyType, string> = {
	text: "Texte",
	number: "Nombre",
	date: "Date",
	select: "Sélection",
	multiselect: "Multi-sélection",
	checkbox: "Case à cocher",
};

const defaultColors = [
	"#EF4444",
	"#F97316",
	"#EAB308",
	"#22C55E",
	"#14B8A6",
	"#3B82F6",
	"#8B5CF6",
	"#EC4899",
	"#6366F1",
	"#64748B",
];

function generateId() {
	return Math.random().toString(36).substring(2, 9);
}

export default function PropertyEditor({
	isOpen,
	onClose,
}: PropertyEditorProps) {
	const isConvexConfigured = !!process.env.NEXT_PUBLIC_CONVEX_URL;

	const [properties, setProperties] = useState<PropertyDefinition[]>([]);
	const [isLoadingProperties, setIsLoadingProperties] = useState(false);

	const [newPropertyName, setNewPropertyName] = useState("");
	const [newPropertyType, setNewPropertyType] = useState<PropertyType>("text");
	const [isAddingProperty, setIsAddingProperty] = useState(false);
	const [editingProperty, setEditingProperty] = useState<string | null>(null);

	// Load properties
	useEffect(() => {
		if (!isConvexConfigured) return;
		async function loadProperties() {
			setIsLoadingProperties(true);
			try {
				// TODO: Get actual boardId from context
				const boardId = "default-board"; // Placeholder - needs actual board context
				const result = await listProperties(boardId);
				// Map DB schema to component interface
				const mapped = result.map((p: any) => ({
					id: p.id,
					name: p.name,
					type: p.propertyType as PropertyType,
					options: p.options as PropertyOption[] | undefined,
					order: p.sortOrder,
				}));
				setProperties(mapped);
			} catch (error) {
				console.error("Erreur chargement propriétés:", error);
			} finally {
				setIsLoadingProperties(false);
			}
		}
		loadProperties();
	}, [isConvexConfigured]);

	const handleCreateProperty = useCallback(async () => {
		if (!newPropertyName.trim()) return;

		try {
			// TODO: Get actual boardId from context
			const boardId = "default-board"; // Placeholder
			const propertyId = await createPropertyAction({
				boardId,
				name: newPropertyName.trim(),
				type: newPropertyType,
				options:
					newPropertyType === "select" || newPropertyType === "multiselect"
						? []
						: undefined,
			});
			// Create a new property object matching our interface
			const newProp: PropertyDefinition = {
				id: propertyId,
				name: newPropertyName.trim(),
				type: newPropertyType,
				options: newPropertyType === "select" || newPropertyType === "multiselect" ? [] : undefined,
				order: properties.length,
			};
			setProperties((prev) => [...prev, newProp]);
			setNewPropertyName("");
			setNewPropertyType("text");
			setIsAddingProperty(false);
		} catch (error) {
			console.error("Erreur création propriété:", error);
		}
	}, [newPropertyName, newPropertyType, properties.length]);

	const handleDeleteProperty = useCallback(
		async (id: string) => {
			if (!confirm("Êtes-vous sûr de vouloir supprimer cette propriété ?"))
				return;

			try {
				await deletePropertyAction(id);
				setProperties((prev) => prev.filter((p) => p.id !== id));
			} catch (error) {
				console.error("Erreur suppression propriété:", error);
			}
		},
		[],
	);

	const handleAddOption = useCallback(
		async (propertyId: string, label: string) => {
			try {
				const newOption = {
					id: generateId(),
					label,
					color:
						defaultColors[Math.floor(Math.random() * defaultColors.length)],
				};
				await addPropertyOptionAction({
					propertyId,
					option: newOption,
				});
				setProperties((prev) =>
					prev.map((p) =>
						p.id === propertyId
							? { ...p, options: [...(p.options || []), newOption] }
							: p
					)
				);
			} catch (error) {
				console.error("Erreur ajout option:", error);
			}
		},
		[],
	);

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
				onClick={onClose}
			>
				<motion.div
					initial={{ scale: 0.95, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.95, opacity: 0 }}
					transition={{ type: "spring", duration: 0.3 }}
					className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
					onClick={(e) => e.stopPropagation()}
				>
					{/* En-tête */}
					<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
							Propriétés personnalisées
						</h2>
						<button
							onClick={onClose}
							className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							<X className="h-5 w-5 text-gray-500" />
						</button>
					</div>

					{/* Contenu */}
					<div className="p-4 max-h-[60vh] overflow-y-auto">
						{!isConvexConfigured ? (
							<div className="text-center py-8 text-gray-500">
								<p>Convex non configuré.</p>
								<p className="text-sm mt-1">
									Configurez NEXT_PUBLIC_CONVEX_URL pour utiliser les
									propriétés.
								</p>
							</div>
						) : isLoadingProperties ? (
							<div className="flex justify-center py-8">
								<div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
							</div>
						) : (
							<>
								{/* Liste des propriétés */}
								<div className="space-y-2">
									{properties.map((property: PropertyDefinition) => (
										<PropertyItem
											key={property.id}
											property={property}
											isEditing={editingProperty === property.id}
											onEdit={() => setEditingProperty(property.id)}
											onDelete={() => handleDeleteProperty(property.id)}
											onAddOption={(label) =>
												handleAddOption(property.id, label)
											}
										/>
									))}
								</div>

								{properties.length === 0 && !isAddingProperty && (
									<div className="text-center py-8 text-gray-500">
										<p>Aucune propriété personnalisée.</p>
										<p className="text-sm mt-1">
											Créez votre première propriété ci-dessous.
										</p>
									</div>
								)}

								{/* Ajouter une propriété */}
								{isAddingProperty ? (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
									>
										<div className="space-y-3">
											<input
												type="text"
												placeholder="Nom de la propriété"
												value={newPropertyName}
												onChange={(e) => setNewPropertyName(e.target.value)}
												className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
											/>

											<select
												value={newPropertyType}
												onChange={(e) =>
													setNewPropertyType(e.target.value as PropertyType)
												}
												className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
											>
												{Object.entries(propertyTypeLabels).map(
													([value, label]) => (
														<option key={value} value={value}>
															{label}
														</option>
													),
												)}
											</select>

											<div className="flex gap-2">
												<button
													onClick={handleCreateProperty}
													disabled={!newPropertyName.trim()}
													className="flex-1 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
												>
													Créer
												</button>
												<button
													onClick={() => {
														setIsAddingProperty(false);
														setNewPropertyName("");
														setNewPropertyType("text");
													}}
													className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
												>
													Annuler
												</button>
											</div>
										</div>
									</motion.div>
								) : (
									<button
										onClick={() => setIsAddingProperty(true)}
										className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
									>
										<Plus className="h-4 w-4" />
										Ajouter une propriété
									</button>
								)}
							</>
						)}
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}

/**
 * Item de propriété individuel
 */
function PropertyItem({
	property,
	isEditing,
	onEdit,
	onDelete,
	onAddOption,
}: {
	property: PropertyDefinition;
	isEditing: boolean;
	onEdit: () => void;
	onDelete: () => void;
	onAddOption: (label: string) => void;
}) {
	const [showOptions, setShowOptions] = useState(false);
	const [newOptionLabel, setNewOptionLabel] = useState("");

	const hasOptions =
		property.type === "select" || property.type === "multiselect";

	const handleAddOption = () => {
		if (!newOptionLabel.trim()) return;
		onAddOption(newOptionLabel.trim());
		setNewOptionLabel("");
	};

	return (
		<div className="group p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
			<div className="flex items-center gap-2">
				<GripVertical className="h-4 w-4 text-gray-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />

				<div className="flex-1">
					<div className="flex items-center gap-2">
						<span className="font-medium text-gray-900 dark:text-white text-sm">
							{property.name}
						</span>
						<span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
							{propertyTypeLabels[property.type]}
						</span>
					</div>
				</div>

				{hasOptions && (
					<button
						onClick={() => setShowOptions(!showOptions)}
						className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
					>
						<ChevronDown
							className={cn(
								"h-4 w-4 text-gray-500 transition-transform",
								showOptions && "rotate-180",
							)}
						/>
					</button>
				)}

				<button
					onClick={onDelete}
					className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded opacity-0 group-hover:opacity-100 transition-opacity"
				>
					<Trash2 className="h-4 w-4 text-red-500" />
				</button>
			</div>

			{/* Options pour select/multiselect */}
			<AnimatePresence>
				{showOptions && hasOptions && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 overflow-hidden"
					>
						<div className="space-y-2">
							{property.options?.map((option) => (
								<div key={option.id} className="flex items-center gap-2">
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: option.color }}
									/>
									<span className="text-sm text-gray-700 dark:text-gray-300">
										{option.label}
									</span>
								</div>
							))}

							<div className="flex gap-2 mt-2">
								<input
									type="text"
									placeholder="Nouvelle option..."
									value={newOptionLabel}
									onChange={(e) => setNewOptionLabel(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
									className="flex-1 px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
								/>
								<button
									onClick={handleAddOption}
									disabled={!newOptionLabel.trim()}
									className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded disabled:opacity-50"
								>
									<Plus className="h-3 w-3" />
								</button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
