# Code Atlas - Repository Explainer

## Project Overview

A local tool that scans repositories and generates comprehensive explainers with diagrams. Uses Claude Code as the analysis engine (subscription-only, no API keys needed). Fast incremental updates for daily use.

## Tech Stack

- **Language**: TypeScript + Node.js
- **CLI Framework**: Commander.js
- **Testing**: Vitest
- **Analysis Engine**: Claude Code (via subprocess)
- **Viewer**: Static HTML + Mermaid.js

## Project Structure

```
code-atlas/
├── src/
│   ├── cli/           # Command handlers (scan, view, status, clean)
│   ├── core/          # File collection, hashing, manifest management
│   ├── facts/         # Facts extraction (heuristics)
│   ├── engine/        # Claude Code subprocess integration
│   ├── report/        # Report generation & synthesis
│   └── viewer/        # Static HTML viewer
├── tests/             # Test files (mirror src structure)
├── .repoexplain/      # Output artifacts (gitignored)
└── repoexplain.config.json  # User config
```

## Implementation Phases

### Phase 1: Project Setup & Core Infrastructure
**Goal**: Scaffold project with CLI commands and file collection

#### Tasks
1. Initialize TypeScript project with dependencies
2. Set up Vitest for testing
3. Implement CLI structure with Commander.js (scan/view/status/clean)
4. Implement file collection with ignore patterns & safety limits
5. Implement manifest.json creation with file hashing

#### Tests Required
- ✅ CLI commands parse arguments correctly
- ✅ File collection respects .gitignore and default ignore patterns
- ✅ File collection respects size limits (max 200KB per file)
- ✅ File collection respects count limits (repo: 200, folder: 500, feature: 120)
- ✅ Manifest creates SHA256 hashes for all included files
- ✅ Binary files are excluded (.png, .jpg, .zip, etc.)

#### Acceptance Criteria
- `repoexplain scan --scope repo` collects files and creates manifest.json
- `repoexplain status` shows last run info
- Running `repoexplain scan` twice with no changes is fast (uses cache)

#### Commit Message
```
Phase 1: Core infrastructure and file collection

- Set up TypeScript project with Vitest
- Implement CLI commands (scan/view/status/clean)
- Add file collection with ignore patterns and limits
- Add manifest.json creation with SHA256 hashing
- Add incremental change detection

All Phase 1 tests passing.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Phase 2: Facts Extraction
**Goal**: Extract lightweight metadata without calling the AI agent

#### Tasks
1. Implement language detection (by file extension counts)
2. Detect notable config files (Dockerfile, docker-compose, package.json, etc.)
3. Detect entrypoints (main.ts, app.py, cmd/*/main.go, etc.)
4. Detect route/controller/service files (by path patterns)
5. Detect db/migration, job/worker, and test folders
6. Generate facts.json artifact

#### Tests Required
- ✅ Detects languages correctly from file extensions
- ✅ Identifies Dockerfile, docker-compose.yml, package.json
- ✅ Finds entrypoints for Node.js, Python, Go projects
- ✅ Identifies routes/ controllers/ handlers/ folders
- ✅ Identifies database migration folders
- ✅ Identifies test folders (test/, tests/, __tests__, spec/)
- ✅ Generates valid facts.json matching schema

#### Acceptance Criteria
- `repoexplain scan --scope repo` generates facts.json with detected metadata
- Facts are accurate for multi-language repos

#### Commit Message
```
Phase 2: Facts extraction heuristics

- Add language detection from file extensions
- Add config file detection (Docker, package.json, etc.)
- Add entrypoint detection for Node/Python/Go
- Add route/controller/service folder detection
- Add database and test folder detection
- Generate facts.json artifact

All Phase 2 tests passing.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Phase 3: Claude Code Engine Integration
**Goal**: Integrate Claude Code as subprocess for AI analysis

#### Tasks
1. Implement engine abstraction interface
2. Implement Claude Code engine (subprocess invocation)
3. Create prompts for "file notes" pass
4. Create prompts for "synthesis" pass
5. Handle engine output parsing (markdown extraction)
6. Store file notes in notes/ directory or notes.json

