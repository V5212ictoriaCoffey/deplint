import { describe, it, expect } from 'vitest';
import rule, { hasDangerousInterpolation } from './no-script-injection';
import { RuleContext } from './rule';

function makeContext(workflow: object): RuleContext {
  return {
    filePath: 'workflow.yml',
    workflow: workflow as any,
  };
}

describe('hasDangerousInterpolation', () => {
  it('detects PR title interpolation', () => {
    expect(
      hasDangerousInterpolation('echo "${{ github.event.pull_request.title }}"')
    ).toBe(true);
  });

  it('detects head_ref interpolation', () => {
    expect(
      hasDangerousInterpolation('git checkout ${{ github.head_ref }}')
    ).toBe(true);
  });

  it('allows safe context values', () => {
    expect(
      hasDangerousInterpolation('echo "${{ github.sha }}"')
    ).toBe(false);
  });

  it('returns false for scripts without interpolation', () => {
    expect(hasDangerousInterpolation('npm ci && npm test')).toBe(false);
  });
});

describe('no-script-injection rule', () => {
  it('flags direct interpolation of PR title in run step', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [
            {
              name: 'Echo title',
              run: 'echo "${{ github.event.pull_request.title }}"',
            },
          ],
        },
      },
    });
    const violations = rule.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe('error');
    expect(violations[0].message).toContain('"Echo title"');
  });

  it('flags issue body interpolation', () => {
    const ctx = makeContext({
      jobs: {
        triage: {
          steps: [
            { run: 'echo ${{ github.event.issue.body }}' },
          ],
        },
      },
    });
    expect(rule.check(ctx)).toHaveLength(1);
  });

  it('does not flag uses steps', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [{ uses: 'actions/checkout@v4' }],
        },
      },
    });
    expect(rule.check(ctx)).toHaveLength(0);
  });

  it('does not flag safe run scripts', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [{ run: 'echo ${{ github.sha }}' }],
        },
      },
    });
    expect(rule.check(ctx)).toHaveLength(0);
  });
});
