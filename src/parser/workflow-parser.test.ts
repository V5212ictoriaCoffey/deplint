import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { parseWorkflowFile, parseWorkflowDirectory } from "./workflow-parser";

function writeTempFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

describe("parseWorkflowFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "deplint-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should parse a valid workflow file", () => {
    const content = `
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`;
    const filePath = writeTempFile(tmpDir, "ci.yml", content);
    const result = parseWorkflowFile(filePath);

    expect(result.workflow.name).toBe("CI");
    expect(result.workflow.jobs).toHaveProperty("build");
    expect(result.workflow.jobs["build"]["runs-on"]).toBe("ubuntu-latest");
  });

  it("should throw if file does not exist", () => {
    expect(() => parseWorkflowFile("/nonexistent/path/workflow.yml")).toThrow(
      "Workflow file not found"
    );
  });

  it("should throw on invalid YAML", () => {
    const filePath = writeTempFile(tmpDir, "bad.yml", "on: [push\njobs: {");
    expect(() => parseWorkflowFile(filePath)).toThrow("Failed to parse YAML");
  });

  it("should throw if 'on' trigger is missing", () => {
    const content = `
name: No Trigger
jobs:
  build:
    runs-on: ubuntu-latest
`;
    const filePath = writeTempFile(tmpDir, "notrigger.yml", content);
    expect(() => parseWorkflowFile(filePath)).toThrow("missing 'on' trigger");
  });

  it("should throw if 'jobs' is missing", () => {
    const content = `
name: No Jobs
on: push
`;
    const filePath = writeTempFile(tmpDir, "nojobs.yml", content);
    expect(() => parseWorkflowFile(filePath)).toThrow("missing 'jobs'");
  });
});

describe("parseWorkflowDirectory", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "deplint-dir-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should parse all yml and yaml files in a directory", () => {
    const content = `on: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n`;
    writeTempFile(tmpDir, "workflow1.yml", content);
    writeTempFile(tmpDir, "workflow2.yaml", content);
    writeTempFile(tmpDir, "ignore.txt", "not a workflow");

    const results = parseWorkflowDirectory(tmpDir);
    expect(results).toHaveLength(2);
  });

  it("should throw if directory does not exist", () => {
    expect(() => parseWorkflowDirectory("/nonexistent/dir")).toThrow(
      "Directory not found"
    );
  });
});
