/**
 * Colab Property Definitions Module
 *
 * Custom Notion-style property definitions for deals.
 * Part of the unified Convex backend (Phase 2 migration).
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Property option for select/multiselect types
const propertyOptionValidator = v.object({
	id: v.string(),
	label: v.string(),
	color: v.string(),
});

// Property type validator
const propertyTypeValidator = v.union(
	v.literal("text"),
	v.literal("number"),
	v.literal("date"),
	v.literal("select"),
	v.literal("multiselect"),
	v.literal("checkbox"),
);

// Create a new property definition
export const createProperty = mutation({
	args: {
		name: v.string(),
		type: propertyTypeValidator,
		options: v.optional(v.array(propertyOptionValidator)),
	},
	handler: async (ctx, args) => {
		// Get the highest order to append at end
		const existingProps = await ctx.db
			.query("colab_property_definitions")
			.collect();

		const maxOrder =
			existingProps.length > 0
				? Math.max(...existingProps.map((p) => p.order))
				: 0;

		const propertyId = await ctx.db.insert("colab_property_definitions", {
			name: args.name,
			type: args.type,
			options: args.options,
			order: maxOrder + 1,
		});

		return propertyId;
	},
});

// List all property definitions (sorted by order)
export const listProperties = query({
	args: {},
	handler: async (ctx) => {
		const properties = await ctx.db
			.query("colab_property_definitions")
			.collect();

		return properties.sort((a, b) => a.order - b.order);
	},
});

// Update a property definition
export const updateProperty = mutation({
	args: {
		id: v.id("colab_property_definitions"),
		name: v.optional(v.string()),
		options: v.optional(v.array(propertyOptionValidator)),
	},
	handler: async (ctx, args) => {
		const updates: Record<string, unknown> = {};
		if (args.name !== undefined) updates.name = args.name;
		if (args.options !== undefined) updates.options = args.options;

		await ctx.db.patch(args.id, updates);
	},
});

// Delete a property definition
export const deleteProperty = mutation({
	args: {
		id: v.id("colab_property_definitions"),
	},
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});

// Reorder properties
export const reorderProperties = mutation({
	args: {
		propertyIds: v.array(v.id("colab_property_definitions")),
	},
	handler: async (ctx, args) => {
		for (let i = 0; i < args.propertyIds.length; i++) {
			await ctx.db.patch(args.propertyIds[i], { order: i + 1 });
		}
	},
});

// Add option to a select/multiselect property
export const addPropertyOption = mutation({
	args: {
		propertyId: v.id("colab_property_definitions"),
		option: propertyOptionValidator,
	},
	handler: async (ctx, args) => {
		const property = await ctx.db.get(args.propertyId);
		if (!property) throw new Error("Property not found");

		const currentOptions = property.options || [];
		await ctx.db.patch(args.propertyId, {
			options: [...currentOptions, args.option],
		});
	},
});
