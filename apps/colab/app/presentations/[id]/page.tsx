import { SlideEditor } from "@/components/presentations/SlideEditor";
import React from "react";

interface PageProps {
	params: Promise<{
		id: string;
	}>;
}

export default function PresentationEditorPage({ params }: PageProps) {
	const { id } = React.use(params);
	return <SlideEditor presentationId={id} />;
}
