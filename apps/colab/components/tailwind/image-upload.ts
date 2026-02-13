export const uploadFn = async (file: File, _view: any, _pos: number) => {
	// Mock upload or use Vercel Blob if keys are configured
	// For now, we'll return a local URL to preview
	return URL.createObjectURL(file);
};
