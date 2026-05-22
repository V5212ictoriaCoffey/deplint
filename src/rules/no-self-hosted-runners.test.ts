import { describe, it, expect } from 'vitest';
import { checkJob, noSelfHostedRunners } from './no-self-hosted-runners';
import { RuleContext } from './rule';

function makeContext(workflow: Record<string, unknown>): RuleContext {
  return { filePath: 'test.yml', workflow, line: 1 };
}

describe('checkJob', () => {
  it('returns a violation for a self-hosted string runner', () => {
    const violations = checkJob(
      'build',
      { 'runs-on': 'self-hosted' },
      makeContext({})
    );
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('no-self-hosted-runners');
  });

  it('returns a violation for self-hosted in array', () => {
    const violations = checkJob(
      'build',
      { 'runs-on': ['self-hosted', 'linux', 'x64'] },
      makeContext({})
    );
    expect(violations).toHaveLength(1);
  });

  it('returns no violation for ubuntu-latest', () => {
    const violations = checkJob(
      'build',
      { 'runs-on': 'ubuntu-latest' },
      makeContext({})
    );
    expect(violations).toHaveLength(0);
  });

  it('returns no violation for hosted runner array', () => {
    const violations = checkJob(
      'build',
      { 'runs-on': ['ubuntu-latest'] },
      makeContext({})
    );
    expect(violations).toHaveLength(0);
  });
});

describe('noSelfHostedRunners rule', () => {
  it('detects self-hosted runners across multiple jobs', () => {
    const workflow = {
      jobs: {
        build: { 'runs-on': 'ubuntu-latest', steps: [] },
        deploy: { 'runs-on': 'self-hosted', steps: [] },
      },
    };
    const violations = noSelfHostedRunners.check(makeContext(workflow));
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('deploy');
  });

  it('returns no violations when all runners are hosted', () => {
    const workflow = {
      jobs: {
        build: { 'runs-on': 'ubuntu-latest', steps: [] },
        test: { 'runs-on': 'windows-latest', steps: [] },
      },
    };
    const violations = noSelfHostedRunners.check(makeContext(workflow));
    expect(violations).toHaveLength(0);
  });
});
