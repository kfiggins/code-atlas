import { describe, it, expect } from 'vitest';
import { createFileNotesPrompt, createSynthesisPrompt } from '../../src/engine/prompts.js';

describe('Engine Prompts', () => {
  describe('createFileNotesPrompt', () => {
    it('should create a valid file notes prompt', () => {
      const prompt = createFileNotesPrompt(
        'src/index.ts',
        'export function main() { console.log("hello"); }',
        'TypeScript'
      );

      expect(prompt).toContain('src/index.ts');
      expect(prompt).toContain('TypeScript');
      expect(prompt).toContain('Purpose');
      expect(prompt).toContain('Key Functions/Classes');
      expect(prompt).toContain('External Interactions');
      expect(prompt).toContain('TODOs/Smells');
      expect(prompt).toContain('export function main()');
    });

    it('should include file content in code fence', () => {
      const content = 'const x = 42;';
      const prompt = createFileNotesPrompt('test.js', content, 'JavaScript');

      expect(prompt).toContain('```javascript');
      expect(prompt).toContain(content);
      expect(prompt).toContain('```');
    });
  });

  describe('createSynthesisPrompt', () => {
    it('should create a valid synthesis prompt', () => {
      const facts = { languages: [{ language: 'TypeScript', fileCount: 10 }] };
      const fileNotes = 'File notes here';

      const prompt = createSynthesisPrompt(
        'repo',
        JSON.stringify(facts),
        fileNotes,
        20,
        false
      );

      expect(prompt).toContain('repo');
      expect(prompt).toContain('Facts');
      expect(prompt).toContain('File Notes');
      expect(prompt).toContain('Executive Map');
      expect(prompt).toContain('How to Find Things');
      expect(prompt).toContain('Data Flow Overview');
      expect(prompt).toContain('Key Modules');
      expect(prompt).toContain('Edge Cases');
      expect(prompt).toContain('Operational Reality');
      expect(prompt).toContain('Change Guide');
    });

    it('should include feature walkthrough for feature scope', () => {
      const prompt = createSynthesisPrompt(
        'feature:auth',
        '{}',
        '',
        20,
        true
      );

      expect(prompt).toContain('Feature Walkthrough');
      expect(prompt).toContain('sequence diagram');
    });

    it('should not include feature walkthrough for non-feature scope', () => {
      const prompt = createSynthesisPrompt(
        'repo',
        '{}',
        '',
        20,
        false
      );

      expect(prompt).not.toContain('Feature Walkthrough');
    });

    it('should include diagram node cap', () => {
      const prompt = createSynthesisPrompt(
        'repo',
        '{}',
        '',
        15,
        false
      );

      expect(prompt).toContain('15 nodes');
    });
  });
});
