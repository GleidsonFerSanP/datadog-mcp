# Build & Publish Guide

## Prerequisites

* Node.js 18+
* npm
* [vsce](https://github.com/microsoft/vscode-vsce) (`npm install -g @vscode/vsce`)
* A [Visual Studio Marketplace Publisher Account](https://marketplace.visualstudio.com/manage)

## Build Steps

### 1. Build the MCP Server

```bash
cd /path/to/datadog-mcp

# Install dependencies
npm install

# Build TypeScript
npm run build
```

### 2. Build the Extension

```bash
cd extension

# Install dependencies
npm install

# Copy MCP server files into extension
npm run copy-server

# Compile extension TypeScript
npm run compile
```

### 3. Create Icon PNG

If you don't have `icon.png` , convert from SVG:

```bash
# Using ImageMagick
convert icon.svg -resize 128x128 icon.png

# Or using sips (macOS built-in, requires intermediate step)
# Use an online converter or install ImageMagick:
# brew install imagemagick
```

### 4. Package the Extension

```bash
cd extension

# Create .vsix package
npx vsce package

# This creates: datadog-observability-1.0.0.vsix
```

### 5. Test Locally

```bash
# Install the .vsix in VS Code
code --install-extension datadog-observability-1.0.0.vsix
```

1. Reload VS Code
2. Open Command Palette → "Configure Datadog Credentials"
3. Enter your API Key and Application Key
4. Open Copilot Chat and ask "Show me all triggered monitors"

### 6. Publish to Marketplace

```bash
# Login with your Personal Access Token
npx vsce login GleidsonFerSanP

# Publish
npx vsce publish
```

Or publish with PAT directly:

```bash
npx vsce publish -p YOUR_PERSONAL_ACCESS_TOKEN
```

## Getting a Personal Access Token (PAT)

1. Go to [Azure DevOps](https://dev.azure.com)
2. Click your profile → Personal Access Tokens
3. Create new token with:
   - Organization: All accessible organizations
   - Scopes: Marketplace > Manage
4. Copy the token and use it with `vsce login` or `vsce publish -p`

## Version Bumping

```bash
cd extension

# Patch: 1.0.0 → 1.0.1
npx vsce publish patch

# Minor: 1.0.0 → 1.1.0
npx vsce publish minor

# Major: 1.0.0 → 2.0.0
npx vsce publish major
```

## Troubleshooting

### "Missing publisher name"

Ensure `publisher` is set in `extension/package.json` .

### "MCP server files not found"

Run `npm run copy-server` from the extension directory.

### "Cannot find module"

Run `npm install` in both root and extension directories.
