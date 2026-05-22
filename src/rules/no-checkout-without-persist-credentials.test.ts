import { describe, it, expect } from 'vitest';
import { noCheckoutWithoutPersistCredentials } from './no-checkout-without-persist-credentials';
import { RuleContext } from './rule';

function makeContext(workflow: unknown): RuleContext {
  return {
    filePath: 'workflow.yml',
    workflow: workflow as RuleContext['workflow'],
  };
}

describe('no-checkout-without-persist-credentials', () => {
  it('flags actions/checkout without any with block', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [{ uses: 'actions/checkout@v4' }],
        },
      },
    });
    const violations = noCheckoutWithoutPersistCredentials.check(ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('no-checkout-without-persist-credentials');
  });

  it('flags actions/checkout when persist-credentials is true', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [
            { uses: 'actions/checkout@v3', with: { 'persist-credentials': true } },
          ],
        },
      },
    });
    const violations = noCheckoutWithoutPersistCredentials.check(ctx);
    expect(violations).toHaveLength(1);
  });

  it('does not flag actions/checkout when persist-credentials is false', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [
            { uses: 'actions/checkout@v4', with: { 'persist-credentials': false } },
          ],
        },
      },
    });
    const violations = noCheckoutWithoutPersistCredentials.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('does not flag unrelated actions', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [{ uses: 'actions/setup-node@v4' }],
        },
      },
    });
    const violations = noCheckoutWithoutPersistCredentials.check(ctx);
    expect(violations).toHaveLength(0);
  });

  it('handles multiple jobs and steps', () => {
    const ctx = makeContext({
      jobs: {
        build: {
          steps: [
            { uses: 'actions/checkout@v4' },
            { uses: 'actions/checkout@v4', with: { 'persist-credentials': false } },
          ],
        },
        test: {
          steps: [{ uses: 'actions/checkout@v4' }],
        },
      },
    });
    const violations = noCheckoutWithoutPersistCredentials.check(ctx);
    expect(violations).toHaveLength(2);
  });

  it('returns no violations when there are no jobs', () => {
    const ctx = makeContext({});
    const violations = noCheckoutWithoutPersistCredentials.check(ctx);
    expect(violations).toHaveLength(0);
  });
});
