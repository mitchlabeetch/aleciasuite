# Accessibility Implementation Guide

## Quick Start for Developers

This guide shows you how to use the new accessibility features in your components.

---

## 1. Reduced Motion Support

### Option A: Using the useReducedMotion Hook

For existing Framer Motion components:

```tsx
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
    >
      Content
    </motion.div>
  );
}
```

### Option B: Using MotionSafe Component

Drop-in replacement for Framer Motion (automatically handles reduced motion):

```tsx
import { MotionSafe } from "@/components/ui/MotionSafe";

function MyComponent() {
  return (
    <MotionSafe.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      Content
    </MotionSafe.div>
  );
}
```

**When to use which:**
- Use **MotionSafe** for new components (simpler, automatic)
- Use **useReducedMotion hook** when you need fine-grained control

### Option C: Using Animation Library Helpers

```tsx
import { fadeInUp } from "@/lib/animations";
import { getReducedMotionVariants } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/useReducedMotion";

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();
  const variants = getReducedMotionVariants(fadeInUp, prefersReducedMotion);

  return (
    <motion.div variants={variants} initial="initial" animate="animate">
      Content
    </motion.div>
  );
}
```

---

## 2. Focus Management

### Basic Focus Styles

All interactive elements automatically get focus styles from global CSS. No extra work needed!

```tsx
// ✅ This button automatically gets focus styles
<button>Click me</button>

// ✅ This link automatically gets focus styles
<Link href="/about">About</Link>
```

### Custom Interactive Elements

If you're creating a custom interactive element, add proper attributes:

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  className="interactive-card" // Gets focus styles automatically
>
  Content
</div>
```

### Focus Trap for Modals

Use the `useFocusTrap` hook to trap focus within modals/dialogs:

```tsx
import { useFocusTrap } from "@/hooks/useFocusTrap";

function Modal({ isOpen, onClose }) {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      <button onClick={onClose}>Close</button>
      <h2>Modal Title</h2>
      <p>Modal content</p>
      <button>Action</button>
    </div>
  );
}
```

**Features:**
- Traps Tab/Shift+Tab within modal
- Escape key closes modal (via onClose callback)
- Restores focus when modal closes

---

## 3. ARIA Labels and Semantic HTML

### Landmark Regions

Add `aria-label` to sections for screen reader users:

```tsx
<section aria-label="Our key achievements">
  <h2>Key Stats</h2>
  {/* ... */}
</section>

<nav aria-label="Quick links to our services">
  {/* ... */}
</nav>
```

### Descriptive Links

Make links meaningful when read out of context:

```tsx
// ❌ Bad - "Learn more" doesn't tell screen reader users where it goes
<Link href="/services">
  <h3>Our Services</h3>
  <p>We offer comprehensive solutions</p>
  <span>Learn more →</span>
</Link>

// ✅ Good - Clear context for screen readers
<Link 
  href="/services"
  aria-label="Our Services: We offer comprehensive solutions"
>
  <h3>Our Services</h3>
  <p>We offer comprehensive solutions</p>
  <span aria-hidden="true">Learn more →</span>
</Link>
```

### Hiding Decorative Content

Use `aria-hidden="true"` for decorative icons and arrows:

```tsx
<button>
  Save Changes
  <CheckIcon aria-hidden="true" />
</button>

<Link href="/next-page">
  Continue
  <ArrowRight className="ml-2" aria-hidden="true" />
</Link>
```

### Form Accessibility

Ensure all inputs have labels:

```tsx
// ✅ Good - Explicit label association
<div>
  <label htmlFor="email">Email Address</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-describedby="email-hint"
  />
  <span id="email-hint">We'll never share your email</span>
</div>

// ❌ Bad - No label
<input type="email" placeholder="Enter email" />
```

---

## 4. Live Regions (Dynamic Content)

### Announcing Updates to Screen Readers

Use the `useAnnouncer` hook for dynamic content changes:

```tsx
import { useAnnouncer } from "@/hooks/useAnnouncer";

function SearchResults() {
  const announce = useAnnouncer();
  const [results, setResults] = useState([]);

  const handleSearch = async (query) => {
    const data = await searchAPI(query);
    setResults(data);
    
    // Announce to screen readers
    announce(`Found ${data.length} results for ${query}`, 'polite');
  };

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      <div>{results.map(result => <ResultCard key={result.id} {...result} />)}</div>
    </div>
  );
}
```

**Priorities:**
- `'polite'` - Waits for current speech to finish (use for most updates)
- `'assertive'` - Interrupts current speech (use for errors/urgent updates)

### Form Validation

```tsx
const announce = useAnnouncer();

const handleSubmit = async (data) => {
  try {
    await submitForm(data);
    announce('Form submitted successfully', 'polite');
  } catch (error) {
    announce('Error: Please fix the highlighted fields', 'assertive');
  }
};
```

---

## 5. Interactive Elements Checklist

When creating interactive elements, ensure:

### ✅ Buttons

```tsx
<button
  type="button" // or "submit"
  onClick={handleClick}
  aria-label="Close modal" // If button only has icon
  disabled={isLoading}
>
  {isLoading ? 'Loading...' : 'Submit'}
</button>
```

### ✅ Links

```tsx
<Link
  href="/contact"
  aria-label="Contact our team" // If link text isn't descriptive
  aria-current={isActive ? "page" : undefined} // For active nav items
>
  Contact
</Link>
```

### ✅ Custom Interactive Elements

```tsx
<div
  role="button" // or "link", "tab", etc.
  tabIndex={0} // Make focusable
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  aria-pressed={isPressed} // For toggle buttons
  aria-expanded={isExpanded} // For expandable elements
