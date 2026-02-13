/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "prosemirror-model" {
	export interface Node {
		type: NodeType;
		attrs: Record<string, any>;
		content: Fragment;
		marks: readonly Mark[];
		text?: string;
		nodeSize: number;
		childCount: number;
		textContent: string;
		firstChild: Node | null;
		lastChild: Node | null;
		child(index: number): Node;
		maybeChild(index: number): Node | null;
		forEach(f: (node: Node, offset: number, index: number) => void): void;
		nodesBetween(
			from: number,
			to: number,
			f: (
				node: Node,
				pos: number,
				parent: Node | null,
				index: number,
			) => boolean | void,
			startPos?: number,
		): void;
		textBetween(
			from: number,
			to: number,
			blockSeparator?: string,
			leafText?: string,
		): string;
		eq(other: Node): boolean;
		sameMarkup(other: Node): boolean;
		hasMarkup(
			type: NodeType,
			attrs?: Record<string, any>,
			marks?: readonly Mark[],
		): boolean;
		copy(content?: Fragment | null): Node;
		mark(marks: readonly Mark[]): Node;
		cut(from: number, to?: number): Node;
		slice(from: number, to?: number, includeParents?: boolean): Slice;
		replace(from: number, to: number, slice: Slice): Node;
		nodeAt(pos: number): Node | null;
		childAfter(pos: number): {
			node: Node | null;
			index: number;
			offset: number;
		};
		childBefore(pos: number): {
			node: Node | null;
			index: number;
			offset: number;
		};
		resolve(pos: number): ResolvedPos;
		rangeHasMark(from: number, to: number, type: MarkType): boolean;
		toString(): string;
		toJSON(): any;
	}

	export interface Schema<
		Nodes extends string = any,
		Marks extends string = any,
	> {
		spec: any;
		nodes: any;
		marks: any;
		topNodeType: NodeType;
		cached: Record<string, any>;
		node(
			type: string | NodeType,
			attrs?: Record<string, any>,
			content?: Fragment | Node | readonly Node[],
			marks?: readonly Mark[],
		): Node;
		text(text: string, marks?: readonly Mark[]): Node;
		mark(type: string | MarkType, attrs?: Record<string, any>): Mark;
		nodeFromJSON(json: any): Node;
		markFromJSON(json: any): Mark;
	}

	export interface Fragment {
		size: number;
		content: readonly Node[];
		firstChild: Node | null;
		lastChild: Node | null;
		childCount: number;
		child(index: number): Node;
		maybeChild(index: number): Node | null;
		forEach(f: (node: Node, offset: number, index: number) => void): void;
		findDiffStart(other: Fragment): number | null;
		findDiffEnd(other: Fragment): { a: number; b: number } | null;
		eq(other: Fragment): boolean;
		toString(): string;
		toJSON(): any;
	}

	export interface Mark {
		type: MarkType;
		attrs: Record<string, any>;
		eq(other: Mark): boolean;
		toJSON(): any;
	}

	export interface Slice {
		content: Fragment;
		openStart: number;
		openEnd: number;
		size: number;
		eq(other: Slice): boolean;
		toJSON(): any;
	}

	export interface ResolvedPos {
		pos: number;
		depth: number;
		parentOffset: number;
		parent: Node;
		doc: Node;
		node(depth?: number): Node;
		index(depth?: number): number;
		indexAfter(depth?: number): number;
		start(depth?: number): number;
		end(depth?: number): number;
		before(depth?: number): number;
		after(depth?: number): number;
		textOffset: number;
		nodeAfter: Node | null;
		nodeBefore: Node | null;
	}

	export interface NodeType {
		name: string;
		schema: Schema;
		spec: any;
		contentMatch: ContentMatch;
		inlineContent: boolean;
		isBlock: boolean;
		isText: boolean;
		isInline: boolean;
		isTextblock: boolean;
		isLeaf: boolean;
		isAtom: boolean;
		whitespace: string;
	}

	export interface MarkType {
		name: string;
		schema: Schema;
		spec: any;
	}

	export interface ContentMatch {
		validEnd: boolean;
		matchType(type: NodeType): ContentMatch | null;
		matchFragment(
			frag: Fragment,
			start?: number,
			end?: number,
		): ContentMatch | null;
		fillBefore(
			after: Fragment,
			toEnd?: boolean,
			startIndex?: number,
		): Fragment | null;
	}

	export interface NodeRange {
		$from: ResolvedPos;
		$to: ResolvedPos;
		depth: number;
		start: number;
		end: number;
		parent: Node;
		startIndex: number;
		endIndex: number;
	}

	export const Node: any;
	export const Schema: any;
	export const Fragment: any;
	export const Mark: any;
	export const Slice: any;
	export const ResolvedPos: any;
	export const NodeRange: any;
	export const NodeType: any;
	export const MarkType: any;
	export const ContentMatch: any;
	export const DOMParser: any;
	export const DOMSerializer: any;
}
