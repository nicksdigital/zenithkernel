# Hydra JSX Syntax

Hydra provides a custom JSX syntax that enables efficient island architecture and secure component loading. This document outlines the available tags and their usage.

## Core Tags

### `<Hydra>`

The main component for creating Hydra islands. Islands are isolated components that can be loaded and executed independently.

```tsx
<Hydra
  type="island"
  id="unique-id"
  entry="Component.tsx"
  execType="local" | "remote" | "edge"
  context={{ /* component context */ }}
>
  {/* Island content */}
</Hydra>
```

### `<meta>`

Manages page metadata and layout information. Can be used both globally and within islands.

```tsx
<meta
  title="Page Title"
  description="Page description"
  keywords={['tag1', 'tag2']}
  author="Author Name"
  viewport="width=device-width, initial-scale=1"
  layout="default"
  og:title="OG Title"
  og:description="OG Description"
  og:image="https://example.com/image.jpg"
  og:type="website"
/>
```

### `<safeScript>`

Securely loads scripts with built-in security features. Supports both external and inline scripts.

```tsx
<safeScript
  type="on_load" | "on_before_load" | "lifecycle_id"
  src="https://example.com/script.js"
  integrity="sha384-abc123"
  crossorigin="anonymous"
  nonce="random-nonce"
  async
  defer
>
  {/* Optional inline script */}
  console.log("Hello");
</safeScript>
```

### `<css>`

Manages stylesheets and inline styles. Supports both external CSS files and inline styles.

```tsx
<css
  href="https://example.com/styles.css"
  media="screen"
  integrity="sha384-xyz789"
  crossorigin="anonymous"
>
  {/* Optional inline styles */}
  .my-class { color: blue; }
</css>
```

## Complete Example

Here's a complete example showing how to use all tags together:

```tsx
<div>
  {/* Global meta information */}
  <meta
    title="My Page"
    description="A page with Hydra islands"
    layout="default"
  />

  {/* Global styles */}
  <css href="global.css" />

  {/* Global scripts */}
  <safeScript
    type="on_load"
    src="main.js"
    integrity="sha384-abc123"
  />

  {/* Hydra island with its own meta, styles, and scripts */}
  <Hydra
    type="island"
    id="my-island"
    entry="MyComponent.tsx"
    execType="local"
    context={{ message: "Hello" }}
  >
    <meta
      title="Island Title"
      layout="island-layout"
    />
    <css href="island.css" />
    <safeScript
      type="lifecycle_id"
      children="console.log('Island loaded');"
    />
    <div>Island content</div>
  </Hydra>
</div>
```

## Security Features

1. **Script Security**
   - Integrity checks via SRI hashes
   - Cross-origin restrictions
   - Nonce-based CSP support
   - Async/defer loading options

2. **Style Security**
   - Integrity checks for external stylesheets
   - Cross-origin restrictions
   - Media query support

3. **Island Isolation**
   - Each island has its own context
   - Separate meta information
   - Isolated styles and scripts

## Best Practices

1. **Meta Tags**
   - Always provide a title and description
   - Use OpenGraph tags for social sharing
   - Specify a layout for consistent rendering

2. **Scripts**
   - Use `on_load` for critical scripts
   - Use `on_before_load` for initialization
   - Use `lifecycle_id` for island-specific scripts
   - Always provide integrity hashes for external scripts

3. **Styles**
   - Use external stylesheets for better caching
   - Use inline styles for critical CSS
   - Provide integrity hashes for external stylesheets

4. **Islands**
   - Give each island a unique ID
   - Specify the correct execution type
   - Provide necessary context data
   - Keep islands focused and small

## TypeScript Support

All tags are fully typed with TypeScript. The types are available in the JSX namespace:

```tsx
import { JSX } from '../modules/Rendering/jsx-runtime';

// Type checking for props
const props: JSX.IntrinsicElements['Hydra'] = {
  type: 'island',
  id: 'test',
  entry: 'Component.tsx'
};
``` 