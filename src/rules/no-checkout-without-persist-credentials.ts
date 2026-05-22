import { Rule, RuleContext, RuleViolation } from './rule';

/**
 * Rule: no-checkout-without-persist-credentials
 *
 * Detects uses of actions/checkout without explicitly setting
 * persist-credentials: false, which can leak GitHub tokens to
 * subsequent steps or third-party actions.
 */

function checkStep(
  step: Record<string, unknown>,
  context: RuleContext
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  if (typeof step.uses !== 'string') return violations;

  const usesValue = step.uses as string;
  if (!usesValue.startsWith('actions/checkout')) return violations;

  const withBlock = step.with as Record<string, unknown> | undefined;

  const persistCredentials = withBlock?.['persist-credentials'];

  // Only flag if persist-credentials is not explicitly set to false
  if (persistCredentials === false || persistCredentials === 'false') {
    return violations;
  }

  violations.push({
    ruleId: 'no-checkout-without-persist-credentials',
    severity: 'warning',
    message:
      'actions/checkout should set persist-credentials: false to avoid leaking the GitHub token to subsequent steps.',
    path: context.filePath,
    line: (step as { __line?: number }).__line,
  });

  return violations;
}

export const noCheckoutWithoutPersistCredentials: Rule = {
  id: 'no-checkout-without-persist-credentials',
  description:
    'Ensures actions/checkout is used with persist-credentials: false.',
  severity: 'warning',
  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const { workflow } = context;

    const jobs = workflow.jobs as Record<string, { steps?: unknown[] }> | undefined;
    if (!jobs) return violations;

    for (const job of Object.values(jobs)) {
      const steps = job.steps ?? [];
      for (const step of steps) {
        violations.push(
          ...checkStep(step as Record<string, unknown>, context)
        );
      }
    }

    return violations;
  },
};
