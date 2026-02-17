/**
 * Prompt templates for AI engine
 */

export function createFileNotesPrompt(filePath: string, content: string, language: string): string {
  return `You are analyzing a file from a codebase to extract key information.

File: ${filePath}
Language: ${language}

Content:
\`\`\`${language.toLowerCase()}
${content}
\`\`\`

Please provide:
1. **Purpose**: What is this file's primary responsibility? (1-2 sentences)
2. **Key Functions/Classes**: List the most important functions, classes, or exports
3. **External Interactions**: Does this file interact with databases, APIs, queues, or external systems?
4. **TODOs/Smells**: Any obvious issues, TODOs, or code smells?

Output must be valid Markdown. Be concise and concrete.`;
}

export function createSynthesisPrompt(
  scope: string,
  factsJson: string,
  fileNotesText: string,
  diagramNodeCap: number,
  isFeatureScope: boolean
): string {
  const featureSection = isFeatureScope
    ? `
# 8. Feature Walkthrough
Happy path narrative + Mermaid sequence diagram + unhappy paths list
`
    : '';

  return `You are creating a comprehensive repository explainer.

Scope: ${scope}

Facts (extracted metadata):
${factsJson}

File Notes (AI-analyzed files):
${fileNotesText}

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
${featureSection}

Requirements:
- Output valid Markdown
- Include Mermaid diagrams in fenced code blocks (\`\`\`mermaid)
- Use exact section headings above
- Prefer concrete file references (e.g., src/api/routes.ts:42)
- If uncertain, say "Unknown" rather than guessing
- Keep Mermaid diagrams under ${diagramNodeCap} nodes`;
}
