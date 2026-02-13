// Convex Auth Configuration for Clerk
// Docs: https://docs.convex.dev/auth/clerk
// The domain should be the Issuer URL from Clerk JWT template

export default {
	providers: [
		{
			// Clerk custom domain issuer URL
			// Format: https://clerk.<your-domain>.com for production
			domain: "https://clerk.alecia.markets",
			applicationID: "convex",
		},
	],
};
