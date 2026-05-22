import { describe, it, expect } from 'vitest';
import { noUnpinnedActions } from './no-unpinned-actions';
import { RuleContext } from './rule';

function makeContext(workflow: object): RuleContext {
  return { workflow, filePath: 'test.yml' };
}

describe('no-unpinned-actions', () => {
  it('returns no violations for SHA-pinned actions', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [
            { uses: 'actions/checkout@a81bbbf8298c0fa03ea29cdc473d45769f953675' },
          ],
        },
      },
    });
    expect(noUnpinnedActions.check(ctx)).toHaveLength(0);
  });

  it('returns a warning for semver-tagged actions', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [{ uses: 'actions/checkout@v3.1.0' }],
        },
      },
    });
    const violations = noUnpinnedActions.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe('warning');
  });

  it('returns an error for actions pinned to main branch', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [{ uses: 'actions/checkout@main' }],
        },
      },
    });
    const violations = noUnpinnedActions.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe('error');
    expect(violations[0].message).toMatch(/mutable branch/);
  });

  it('returns an error for actions with no version', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [{ uses: 'actions/checkout' }],
        },
      },
    });
    const violations = noUnpinnedActions.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe('error');
  });

  it('ignores steps without a uses field', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [{ name: 'Run tests', run: 'npm test' }],
        },
      },
    });
    expect(noUnpinnedActions.check(ctx)).toHaveLength(0);
  });

  it('handles workflows with no jobs', () => {
    const ctx = makeContext({});
    expect(noUnpinnedActions.check(ctx)).toHaveLength(0);
  });
});