#### Tests Required
- ✅ Engine interface is implemented
- ✅ Claude Code subprocess executes successfully (mock test)
- ✅ File notes prompt includes file content and instructions
- ✅ Synthesis prompt includes facts + notes + section requirements
- ✅ Engine output is parsed correctly (handles markdown)
- ✅ File notes are stored correctly
- ✅ Engine errors are caught and reported

#### Acceptance Criteria
- `repoexplain scan --scope folder:src` calls Claude Code with proper prompts
- File notes are generated and stored
- Engine failures don't crash the CLI (graceful error handling)

#### Commit Message
```
Phase 3: Claude Code engine integration

- Add engine abstraction interface
- Implement Claude Code subprocess runner
- Create file notes prompt template
- Create synthesis prompt template
- Add markdown output parsing
- Store file notes in .repoexplain/notes/

All Phase 3 tests passing.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Phase 4: Report Generation & Synthesis
**Goal**: Generate structured reports with all required sections

#### Tasks
1. Define report.json schema (all 8 sections)
2. Implement synthesis pass (combines facts + notes → report)
3. Generate report.md (human-friendly markdown)
4. Generate report.json (structured for viewer)
5. Extract and validate Mermaid diagrams
6. Handle incremental updates (only regenerate changed file notes)

#### Tests Required
- ✅ report.json matches schema (all 8 sections present)
- ✅ report.md includes all required sections
- ✅ Mermaid diagrams are valid syntax
- ✅ Executive Map section is populated
- ✅ Data Flow Overview includes Mermaid flowchart
- ✅ Feature mode generates sequence diagram
- ✅ Incremental update only regenerates changed files
- ✅ "No changes" case is fast and reports correctly

#### Acceptance Criteria
- `repoexplain scan --scope folder:src` produces complete report.md + report.json
- Report includes all 8 sections with accurate content
- At least 1 valid Mermaid diagram is present
- Changing 1 file and re-scanning is fast (incremental)

#### Commit Message
```
Phase 4: Report generation and synthesis

- Define report.json schema (8 sections)
- Implement synthesis pass
- Generate report.md and report.json
- Extract and validate Mermaid diagrams
- Add incremental update logic (hash-based)
- Handle "no changes" case efficiently

All Phase 4 tests passing.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Phase 5: Viewer Implementation
**Goal**: Create local web viewer for reports

#### Tasks
1. Create static HTML viewer template
2. Implement markdown rendering (marked.js or similar)
3. Implement Mermaid diagram rendering (mermaid.js)
4. Add left sidebar navigation (scopes + sections)
5. Add search functionality (sections + file names)
6. Implement `repoexplain view` command (opens browser)
7. Handle multiple scopes (repo, folder:X, feature:Y)

#### Tests Required
- ✅ Viewer HTML is generated correctly
- ✅ report.json loads in viewer
- ✅ Markdown sections render correctly
- ✅ Mermaid diagrams render correctly
- ✅ Sidebar shows all sections
- ✅ Search filters sections
- ✅ Multiple scopes can be viewed

#### Acceptance Criteria
- `repoexplain view` opens browser with rendered report
- All sections are readable and formatted
- Mermaid diagrams display correctly
- Navigation between sections works

#### Commit Message
```
Phase 5: Local web viewer

- Create static HTML viewer
- Add markdown rendering with marked.js
- Add Mermaid diagram rendering
- Implement sidebar navigation
- Add search functionality
- Implement 'repoexplain view' command

All Phase 5 tests passing.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Phase 6: Scope Implementations (Repo, Folder, Feature)
**Goal**: Implement all three scope types with specific behaviors

#### Tasks
1. Implement repo scope (shallow sampling, top-level understanding)
2. Implement folder scope (deep dive)
3. Implement feature scope:
   - Ripgrep search for query string
   - Expand to related files (imports, routes, controllers)
   - Cap to max file count
4. Add feature narrative and sequence diagram generation
5. Implement `--include` and `--exclude` options

#### Tests Required
- ✅ Repo scope samples files correctly (caps at 200)
- ✅ Folder scope includes all files under path
- ✅ Feature scope finds files containing query string
- ✅ Feature scope expands to related files (best effort)
- ✅ Feature scope generates sequence diagram
- ✅ --include and --exclude work correctly
- ✅ Each scope respects its file count limit

#### Acceptance Criteria
- `repoexplain scan --scope repo` works (shallow)
- `repoexplain scan --scope folder:src` works (deep)
- `repoexplain scan --scope feature:"authentication"` works (targeted)
- Feature scope generates sequence diagram

#### Commit Message
```
Phase 6: Scope implementations

