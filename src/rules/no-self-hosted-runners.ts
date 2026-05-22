import { Rule, RuleContext, RuleViolation } from './rule';

const SELF_HOSTED_PATTERNS = ['self-hosted', /^self-hosted$/];

function isSelfHosted(runsOn: unknown): boolean {
  if (typeof runsOn === 'string') {
    return runsOn.includes('self-hosted');
  }
  if (Array.isArray(runsOn)) {
    return runsOn.some(
      (label) => typeof label === 'string' && label.includes('self-hosted')
    );
  }
  return false;
}

export function checkJob(
  jobId: string,
  job: Record<string, unknown>,
  context: RuleContext
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const runsOn = job['runs-on'];

  if (isSelfHosted(runsOn)) {
    violations.push({
      ruleId: 'no-self-hosted-runners',
      severity: 'warning',
      message:
        `Job "${jobId}" uses self-hosted runners. ` +
        'Self-hosted runners in public repos can be exploited via pull_request events.',
      file: context.filePath,
      line: context.line,
    });
  }

  return violations;
}

export const noSelfHostedRunners: Rule = {
  id: 'no-self-hosted-runners',
  name: 'No Self-Hosted Runners',
  description:
    'Warns when self-hosted runners are used, which may pose security risks in public repositories.',
  severity: 'warning',
  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const jobs = (context.workflow['jobs'] as Record<string, unknown>) ?? {};

    for (const [jobId, job] of Object.entries(jobs)) {
      violations.push(
        ...checkJob(jobId, job as Record<string, unknown>, context)
      );
    }

    return violations;
  },
};
