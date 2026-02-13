// Components
export { UnifiedSidebar, detectAppContext } from "./UnifiedSidebar";

// Provider & Hooks
export {
	SidebarProvider,
	useSidebar,
	useSidebarVisibility,
} from "../../hooks/use-sidebar";

// Types
export type {
	SidebarCategory,
	SidebarItem,
	SidebarConfig,
	SidebarData,
	AppContext,
} from "./types";

// Config
export { defaultSidebarConfig } from "./config";
