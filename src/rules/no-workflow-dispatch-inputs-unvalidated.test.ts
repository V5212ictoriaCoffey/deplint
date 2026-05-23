import { describe, it, expect } from 'vitest';
import { checkStep } from './no-workflow-dispatch-inputs-unvalidated';
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

describe('no-workflow-dispatch-inputs-unvalidated: checkStep', () => {
  it('flags direct use of github.event.inputs in run step', () => {
    const step = { run: 'echo ${{ github.event.inputs.name }}' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('github.event.inputs.name');
    expect(violations[0].severity).toBe('high');
  });

  it('flags multiple dispatch input uses in one run step', () => {
    const step = {
      run: 'deploy --env ${{ github.event.inputs.environment }} --version ${{ github.event.inputs.version }}',
    };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(2);
  });

  it('does not flag steps without run', () => {
    const step = { uses: 'actions/checkout@v4' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(0);
  });

  it('does not flag run steps without dispatch input interpolation', () => {
    const step = { run: 'echo "static value"' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(0);
  });

  it('does not flag env context usage', () => {
    const step = { run: 'echo ${{ env.INPUT_NAME }}' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(0);
  });

  it('does not flag inputs used in non-run fields', () => {
    const step = { name: 'Deploy ${{ github.event.inputs.env }}', run: 'echo safe' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(0);
  });
});
