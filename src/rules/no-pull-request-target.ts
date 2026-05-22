import { Rule, RuleContext, RuleViolation } from './rule';

/**
 * Rule: no-pull-request-target
 *
 * Detects use of `pull_request_target` trigger, which runs in the context
 * of the base branch and has access to secrets, making it dangerous when
 * combined with code from untrusted forks.
 */

function checkTriggers(context: RuleContext): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const { workflow, filePath } = context;

  const on = workflow.on;
  if (!on) return violations;

  const hasTrigger =
    (typeof on === 'string' && on === 'pull_request_target') ||
    (Array.isArray(on) && on.includes('pull_request_target')) ||
    (typeof on === 'object' && on !== null && 'pull_request_target' in on);

  if (hasTrigger) {
    const detail =
      typeof on === 'object' && !Array.isArray(on) && on['pull_request_target']
        ? JSON.stringify(on['pull_request_target'])
        : undefined;

    violations.push({
      ruleId: 'no-pull-request-target',
      severity: 'error',
      message:
        '`pull_request_target` trigger runs with write permissions and access to secrets. ' +
        'It is dangerous when the workflow checks out or executes code from a fork.',
      filePath,
      line: undefined,
      detail,
    });
  }

  return violations;
}

export const noPullRequestTarget: Rule = {
  id: 'no-pull-request-target',
  description:
    'Disallow the pull_request_target trigger to prevent privilege escalation from untrusted forks.',
  severity: 'error',
  check(context: RuleContext): RuleViolation[] {
    return checkTriggers(context);
  },
};

export { checkTriggers };
