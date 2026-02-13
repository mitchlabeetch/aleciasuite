// Main UI Package Exports

// Sidebar
export {
	UnifiedSidebar,
	SidebarProvider,
	useSidebar,
	useSidebarVisibility,
	defaultSidebarConfig,
	detectAppContext,
} from "./components/sidebar";
export type {
	SidebarCategory,
	SidebarItem,
	SidebarConfig,
	SidebarData,
	AppContext,
} from "./components/sidebar";

// Hooks
export * from "./hooks";

// Utils
export * from "./utils";
