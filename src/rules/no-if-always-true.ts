import { Rule, RuleContext, RuleViolation } from './rule';

// Detects conditions that are always true and may bypass branch protection
const ALWAYS_TRUE_PATTERNS = [
  /^\s*true\s*$/i,
  /^\s*1\s*==\s*1\s*$/,
  /^\s*'[^']*'\s*==\s*'[^']*'\s*$/, // literal string comparison that could be trivially true
  /^\s*\$\{\{\s*true\s*\}\}\s*$/i,
  /^\s*always\(\)\s*$/i,
];

const SUSPICIOUS_BYPASS_PATTERNS = [
  /\|\|\s*true/i,
  /\|\|\s*always\(\)/i,
  /\|\|\s*1\s*==\s*1/,
];

export function checkIfCondition(
  condition: string,
  path: string,
  context: RuleContext
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  for (const pattern of ALWAYS_TRUE_PATTERNS) {
    if (pattern.test(condition)) {
      violations.push({
        ruleId: 'no-if-always-true',
        severity: 'warning',
        message: `Condition \`${condition.trim()}\` is always true and may bypass intended branch logic.`,
        path,
      });
      return violations;
    }
  }

  for (const pattern of SUSPICIOUS_BYPASS_PATTERNS) {
    if (pattern.test(condition)) {
      violations.push({
        ruleId: 'no-if-always-true',
        severity: 'warning',
        message: `Condition \`${condition.trim()}\` contains a clause that is always true, potentially bypassing guards.`,
        path,
      });
      return violations;
    }
  }

  return violations;
}

const rule: Rule = {
  id: 'no-if-always-true',
  description: 'Disallow if conditions that are always true, which may bypass branch protection logic.',
  severity: 'warning',
  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const { workflow, filePath } = context;

    const jobs = workflow.jobs ?? {};
    for (const [jobId, job] of Object.entries(jobs) as [string, any][]) {
      if (job?.if) {
        violations.push(
          ...checkIfCondition(String(job.if), `${filePath} > jobs.${jobId}.if`, context)
        );
      }
      const steps: any[] = job?.steps ?? [];
      steps.forEach((step, idx) => {
        if (step?.if) {
          violations.push(
            ...checkIfCondition(
              String(step.if),
              `${filePath} > jobs.${jobId}.steps[${idx}].if`,
              context
            )
          );
        }
      });
    }

    return violations;
  },
};

export default rule;
