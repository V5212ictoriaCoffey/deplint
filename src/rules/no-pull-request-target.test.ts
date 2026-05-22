import { describe, it, expect } from 'vitest';
import { checkTriggers } from './no-pull-request-target';
import { RuleContext } from './rule';

function makeContext(on: unknown): RuleContext {
  return {
    filePath: 'test.yml',
    workflow: { on } as any,
  };
}

describe('no-pull-request-target', () => {
  it('flags pull_request_target as a string trigger', () => {
    const violations = checkTriggers(makeContext('pull_request_target'));
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('no-pull-request-target');
    expect(violations[0].severity).toBe('error');
  });

  it('flags pull_request_target in an array of triggers', () => {
    const violations = checkTriggers(
      makeContext(['push', 'pull_request_target'])
    );
    expect(violations).toHaveLength(1);
  });

  it('flags pull_request_target as an object trigger', () => {
    const violations = checkTriggers(
      makeContext({ pull_request_target: { branches: ['main'] } })
    );
    expect(violations).toHaveLength(1);
    expect(violations[0].detail).toContain('main');
  });

  it('does not flag pull_request trigger', () => {
    const violations = checkTriggers(makeContext('pull_request'));
    expect(violations).toHaveLength(0);
  });

  it('does not flag push trigger', () => {
    const violations = checkTriggers(
      makeContext({ push: { branches: ['main'] } })
    );
    expect(violations).toHaveLength(0);
  });

  it('does not flag an array without pull_request_target', () => {
    const violations = checkTriggers(makeContext(['push', 'pull_request']));
    expect(violations).toHaveLength(0);
  });

  it('returns no violations when on is missing', () => {
    const violations = checkTriggers(makeContext(undefined));
    expect(violations).toHaveLength(0);
  });
});
