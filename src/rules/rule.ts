export type Severity = 'error' | 'warning' | 'info';

export interface RuleViolation {
  ruleId: string;
  severity: Severity;
  message: string;
  file: string;
  line?: number;
  path?: string;
}

export interface RuleContext {
  file: string;
  workflow: Record<string, unknown>;
}

export interface Rule {
  id: string;
  description: string;
  severity: Severity;
  check(context: RuleContext): RuleViolation[];
}
