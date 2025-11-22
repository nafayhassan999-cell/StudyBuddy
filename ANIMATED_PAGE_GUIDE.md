# AnimatedPage Component

A reusable wrapper component for smooth page transitions using Framer Motion in the StudyBuddy app.

## Features

- ✨ Smooth slide transitions (fade + horizontal slide)
- 🔄 AnimatePresence for enter/exit animations
- 🎯 Shared layoutId for smooth element transitions
- ⏳ Optional loading spinner during transitions
- 🎨 Customizable className support

## Usage Examples

### Basic Usage

```tsx
import AnimatedPage from "@/components/AnimatedPage";

export default function MyPage() {
  return (
    <AnimatedPage>
      <main>
        <h1>Your content here</h1>
        <p>This page will animate on mount and unmount</p>
      </main>
    </AnimatedPage>
  );
}
```

### With Loading Spinner

```tsx
import AnimatedPage from "@/components/AnimatedPage";

export default function MyPage() {
  return (
    <AnimatedPage showLoader={true}>
      <main>
        <h1>Content with loading transition</h1>
      </main>
    </AnimatedPage>
  );
}
```

### With Custom Classes

```tsx
import AnimatedPage from "@/components/AnimatedPage";

export default function MyPage() {
  return (
    <AnimatedPage className="custom-wrapper-class">
      <main>
        <h1>Content with custom styling</h1>
      </main>
    </AnimatedPage>
  );
}
```

## Animation Details

- **Initial State**: `opacity: 0, x: 300` (enters from right)
- **Animate State**: `opacity: 1, x: 0` (slides to center)
- **Exit State**: `opacity: 0, x: -300` (exits to left)
- **Duration**: 0.5 seconds
- **Easing**: easeInOut (smooth curve)
- **LayoutId**: "page-transition" for shared element animations

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | The content to wrap with animations |
| `className` | `string` | `""` | Optional CSS classes for the wrapper |
| `showLoader` | `boolean` | `false` | Show loading spinner during transition |

## Integration

The component is already integrated into:
- `/auth/signup` - Signup page
- `/auth/login` - Login page  
- `/features` - Features page

The home page (`/`) uses custom animations and doesn't need AnimatedPage.

## Tips

1. **Navigation**: Works automatically with Next.js Link components
2. **Performance**: Uses `mode="wait"` in AnimatePresence for clean transitions
3. **Accessibility**: Maintains proper semantic HTML structure
4. **Loading Time**: Spinner shows for 800ms (configurable in component)

## Customization

To modify transition behavior, edit the constants in `components/AnimatedPage.tsx`:

```tsx
const pageVariants = {
  initial: { opacity: 0, x: 300 },  // Change x value for slide distance
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -300 },
};

const pageTransition = {
  duration: 0.5,  // Change duration in seconds
  ease: [0.42, 0, 0.58, 1],  // Custom bezier curve
};
```
