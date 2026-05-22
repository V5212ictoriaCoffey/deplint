import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

export interface WorkflowJob {
  name?: string;
  "runs-on": string | string[];
  steps?: WorkflowStep[];
  permissions?: Record<string, string> | string;
  env?: Record<string, string>;
}

export interface WorkflowStep {
  name?: string;
  uses?: string;
  run?: string;
  env?: Record<string, string>;
  with?: Record<string, unknown>;
}

export interface WorkflowTrigger {
  push?: unknown;
  pull_request?: unknown;
  pull_request_target?: unknown;
  workflow_dispatch?: unknown;
  schedule?: unknown;
}

export interface Workflow {
  name?: string;
  on: WorkflowTrigger | string | string[];
  jobs: Record<string, WorkflowJob>;
  permissions?: Record<string, string> | string;
  env?: Record<string, string>;
}

export interface ParseResult {
  filePath: string;
  workflow: Workflow;
}

export function parseWorkflowFile(filePath: string): ParseResult {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Workflow file not found: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, "utf8");

  let parsed: unknown;
  try {
    parsed = yaml.load(content);
  } catch (err) {
    throw new Error(`Failed to parse YAML in ${filePath}: ${(err as Error).message}`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid workflow file: ${filePath}`);
  }

  const workflow = parsed as Workflow;

  if (!workflow.on) {
    throw new Error(`Workflow missing 'on' trigger: ${filePath}`);
  }

  if (!workflow.jobs || typeof workflow.jobs !== "object") {
    throw new Error(`Workflow missing 'jobs': ${filePath}`);
  }

  return { filePath: absolutePath, workflow };
}

export function parseWorkflowDirectory(dirPath: string): ParseResult[] {
  const absoluteDir = path.resolve(dirPath);

  if (!fs.existsSync(absoluteDir)) {
    throw new Error(`Directory not found: ${absoluteDir}`);
  }

  const files = fs.readdirSync(absoluteDir).filter(
    (f) => f.endsWith(".yml") || f.endsWith(".yaml")
  );

  return files.map((file) => parseWorkflowFile(path.join(absoluteDir, file)));
}
