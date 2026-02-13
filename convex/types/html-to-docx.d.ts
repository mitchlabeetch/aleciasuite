declare module "html-to-docx" {
	function HTMLtoDOCX(
		html: string,
		headerHTML?: string | null,
		options?: Record<string, unknown>,
		vfsOptions?: Record<string, unknown>,
	): Promise<Blob>;
	export default HTMLtoDOCX;
}
