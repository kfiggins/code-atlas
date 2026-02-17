import { spawn } from 'child_process';
import type { IEngine, FileNote, EngineResult } from './types.js';
import { createFileNotesPrompt, createSynthesisPrompt } from './prompts.js';

export class ClaudeEngine implements IEngine {
  private timeout: number;

  constructor(timeout: number = 120000) {
    // 2 minutes default
    this.timeout = timeout;
  }

  async generateFileNotes(
    filePath: string,
    content: string,
    language: string
  ): Promise<FileNote | null> {
    const prompt = createFileNotesPrompt(filePath, content, language);

    const result = await this.runClaude(prompt);

    if (!result.success || !result.output) {
      console.warn(`Failed to generate file notes for ${filePath}`);
      return null;
    }

    // Parse the markdown output into structured FileNote
    // For now, just return a simplified version
    return this.parseFileNotes(filePath, result.output);
  }

  async generateSynthesis(
    scope: string,
    facts: any,
    fileNotes: FileNote[],
    diagramNodeCap: number
  ): Promise<string | null> {
    const factsJson = JSON.stringify(facts, null, 2);
    const fileNotesText = fileNotes
      .map(
        (note) => `
## ${note.filePath}
**Purpose**: ${note.purpose}
**Key Items**: ${note.keyItems.join(', ')}
**External Interactions**: ${note.externalInteractions.join(', ')}
**TODOs**: ${note.todos.join(', ')}
`
      )
      .join('\n');

    const isFeatureScope = scope.startsWith('feature:');
    const prompt = createSynthesisPrompt(scope, factsJson, fileNotesText, diagramNodeCap, isFeatureScope);

    const result = await this.runClaude(prompt);

    if (!result.success || !result.output) {
      console.warn('Failed to generate synthesis report');
      return null;
    }

    return result.output;
  }

  private async runClaude(prompt: string): Promise<EngineResult> {
    return new Promise((resolve) => {
      // Try to run 'claude' command
      // Note: This assumes Claude Code CLI is installed and available
      // For now, we'll use a simple echo for testing
      // In production, this would be: claude --prompt "..."

      const child = spawn('claude', ['--message', prompt], {
        timeout: this.timeout,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        // Command not found or other error
        resolve({
          success: false,
          output: '',
          error: `Failed to execute claude: ${error.message}`,
        });
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: stdout,
          });
        } else {
          resolve({
            success: false,
            output: stdout,
            error: stderr || `Claude exited with code ${code}`,
          });
        }
      });
    });
  }

  private parseFileNotes(filePath: string, markdown: string): FileNote {
    // Simple parser - looks for sections in markdown
    const purposeMatch = markdown.match(/\*\*Purpose\*\*:?\s*(.+?)(?=\n|$)/i);
    const keyItemsMatch = markdown.match(/\*\*Key Functions\/Classes\*\*:?\s*(.+?)(?=\n\n|$)/is);
    const interactionsMatch = markdown.match(/\*\*External Interactions\*\*:?\s*(.+?)(?=\n\n|$)/is);
    const todosMatch = markdown.match(/\*\*TODOs\/Smells\*\*:?\s*(.+?)(?=\n\n|$)/is);

    return {
      filePath,
      purpose: purposeMatch?.[1]?.trim() || 'Unknown',
      keyItems: this.parseListItems(keyItemsMatch?.[1] || ''),
      externalInteractions: this.parseListItems(interactionsMatch?.[1] || ''),
      todos: this.parseListItems(todosMatch?.[1] || ''),
    };
  }

  private parseListItems(text: string): string[] {
    if (!text || text.trim().toLowerCase().includes('none') || text.trim().toLowerCase().includes('no ')) {
      return [];
    }

    // Split by commas, newlines, or bullet points
    return text
      .split(/[,\n]|[-•*]\s*/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
}
