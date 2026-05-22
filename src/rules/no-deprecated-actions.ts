import { Rule, RuleContext, RuleViolation } from './rule';

const DEPRECATED_ACTIONS: Record<string, string> = {
  'actions/checkout@v1': 'actions/checkout@v4',
  'actions/checkout@v2': 'actions/checkout@v4',
  'actions/setup-node@v1': 'actions/setup-node@v4',
  'actions/setup-node@v2': 'actions/setup-node@v4',
  'actions/setup-python@v1': 'actions/setup-python@v5',
  'actions/setup-python@v2': 'actions/setup-python@v5',
  'actions/cache@v1': 'actions/cache@v4',
  'actions/cache@v2': 'actions/cache@v4',
  'actions/upload-artifact@v1': 'actions/upload-artifact@v4',
  'actions/upload-artifact@v2': 'actions/upload-artifact@v4',
  'actions/download-artifact@v1': 'actions/download-artifact@v4',
  'actions/download-artifact@v2': 'actions/download-artifact@v4',
  'github/codeql-action/init@v1': 'github/codeql-action/init@v3',
  'github/codeql-action/analyze@v1': 'github/codeql-action/analyze@v3',
};

export function checkStep(
  step: Record<string, unknown>,
  context: RuleContext
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const uses = step['uses'];

  if (typeof uses !== 'string') {
    return violations;
  }

  const replacement = DEPRECATED_ACTIONS[uses];
  if (replacement) {
    violations.push({
      ruleId: 'no-deprecated-actions',
      severity: 'warning',
      message: `Deprecated action "${uses}" found. Consider upgrading to "${replacement}".`,
      file: context.filePath,
      line: context.line,
    });
  }

  return violations;
}

export const noDeprecatedActions: Rule = {
  id: 'no-deprecated-actions',
  name: 'No Deprecated Actions',
  description: 'Flags usage of known deprecated GitHub Actions versions.',
  severity: 'warning',
  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const jobs = (context.workflow['jobs'] as Record<string, unknown>) ?? {};

    for (const [, job] of Object.entries(jobs)) {
      const steps = ((job as Record<string, unknown>)['steps'] as unknown[]) ?? [];
      for (const step of steps) {
        violations.push(
          ...checkStep(step as Record<string, unknown>, context)
        );
      }
    }

    return violations;
  },
};
