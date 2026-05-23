import { Rule, RuleContext, RuleViolation } from './rule';

// Jobs deploying to sensitive environments should require reviewers / protection rules.
// We can only lint what's expressed in the workflow: warn if `environment` is set
// without a corresponding `if` guard referencing branch/tag protection.
const SENSITIVE_ENV_PATTERNS = [
  /prod/i,
  /production/i,
  /release/i,
  /staging/i,
  /deploy/i,
];

function isSensitiveEnvironment(env: string): boolean {
  return SENSITIVE_ENV_PATTERNS.some((p) => p.test(env));
}

export function checkJob(job: any, jobId: string, filePath: string): RuleViolation[] {
  const violations: RuleViolation[] = [];

  const envValue: string | undefined =
    typeof job.environment === 'string'
      ? job.environment
      : typeof job.environment?.name === 'string'
      ? job.environment.name
      : undefined;

  if (!envValue) return violations;
  if (!isSensitiveEnvironment(envValue)) return violations;

  // If there's no `if` condition on the job, flag it
  if (!job.if) {
    violations.push({
      ruleId: 'no-unprotected-environment',
      severity: 'warning',
      message: `Job \`${jobId}\` deploys to sensitive environment \`${envValue}\` without an \`if\` condition. Consider restricting to protected branches.`,
      path: `${filePath} > jobs.${jobId}`,
    });
  }

  return violations;
}

const rule: Rule = {
  id: 'no-unprotected-environment',
  description:
    'Warn when a job targets a sensitive environment (e.g. production) without an if-condition guard.',
  severity: 'warning',
  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const jobs = context.workflow.jobs ?? {};
    for (const [jobId, job] of Object.entries(jobs) as [string, any][]) {
      violations.push(...checkJob(job, jobId, context.filePath));
    }
    return violations;
  },
};

export default rule;
