declare module "html-to-text" {
	interface SelectorDefinition {
		selector: string;
		format?:
			| "heading"
			| "paragraph"
			| "unorderedList"
			| "orderedList"
			| "anchor"
			| "skip"
			| "inline"
			| "block"
			| "dataTable"
			| "image"
			| "lineBreak"
			| "wbr"
			| "horizontalLine"
			| "blockquote"
			| string;
		options?: Record<string, unknown>;
	}

	interface HtmlToTextOptions {
		baseElements?: {
			selectors?: string[];
			orderBy?: "selectors" | "occurrence";
			returnDomByDefault?: boolean;
		};
		decodeEntities?: boolean;
		encodeCharacters?: Record<string, string>;
		formatters?: Record<
			string,
			(
				elem: unknown,
				walk: unknown,
				builder: unknown,
				formatOptions: unknown,
			) => void
		>;
		limits?: {
			ellipsis?: string;
			maxBaseElements?: number;
			maxChildNodes?: number;
			maxDepth?: number;
			maxInputLength?: number;
		};
		longWordSplit?: {
			forceWrapOnLimit?: boolean;
			wrapCharacters?: string[];
		};
		preserveNewlines?: boolean;
		selectors?: SelectorDefinition[];
		whitespaceCharacters?: string;
		wordwrap?: number | false | null;
	}

	export function convert(html: string, options?: HtmlToTextOptions): string;

	export function compile(
		options?: HtmlToTextOptions,
	): (html: string) => string;

	export function htmlToText(html: string, options?: HtmlToTextOptions): string;
}
