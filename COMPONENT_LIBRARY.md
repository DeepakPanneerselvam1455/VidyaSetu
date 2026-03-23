# VidyaSetu Component Library Documentation

## Overview

The VidyaSetu component library provides a comprehensive set of reusable UI components built with React 19, TypeScript, and Tailwind CSS. All components support light/dark theming through CSS custom properties and are designed with accessibility in mind.

## Table of Contents

1. [Button](#button)
2. [Card](#card)
3. [Input](#input)
4. [Textarea](#textarea)
5. [Select](#select)
6. [Dialog](#dialog)
7. [Badge](#badge)
8. [DropdownMenu](#dropdownmenu)
9. [PasswordStrengthMeter](#passwordstrengthmeter)
10. [FormError](#formerror)
11. [Icons](#icons)

---

## Button

### Purpose
Versatile button component with multiple variants, sizes, and states for user interactions throughout the application.

### Props Interface

```typescript
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { 
    asChild?: boolean 
  }

// Variants
variant?: "default" | "primary" | "destructive" | "outline" | "secondary" | "ghost" | "link"
size?: "default" | "sm" | "lg" | "icon"
```

### Variants

- **default**: Gradient primary button with shadow and hover lift effect (premium look)
- **primary**: Solid primary color without gradient
- **destructive**: Red button for dangerous actions (delete, remove)
- **outline**: Transparent with border, changes on hover
- **secondary**: Subtle background with border
- **ghost**: Minimal styling, text-only appearance
- **link**: Underlined text link style

### Sizes

- **default**: `h-11 px-5 py-2.5` (mobile), `h-10 px-5 py-2` (desktop)
- **sm**: `h-10 px-4` (mobile), `h-9` (desktop) with smaller text
- **lg**: `h-12 px-8` with larger text
- **icon**: `h-11 w-11` (mobile), `h-10 w-10` (desktop) square button

### Usage Examples

```tsx
import { Button } from './components/ui/Button';

// Default gradient button
<Button onClick={handleSubmit}>Submit</Button>

// Destructive action
<Button variant="destructive" onClick={handleDelete}>
  Delete Course
</Button>

// Outline button
<Button variant="outline" size="sm">
  Cancel
</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Settings className="h-5 w-5" />
</Button>

// Link style
<Button variant="link" onClick={handleNavigate}>
  Learn More
</Button>

// Disabled state
<Button disabled>Processing...</Button>
```

### Accessibility Features

- Semantic `<button>` element
- Supports all native button attributes (`disabled`, `type`, `aria-*`)
- Focus visible ring with offset (`focus-visible:ring-2`)
- Disabled state prevents pointer events and reduces opacity
- Keyboard navigation support (Enter/Space)

### Best Practices

- Use `variant="destructive"` for delete/remove actions
- Use `variant="outline"` or `variant="secondary"` for cancel actions
- Use `variant="ghost"` for icon-only buttons in toolbars
- Always provide accessible labels for icon buttons using `aria-label`
- Use `size="icon"` for square icon buttons to maintain aspect ratio

---

## Card

### Purpose
Container component for grouping related content with consistent styling, borders, and optional hover effects.

### Props Interface

```typescript
// Card
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean; // Enable hover lift effect (default: true)
}

// Sub-components
CardHeader: React.HTMLAttributes<HTMLDivElement>
CardTitle: React.HTMLAttributes<HTMLHeadingElement>
CardDescription: React.HTMLAttributes<HTMLParagraphElement>
CardContent: React.HTMLAttributes<HTMLDivElement>
CardFooter: React.HTMLAttributes<HTMLDivElement>
```

### Styling Options

- **Background**: Uses `var(--card-bg)` CSS custom property
- **Border**: Uses `var(--border-default)` with rounded corners (`rounded-xl`)
- **Shadow**: Default shadow from `var(--shadow-card)`
- **Hover**: Optional lift effect with increased shadow (`hover:shadow-lg hover:-translate-y-0.5`)

### Usage Examples

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/Card';

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Course Title</CardTitle>
    <CardDescription>Brief description of the course</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Enroll Now</Button>
  </CardFooter>
</Card>

// Card without hover effect
<Card hover={false}>
  <CardContent>Static content</CardContent>
</Card>

// Minimal card
<Card>
  <CardContent>
    Simple content without header or footer
  </CardContent>
</Card>
```

### Accessibility Features

- Semantic HTML structure with proper heading hierarchy
- Color contrast meets WCAG AA standards
- Responsive padding (larger on desktop: `p-6`, smaller on mobile: `p-4`)

### Best Practices

- Use `CardTitle` for the main heading (renders as `<h3>`)
- Use `CardDescription` for secondary text with muted color
- Disable hover effect (`hover={false}`) for non-interactive cards
- Keep card content focused on a single topic or action
- Use consistent card layouts across similar content types

---

## Input

### Purpose
Text input component with validation support, error states, and theme-aware styling.

### Props Interface

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | null; // Error message to display
}
```

### Validation States

- **Normal**: Default border color from `var(--border-default)`
- **Error**: Red border (`border-red-500`) when `error` prop is provided
- **Focus**: Border highlight on focus
- **Disabled**: Reduced opacity and cursor change

### Usage Examples

```tsx
import { Input } from './components/ui/Input';
import { FormError } from './components/ui/FormError';

// Basic input
<Input 
  type="text" 
  placeholder="Enter your name" 
/>

// Input with error
<div>
  <Input 
    id="email"
    type="email" 
    placeholder="Email address"
    error={emailError}
  />
  <FormError error={emailError} />
</div>

// Password input
<Input 
  type="password" 
  placeholder="Password"
  autoComplete="current-password"
/>

// Disabled input
<Input 
  value="Read-only value" 
  disabled 
/>

// With label
<div>
  <label htmlFor="username" className="block text-sm font-medium mb-2">
    Username
  </label>
  <Input 
    id="username"
    type="text"
    placeholder="Choose a username"
  />
</div>
```

### Accessibility Features

- `aria-invalid` set to `true` when error is present
- `aria-describedby` links to error message element
- Supports all native input attributes (`required`, `pattern`, `minLength`, etc.)
- Proper focus management with visible outline
- Disabled state prevents interaction

### Best Practices

- Always pair with a `<label>` element using matching `id` and `htmlFor`
- Use `FormError` component to display validation errors
- Provide clear placeholder text as hints
- Use appropriate `type` attribute (email, password, tel, url, etc.)
- Set `autoComplete` for better UX (name, email, current-password, etc.)
- Mobile-optimized height: `h-11` on mobile, `h-10` on desktop

---

## Textarea

### Purpose
Multi-line text input component for longer content with validation support.

### Props Interface

```typescript
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | null; // Error message to display
}
```

### Sizing

- **Min Height**: `min-h-[100px]` on mobile, `min-h-[80px]` on desktop
- **Width**: Full width by default (`w-full`)
- **Resizable**: Browser default resize behavior

### Usage Examples

```tsx
import { Textarea } from './components/ui/Textarea';
import { FormError } from './components/ui/FormError';

// Basic textarea
<Textarea 
  placeholder="Enter your message..." 
  rows={4}
/>

// With error state
<div>
  <Textarea 
    id="description"
    placeholder="Course description"
    error={descriptionError}
    rows={6}
  />
  <FormError error={descriptionError} />
</div>

// With character limit
<div>
  <Textarea 
    placeholder="Bio (max 500 characters)"
    maxLength={500}
    value={bio}
    onChange={(e) => setBio(e.target.value)}
  />
  <p className="text-xs text-right mt-1">
    {bio.length}/500 characters
  </p>
</div>

// Disabled textarea
<Textarea 
  value="Read-only content" 
  disabled 
/>
```

### Accessibility Features

- `aria-invalid` set when error is present
- `aria-describedby` links to error message
- Supports `required`, `maxLength`, `minLength` attributes
- Proper focus management
- Disabled state prevents editing

### Best Practices

- Set appropriate `rows` attribute for expected content length
- Use `maxLength` to enforce character limits
- Display character count for limited inputs
- Provide clear placeholder text
- Use with `FormError` for validation feedback

---

## Select

### Purpose
Dropdown select component with validation support and theme-aware styling.

### Props Interface

```typescript
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string | null; // Error message to display
}
```

### Usage Examples

```tsx
import { Select } from './components/ui/Select';
import { FormError } from './components/ui/FormError';

// Basic select
<Select>
  <option value="">Select a category</option>
  <option value="math">Mathematics</option>
  <option value="science">Science</option>
  <option value="history">History</option>
</Select>

// With error state
<div>
  <Select 
    id="difficulty"
    error={difficultyError}
    value={difficulty}
    onChange={(e) => setDifficulty(e.target.value)}
  >
    <option value="">Select difficulty</option>
    <option value="easy">Easy</option>
    <option value="medium">Medium</option>
    <option value="hard">Hard</option>
  </Select>
  <FormError error={difficultyError} />
</div>

// Disabled select
<Select disabled>
  <option>Not available</option>
</Select>

// With label
<div>
  <label htmlFor="role" className="block text-sm font-medium mb-2">
    User Role
  </label>
  <Select id="role" required>
    <option value="">Choose a role</option>
    <option value="student">Student</option>
    <option value="mentor">Mentor</option>
  </Select>
</div>
```

### Accessibility Features

- `aria-invalid` set when error is present
- `aria-describedby` links to error message
- Keyboard navigation (Arrow keys, Enter, Escape)
- Supports `required` and `disabled` attributes
- Proper focus management

### Best Practices

- Always include a default/placeholder option with empty value
- Use descriptive option text
- Pair with labels using `htmlFor` and `id`
- Mobile-optimized height: `h-11` on mobile, `h-10` on desktop
- Use `FormError` component for validation feedback

---

## Dialog

### Purpose
Modal dialog component with glass morphism effect, backdrop blur, and portal rendering for overlays and confirmations.

### Props Interface

```typescript
interface DialogProps {
  isOpen: boolean;           // Controls dialog visibility
  onClose: () => void;       // Callback when dialog should close
  children: React.ReactNode; // Dialog content
  title?: string;            // Optional dialog title
  description?: string;      // Optional dialog description
}
```

### Styling Features

- **Glass Morphism**: Backdrop blur with semi-transparent background
- **Portal Rendering**: Renders at document body level to avoid z-index issues
- **Animations**: Fade-in and zoom-in entrance animation
- **Responsive**: Max width with mobile padding
- **Close Button**: Positioned in top-right corner

### Usage Examples

```tsx
import Dialog from './components/ui/Dialog';
import { Button } from './components/ui/Button';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Dialog
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        description="Are you sure you want to proceed?"
      >
        <div className="space-y-4">
          <p>This action cannot be undone.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

// Form dialog
<Dialog
  isOpen={showForm}
  onClose={() => setShowForm(false)}
  title="Add New Course"
>
  <form onSubmit={handleSubmit}>
    <div className="space-y-4">
      <Input placeholder="Course title" />
      <Textarea placeholder="Description" />
      <Button type="submit">Create Course</Button>
    </div>
  </form>
</Dialog>
```

### Accessibility Features

- Prevents body scroll when open
- Click outside to close (backdrop click)
- Close button with screen reader text
- Focus trap within dialog
- Escape key to close (browser default)
- `role="dialog"` implicit through modal behavior

### Best Practices

- Use for confirmations, forms, and important messages
- Keep content focused and concise
- Provide clear close actions (X button, Cancel button, backdrop click)
- Avoid nested dialogs
- Use descriptive titles
- Max height with scroll for long content (`max-h-[80vh]`)

---

## Badge

### Purpose
Small label component for status indicators, tags, and categorical information.

### Props Interface

```typescript
type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>

// Variants
variant?: "default" | "secondary" | "destructive" | "success" | "outline"
```

### Variants

- **default**: Primary color background with white text
- **secondary**: Subtle background with border
- **destructive**: Red background for errors or warnings
- **success**: Green background for success states (theme-aware)
- **outline**: Transparent with border

### Usage Examples

```tsx
import { Badge } from './components/ui/Badge';

// Status indicators
<Badge variant="success">Active</Badge>
<Badge variant="destructive">Inactive</Badge>
<Badge>Pending</Badge>

// Course difficulty
<Badge variant="outline">Easy</Badge>
<Badge variant="secondary">Medium</Badge>
<Badge variant="destructive">Hard</Badge>

// Tags
<div className="flex gap-2 flex-wrap">
  <Badge>Mathematics</Badge>
  <Badge>Science</Badge>
  <Badge>Physics</Badge>
</div>

// With icons
<Badge className="flex items-center gap-1">
  <CheckCircle className="h-3 w-3" />
  Completed
</Badge>

// Custom styling
<Badge className="text-xs">
  New
</Badge>
```

### Accessibility Features

- Semantic HTML (`<div>` with appropriate styling)
- Color is not the only indicator (text labels included)
- Sufficient color contrast for readability

### Best Practices

- Use consistent variants for similar states across the app
- Keep text short (1-2 words)
- Use `variant="success"` for positive states
- Use `variant="destructive"` for errors or critical states
- Use `variant="outline"` for neutral tags
- Combine with icons for enhanced meaning

---

## DropdownMenu

### Purpose
Context menu component with trigger, content, items, labels, and separators for action menus and navigation.

### Props Interface

```typescript
// Root component
<DropdownMenu>
  {children}
</DropdownMenu>

// Trigger
<DropdownMenuTrigger asChild?: boolean>
  {children}
</DropdownMenuTrigger>

// Content
<DropdownMenuContent 
  align?: "start" | "end"  // Alignment relative to trigger
  className?: string
>
  {children}
</DropdownMenuContent>

// Item
<DropdownMenuItem asChild?: boolean>
  {children}
</DropdownMenuItem>

// Label
<DropdownMenuLabel>
  {children}
</DropdownMenuLabel>

// Separator
<DropdownMenuSeparator />
```

### Usage Examples

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './components/ui/DropdownMenu';
import { Button } from './components/ui/Button';
import { MoreHorizontal, Edit, Trash2, Eye } from './components/ui/Icons';

// Basic dropdown
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-5 w-5" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleView}>
      <Eye className="h-4 w-4 mr-2" />
      View Details
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleEdit}>
      <Edit className="h-4 w-4 mr-2" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleDelete}>
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// With labels and sections
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      Actions
      <ChevronDown className="ml-2 h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Course Actions</DropdownMenuLabel>
    <DropdownMenuItem onClick={handleEnroll}>
      Enroll Students
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleExport}>
      Export Data
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuLabel>Danger Zone</DropdownMenuLabel>
    <DropdownMenuItem onClick={handleArchive}>
      Archive Course
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// User menu
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="flex items-center gap-2">
      <img src={avatar} className="h-8 w-8 rounded-full" />
      <span>{userName}</span>
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuItem onClick={() => navigate('/profile')}>
      Profile
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => navigate('/settings')}>
      Settings
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleLogout}>
      Log Out
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Accessibility Features

- `role="menu"` and `role="menuitem"` for proper semantics
- `aria-haspopup="menu"` on trigger
- `aria-expanded` reflects open/close state
- Click outside to close
- Automatic focus management
- Keyboard navigation support

### Best Practices

- Use `asChild` on trigger to compose with custom elements
- Use `align="end"` for right-aligned menus
- Group related items with labels and separators
- Include icons for visual clarity
- Keep menu items concise (1-3 words)
- Use separators to divide logical sections
- Close menu automatically after item selection

---

## PasswordStrengthMeter

### Purpose
Visual indicator for password strength with color-coded bar and text feedback.

### Props Interface

```typescript
interface PasswordStrengthProps {
  level: 'none' | 'very weak' | 'weak' | 'medium' | 'strong' | 'very strong';
  text: string; // Display text for the strength level
}
```

### Strength Levels

| Level | Color | Width | Use Case |
|-------|-------|-------|----------|
| none | - | 0% | No password entered |
| very weak | Red | 20% | < 6 characters |
| weak | Orange | 40% | 6-8 characters, no variety |
| medium | Yellow | 60% | 8+ characters, some variety |
| strong | Lime | 80% | 10+ characters, good variety |
| very strong | Green | 100% | 12+ characters, excellent variety |

### Usage Examples

```tsx
import PasswordStrengthMeter from './components/ui/PasswordStrengthMeter';
import { Input } from './components/ui/Input';

function PasswordInput() {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState<{
    level: 'none' | 'very weak' | 'weak' | 'medium' | 'strong' | 'very strong';
    text: string;
  }>({ level: 'none', text: '' });

  const calculateStrength = (pwd: string) => {
    if (!pwd) return { level: 'none', text: '' };
    if (pwd.length < 6) return { level: 'very weak', text: 'Very Weak' };
    if (pwd.length < 8) return { level: 'weak', text: 'Weak' };
    
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const variety = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (pwd.length >= 12 && variety >= 3) return { level: 'very strong', text: 'Very Strong' };
    if (pwd.length >= 10 && variety >= 3) return { level: 'strong', text: 'Strong' };
    return { level: 'medium', text: 'Medium' };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setStrength(calculateStrength(pwd));
  };

  return (
    <div>
      <Input
        type="password"
        value={password}
        onChange={handleChange}
        placeholder="Enter password"
      />
      <PasswordStrengthMeter level={strength.level} text={strength.text} />
    </div>
  );
}
```

### Accessibility Features

- Color-coded with text labels (not relying on color alone)
- Smooth transition animations for visual feedback
- Hidden when no password is entered (maintains layout space)

### Best Practices

- Display immediately as user types
- Provide clear text feedback alongside color
- Use in registration and password change forms
- Consider password requirements in strength calculation
- Encourage strong passwords with visual feedback

---

## FormError

### Purpose
Consistent error message display component with icon for form validation feedback.

### Props Interface

```typescript
interface FormErrorProps {
  error?: string | null; // Error message to display
  className?: string;     // Additional CSS classes
}
```

### Usage Examples

```tsx
import { FormError } from './components/ui/FormError';
import { Input } from './components/ui/Input';

// With Input
<div>
  <Input 
    id="email"
    type="email"
    error={emailError}
  />
  <FormError error={emailError} />
</div>

// With Textarea
<div>
  <Textarea 
    id="description"
    error={descError}
  />
  <FormError error={descError} />
</div>

// With Select
<div>
  <Select error={categoryError}>
    <option value="">Select category</option>
  </Select>
  <FormError error={categoryError} />
</div>

// Custom styling
<FormError 
  error="This field is required" 
  className="mt-2"
/>

// Conditional rendering (component handles this internally)
<FormError error={formErrors.username} />
```

### Accessibility Features

- `role="alert"` for screen reader announcements
- `aria-live="polite"` for dynamic error updates
- Alert circle icon for visual indication
- Red color with sufficient contrast
- Returns `null` when no error (no DOM element)

### Best Practices

- Always pair with form inputs (Input, Textarea, Select)
- Display below the associated input field
- Keep error messages clear and actionable
- Use consistent error message patterns
- Component automatically handles null/undefined errors
- Icon and text provide redundant error indication

---

## Icons

### Purpose
Comprehensive icon library with SVG components for consistent iconography throughout the application.

### Available Icon Categories

1. **Navigation & Layout**: LayoutDashboard, Home, Menu, X
2. **Course & Learning**: BookOpen, Library, GraduationCap
3. **Quiz & Assessment**: ClipboardCheck, ClipboardList, FileQuestion, Sparkles
4. **Progress & Analytics**: TrendingUp, BarChart3, AreaChart, FileBarChart
5. **Communication**: Video, MessageCircle, UserStar, HeartHandshake
6. **User & People**: Users, UserPlus, UserMinus, Presentation
7. **Actions**: Plus, PlusCircle, Check, CheckCircle, HelpCircle
8. **System & Settings**: Settings, Shield, ShieldCheck, ShieldX
9. **Theme**: Sun, Moon
10. **Utility**: ChevronDown, ChevronRight, Info, AlertTriangle, LogIn, LogOut, Search, Calendar, Clock, Mail, Eye, EyeOff, Download, Upload, Trash2, Edit, MoreHorizontal, ExternalLink, RefreshCw, Copy, Filter, Star, Award, Activity, Zap

### Props Interface

```typescript
type IconProps = React.SVGProps<SVGSVGElement>;

// All icons accept standard SVG props:
// - className: CSS classes for styling
// - width/height: Size (defaults to 24x24)
// - stroke: Stroke color (defaults to currentColor)
// - strokeWidth: Line thickness (defaults to 2)
// - fill: Fill color (defaults to none)
// - onClick: Click handler
// - aria-label: Accessibility label
```

### Usage Examples

```tsx
import { 
  BookOpen, 
  Users, 
  Settings, 
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle
} from './components/ui/Icons';

// Basic icon
<BookOpen className="h-5 w-5" />

// With color
<CheckCircle className="h-6 w-6 text-green-500" />

// In button
<Button variant="ghost" size="icon">
  <Settings className="h-5 w-5" />
</Button>

// With text
<div className="flex items-center gap-2">
  <Users className="h-4 w-4" />
  <span>125 Students</span>
</div>

// Status indicators
<div className="flex items-center gap-2">
  <CheckCircle className="h-5 w-5 text-green-500" />
  <span>Completed</span>
</div>

<div className="flex items-center gap-2">
  <AlertTriangle className="h-5 w-5 text-yellow-500" />
  <span>Warning</span>
</div>

// Navigation
<nav>
  <a href="#dashboard" className="flex items-center gap-3">
    <LayoutDashboard className="h-5 w-5" />
    Dashboard
  </a>
  <a href="#courses" className="flex items-center gap-3">
    <BookOpen className="h-5 w-5" />
    Courses
  </a>
</nav>

// Action buttons
<Button variant="outline" size="sm">
  <Plus className="h-4 w-4 mr-2" />
  Add Course
</Button>

<Button variant="destructive" size="sm">
  <Trash2 className="h-4 w-4 mr-2" />
  Delete
</Button>

// Theme toggle
<Button variant="ghost" size="icon" onClick={toggleTheme}>
  {theme === 'dark' ? (
    <Sun className="h-5 w-5" />
  ) : (
    <Moon className="h-5 w-5" />
  )}
</Button>

// Dropdown menu items
<DropdownMenuItem onClick={handleEdit}>
  <Edit className="h-4 w-4 mr-2" />
  Edit
</DropdownMenuItem>
```

### Common Icon Sizes

- **Extra Small**: `h-3 w-3` (12px) - Inline with small text
- **Small**: `h-4 w-4` (16px) - Buttons, menu items
- **Medium**: `h-5 w-5` (20px) - Navigation, default size
- **Large**: `h-6 w-6` (24px) - Headers, emphasis
- **Extra Large**: `h-8 w-8` (32px) - Feature highlights

### Accessibility Features

- Uses `currentColor` for stroke (inherits text color)
- Supports `aria-label` for screen readers
- Decorative icons should have `aria-hidden="true"`
- Interactive icons should have accessible labels

### Best Practices

- Use consistent sizes within similar contexts
- Pair icons with text labels for clarity
- Use semantic icons (trash for delete, plus for add)
- Apply color for status (green=success, red=error, yellow=warning)
- Use `currentColor` to inherit text color
- Add `aria-label` for icon-only buttons
- Keep stroke width consistent (default: 2)

### Icon Reference by Use Case

**Course Management**
- `BookOpen` - View courses
- `BookUp` - Upload course materials
- `Library` - Course library
- `GraduationCap` - Academic content

**Quiz & Assessment**
- `ClipboardCheck` - Completed quiz
- `ClipboardList` - Quiz list
- `FileQuestion` - Quiz questions
- `Sparkles` - AI-generated content
- `ClipboardEdit` - Edit quiz

**User Management**
- `Users` - User list
- `UserPlus` - Add user
- `UserMinus` - Remove user
- `UserStar` - Featured mentor

**Analytics & Progress**
- `TrendingUp` - Positive trend
- `TrendingDown` - Negative trend
- `BarChart3` - Statistics
- `AreaChart` - Progress chart
- `Target` - Goals

**Communication**
- `Video` - Video call
- `MessageCircle` - Chat/messages
- `Mail` - Email
- `HeartHandshake` - Mentorship

**Actions**
- `Plus` / `PlusCircle` - Add/create
- `Edit` / `Pencil` - Edit
- `Trash2` - Delete
- `Check` / `CheckCircle` - Confirm/complete
- `X` / `XCircle` - Close/cancel
- `RefreshCw` - Refresh/reload
- `Download` / `Upload` - File operations
- `Copy` - Duplicate
- `Search` - Search functionality

**Navigation**
- `Home` - Home page
- `LayoutDashboard` - Dashboard
- `ChevronRight` - Next/forward
- `ChevronDown` - Expand/dropdown
- `ExternalLink` - External link
- `ArrowRight` - Navigate forward

**Status & Alerts**
- `CheckCircle` - Success
- `AlertTriangle` - Warning
- `Info` - Information
- `XCircle` - Error
- `HelpCircle` - Help/tooltip

**System**
- `Settings` - Settings/configuration
- `Shield` / `ShieldCheck` - Security
- `LogIn` / `LogOut` - Authentication
- `Eye` / `EyeOff` - Visibility toggle
- `Calendar` - Date/schedule
- `Clock` - Time

---

## Common Patterns

### Form with Validation

```tsx
import { Input, Textarea, Select } from './components/ui';
import { FormError } from './components/ui/FormError';
import { Button } from './components/ui/Button';

function CourseForm() {
  const [errors, setErrors] = useState({});

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Course Title
        </label>
        <Input
          id="title"
          type="text"
          error={errors.title}
          placeholder="Enter course title"
        />
        <FormError error={errors.title} />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description
        </label>
        <Textarea
          id="description"
          error={errors.description}
          placeholder="Describe your course"
          rows={4}
        />
        <FormError error={errors.description} />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-2">
          Category
        </label>
        <Select id="category" error={errors.category}>
          <option value="">Select a category</option>
          <option value="math">Mathematics</option>
          <option value="science">Science</option>
        </Select>
        <FormError error={errors.category} />
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Course
        </Button>
      </div>
    </form>
  );
}
```

### Card Grid Layout

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import { Users, BookOpen } from './components/ui/Icons';

function CourseGrid({ courses }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map(course => (
        <Card key={course.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle>{course.title}</CardTitle>
              <Badge variant="outline">{course.difficulty}</Badge>
            </div>
            <CardDescription>{course.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{course.enrollmentCount} students</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{course.lessonCount} lessons</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Enroll Now</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
```

### Confirmation Dialog

```tsx
import Dialog from './components/ui/Dialog';
import { Button } from './components/ui/Button';
import { AlertTriangle } from './components/ui/Icons';

function DeleteConfirmation({ isOpen, onClose, onConfirm, itemName }) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Deletion"
      description={`Are you sure you want to delete "${itemName}"?`}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">
            This action cannot be undone. All associated data will be permanently deleted.
          </p>
        </div>
        
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
```

### Action Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './components/ui/DropdownMenu';
import { Button } from './components/ui/Button';
import { MoreHorizontal, Edit, Copy, Trash2, Eye } from './components/ui/Icons';

function CourseActions({ course, onView, onEdit, onDuplicate, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(course.id)}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(course.id)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Course
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(course.id)}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete(course.id)}
          className="text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Status Badge with Icon

```tsx
import { Badge } from './components/ui/Badge';
import { CheckCircle, Clock, XCircle } from './components/ui/Icons';

function StatusBadge({ status }) {
  const statusConfig = {
    completed: {
      variant: 'success',
      icon: CheckCircle,
      label: 'Completed'
    },
    pending: {
      variant: 'secondary',
      icon: Clock,
      label: 'Pending'
    },
    failed: {
      variant: 'destructive',
      icon: XCircle,
      label: 'Failed'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
```

---

## Theming

### CSS Custom Properties

All components use CSS custom properties for theming, allowing seamless light/dark mode switching:

```css
/* Light theme */
--card-bg: #ffffff;
--text-main: #1f2937;
--text-secondary: #6b7280;
--text-heading: #111827;
--border-default: #e5e7eb;
--border-strong: #d1d5db;
--primary: #3b82f6;
--primary-hover: #2563eb;
--primary-foreground: #ffffff;

/* Dark theme */
--card-bg: #1f2937;
--text-main: #f9fafb;
--text-secondary: #9ca3af;
--text-heading: #ffffff;
--border-default: #374151;
--border-strong: #4b5563;
--primary: #60a5fa;
--primary-hover: #3b82f6;
--primary-foreground: #111827;
```

### Theme Context Usage

```tsx
import { useTheme } from './lib/theme';
import { Sun, Moon } from './components/ui/Icons';
import { Button } from './components/ui/Button';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
```

---

## Responsive Design

### Mobile-First Approach

All components are designed mobile-first with responsive breakpoints:

```tsx
// Button heights
h-11 md:h-10  // Larger on mobile for touch targets

// Card padding
p-4 md:p-6    // More compact on mobile

// Input heights
h-11 md:h-10  // Touch-friendly on mobile

// Textarea min-height
min-h-[100px] md:min-h-[80px]  // Larger on mobile

// Grid layouts
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

### Touch-Friendly Targets

- Minimum touch target: 44x44px (iOS) / 48x48px (Android)
- Mobile button height: `h-11` (44px)
- Icon button size: `h-11 w-11` on mobile
- Increased padding on mobile for easier interaction

---

## Accessibility Guidelines

### WCAG 2.1 Level AA Compliance

1. **Color Contrast**
   - Text: Minimum 4.5:1 ratio
   - Large text: Minimum 3:1 ratio
   - UI components: Minimum 3:1 ratio

2. **Keyboard Navigation**
   - All interactive elements are keyboard accessible
   - Visible focus indicators on all focusable elements
   - Logical tab order

3. **Screen Reader Support**
   - Semantic HTML elements
   - ARIA labels for icon-only buttons
   - ARIA attributes for dynamic content
   - Error announcements with `role="alert"`

4. **Form Accessibility**
   - Labels associated with inputs via `htmlFor`/`id`
   - Error messages linked via `aria-describedby`
   - Required fields marked with `required` attribute
   - Clear validation feedback

### Accessibility Checklist

- [ ] All images have alt text
- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Focus is visible on all interactive elements
- [ ] Color is not the only means of conveying information
- [ ] Keyboard navigation works throughout
- [ ] Dialogs trap focus appropriately
- [ ] Dynamic content updates are announced

---

## Performance Considerations

### Component Optimization

1. **React.forwardRef**: All form components support refs for integration with form libraries
2. **Memoization**: Consider using `React.memo` for frequently re-rendered components
3. **Code Splitting**: Import icons individually to reduce bundle size
4. **CSS-in-JS**: Uses Tailwind CSS for optimal performance

### Bundle Size

- Button: ~2KB
- Card: ~1.5KB
- Input/Textarea/Select: ~1KB each
- Dialog: ~3KB (includes portal)
- DropdownMenu: ~4KB (includes state management)
- Icons: ~0.5KB per icon (tree-shakeable)

---

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile Safari: iOS 12+
- Chrome Mobile: Latest version

---

## Migration Guide

### From Native HTML Elements

```tsx
// Before
<button className="btn-primary" onClick={handleClick}>
  Submit
</button>

// After
<Button onClick={handleClick}>
  Submit
</Button>

// Before
<input type="text" className="form-input" />

// After
<Input type="text" />

// Before
<div className="card">
  <h3>Title</h3>
  <p>Content</p>
</div>

// After
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
</Card>
```

---

## Contributing

When adding new components to the library:

1. Follow existing patterns and naming conventions
2. Support theme CSS custom properties
3. Include TypeScript interfaces
4. Add accessibility features (ARIA, keyboard support)
5. Make components responsive (mobile-first)
6. Document props, variants, and usage examples
7. Test with keyboard navigation and screen readers

---

## Support

For questions or issues with the component library:

- Review this documentation
- Check component source code in `components/ui/`
- Refer to design document: `.kiro/specs/vidyasetu-complete-platform/design.md`
- Test components in isolation before integration

---

**Last Updated**: Task 29.2 - Component Library Documentation
**Version**: 1.0.0
**Maintained by**: VidyaSetu Development Team
