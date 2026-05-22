import { Rule, RuleContext, RuleViolation } from './rule';

const DEFAULT_TIMEOUT_MINUTES = 360; // GitHub default
const RECOMMENDED_MAX_TIMEOUT = 60;

function checkJob(
  jobId: string,
  job: Record<string, unknown>,
  context: RuleContext
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  const timeoutMinutes = job['timeout-minutes'];

  if (timeoutMinutes === undefined || timeoutMinutes === null) {
    violations.push({
      rule: 'no-missing-timeout',
      severity: 'warning',
      message: `Job "${jobId}" does not define a timeout-minutes. Defaults to ${DEFAULT_TIMEOUT_MINUTES} minutes, which may allow runaway jobs to consume excessive resources.`,
      file: context.filePath,
      line: context.lines?.[`jobs.${jobId}`],
    });
    return violations;
  }

  const timeout = Number(timeoutMinutes);
  if (!isNaN(timeout) && timeout > RECOMMENDED_MAX_TIMEOUT) {
    violations.push({
      rule: 'no-missing-timeout',
      severity: 'info',
      message: `Job "${jobId}" has a timeout of ${timeout} minutes, which exceeds the recommended maximum of ${RECOMMENDED_MAX_TIMEOUT} minutes.`,
      file: context.filePath,
      line: context.lines?.[`jobs.${jobId}`],
    });
  }

  return violations;
}

export const noMissingTimeout: Rule = {
  id: 'no-missing-timeout',
  name: 'No Missing Timeout',
  description:
    'Ensures all jobs define a timeout-minutes to prevent runaway workflows from consuming excessive CI resources.',
  severity: 'warning',
  check(context: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const jobs = context.workflow?.jobs;

    if (!jobs || typeof jobs !== 'object') {
      return violations;
    }

    for (const [jobId, job] of Object.entries(jobs)) {
      if (job && typeof job === 'object') {
        violations.push(...checkJob(jobId, job as Record<string, unknown>, context));
      }
    }

    return violations;
  },
};
