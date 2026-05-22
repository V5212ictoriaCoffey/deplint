import { Rule, RuleContext, RuleViolation } from './rule';

// Detects use of env context in `if:` conditions which can lead to
// script injection when the env var contains user-controlled data.
const ENV_CONTEXT_PATTERN = /\${{\s*env\.[A-Za-z0-9_]+\s*}}/;

export function checkIfCondition(
  condition: string,
  context: RuleContext,
  location: string
): RuleViolation | null {
  if (ENV_CONTEXT_PATTERN.test(condition)) {
    return {
      ruleId: 'no-env-context-in-if',
      severity: 'warning',
      message:
        `Avoid using env context in \`if:\` expressions (${location}). ` +
        'Environment variables may contain user-controlled data and can lead to expression injection.',
      file: context.filePath,
    };
  }
  return null;
}

const rule: Rule = {
  id: 'no-env-context-in-if',
  description: 'Disallow env context references inside if: conditions to prevent expression injection.',
  severity: 'warning',
  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const { workflow } = context;

    for (const [jobId, job] of Object.entries(workflow.jobs ?? {})) {
      if (job.if) {
        const v = checkIfCondition(String(job.if), context, `job "${jobId}"`);
        if (v) violations.push(v);
      }

      for (const [stepIndex, step] of (job.steps ?? []).entries()) {
        if (step.if) {
          const label = `job "${jobId}" step ${stepIndex + 1}${
            step.name ? ` ("${step.name}")` : ''
          }`;
          const v = checkIfCondition(String(step.if), context, label);
          if (v) violations.push(v);
        }
      }
    }

    return violations;
  },
};

export default rule;
