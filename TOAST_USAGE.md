# Custom Toast Notification System

This project uses a customized React Toastify implementation that integrates seamlessly with DaisyUI themes and provides a native app experience.

## Features

- ✅ **Native DaisyUI Styling**: Uses DaisyUI alert components with base background colors for consistent design
- ✅ **Theme Awareness**: Automatically adapts to light/dark themes
- ✅ **Lucide React Icons**: Beautiful, consistent icons for each toast type using Lucide React library
- ✅ **Smooth Animations**: Custom slide-in/out animations with enhanced shadows
- ✅ **Consistent Borders**: Clean colored borders that match toast type for visual hierarchy
- ✅ **Interactive**: Click to dismiss, pause on hover, draggable
- ✅ **Auto-close**: Configurable auto-close timing

## Usage

### Basic Usage

```tsx
import { showToast } from '@/components/CustomToast';

// Success notification
showToast.success('Operation completed successfully!');

// Error notification
showToast.error('Something went wrong. Please try again.');

// Warning notification
showToast.warning('Please review your input before proceeding.');

// Info notification
showToast.info('Here is some helpful information for you.');
```

### Using the Hook

```tsx
import { useToast } from '@/hooks/useToast';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Great job!');
  };

  const handleError = () => {
    toast.error('Oops! Something went wrong.');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

### Advanced Options

```tsx
import { showToast } from '@/components/CustomToast';

// Custom auto-close timing
showToast.success('This will stay longer', {
  autoClose: 10000, // 10 seconds
});

// Custom position
showToast.info('Bottom right toast', {
  position: 'bottom-right',
});

// Custom styling
showToast.warning('Custom styled toast', {
  className: 'custom-toast-class',
  bodyClassName: 'custom-body-class',
});
```

## Toast Types

| Type | Icon | DaisyUI Class | Use Case |
|------|------|----------------|----------|
| `success` | ✅ CheckCircle (Lucide) | `alert alert-success bg-base-200` | Successful operations |
| `error` | ❌ XCircle (Lucide) | `alert alert-error bg-base-200` | Errors and failures |
| `warning` | ⚠️ AlertTriangle (Lucide) | `alert alert-warning bg-base-200` | Warnings and cautions |
| `info` | ℹ️ Info (Lucide) | `alert alert-info bg-base-200` | General information |
| `pending` | 🔄 Loader2 (Lucide) | `alert alert-info bg-base-200` | Loading operations |

## Configuration

The toast system is configured in `src/components/CustomToast.tsx` with the following defaults:

- **Position**: Top-right corner
- **Auto-close**: 5 seconds
- **Progress bar**: Hidden for clean appearance
- **Close button**: Hidden (click to dismiss)
- **Borders**: Consistent colored borders matching toast type
- **Theme**: Automatically follows app theme
- **Animations**: Slide from right with fade

## Customization

### Styling

The toast styles are defined in `src/app/toastify-custom.css`. You can modify:

- Colors and themes
- Animation timing
- Position offsets
- Z-index values

### Component Override

To customize the toast appearance, modify the `CustomToast` component in `src/components/CustomToast.tsx`:

```tsx
const CustomToast = ({ message, type }: { message: string; type: string }) => {
  // Customize icon, styling, or layout here
  return (
    <div className={`custom-toast custom-toast-${type}`}>
      {/* Your custom toast content */}
    </div>
  );
};
```

## Integration with Existing Code

The system automatically replaces browser alerts with styled toasts. All existing `alert()` calls in the dashboard have been updated to use the toast system.

## Best Practices

1. **Use appropriate types**: Choose the right toast type for your message
2. **Keep messages concise**: Long messages can make toasts hard to read
3. **Consistent timing**: Use similar auto-close times for similar types of messages
4. **Accessibility**: Ensure messages are clear and actionable
5. **Theme consistency**: The system automatically handles theme switching

## Troubleshooting

### Toasts not showing

1. Check that `CustomToastContainer` is included in your layout
2. Verify the toast CSS is imported
3. Check browser console for errors

### Styling issues

1. Ensure DaisyUI is properly configured
2. Check that custom CSS overrides are loaded
3. Verify theme context is working

### Performance issues

1. Limit the number of simultaneous toasts
2. Use appropriate auto-close timing
3. Consider using the hook for better performance

