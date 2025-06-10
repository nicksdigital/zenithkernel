# ZenithKernel Single File Component Quick Start

Welcome to ZenithKernel! This guide shows you how to get started with the Single File Component syntax and scaffolding.

## 🚀 Quick Start

### 1. Test Basic Functionality
```bash
# Test the basic ManifestAuth and JSX runtime
bun run test-basic.mjs

# Test the scaffolding system
bun run test-scaffolding.ts
```

### 2. Create a New Hydra Component
```bash
# Use the enhanced CLI to create a component
bun run src/cli/zenith.ts create-hydra

# This will prompt for:
# - Component name
# - ZK proof verification
# - ECS integration
# - Single File Component syntax
```

### 3. Single File Component Syntax

The enhanced syntax allows you to define metadata, styles, and scripts within your component:

```tsx
import React from 'react';
import { jsx } from '@modules/Rendering/jsx-runtime';

export default function MyComponent({ id, context }) {
  return (
    <div className="hydra-component">
      {/* Component metadata */}
      <meta
        title="My Component"
        description="A Hydra component with enhanced functionality"
        layout="hydra-layout"
      />
      
      {/* Component styles */}
      <css>
        {`
          .hydra-component {
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
        `}
      </css>
      
      {/* Component script */}
      <safeScript type="lifecycle_id">
        {`
          console.log('Component loaded!');
          // Safe, scoped JavaScript execution
        `}
      </safeScript>
      
      {/* Component content */}
      <div className="content">
        <h2>My Component</h2>
        <p>Content here...</p>
      </div>
    </div>
  );
}
```

## 🏗️ Project Structure

After running `zenith init`, your project will have:

```
my-zenith-app/
├── src/
│   ├── components/
│   │   └── hydra/           # Hydra components
│   ├── modules/             # System modules
│   ├── islands/             # Island definitions
│   └── main.ts             # Entry point
├── manifests/
│   └── hydras/             # Component manifests
├── public/
│   └── index.html          # Main HTML page
└── package.json
```

## 🌊 Hydra Component Features

### Special JSX Elements

1. **`<meta>`** - Component metadata
   ```tsx
   <meta title="Page Title" description="Description" layout="layout-name" />
   ```

2. **`<css>`** - Component styling
   ```tsx
   <css href="external.css" />           // External stylesheet
   <css>{`/* inline styles */`}</css>    // Inline styles
   ```

3. **`<safeScript>`** - Secure scripts
   ```tsx
   <safeScript type="on_load" src="script.js" integrity="sha384-..." />
   <safeScript type="lifecycle_id">{`/* inline script */`}</safeScript>
   ```

4. **`<Hydra>`** - Hydra islands
   ```tsx
   <Hydra
     type="island"
     id="my-island"
     entry="MyComponent"
     execType="local"
     strategy="immediate"
     context={{ data: 'value' }}
   />
   ```

### Hydration Strategies

- `immediate` - Hydrate immediately when component mounts
- `visible` - Hydrate when component becomes visible
- `interaction` - Hydrate on first user interaction
- `idle` - Hydrate during browser idle time
- `manual` - Require explicit hydration trigger

### Trust Levels

- `unverified` - No verification required
- `local` - Local trust only
- `community` - Community-verified
- `verified` - ZK proof verified

## 🔧 CLI Commands

### Initialize a new project
```bash
zenith init
```

### Create a new Hydra component
```bash
zenith create-hydra MyComponent
```

### Sign a manifest
```bash
zenith sign-manifest --path ./manifest.json
```

### Publish a component
```bash
zenith publish-module --path ./manifest.json
```

## 🧪 Development Workflow

1. **Create**: Use `zenith create-hydra` to scaffold components
2. **Develop**: Write your component using Single File Component syntax
3. **Test**: Use the built-in test utilities
4. **Sign**: Sign your manifests for distribution
5. **Deploy**: Publish to the Zenith network

## 🔒 Security Features

- **Post-quantum signatures** (planned) - Future-proof security
- **ZK proof verification** - Zero-knowledge component verification
- **Manifest signing** - Cryptographic integrity
- **Sandboxed execution** - Secure WASM and script execution
- **Permission system** - Fine-grained access control

## 📚 Next Steps

1. Run the test scripts to verify everything works
2. Create your first component with `zenith create-hydra`
3. Explore the Single File Component syntax
4. Build your decentralized application!

## 🆘 Troubleshooting

### Common Issues

1. **Import errors**: Make sure you're using the correct import paths
2. **TypeScript errors**: Check your tsconfig.json configuration
3. **Missing dependencies**: Run `bun install` or `npm install`

### Getting Help

- Check the generated demo.html file for examples
- Run the test scripts to verify functionality
- Examine the generated component files for patterns

---

**Ready to build the future with ZenithKernel? Let's go! 🚀**
