import { describe, it, expect } from 'vitest';
import { noMissingTimeout } from './no-missing-timeout';
import { RuleContext } from './rule';

function makeContext(jobs: Record<string, unknown>): RuleContext {
  return {
    filePath: 'test.yml',
    workflow: {
      jobs,
    },
  };
}

describe('no-missing-timeout', () => {
  it('flags a job with no timeout-minutes defined', () => {
    const ctx = makeContext({
      build: {
        'runs-on': 'ubuntu-latest',
        steps: [],
      },
    });
    const violations = noMissingTimeout.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe('warning');
    expect(violations[0].message).toContain('build');
    expect(violations[0].message).toContain('timeout-minutes');
  });

  it('does not flag a job with an acceptable timeout', () => {
    const ctx = makeContext({
      build: {
        'runs-on': 'ubuntu-latest',
        'timeout-minutes': 30,
        steps: [],
      },
    });
    const violations = noMissingTimeout.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('flags a job with a timeout exceeding the recommended max', () => {
    const ctx = makeContext({
      build: {
        'runs-on': 'ubuntu-latest',
        'timeout-minutes': 120,
        steps: [],
      },
    });
    const violations = noMissingTimeout.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe('info');
    expect(violations[0].message).toContain('120 minutes');
  });

  it('handles multiple jobs and flags each missing timeout', () => {
    const ctx = makeContext({
      build: { 'runs-on': 'ubuntu-latest', steps: [] },
      test: { 'runs-on': 'ubuntu-latest', 'timeout-minutes': 20, steps: [] },
      deploy: { 'runs-on': 'ubuntu-latest', steps: [] },
    });
    const violations = noMissingTimeout.check(ctx);
    expect(violations).toHaveLength(2);
    const jobNames = violations.map((v) => v.message);
    expect(jobNames.some((m) => m.includes('build'))).toBe(true);
    expect(jobNames.some((m) => m.includes('deploy'))).toBe(true);
  });

  it('returns no violations when workflow has no jobs', () => {
    const ctx: RuleContext = { filePath: 'test.yml', workflow: {} };
    const violations = noMissingTimeout.check(ctx);
    expect(violations).toHaveLength(0);
  });
});
