import { Rule, RuleContext, RuleViolation } from './rule';

/**
 * Detects dangerous use of matrix context values in run steps,
 * which can lead to script injection if matrix values are user-controlled.
 */

const MATRIX_INTERPOLATION_PATTERN = /\$\{\{\s*matrix\.[^}]+\}\}/g;

export function checkStep(
  step: Record<string, unknown>,
  context: RuleContext
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  const run = step['run'];
  if (typeof run !== 'string') return violations;

  const matches = run.match(MATRIX_INTERPOLATION_PATTERN);
  if (!matches) return violations;

  for (const match of matches) {
    violations.push(
      context.createViolation(
        `Dangerous matrix interpolation in run step: ${match}. ` +
          'Matrix values may be attacker-controlled and can lead to script injection. ' +
          'Assign the matrix value to an environment variable and reference that instead.',
        'high'
      )
    );
  }

  return violations;
}

const rule: Rule = {
  id: 'no-matrix-injection',
  name: 'No Matrix Injection',
  description:
    'Detects direct interpolation of matrix context values inside run steps, ' +
    'which can lead to script injection vulnerabilities.',
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
