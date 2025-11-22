# StudyBuddy Multi-Theme System

## 🎨 Available Themes

### 1. **Default Theme**
- **Style**: Vibrant gradients (blue → purple → pink)
- **Vibe**: Energetic and modern
- **Use Case**: Best for active learning sessions

### 2. **Dark Theme** 
- **Style**: Premium black with subtle purple glows
- **Vibe**: Professional and focused
- **Use Case**: Night study sessions, reduced eye strain

### 3. **White Theme**
- **Style**: Clean minimalist with soft shadows
- **Vibe**: Fresh and organized
- **Use Case**: Daytime use, clean workspace aesthetic

### 4. **Ocean Theme**
- **Style**: Blue/teal gradients (calm waters)
- **Vibe**: Calm and serene
- **Use Case**: Meditation, stress-free learning

### 5. **Forest Theme**
- **Style**: Green/earth tones
- **Vibe**: Natural and grounding
- **Use Case**: Deep focus work, long study sessions

## 🚀 Features

✅ **Persistent Storage** - Theme saves automatically to localStorage  
✅ **Smooth Transitions** - 300ms fade animation when switching themes  
✅ **No Flash** - Smart loading prevents FOUC (Flash of Unstyled Content)  
✅ **Premium UI** - Animated dropdown with theme previews  
✅ **Theme-Aware Components** - All components adapt to current theme  
✅ **Responsive** - Works seamlessly on all devices  

## 🛠️ Technical Implementation

### Theme Context (`contexts/ThemeContext.tsx`)
- Zustand-like state management with React Context
- Automatic localStorage sync
- Document class and data-attribute management

### Theme Switcher (`components/ThemeSwitcher.tsx`)
- Palette icon button in navbar
- Animated dropdown with theme previews
- Visual feedback with check icons
- Color swatches for each theme

### Tailwind Config (`tailwind.config.ts`)
- Custom color palettes for each theme
- Variant support (dark:, white:, ocean:, forest:)
- Extended with theme-specific variables

### Global Styles (`app/globals.css`)
- CSS variables for each theme
- Gradient backgrounds
- Smooth transitions

## 📱 Usage

### For Users
1. Click the **Palette** icon in the navbar
2. Select your preferred theme
3. Theme applies instantly and saves automatically

### For Developers
```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="bg-white dark:bg-dark-card ocean:bg-ocean-card">
      Current theme: {theme}
    </div>
  );
}
```

## 🎯 Theme-Aware Classes

Use Tailwind variants for theme-specific styling:

```tsx
// Background colors
className="bg-white dark:bg-dark-card white:bg-white-card ocean:bg-ocean-card forest:bg-forest-card"

// Text colors  
className="text-gray-800 dark:text-gray-200 ocean:text-cyan-100 forest:text-green-100"

// Borders
className="border-gray-200 dark:border-dark-border ocean:border-ocean-border forest:border-forest-border"

// Accents
className="text-blue-500 dark:text-dark-accent ocean:text-ocean-accent forest:text-forest-accent"
```

## 🔧 Configuration

### Adding a New Theme

1. **Update ThemeContext.tsx**
```tsx
export type Theme = "default" | "dark" | "white" | "ocean" | "forest" | "yourtheme";
```

2. **Add to Tailwind Config**
```ts
colors: {
  "yourtheme-bg": "#hexcode",
  "yourtheme-card": "#hexcode",
  // ...
}
```

3. **Add Global Styles**
```css
.yourtheme {
  --background: #hexcode;
  --foreground: #hexcode;
}
```

4. **Update ThemeSwitcher**
```tsx
{
  id: "yourtheme",
  name: "Your Theme",
  description: "Description",
  preview: "bg-gradient-to-r from-color1 to-color2",
}
```

## 🎬 Animation Details

- **Theme Switch**: 300ms fade transition on entire page
- **Dropdown Open**: Spring animation (damping: 25, stiffness: 300)
- **Theme Button Hover**: 1.05x scale
- **Selected Theme**: Check icon with spring scale animation

## 💾 Storage

- **Key**: `studybuddy-theme`
- **Location**: localStorage
- **Format**: String ("default" | "dark" | "white" | "ocean" | "forest")
- **Persistence**: Survives page refresh and browser restart

## 🐛 Troubleshooting

**Theme not persisting?**
- Check browser localStorage permissions
- Verify localStorage isn't cleared on exit

**Flash of wrong theme?**
- ThemeProvider includes anti-flash logic
- Theme applies before render

**Components not changing color?**
- Ensure components use theme-aware Tailwind classes
- Check variant syntax (dark:, ocean:, etc.)

## 🎨 Design Philosophy

Each theme is carefully crafted to:
- Maintain high contrast for readability
- Use appropriate color psychology
- Ensure accessibility (WCAG AA compliance)
- Provide distinct visual identity
- Support glassmorphism effects

---

**Version**: 1.0  
**Last Updated**: November 12, 2025  
**Author**: StudyBuddy Team
