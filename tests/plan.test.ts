import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { counts, parsePlan, toValues } from "../templates/_shared/plan.ts";

const sample = readFileSync(new URL("../public/samples/plan.json", import.meta.url), "utf8");
const plan = (changes: unknown[]) => JSON.stringify({ format_version: "1.2", terraform_version: "1.17.2", planned_values: {}, resource_changes: changes });
const rc = (type: string, actions: string[], before: unknown, after: unknown, extra: Record<string, unknown> = {}) => ({ address: `${type}.x`, type, name: "x", mode: "managed", change: { actions, before, after, after_unknown: {}, before_sensitive: {}, after_sensitive: {}, ...extra } });

test("the real sample plan: Terraform's own counts, the database replacement first", () => {
  const p = parsePlan(sample);
  assert.deepEqual(counts(p.changes), { add: 3, change: 4, destroy: 3, replace: 1, forget: 0 });
  assert.equal(p.changes[0].address, "aws_db_instance.orders");
  assert.equal(p.changes[0].action, "replace");
  assert.deepEqual(p.changes[0].forcedBy, ["storage_encrypted"]);
  assert.deepEqual(p.changes[0].diffs[0], { path: "storage_encrypted", before: "false", after: "true" });
  assert.ok(p.changes[0].flags.some((f) => f.includes("skip_final_snapshot")));
  assert.equal(p.changes.filter((c) => c.risk === "high").length, 4);
  assert.match(p.changes.find((c) => c.address === "aws_instance.web[2]")!.why, /past the new count/);
});

test("sensitive values never reach the outputs", () => {
  assert.ok(sample.includes("sample-only-not-a-real-password"));
  const v = toValues(parsePlan(sample), { project: "p", date: "2026-11-22" });
  assert.ok(!JSON.stringify(v).includes("sample-only-not-a-real-password"));
  const p = parsePlan(plan([rc("aws_db_instance", ["update"], { password: "old", port: 5432 }, { password: "new", port: 5432 }, { before_sensitive: { password: true }, after_sensitive: { password: true } })]));
  assert.deepEqual(p.changes[0].diffs, [{ path: "password", before: "(sensitive)", after: "(sensitive)" }]);
});

test("ingress open to the internet: SSH is high, public 443 is fine, egress is ignored", () => {
  const sg = (from: number, cidr = "0.0.0.0/0") => ({ name: "web", ingress: [{ from_port: from, to_port: from, protocol: "tcp", cidr_blocks: [cidr] }], egress: [{ from_port: 0, to_port: 0, protocol: "-1", cidr_blocks: ["0.0.0.0/0"] }] });
  const [ssh] = parsePlan(plan([rc("aws_security_group", ["create"], null, sg(22))])).changes;
  assert.equal(ssh.risk, "high");
  assert.deepEqual(ssh.flags, ["Opens port 22 to the whole internet (0.0.0.0/0)."]);
  assert.equal(parsePlan(plan([rc("aws_security_group", ["create"], null, sg(443))])).changes[0].risk, "low");
  assert.equal(parsePlan(plan([rc("aws_security_group", ["create"], null, sg(22, "10.0.0.0/16"))])).changes[0].risk, "low");
  // Already open before: not news.
  assert.equal(parsePlan(plan([rc("aws_security_group", ["update"], sg(22), { ...sg(22), name: "web2" })])).changes[0].risk, "low");
});

test("wildcard IAM is read from the policy JSON", () => {
  const doc = (Action: string, Resource: string) => JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Allow", Action, Resource }] });
  const [admin] = parsePlan(plan([rc("aws_iam_policy", ["create"], null, { policy: doc("*", "*") })])).changes;
  assert.equal(admin.flags[0], "Allows every action on every resource (*): full admin.");
  assert.equal(parsePlan(plan([rc("aws_iam_policy", ["create"], null, { policy: doc("s3:*", "arn:aws:s3:::b/*") })])).changes[0].risk, "low");
});

test("destroying a data store is high; deletes say why", () => {
  const [b] = parsePlan(plan([{ ...rc("aws_s3_bucket", ["delete"], { bucket: "b", force_destroy: true }, null), action_reason: "delete_because_no_resource_config" }])).changes;
  assert.equal(b.risk, "high");
  assert.ok(b.flags.some((f) => f.startsWith("force_destroy is true")));
  assert.match(b.why, /no longer in the configuration/);
});

test("clear messages for the wrong file", () => {
  assert.throws(() => parsePlan("terraform plan output"), /isn't JSON/);
  assert.throws(() => parsePlan(JSON.stringify({ format_version: "1.0", values: {} })), /state, not a plan/);
  assert.throws(() => parsePlan(JSON.stringify({ hello: 1 })), /format_version/);
});
