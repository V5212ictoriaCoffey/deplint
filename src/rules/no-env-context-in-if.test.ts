import { describe, it, expect } from 'vitest';
import rule, { checkIfCondition } from './no-env-context-in-if';
import { RuleContext } from './rule';

function makeContext(workflow: object): RuleContext {
  return {
    filePath: 'test.yml',
    workflow: workflow as any,
  };
}

describe('checkIfCondition', () => {
  it('flags env context usage in if condition', () => {
    const result = checkIfCondition(
      "${{ env.BRANCH_NAME == 'main' }}",
      makeContext({}),
      'job "build"'
    );
    expect(result).not.toBeNull();
    expect(result?.ruleId).toBe('no-env-context-in-if');
  });

  it('allows non-env context expressions', () => {
    const result = checkIfCondition(
      "${{ github.ref == 'refs/heads/main' }}",
      makeContext({}),
      'job "build"'
    );
    expect(result).toBeNull();
  });

  it('allows plain string conditions', () => {
    const result = checkIfCondition('always()', makeContext({}), 'step 1');
    expect(result).toBeNull();
  });
});

describe('no-env-context-in-if rule', () => {
  it('detects env context in job-level if', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          if: "${{ env.DEPLOY_ENV == 'prod' }}",
          steps: [],
        },
      },
    });
    const violations = rule.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('job "build"');
  });

  it('detects env context in step-level if', () => {
    const ctx = makeContext({
      jobs: {
        test: {
          steps: [
            { name: 'Run tests', if: '${{ env.SKIP_TESTS }}', run: 'npm test' },
          ],
        },
      },
    });
    const violations = rule.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('"Run tests"');
  });

  it('returns no violations when env context is not used in if', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          if: "${{ github.event_name == 'push' }}",
          steps: [
            { name: 'Checkout', uses: 'actions/checkout@v4' },
          ],
        },
      },
    });
    expect(rule.check(ctx)).toHaveLength(0);
  });

  it('returns no violations for workflow with no jobs', () => {
    const ctx = makeContext({});
    expect(rule.check(ctx)).toHaveLength(0);
  });
});
