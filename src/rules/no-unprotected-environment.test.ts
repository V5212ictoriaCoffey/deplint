import { describe, it, expect } from 'vitest';
import { checkJob } from './no-unprotected-environment';
import rule from './no-unprotected-environment';
import { RuleContext } from './rule';

function makeContext(workflow: object): RuleContext {
  return { workflow: workflow as any, filePath: 'test.yml' };
}

describe('checkJob', () => {
  it('flags a production environment without an if guard', () => {
    const job = { environment: 'production', steps: [] };
    const result = checkJob(job, 'deploy', 'test.yml');
    expect(result).toHaveLength(1);
    expect(result[0].ruleId).toBe('no-unprotected-environment');
    expect(result[0].message).toContain('production');
  });

  it('flags when environment is an object with a sensitive name', () => {
    const job = { environment: { name: 'prod', url: 'https://example.com' }, steps: [] };
    const result = checkJob(job, 'deploy', 'test.yml');
    expect(result).toHaveLength(1);
  });

  it('does not flag when an if condition is present', () => {
    const job = {
      environment: 'production',
      if: "github.ref == 'refs/heads/main'",
      steps: [],
    };
    const result = checkJob(job, 'deploy', 'test.yml');
    expect(result).toHaveLength(0);
  });

  it('does not flag non-sensitive environments', () => {
    const job = { environment: 'testing', steps: [] };
    const result = checkJob(job, 'test', 'test.yml');
    expect(result).toHaveLength(0);
  });

  it('does not flag jobs without an environment', () => {
    const job = { steps: [{ run: 'echo hi' }] };
    const result = checkJob(job, 'build', 'test.yml');
    expect(result).toHaveLength(0);
  });
});

describe('no-unprotected-environment rule', () => {
  it('detects unguarded production deployment', () => {
    const ctx = makeContext({
      jobs: {
        deploy: { environment: 'production', steps: [] },
      },
    });
    const violations = rule.check(ctx);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].path).toContain('jobs.deploy');
  });

  it('returns no violations when all sensitive envs have guards', () => {
    const ctx = makeContext({
      jobs: {
        deploy: {
          environment: 'staging',
          if: "github.ref == 'refs/heads/main'",
          steps: [],
        },
      },
    });
    expect(rule.check(ctx)).toHaveLength(0);
  });

  it('returns no violations for a non-deployment workflow', () => {
    const ctx = makeContext({
      jobs: {
        build: { steps: [{ run: 'npm test' }] },
      },
    });
    expect(rule.check(ctx)).toHaveLength(0);
  });
});
