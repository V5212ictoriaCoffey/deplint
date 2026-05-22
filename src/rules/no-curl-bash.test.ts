import { describe, it, expect } from 'vitest';
import { checkStep } from './no-curl-bash';
import { RuleContext } from './rule';

function makeContext(overrides?: Partial<RuleContext>): RuleContext {
  return {
    filePath: 'test.yml',
    jobId: 'build',
    stepIndex: 0,
    ...overrides,
  };
}

describe('no-curl-bash', () => {
  it('flags curl piped to bash', () => {
    const step = { run: 'curl https://example.com/install.sh | bash' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('no-curl-bash');
    expect(violations[0].severity).toBe('error');
  });

  it('flags curl piped to sh', () => {
    const step = { run: 'curl -fsSL https://get.example.com | sh' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(1);
  });

  it('flags wget piped to bash', () => {
    const step = { run: 'wget -qO- https://example.com/install.sh | bash' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(1);
  });

  it('flags wget piped to sh', () => {
    const step = { run: 'wget -O - https://example.com/setup.sh | sh' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(1);
  });

  it('flags each offending line independently', () => {
    const step = {
      run: 'curl https://a.com/a.sh | bash\ncurl https://b.com/b.sh | bash',
    };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(2);
  });

  it('does not flag safe curl usage', () => {
    const step = { run: 'curl -o file.sh https://example.com/install.sh' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(0);
  });

  it('does not flag steps without run', () => {
    const step = { uses: 'actions/checkout@v4' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    const step = { run: 'CURL https://example.com/install.sh | BASH' };
    const violations = checkStep(step, makeContext());
    expect(violations).toHaveLength(1);
  });
});
