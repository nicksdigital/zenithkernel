# @zenithcore/zenny

The official command-line interface for ZenithKernel framework.

## 🚀 Installation

```bash
# Install globally with npm
npm install -g @zenithcore/zenny

# Install globally with bun
bun install -g @zenithcore/zenny

# Or use directly with npx/bunx
npx @zenithcore/zenny --help
bunx @zenithcore/zenny --help
```

## 📋 Commands

### Project Scaffolding

```bash
# Initialize a new ZenithKernel project
zenny init

# Create a new module
zenny create module

# Create a new Hydra component
zenny create hydra [name]
```

### Development

```bash
# List available modules
zenny list modules

# List available systems
zenny list systems

# Open documentation
zenny docs
```

### Publishing & Deployment

```bash
# Login to registry
zenny login

# Login with ZK authentication
zenny login --zk

# Publish a module
zenny publish module [path]

# Sign a manifest
zenny sign manifest [path]

# Publish manifest to qDHT
zenny publish manifest --qdht [path]
```

### Hydra Operations

```bash
# Hydrate local Hydra component
zenny hydra local [path] [--verbose]

# Hydrate remote Hydra component
zenny hydra remote [url]
```

### Bundle Operations

```bash
# Pack a Hydra bundle
zenny bundle pack [input] [output]
```

## 🛠️ Usage Examples

### Create a New Project

```bash
# Initialize a new ZenithKernel project
zenny init
cd my-zenith-app

# Create a new component
zenny create hydra MyComponent

# Create a new system module
zenny create module
```

### Development Workflow

```bash
# List all available modules
zenny list modules

# Create and publish a module
zenny create module
zenny publish module ./my-module

# Sign and publish manifest
zenny sign manifest ./manifest.json
zenny publish manifest --qdht ./manifest.json
```

## 🔧 Configuration

Zenny uses configuration files and environment variables:

- `~/.zenith/config.json` - Global configuration
- `.zenithrc` - Project-specific configuration
- Environment variables with `ZENITH_` prefix

## 📚 Documentation

For detailed documentation, visit:
- [ZenithKernel Documentation](https://github.com/nicksdigital/zenithkernel)
- [CLI Reference](https://github.com/nicksdigital/zenithkernel/tree/main/packages/zenny)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see the [LICENSE](../../LICENSE) file for details.

---

**Built with ❤️ by the ZenithKernel Team**
