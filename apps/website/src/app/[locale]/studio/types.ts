export interface Transaction {
	_id: string;
	slug: string;
	clientName: string;
	clientLogo?: string;
	acquirerName?: string;
	acquirerLogo?: string;
	sector: string;
	region?: string;
	year: number;
	mandateType: string;
	description?: string;
	isConfidential: boolean;
	isClientConfidential?: boolean;
	isAcquirerConfidential?: boolean;
	isPriorExperience: boolean;
}

export interface Theme {
	id: string;
	name: string;
	left: string;
	center: string;
	right: string;
	textColor: string;
}

export interface Typography {
	id: string;
	name: string;
	fontFamily: string;
}

export type FormatType = "square" | "landscape";

export interface PreviewDimensions {
	width: number;
	height: number;
	displayWidth: number;
}
