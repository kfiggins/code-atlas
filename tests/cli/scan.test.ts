import { describe, it, expect } from 'vitest';
import { parseScope } from '../../src/cli/scan.js';

describe('Scan Command', () => {
  describe('parseScope', () => {
    it('should parse repo scope', () => {
      const scope = parseScope('repo');
      expect(scope).toEqual({ type: 'repo', value: 'repo' });
    });

    it('should parse folder scope', () => {
      const scope = parseScope('folder:src/api');
      expect(scope).toEqual({ type: 'folder', value: 'src/api' });
    });

    it('should parse feature scope', () => {
      const scope = parseScope('feature:authentication');
      expect(scope).toEqual({ type: 'feature', value: 'authentication' });
    });

    it('should throw error for invalid scope format', () => {
      expect(() => parseScope('invalid')).toThrow();
      expect(() => parseScope('unknown:value')).toThrow();
    });

    it('should handle folder paths with slashes', () => {
      const scope = parseScope('folder:src/components/auth');
      expect(scope).toEqual({ type: 'folder', value: 'src/components/auth' });
    });

    it('should handle feature queries with spaces', () => {
      const scope = parseScope('feature:user authentication');
      expect(scope).toEqual({ type: 'feature', value: 'user authentication' });
    });
  });
});
