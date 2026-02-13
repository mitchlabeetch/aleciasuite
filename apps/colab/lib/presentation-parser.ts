export type Slide = {
	id: string;
	title: string;
	content: { type: string; content: string }[];
	notes?: string;
	rootImage?: {
		url: string;
		query: string;
	};
};

export function parsePresentationStream(text: string): Slide[] {
	const slides: Slide[] = [];
	const slideRegex = /<SLIDE>([\s\S]*?)<\/SLIDE>/g;
	let match: RegExpExecArray | null;

	// biome-ignore lint/suspicious/noAssignInExpressions: Standard regex loop pattern
	while ((match = slideRegex.exec(text)) !== null) {
		const slideContent = match[1];
		const titleMatch = /<TITLE>(.*?)<\/TITLE>/.exec(slideContent);
		const title = titleMatch ? titleMatch[1].trim() : "Untitled Slide";

		const content: { type: string; content: string }[] = [];

		// Parse bullets
		const bulletRegex = /<BULLET>(.*?)<\/BULLET>/g;
		let bulletMatch: RegExpExecArray | null;
		// biome-ignore lint/suspicious/noAssignInExpressions: Standard regex loop pattern
		while ((bulletMatch = bulletRegex.exec(slideContent)) !== null) {
			content.push({
				type: "bullet",
				content: bulletMatch[1].trim(),
			});
		}

		// Parse image (simple implementation for now)
		const imageMatch = /<IMAGE>(.*?)<\/IMAGE>/.exec(slideContent);
		let rootImage: { url: string; query: string } | undefined;
		if (imageMatch) {
			rootImage = {
				url: "", // Placeholder, would be generated
				query: imageMatch[1].trim(),
			};
		}

		slides.push({
			id: Math.random().toString(36).substring(7), // Temporary ID generation
			title,
			content,
			rootImage,
		});
	}

	return slides;
}
