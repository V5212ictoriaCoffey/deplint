import { describe, it, expect } from 'vitest';
import { checkStep } from './no-matrix-injection';
import { RuleContext, RuleViolation } from './rule';

function makeContext(): RuleContext {
  return {
    workflow: { jobs: {} },
    filePath: 'test.yml',
    createViolation(message: string, severity: string): RuleViolation {
      return { message, severity: severity as RuleViolation['severity'], filePath: this.filePath };
    },
  };
}

describe('no-matrix-injection: checkStep', () => {
  it('flags direct matrix interpolation in run step', () => {
    const step = { run: 'echo ${{ matrix.os }}' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('matrix.os');
    expect(violations[0].severity).toBe('high');
  });

  it('flags multiple matrix interpolations in one run step', () => {
    const step = { run: 'echo ${{ matrix.os }} && echo ${{ matrix.version }}' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(2);
  });

  it('does not flag steps without run', () => {
    const step = { uses: 'actions/checkout@v4' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(0);
  });

  it('does not flag run steps without matrix interpolation', () => {
    const step = { run: 'echo "hello world"' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(0);
  });

  it('does not flag env var usage (not matrix)', () => {
    const step = { run: 'echo ${{ env.MY_VAR }}' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(0);
  });

  it('does not flag matrix used in non-run fields', () => {
    const step = { name: 'Test on ${{ matrix.os }}', run: 'echo safe' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(0);
  });
});
