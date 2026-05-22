import { describe, it, expect } from 'vitest';
import { checkStep, noDeprecatedActions } from './no-deprecated-actions';
import { RuleContext } from './rule';

function makeContext(workflow: Record<string, unknown>): RuleContext {
  return { filePath: 'test.yml', workflow, line: 1 };
}

describe('checkStep', () => {
  it('returns a violation for a deprecated action', () => {
    const violations = checkStep(
      { uses: 'actions/checkout@v2' },
      makeContext({})
    );
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('no-deprecated-actions');
    expect(violations[0].message).toContain('actions/checkout@v4');
  });

  it('returns no violation for a current action', () => {
    const violations = checkStep(
      { uses: 'actions/checkout@v4' },
      makeContext({})
    );
    expect(violations).toHaveLength(0);
  });

  it('returns no violation for a run step', () => {
    const violations = checkStep(
      { run: 'echo hello' },
      makeContext({})
    );
    expect(violations).toHaveLength(0);
  });

  it('returns violation for deprecated setup-node', () => {
    const violations = checkStep(
      { uses: 'actions/setup-node@v1' },
      makeContext({})
    );
    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe('warning');
  });
});

describe('noDeprecatedActions rule', () => {
  it('detects deprecated actions in workflow jobs', () => {
    const workflow = {
      jobs: {
        build: {
          steps: [
            { uses: 'actions/checkout@v2' },
            { uses: 'actions/setup-node@v1' },
            { run: 'npm test' },
          ],
        },
      },
    };
    const violations = noDeprecatedActions.check(makeContext(workflow));
    expect(violations).toHaveLength(2);
  });

  it('returns no violations when no deprecated actions are used', () => {
    const workflow = {
      jobs: {
        build: {
          steps: [
            { uses: 'actions/checkout@v4' },
            { run: 'npm ci' },
          ],
        },
      },
    };
    const violations = noDeprecatedActions.check(makeContext(workflow));
    expect(violations).toHaveLength(0);
  });
});
