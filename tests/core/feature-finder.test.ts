import { describe, it, expect } from 'vitest';
import { FeatureFinder } from '../../src/core/feature-finder.js';

describe('Feature Finder', () => {
  it('should create instance with query', () => {
    const finder = new FeatureFinder('/test/repo', 'authentication');
    expect(finder).toBeTruthy();
  });

  it('should find feature files (integration test - may fail without ripgrep)', () => {
    // This is a basic integration test that will work when ripgrep is available
    const finder = new FeatureFinder(process.cwd(), 'test');
    const result = finder.findFeatureFiles();

    // Result structure should be valid even if empty
    expect(result).toHaveProperty('matchingFiles');
    expect(result).toHaveProperty('expandedFiles');
    expect(Array.isArray(result.matchingFiles)).toBe(true);
    expect(Array.isArray(result.expandedFiles)).toBe(true);
  });
});