- Implement repo scope (shallow sampling)
- Implement folder scope (deep dive)
- Implement feature scope (ripgrep + expansion)
- Add feature sequence diagram generation
- Add --include and --exclude options
- Enforce file count limits per scope

All Phase 6 tests passing.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Phase 7: Configuration & Polish
**Goal**: Add config file, clean command, and final polish

#### Tasks
1. Implement repoexplain.config.json loading
2. Make all limits configurable (max files, max size, etc.)
3. Implement `repoexplain clean` command
4. Add better error messages and logging
5. Add progress indicators for long operations
6. Add `--verbose` flag for debugging
7. Update documentation (README.md)

#### Tests Required
- ✅ Config file is loaded correctly
- ✅ Config overrides default limits
- ✅ `repoexplain clean` removes correct artifacts
- ✅ `repoexplain clean --scope folder:X` removes only that scope
- ✅ Error messages are helpful
- ✅ Progress indicators work for file collection

#### Acceptance Criteria
- Config file works (all settings respected)
- `repoexplain clean` removes artifacts
- Error messages guide users to solutions
- README has installation and usage instructions

#### Commit Message
```
Phase 7: Configuration and polish

- Add repoexplain.config.json support
- Make all limits configurable
- Implement 'repoexplain clean' command
- Add better error messages and logging
- Add progress indicators
- Add --verbose flag
- Update README with full documentation

All Phase 7 tests passing.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Phase 8: End-to-End Testing & Release
**Goal**: Comprehensive testing and v1.0 release

#### Tasks
1. End-to-end test on real repositories:
   - Simple Node.js repo
   - Multi-language repo
   - Large monorepo (with limits)
2. Performance testing (incremental updates)
3. Fix any bugs found in E2E testing
4. Create release build process
5. Add npm publish configuration (if publishing)

#### Tests Required
- ✅ E2E: Full scan of Node.js repo succeeds
- ✅ E2E: Full scan of Python repo succeeds
- ✅ E2E: Feature scope on real codebase works
- ✅ E2E: Incremental update is >10x faster than full scan
- ✅ E2E: Viewer renders correctly for all test repos
- ✅ Performance: 500-file scan completes in <5min
- ✅ Performance: No-change re-scan completes in <5sec

#### Acceptance Criteria
- All v1 acceptance criteria met (from spec)
- Tool works on at least 3 different real repositories
- Documentation is complete
- No critical bugs

#### Commit Message
```
Phase 8: End-to-end testing and v1.0 release

- Add E2E tests for Node.js, Python, and multi-language repos
- Add performance benchmarks
- Fix bugs found in E2E testing
- Add release build process
- Complete documentation
- Ready for v1.0 release

All tests passing. v1.0 complete.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Report Schema (report.json)

```json
{
  "metadata": {
    "scope": "repo|folder|feature",
    "scopeValue": "repo | src/api | authentication",
    "generatedAt": "ISO-8601 timestamp",
    "toolVersion": "1.0.0",
    "filesAnalyzed": 42
  },
  "sections": [
    {
      "id": "executive-map",
      "title": "Executive Map",
      "content": "markdown content",
      "mermaid": "optional mermaid diagram code"
    },
    {
      "id": "how-to-find-things",
      "title": "How to Find Things",
      "content": "markdown content"
    },
    {
      "id": "data-flow-overview",
      "title": "Data Flow Overview",
      "content": "markdown content",
      "mermaid": "flowchart diagram"
    },
    {
      "id": "key-modules",
      "title": "Key Modules and Responsibilities",
      "content": "markdown content"
    },
    {
      "id": "edge-cases",
      "title": "Edge Cases and Foot-guns",
      "content": "markdown content"
    },
    {
      "id": "operational-reality",
      "title": "Operational Reality",
      "content": "markdown content"
    },
    {
      "id": "change-guide",
      "title": "Change Guide",
      "content": "markdown content"
    },
    {
      "id": "feature-walkthrough",
      "title": "Feature Walkthrough",
      "content": "markdown content (feature scope only)",
      "mermaid": "sequence diagram (feature scope only)"
    }
  ]
}
```

