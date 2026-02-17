# Code Atlas

> AI-powered repository explainer with diagrams and incremental updates

Code Atlas is a CLI tool that scans your codebase and generates comprehensive documentation with Mermaid diagrams. It uses Claude Code (or other AI engines) to analyze your code and create structured reports that help you understand complex repositories.

## Features

- **📁 Smart File Collection**: Respects `.gitignore`, excludes binaries, handles large codebases
- **🔍 Facts Extraction**: Detects languages, configs, entrypoints, routes, tests automatically
- **🤖 AI Analysis**: Uses Claude Code to analyze files and generate insights
- **📊 Mermaid Diagrams**: Flowcharts, sequence diagrams, and data flow visualizations
- **🔄 Incremental Updates**: SHA256-based change detection for fast re-scans
- **👁️ Web Viewer**: Local HTML viewer with search and navigation
- **3️⃣ Three Scope Types**: Analyze whole repos, specific folders, or features

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/code-atlas.git
cd code-atlas

# Install dependencies
npm install

# Build the project
npm run build

# Link for global usage (optional)
npm link
```

## Quick Start

```bash
# Scan your entire repository
repoexplain scan --scope repo

# View the generated report in your browser
repoexplain view

# Check status of scanned scopes
repoexplain status
```

## Usage

### Commands

#### `scan` - Analyze your codebase

```bash
# Scan entire repository (shallow analysis)
repoexplain scan --scope repo

# Deep dive into a specific folder
repoexplain scan --scope folder:src/api

# Analyze a specific feature
repoexplain scan --scope feature:"authentication"

# With custom filters
repoexplain scan --scope repo --exclude "*.test.ts" --include "*.ts"

# Verbose output
repoexplain scan --scope repo --verbose
```

**Scope Types:**
- **repo**: Fast, top-level analysis (caps at 200 files)
- **folder**: Deep dive into a specific directory (caps at 500 files)
- **feature**: Targeted analysis using ripgrep search (caps at 120 files)

#### `view` - Open the web viewer

```bash
# View most recent scan
repoexplain view

# View specific scope
repoexplain view --scope folder:src
```

#### `status` - Show scan status

```bash
repoexplain status
```

#### `clean` - Remove cached artifacts

```bash
# Clean all scans
repoexplain clean

# Clean specific scope
repoexplain clean --scope folder:src
```

## Report Structure

Each report includes these sections:

1. **Executive Map**: Overview, components, entry points, dependencies
2. **How to Find Things**: Navigation guide ("If you need X, start here")
3. **Data Flow Overview**: Request/data flow with Mermaid flowchart
4. **Key Modules**: Top 10-20 files with descriptions
5. **Edge Cases and Foot-guns**: Concurrency, caching, validation issues
6. **Operational Reality**: How to run, config, logging, failure modes
7. **Change Guide**: "Before editing" checklist, rollout notes
8. **Feature Walkthrough** (feature scope only): Narrative + sequence diagram

## Configuration

Create `repoexplain.config.json` in your project root:

```json
{
  "maxFilesRepo": 200,
  "maxFilesFolder": 500,
  "maxFilesFeature": 120,
  "maxFileSizeKB": 200,
  "ignorePatterns": [
    "node_modules",
    "dist",
    ".cache"
  ],
  "binaryExtensions": [
    ".png",
    ".jpg",
    ".zip"
  ],
  "engine": "claude",
  "diagramNodeCap": 20
}
```

See [repoexplain.config.json.example](./repoexplain.config.json.example) for full options.

## Output Structure

```
.repoexplain/
├── repo/
│   ├── manifest.json      # File list with SHA256 hashes
│   ├── facts.json         # Extracted metadata
│   ├── notes.json         # AI file notes (future)
│   ├── report.json        # Structured report
│   ├── report.md          # Human-readable markdown
│   └── index.html         # Web viewer
├── folder-src-api/
│   └── ...
└── feature-auth/
    └── ...
```

## How It Works

1. **File Collection**: Scans repository respecting ignore patterns
2. **Facts Extraction**: Detects languages, configs, entrypoints (no AI needed)
3. **AI Analysis** (optional): Calls Claude Code to analyze file contents
4. **Report Generation**: Creates structured report with Mermaid diagrams
5. **Incremental Updates**: Re-scans only changed files on subsequent runs

## Requirements

- **Node.js**: v18 or higher
- **Claude Code** (optional): For AI-powered analysis
  - Install from [claude.ai/code](https://claude.ai/code)
  - Or use without AI for facts-only reports
- **ripgrep** (optional): For feature scope search
  - Install: `brew install ripgrep` (macOS)

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Build
npm run build

# Run locally without installing
npm run cli -- scan --scope repo
```

## Architecture

```
src/
├── cli/           # Command handlers
├── core/          # File collection, manifest, config
├── facts/         # Metadata extraction
├── engine/        # AI engine integration (Claude Code)
├── report/        # Report generation
└── viewer/        # HTML viewer

tests/             # Unit & integration tests
```

## Examples

### Scan a Node.js API

```bash
cd my-api-project
repoexplain scan --scope folder:src/api
repoexplain view
```

### Analyze authentication feature

```bash
repoexplain scan --scope feature:"login"
repoexplain view
```

### Quick repo overview

```bash
repoexplain scan --scope repo --verbose
```

## Limitations

- **Current version generates mock reports**: Phase 4 creates reports from facts only. Full AI integration requires Claude Code CLI to be configured.
- **Feature scope requires ripgrep**: Falls back to grep if unavailable
- **Large files skipped**: Default max 200KB per file (configurable)

## Roadmap

- [ ] Full Claude Code integration for file notes
- [ ] Codex engine support
- [ ] File path linking in viewer
- [ ] Compare reports between scans
- [ ] Export to PDF
- [ ] VS Code extension

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass: `npm test`
5. Submit a pull request

## License

MIT

## Acknowledgments

Built with:
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal styling
- [Marked](https://marked.js.org/) - Markdown parsing
- [Mermaid](https://mermaid.js.org/) - Diagram rendering
- [Vitest](https://vitest.dev/) - Testing framework

---

**Made with Claude Code** 🤖