>
  Toggle
</div>
```

### ✅ Images

```tsx
// Informative images
<Image
  src="/product.jpg"
  alt="Blue ceramic vase with white flowers"
  width={400}
  height={300}
/>

// Decorative images
<Image
  src="/decoration.jpg"
  alt=""
  aria-hidden="true"
  width={400}
  height={300}
/>
```

---

## 6. Common Patterns

### Expandable Sections (Accordions)

```tsx
function Accordion({ title, children }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = useId();

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        {title}
        <ChevronDown aria-hidden="true" />
      </button>
      
      {isExpanded && (
        <div id={contentId} role="region">
          {children}
        </div>
      )}
    </div>
  );
}
```

### Tabs

```tsx
function Tabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div role="tablist" aria-label="Product features">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === index}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          hidden={activeTab !== index}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

### Loading States

```tsx
function DataTable({ isLoading, data }) {
  const announce = useAnnouncer();

  useEffect(() => {
    if (isLoading) {
      announce('Loading data, please wait', 'polite');
    } else {
      announce(`Loaded ${data.length} items`, 'polite');
    }
  }, [isLoading, data, announce]);

  return (
    <div>
      {isLoading ? (
        <div role="status" aria-live="polite">
          Loading...
        </div>
      ) : (
        <table>
          {/* data */}
        </table>
      )}
    </div>
  );
}
```

---

## 7. Testing Your Components

### Manual Keyboard Testing

1. **Unplug your mouse**
2. Navigate using only keyboard:
   - `Tab` - Move forward
   - `Shift + Tab` - Move backward
   - `Enter` - Activate buttons/links
   - `Space` - Activate buttons/checkboxes
   - `Escape` - Close modals/menus
   - Arrow keys - Navigate within component

3. **Check:**
   - Can you reach all interactive elements?
   - Is the focus indicator clearly visible?
   - Is the tab order logical?
   - Can you close modals/menus?

### Screen Reader Testing

**macOS - VoiceOver:**
```bash
# Turn on: Cmd + F5
# Navigate: Control + Option + Arrow Keys
# Interact: Control + Option + Space
```

**Windows - NVDA (free):**
```bash
# Download from: https://www.nvaccess.org/
# Navigate: Arrow Keys
# Interact: Enter
```

### Reduced Motion Testing

**Chrome DevTools:**
1. Open DevTools (F12)
2. Press `Cmd/Ctrl + Shift + P`
3. Type "Emulate CSS prefers-reduced-motion"
4. Select "reduce"
5. Verify animations are disabled

**System Settings:**
- macOS: System Preferences → Accessibility → Display → Reduce motion
- Windows: Settings → Ease of Access → Display → Show animations
- Test that your component still works without animations

---

## 8. Common Mistakes to Avoid

### ❌ Don't Do This

```tsx
// Missing keyboard support
<div onClick={handleClick}>Click me</div>

// Non-descriptive link text
<Link href="/services">Click here</Link>

// No label for input
<input type="text" placeholder="Name" />

// Motion without reduced motion support
<motion.div animate={{ x: 100 }} transition={{ duration: 2 }}>

// Missing alt text
<img src="/product.jpg" />

// Disabled button without explanation
<button disabled>Submit</button>
```

### ✅ Do This Instead

```tsx
// Proper keyboard support
<button onClick={handleClick}>Click me</button>

// Descriptive link text
<Link href="/services">View our services</Link>

// Labeled input
<label htmlFor="name">Name</label>
<input id="name" type="text" />

// Motion with reduced motion support
const prefersReducedMotion = useReducedMotion();
<motion.div 
  animate={{ x: prefersReducedMotion ? 0 : 100 }} 
  transition={{ duration: prefersReducedMotion ? 0 : 2 }}
>

// Alt text for all images
<img src="/product.jpg" alt="Blue ceramic vase" />

// Disabled button with explanation
<button disabled aria-label="Submit button disabled - please complete all required fields">
  Submit
</button>
```

---

## 9. Quick Reference

### Hooks

```tsx
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useFocusVisible } from "@/hooks/useFocusVisible";
import { useAnnouncer } from "@/hooks/useAnnouncer";
```

### Components

```tsx
import { MotionSafe } from "@/components/ui/MotionSafe";
```

### Animation Helpers

```tsx
import { 
  getReducedMotionVariants, 
  getReducedMotionTransition 
} from "@/lib/animations";
```

### ARIA Attributes Cheat Sheet

```tsx
// State
aria-expanded={boolean}      // For expandable elements
aria-pressed={boolean}        // For toggle buttons
aria-selected={boolean}       // For selectable items
aria-checked={boolean}        // For checkboxes
aria-current="page"           // For active navigation items

// Relationships
aria-label="descriptive text"  // Accessible name
aria-labelledby="id"           // Points to label element
aria-describedby="id"          // Points to description
aria-controls="id"             // Element this controls
aria-owns="id"                 // Owned child elements

// Properties
aria-required={boolean}        // For required fields
aria-invalid={boolean}         // For invalid inputs
aria-hidden={boolean}          // Hide from screen readers
aria-live="polite|assertive"   // Live region updates
aria-modal={boolean}           // For modal dialogs
```

---

## 10. Resources

- **Full Audit Report**: `/apps/website/WCAG_ACCESSIBILITY_AUDIT.md`
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **A11y Project**: https://www.a11yproject.com/

---

## Need Help?

1. Check the full audit report for detailed examples
2. Test with axe DevTools browser extension
3. Review existing accessible components in the codebase
4. Ask for code review focusing on accessibility

**Remember**: Accessibility is not optional - it's a core requirement for all new components!
