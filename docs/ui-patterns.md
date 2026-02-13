# Alecia UI/UX Patterns Codex

This document serves as the source of truth for UI/UX patterns in the Alecia admin panel. It synthesizes best practices from Odoo (ERP), OpenBB (Finance), and Shadcn (Components) to ensure a cohesive, high-performance interface.

## 1. List Views & Actions (Source: Odoo)

### Pattern: Dense List Views with Inline Actions
Tables should be dense to maximize data visibility without scrolling. Actions should be accessible directly from the row.

*   **Row Height:** Compact (e.g., `h-10` or `h-12`).
*   **Typography:** Use `text-sm` or `text-xs` for data cells.
*   **Actions:**
    *   Do not rely solely on opening the item to perform common actions.
    *   Include a "three-dot" menu (`...`) at the end of each row.
    *   **Common Actions:** Edit, Delete, Change Status, Duplicate.
*   **Status Indicators:** Use colored badges or dots for status (e.g., Active/Inactive), but ensure color contrast adheres to the Alecia palette.

### Pattern: Breadcrumb Navigation for Hierarchy
Deeply nested views must provide a clear path back to the root.

*   **Structure:** `Section > Resource List > Resource Name > Sub-resource`.
*   **Placement:** Top of the page, below the header.
*   **Behavior:** Last item is current page (non-clickable), previous items are links.

## 2. Navigation & Command (Source: OpenBB)

### Pattern: Keyboard-First Navigation
The interface should be navigable primarily via keyboard for power users.

*   **Command Palette:**
    *   Trigger: `Cmd+K` (Mac) or `Ctrl+K` (Windows).
    *   Functionality: Navigation to pages, search resources, execute global actions (e.g., "New Deal").
    *   Component: Use `ActionSearchBar` (or equivalent `Command` component).
*   **Shortcuts:** Document and implement shortcuts for common actions (e.g., `Cmd+S` to save).

### Pattern: High-Density Data Grids
Financial data requires precision and comparison.

*   **Font:** Monospace for all financial figures (`font-mono`).
*   **Alignment:** Right-align all currency and numeric columns.
*   **Formatting:**
    *   Use the Alecia formatter: `50 m€`, `100 k€`.
    *   No unnecessary decimal places for large numbers.
*   **Visual Cues:**
    *   Positive trends: Green (use Alecia compatible green or standard success).
    *   Negative trends: Red (`--alecia-red-accent`).
    *   Neutral: Grey (`--alecia-grey-titanium`).

## 3. Layout Structure (Source: Shadcn Block)

### Pattern: Collapsible Sidebar + Bottom Dock Hybrid
A hybrid approach to manage screen real estate and accessibility.

*   **Sidebar (Left):**
    *   Role: High-level context and module switching (e.g., Dashboard, Deals, CRM).
    *   Behavior: Collapsible to icons-only mode to save space.
*   **Bottom Dock (Optional/Contextual):**
    *   Role: Frequent cross-cutting tools or active task management.
    *   Examples: Quick note taking, Recent items, Global search trigger.
    *   Implementation: Fixed at bottom, semi-transparent (glassmorphism).

## 4. Brand Enforcement

*   **Colors:** Strictly adhere to CSS variables (`--alecia-blue-midnight`, `--alecia-red-accent`, etc.).
*   **Terminology:**
    *   **EBE** (Excédent Brut d'Exploitation) instead of EBITDA.
    *   **Chiffre d'Affaires** instead of Revenue.
