import { Rule, RuleContext, RuleViolation } from './rule';

// Matches ${{ <expression> }} interpolated directly into a run: script
const INTERPOLATION_PATTERN = /\${{[^}]+}}/g;

// Contexts that carry user-controlled data
const DANGEROUS_CONTEXTS = [
  'github.event.pull_request.title',
  'github.event.pull_request.body',
  'github.event.pull_request.head.ref',
  'github.event.issue.title',
  'github.event.issue.body',
  'github.event.comment.body',
  'github.head_ref',
];

export function hasDangerousInterpolation(script: string): boolean {
  const matches = script.match(INTERPOLATION_PATTERN) ?? [];
  return matches.some((expr) =>
    DANGEROUS_CONTEXTS.some((ctx) => expr.includes(ctx))
  );
}

const rule: Rule = {
  id: 'no-script-injection',
  description: 'Disallow direct interpolation of user-controlled GitHub context values into run scripts.',
  severity: 'error',
  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const { workflow } = context;

    for (const [jobId, job] of Object.entries(workflow.jobs ?? {})) {
      for (const [stepIndex, step] of (job.steps ?? []).entries()) {
        if (typeof step.run === 'string' && hasDangerousInterpolation(step.run)) {
          const label = step.name
            ? `"${step.name}"`
            : `step ${stepIndex + 1}`;
          violations.push({
            ruleId: 'no-script-injection',
            severity: 'error',
            message:
              `Script injection risk in job "${jobId}" ${label}: ` +
              'user-controlled context value interpolated directly into a run script. ' +
              'Use an intermediate env variable instead.',
            file: context.filePath,
          });
        }
      }
    }

    return violations;
  },
};

export default rule;
