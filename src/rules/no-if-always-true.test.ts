import { describe, it, expect } from 'vitest';
import { checkIfCondition } from './no-if-always-true';
import rule from './no-if-always-true';
import { RuleContext } from './rule';

function makeContext(workflow: object): RuleContext {
  return {
    workflow: workflow as any,
    filePath: 'test.yml',
  };
}

describe('checkIfCondition', () => {
  it('flags a bare true condition', () => {
    const result = checkIfCondition('true', 'test.yml > jobs.build.if', makeContext({}));
    expect(result).toHaveLength(1);
    expect(result[0].ruleId).toBe('no-if-always-true');
  });

  it('flags always() condition', () => {
    const result = checkIfCondition('always()', 'test.yml > jobs.build.if', makeContext({}));
    expect(result).toHaveLength(1);
  });

  it('flags || true bypass pattern', () => {
    const result = checkIfCondition(
      "github.event_name == 'push' || true",
      'test.yml > jobs.deploy.if',
      makeContext({})
    );
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('always true');
  });

  it('does not flag a normal condition', () => {
    const result = checkIfCondition(
      "github.event_name == 'push'",
      'test.yml > jobs.build.if',
      makeContext({})
    );
    expect(result).toHaveLength(0);
  });

  it('does not flag success() condition', () => {
    const result = checkIfCondition('success()', 'test.yml > jobs.build.if', makeContext({}));
    expect(result).toHaveLength(0);
  });
});

describe('no-if-always-true rule', () => {
  it('detects always-true job condition', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          if: 'true',
          steps: [],
        },
      },
    });
    const violations = rule.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].path).toContain('jobs.build.if');
  });

  it('detects always-true step condition', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [{ name: 'Deploy', if: 'always()', run: 'echo deploy' }],
        },
      },
    });
    const violations = rule.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].path).toContain('steps[0].if');
  });

  it('returns no violations for a clean workflow', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [{ name: 'Build', run: 'make build' }],
        },
      },
    });
    expect(rule.check(ctx)).toHaveLength(0);
  });
});