## Default Configuration (repoexplain.config.json)

```json
{
  "maxFilesRepo": 200,
  "maxFilesFolder": 500,
  "maxFilesFeature": 120,
  "maxFileSizeKB": 200,
  "ignorePatterns": [
    "node_modules",
    "dist",
    "build",
    ".next",
    ".turbo",
    ".cache",
    "coverage",
    "vendor",
    ".git"
  ],
  "binaryExtensions": [
    ".png", ".jpg", ".jpeg", ".gif", ".pdf",
    ".zip", ".gz", ".tar", ".jar", ".class",
    ".exe", ".dll", ".dylib"
  ],
  "engine": "claude",
  "diagramNodeCap": 20
}
```

## Prompts for Claude Code

### File Notes Prompt Template

```
You are analyzing a file from a codebase to extract key information.

File: {filepath}
Language: {language}

Content:
{fileContent}

Please provide:
1. **Purpose**: What is this file's primary responsibility? (1-2 sentences)
2. **Key Functions/Classes**: List the most important functions, classes, or exports
3. **External Interactions**: Does this file interact with databases, APIs, queues, or external systems?
4. **TODOs/Smells**: Any obvious issues, TODOs, or code smells?

Output must be valid Markdown. Be concise and concrete.
```

### Synthesis Prompt Template

```
You are creating a comprehensive repository explainer.

Scope: {scope}
Files analyzed: {fileCount}

Facts (extracted metadata):
{factsJson}

File Notes (AI-analyzed files):
{fileNotes}

Generate a report with these EXACT sections in order:

# 1. Executive Map
What this scope is, major components, entry points, key dependencies

# 2. How to Find Things
"If you need X, start here" mapping

# 3. Data Flow Overview
Request/data flow narrative + Mermaid flowchart diagram

# 4. Key Modules and Responsibilities
Top 10-20 files with 1-2 line descriptions

# 5. Edge Cases and Foot-guns
Concurrency, retries, idempotency, caching, validation, "places bugs like to hide"

# 6. Operational Reality
How to run locally, config/env, logging/metrics, common failures

# 7. Change Guide
"Before editing" checklist, safe rollout notes, tests to update

{featureSectionIfApplicable}
# 8. Feature Walkthrough (feature scope only)
Happy path narrative + Mermaid sequence diagram + unhappy paths list

Requirements:
- Output valid Markdown
- Include Mermaid diagrams in fenced code blocks (```mermaid)
- Use exact section headings above
- Prefer concrete file references (e.g., src/api/routes.ts:42)
- If uncertain, say "Unknown" rather than guessing
- Keep Mermaid diagrams under {diagramNodeCap} nodes
```

---

## Current Phase

**We are starting Phase 1: Project Setup & Core Infrastructure**

Next LLM instance: Check the most recent git commits to see which phase is complete, then continue with the next phase.

---

## Testing Strategy

### Unit Tests
- Each core module (file collection, hashing, facts extraction) has unit tests
- Mock file system where needed
- Mock Claude Code subprocess in tests

### Integration Tests
- Test CLI commands end-to-end
- Test file collection on real test fixtures
- Test manifest creation and updates

### E2E Tests (Phase 8)
- Run on real repositories in `tests/fixtures/`
- Verify complete flow: scan → report generation → viewer

### Running Tests
```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # Coverage report
```

---

## Development Workflow

1. **Start each phase**: Read phase tasks and tests required
2. **Implement**: Write code to pass tests
3. **Test**: Run `npm test` until all tests pass
4. **Commit**: Use the phase commit message template
5. **Next phase**: Move to next phase

## Getting Help

If blocked or uncertain:
- Check this CLAUDE.md file for guidance
- Check phase acceptance criteria
- Look at test requirements for what "done" means
- Commit what works, document blockers

---

## Notes for Future LLM Instances

- **Check git log** to see which phases are complete
- **Read test files** to understand what's been implemented
- **Run tests** before starting new work (`npm test`)
- **Follow the phase order** - don't skip ahead
- **Commit at phase boundaries** - not mid-phase
- **Update this file** if you discover better approaches
