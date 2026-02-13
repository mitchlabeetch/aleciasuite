// Transaction ID type (previously Convex Id, now using string)
type TransactionId = string;

export interface Transaction {
	_id: TransactionId;
	clientName: string;
	acquirerName?: string;
	mandateType: string;
	year: number;
	sector: string;
	slug: string;
	clientLogo?: string;
	acquirerLogo?: string;
}

export interface Theme {
	id: string;
	name: string;
	left: string;
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
