import { Rule, RuleContext, RuleViolation } from './rule';

/**
 * Warns when workflow_dispatch inputs are used directly in run steps
 * without being assigned to environment variables first (potential injection).
 */

const DISPATCH_INPUT_PATTERN = /\$\{\{\s*github\.event\.inputs\.[^}]+\}\}/g;

export function checkStep(
  step: Record<string, unknown>,
  context: RuleContext
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  const run = step['run'];
  if (typeof run !== 'string') return violations;

  const matches = run.match(DISPATCH_INPUT_PATTERN);
  if (!matches) return violations;

  for (const match of matches) {
    violations.push(
      context.createViolation(
        `Unvalidated workflow_dispatch input used in run step: ${match}. ` +
          'Directly interpolating user-supplied inputs can lead to script injection. ' +
          'Pass the value through an environment variable instead.',
        'high'
      )
    );
  }

  return violations;
}

const rule: Rule = {
  id: 'no-workflow-dispatch-inputs-unvalidated',
  name: 'No Unvalidated Workflow Dispatch Inputs',
  description:
    'Detects direct use of github.event.inputs values in run steps, ' +
    'which can allow script injection from user-supplied input.',
  severity: 'high',
  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const jobs = context.workflow.jobs ?? {};

    for (const [, job] of Object.entries(jobs)) {
      const steps: unknown[] = (job as Record<string, unknown>)['steps'] as unknown[] ?? [];
      for (const step of steps) {
        violations.push(...checkStep(step as Record<string, unknown>, context));
      }
    }

    return violations;
  },
};

export default rule;
