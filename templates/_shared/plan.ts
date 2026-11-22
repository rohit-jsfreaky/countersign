/**
 * Reading `terraform show -json tfplan` (HashiCorp's JSON output format) into the changes an approver has to look at,
 * ranked by risk. Pure, no imports: the app, the sample script, the templates and the tests share it.
 * Format: https://developer.hashicorp.com/terraform/internals/json-format
 */

export type Action = "create" | "update" | "replace" | "delete" | "forget";
export type Risk = "high" | "medium" | "low";
export type Flag = { risk: Risk; text: string };
export type Diff = { path: string; before: string; after: string };
export type Change = { address: string; type: string; action: Action; risk: Risk; why: string; forcedBy: string[]; flags: string[]; diffs: Diff[] };
export type Plan = { terraform: string; changes: Change[]; drift: number; errored: boolean };

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type Obj = { [k: string]: Json };
type RawChange = { address: string; type: string; name: string; mode: string; index?: Json; action_reason?: string; change: { actions: string[]; before: Json; after: Json; after_unknown?: Json; before_sensitive?: Json; after_sensitive?: Json; replace_paths?: Array<Array<string | number>>; importing?: Obj } };

const RANK: Record<Risk, number> = { high: 0, medium: 1, low: 2 };
const ORDER: Record<Action, number> = { replace: 0, delete: 1, update: 2, create: 3, forget: 4 };

/** Things that hold data: destroying one loses what is in it. Exact resource types, AWS, Google Cloud and Azure. */
const STATEFUL: Array<[RegExp, string]> = [
  [/^(aws_db_instance|aws_rds_cluster|aws_docdb_cluster|aws_neptune_cluster|aws_redshift_cluster|google_sql_database_instance|google_sql_database|google_spanner_(instance|database)|azurerm_(mssql_database|mssql_server|postgresql_flexible_server|mysql_flexible_server|cosmosdb_account))$/, "database"],
  [/^(aws_s3_bucket|google_storage_bucket|azurerm_storage_account)$/, "storage bucket"],
  [/^(aws_dynamodb_table|google_bigquery_(dataset|table)|google_firestore_database)$/, "table"],
  [/^(aws_ebs_volume|aws_efs_file_system|google_compute_disk|google_filestore_instance|azurerm_managed_disk)$/, "disk"],
  [/^(aws_elasticache_(cluster|replication_group)|google_redis_instance|azurerm_redis_cache|aws_opensearch_domain|aws_elasticsearch_domain)$/, "data service"],
  [/^(aws_kms_key|google_kms_crypto_key|azurerm_key_vault|aws_secretsmanager_secret)$/, "key or secret store"],
  [/^(aws_sqs_queue|aws_kinesis_stream)$/, "queue"],
  [/^(aws_route53_zone|google_dns_managed_zone|azurerm_dns_zone)$/, "DNS zone"],
  [/^(aws_cognito_user_pool)$/, "user pool"],
  [/^(aws_ecr_repository|google_artifact_registry_repository)$/, "image registry"],
];
export const stateful = (type: string) => STATEFUL.find(([re]) => re.test(type))?.[1];

const WORLD = new Set(["0.0.0.0/0", "::/0", "*", "Internet", "any"]);
const CIDR_KEYS = ["cidr_ipv4", "cidr_ipv6", "cidr_blocks", "ipv6_cidr_blocks", "source_ranges", "source_address_prefix", "source_address_prefixes"];
const RISKY_PORTS = new Set([22, 3389, 3306, 5432, 1433, 1521, 6379, 27017, 9200, 11211, 2375, 5984]);

const isObj = (v: Json | undefined): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

/** Plain words for `action_reason` (Terraform's display hint for why it chose the action). */
export function reason(c: RawChange, forcedBy: string[]) {
  const name = c.name + (c.index !== undefined && c.index !== null ? `[${JSON.stringify(c.index)}]` : "");
  switch (c.action_reason) {
    case "replace_because_cannot_update":
      return forcedBy.length ? `${list(forcedBy)} can't change in place, so Terraform deletes ${name} and creates a new one.` : `The provider can't make this change in place, so Terraform deletes ${name} and creates a new one.`;
    case "replace_because_tainted":
      return `${name} is marked tainted in the state (an earlier apply failed part-way), so Terraform replaces it.`;
    case "replace_by_request":
      return "Someone asked for this replacement with -replace.";
    case "delete_because_no_resource_config":
      return "It is no longer in the configuration: removed, or renamed or moved without a moved block.";
    case "delete_because_no_module":
      return "The module it belongs to is no longer in the configuration.";
    case "delete_because_wrong_repetition":
      return "How the resource repeats changed (count, for_each or neither), so this instance's key no longer fits.";
    case "delete_because_count_index":
      return `Its index ${JSON.stringify(c.index)} is past the new count.`;
    case "delete_because_each_key":
      return `Its key ${JSON.stringify(c.index)} is no longer in the for_each map.`;
  }
  const a = c.change.actions;
  if (a.includes("delete") && a.includes("create")) return forcedBy.length ? `${list(forcedBy)} can't change in place, so Terraform deletes ${name} and creates a new one.` : "Terraform replaces it.";
  if (a.includes("delete")) return "Planned for destroy.";
  if (a.includes("forget")) return "Terraform stops managing it; the real object stays.";
  if (c.change.importing) return `Imported into the state (${c.change.importing.id ?? "by id"}).`;
  return a.includes("create") ? "New resource." : "Updated in place.";
}
const list = (xs: string[]) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

/** "ingress[0].cidr_blocks" from ["ingress", 0, "cidr_blocks"]. */
export const pathText = (p: Array<string | number>) => p.map((s, i) => (typeof s === "number" ? `[${s}]` : i ? `.${s}` : s)).join("");
const at = (v: Json | undefined, p: Array<string | number>): Json | undefined => p.reduce<Json | undefined>((o, k) => (o && typeof o === "object" ? (o as Record<string, Json>)[k as string] : undefined), v);

/** Sensitive when the marker is `true`, or any part of it is (then the whole attribute stays hidden). */
const sensitive = (mark: Json | undefined): boolean => mark === true || (!!mark && typeof mark === "object" && Object.values(mark).some(sensitive));

/** A short display value: strings as they are, everything else as compact JSON, cut at 70 characters. */
export function show(v: Json | undefined, secret = false, unknown = false) {
  if (secret) return "(sensitive)";
  if (unknown) return "(known after apply)";
  if (v === undefined || v === null) return "null";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 70 ? `${s.slice(0, 67)}…` : s;
}

const empty = (v: Json | undefined) => v === null || v === undefined || (Array.isArray(v) && !v.length) || (isObj(v) && !Object.keys(v).length);
const asJson = (v: Json | undefined): Json | undefined => {
  if (typeof v !== "string" || !/^\s*[[{]/.test(v)) return undefined;
  try {
    return JSON.parse(v) as Json;
  } catch {
    return undefined;
  }
};

/** Leaf-level differences, like Terraform's own plan output: into objects, same-length lists and JSON strings (policies). */
function leaves(b: Json | undefined, a: Json | undefined, path: string, out: Diff[]) {
  const jb = asJson(b);
  const ja = asJson(a);
  if (jb !== undefined && ja !== undefined) return leaves(jb, ja, path, out);
  if (isObj(b) && isObj(a)) {
    for (const k of new Set([...Object.keys(b), ...Object.keys(a)])) leaves(b[k], a[k], `${path}.${k}`, out);
    return;
  }
  if (Array.isArray(b) && Array.isArray(a) && b.length === a.length && a.some((x) => x && typeof x === "object")) {
    a.forEach((x, i) => leaves(b[i], x, `${path}[${i}]`, out));
    return;
  }
  if (JSON.stringify(b ?? null) !== JSON.stringify(a ?? null)) out.push({ path, before: show(b), after: show(a) });
}

function diffs(c: RawChange["change"], action: Action): Diff[] {
  if (action !== "update" && action !== "replace") return [];
  const b = isObj(c.before) ? c.before : {};
  const a = isObj(c.after) ? c.after : {};
  const u = isObj(c.after_unknown) ? c.after_unknown : {};
  const bs = isObj(c.before_sensitive) ? c.before_sensitive : {};
  const as = isObj(c.after_sensitive) ? c.after_sensitive : {};
  const out: Diff[] = [];
  for (const k of new Set([...Object.keys(b), ...Object.keys(a)])) {
    if (k === "tags_all" || k === "id") continue;
    if (u[k] === true) {
      // Computed values: only worth a line when something real is there now and may change (Terraform hides the rest).
      if (action === "update" && !empty(b[k])) out.push({ path: k, before: show(b[k], sensitive(bs[k])), after: "(known after apply)" });
      continue;
    }
    if (sensitive(bs[k]) || sensitive(as[k])) {
      if (JSON.stringify(b[k] ?? null) !== JSON.stringify(a[k] ?? null)) out.push({ path: k, before: "(sensitive)", after: "(sensitive)" });
      continue;
    }
    leaves(b[k], a[k], k, out);
  }
  return out;
}

/* ---------- risk checks ---------- */

/** Every object in a value, with its path, for the network and policy checks. */
function walk(v: Json | undefined, path: Array<string | number> = [], out: Array<{ path: Array<string | number>; v: Json }> = []) {
  if (v && typeof v === "object") {
    out.push({ path, v });
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, [...path, i], out));
    else for (const [k, x] of Object.entries(v)) walk(x, [...path, k], out);
  }
  return out;
}

function ports(o: Obj): { text: string; risky: boolean; web: boolean } {
  const proto = String(o.ip_protocol ?? o.protocol ?? "");
  const from = typeof o.from_port === "number" ? o.from_port : undefined;
  const to = typeof o.to_port === "number" ? o.to_port : from;
  if (proto === "-1" || proto === "all" || (from === 0 && to === 65535) || (from === -1 && to === -1)) return { text: "every port", risky: true, web: false };
  let nums: Array<[number, number]> = [];
  if (from !== undefined && to !== undefined) nums = [[from, to]];
  else {
    const raw = [o.destination_port_range, o.destination_port_ranges, o.port_range, ...(Array.isArray(o.allow) ? o.allow.map((x) => (isObj(x) ? x.ports : null)) : [])].flat().filter((x) => x !== null && x !== undefined);
    if (!raw.length || raw.includes("*")) return { text: "every port", risky: true, web: false };
    nums = raw.map((r) => String(r).split("-").map(Number) as number[]).map(([x, y]) => [x, y ?? x] as [number, number]);
  }
  const text = nums.map(([x, y]) => (x === y ? `port ${x}` : `ports ${x}–${y}`)).join(", ");
  const risky = nums.some(([x, y]) => y - x > 100 || [...RISKY_PORTS].some((p) => p >= x && p <= y));
  const web = nums.every(([x, y]) => (x === 80 || x === 443) && y === x);
  return { text, risky, web };
}

/** Ingress open to the whole internet that wasn't open before (public 80/443 is expected and not flagged). */
function openToWorld(c: RawChange): Flag[] {
  if (/egress|outbound/i.test(c.type)) return [];
  const before = new Set(walk(c.change.before).map((x) => JSON.stringify(x.v)));
  const flags: Flag[] = [];
  for (const { path, v } of walk(c.change.after)) {
    if (!isObj(v) || path.some((p) => p === "egress")) continue;
    if (String(v.type ?? v.direction ?? "").match(/^(egress|outbound)$/i)) continue;
    const world = CIDR_KEYS.flatMap((k) => [v[k]].flat()).find((x) => typeof x === "string" && WORLD.has(x));
    if (!world || before.has(JSON.stringify(v))) continue;
    const p = ports(v);
    if (p.web) continue;
    flags.push({ risk: p.risky ? "high" : "medium", text: `Opens ${p.text} to the whole internet (${world}).` });
  }
  return flags;
}

type Statement = { Effect?: string; Action?: string | string[]; NotAction?: string | string[]; Resource?: string | string[] };
function wildcards(doc: string) {
  try {
    const p = JSON.parse(doc) as { Statement?: Statement | Statement[] };
    const out: string[] = [];
    for (const s of [p.Statement ?? []].flat()) {
      if (s.Effect !== "Allow" || ![s.Resource ?? []].flat().includes("*")) continue;
      if (s.NotAction) out.push("every action except a few (NotAction)");
      for (const a of [s.Action ?? []].flat()) if (a === "*" || a.endsWith(":*")) out.push(a);
    }
    return out;
  } catch {
    return [];
  }
}

/** IAM policy documents (any JSON string with a Statement) that allow a wildcard action on every resource. */
function wideOpenPolicy(c: RawChange): Flag[] {
  const old = new Set(walk(c.change.before).flatMap(({ v }) => Object.values(isObj(v) ? v : {}).filter((x): x is string => typeof x === "string" && x.includes("Statement")).flatMap(wildcards)));
  const flags: Flag[] = [];
  for (const { v } of walk(c.change.after)) {
    if (!isObj(v)) continue;
    for (const [k, doc] of Object.entries(v)) {
      if (typeof doc !== "string" || !doc.includes("Statement") || k === "assume_role_policy") continue;
      const fresh = wildcards(doc).filter((a) => !old.has(a));
      if (!fresh.length) continue;
      flags.push({ risk: "high", text: fresh.includes("*") ? "Allows every action on every resource (*): full admin." : `Allows ${list(fresh)} on every resource (*).` });
    }
  }
  return flags;
}

function checks(c: RawChange, action: Action): Flag[] {
  const b = isObj(c.change.before) ? c.change.before : {};
  const a = isObj(c.change.after) ? c.change.after : {};
  const flags: Flag[] = [];
  const kind = stateful(c.type);
  if (kind && (action === "delete" || action === "replace")) {
    flags.push({ risk: "high", text: action === "replace" ? `Holds data (${kind}). The new one starts empty unless it is restored from a backup.` : `Holds data (${kind}). Destroying it deletes what is in it.` });
    if (b.skip_final_snapshot === true) flags.push({ risk: "high", text: "No final snapshot is taken first (skip_final_snapshot = true)." });
    if (b.deletion_protection === true) flags.push({ risk: "medium", text: "Deletion protection is on, so the apply fails here until it is turned off." });
    if (c.type === "aws_s3_bucket" && b.force_destroy === true) flags.push({ risk: "high", text: "force_destroy is true: every object in the bucket is deleted with it." });
    if (c.type === "aws_s3_bucket" && b.force_destroy === false) flags.push({ risk: "medium", text: "If the bucket isn't empty the delete fails (force_destroy = false)." });
  } else if (action === "delete" || action === "replace") flags.push({ risk: "medium", text: action === "replace" ? "Replaced: the new object gets a new id." : "Destroyed." });
  if (action === "replace" && c.change.actions[0] === "delete") flags.push({ risk: "medium", text: "Deleted before the new one exists (no create_before_destroy): expect a gap." });
  if (action !== "delete") {
    flags.push(...openToWorld(c), ...wideOpenPolicy(c));
    if (a.publicly_accessible === true && b.publicly_accessible !== true) flags.push({ risk: "high", text: "Reachable from the internet (publicly_accessible = true)." });
    if (typeof a.acl === "string" && /^public-read/.test(a.acl) && b.acl !== a.acl) flags.push({ risk: "high", text: `Public ACL (${a.acl}).` });
    if (b.deletion_protection === true && a.deletion_protection === false) flags.push({ risk: "medium", text: "Turns deletion protection off." });
    if (c.type === "aws_instance" && action === "update" && b.instance_type !== a.instance_type) flags.push({ risk: "low", text: "AWS stops and starts the instance to change its type." });
  }
  if (c.action_reason === "replace_because_tainted") flags.push({ risk: "medium", text: "Tainted: an earlier apply failed part-way on this object." });
  return flags;
}

/* ---------- the plan ---------- */

export function actionOf(actions: string[]): Action | undefined {
  if (actions.includes("delete") && actions.includes("create")) return "replace";
  if (actions.includes("delete")) return "delete";
  if (actions.includes("create")) return "create";
  if (actions.includes("update")) return "update";
  if (actions.includes("forget")) return "forget";
  return undefined; // no-op, read
}

export function parsePlan(text: string): Plan {
  let p: { format_version?: string; terraform_version?: string; resource_changes?: RawChange[]; resource_drift?: unknown[]; planned_values?: unknown; errored?: boolean; values?: unknown };
  try {
    p = JSON.parse(text);
  } catch {
    throw new Error("That isn't JSON. Save the plan with `terraform plan -out=tfplan`, then run `terraform show -json tfplan > plan.json`.");
  }
  if (!p || typeof p !== "object" || !p.format_version) throw new Error("That isn't Terraform JSON output (no format_version). Run `terraform show -json tfplan > plan.json`.");
  if (!p.planned_values && !p.resource_changes) throw new Error("That looks like state, not a plan. Run `terraform show -json tfplan` on the saved plan file.");
  const changes: Change[] = [];
  for (const r of p.resource_changes ?? []) {
    if (r.mode !== "managed") continue;
    const action = actionOf(r.change.actions);
    if (!action) continue;
    const forcedBy = (r.change.replace_paths ?? []).map(pathText);
    const flags = checks(r, action);
    const risk = flags.reduce<Risk>((m, f) => (RANK[f.risk] < RANK[m] ? f.risk : m), "low");
    const ds = diffs(r.change, action);
    // The attributes that force a replacement go first, with their before → after.
    const forced = forcedBy.map((path) => ds.find((d) => d.path === path) ?? { path, before: show(at(r.change.before, r.change.replace_paths![forcedBy.indexOf(path)])), after: show(at(r.change.after, r.change.replace_paths![forcedBy.indexOf(path)])) });
    const rest = ds.filter((d) => !forcedBy.includes(d.path));
    changes.push({
      address: r.address,
      type: r.type,
      action,
      risk,
      why: reason(r, forcedBy),
      forcedBy,
      flags: flags.sort((x, y) => RANK[x.risk] - RANK[y.risk]).map((f) => f.text),
      diffs: [...forced, ...rest].slice(0, 8),
    });
  }
  changes.sort((x, y) => RANK[x.risk] - RANK[y.risk] || ORDER[x.action] - ORDER[y.action] || x.address.localeCompare(y.address));
  return { terraform: p.terraform_version ?? "", changes, drift: (p.resource_drift ?? []).length, errored: !!p.errored };
}

export function counts(changes: Change[]) {
  const n = (a: Action) => changes.filter((c) => c.action === a).length;
  return { add: n("create") + n("replace"), change: n("update"), destroy: n("delete") + n("replace"), replace: n("replace"), forget: n("forget") };
}

export type Decision = "pending" | "approved" | "conditions" | "rejected";
export const DECISION: Record<Decision, string> = { pending: "Waiting for sign-off", approved: "Approved", conditions: "Approved with conditions", rejected: "Rejected" };

/** Terraform's own summary line: "Plan: 3 to add, 4 to change, 3 to destroy." */
export const summaryLine = (c: ReturnType<typeof counts>) => `Plan: ${c.add} to add, ${c.change} to change, ${c.destroy} to destroy.`;

/** The values the three templates take. */
export function toValues(plan: Plan, meta: { project: string; date: string; requestedBy?: string; reviewer?: string; link?: string; decision?: Decision; note?: string; checked?: string[] }) {
  const c = counts(plan.changes);
  const checked = new Set(meta.checked ?? []);
  return {
    project: meta.project.trim().slice(0, 60) || "Terraform plan",
    date: meta.date,
    requestedBy: meta.requestedBy?.trim().slice(0, 40) || undefined,
    reviewer: meta.reviewer?.trim().slice(0, 40) || undefined,
    link: /^https:\/\/\S+$/.test(meta.link?.trim() ?? "") ? meta.link!.trim().slice(0, 200) : undefined,
    decision: meta.decision ?? "pending",
    note: meta.note?.trim().slice(0, 400) || undefined,
    terraform: plan.terraform.slice(0, 20) || undefined,
    drift: plan.drift,
    errored: plan.errored,
    add: c.add,
    change: c.change,
    destroy: c.destroy,
    replace: c.replace,
    high: plan.changes.filter((x) => x.risk === "high").length,
    medium: plan.changes.filter((x) => x.risk === "medium").length,
    changes: plan.changes.slice(0, 60).map((x) => ({ ...x, address: x.address.slice(0, 120), type: x.type.slice(0, 80), forcedBy: x.forcedBy.slice(0, 6).map((f) => f.slice(0, 80)), flags: x.flags.slice(0, 8), diffs: x.diffs.map((d) => ({ ...d, path: d.path.slice(0, 80) })), checked: checked.has(x.address) })),
    more: Math.max(0, plan.changes.length - 60),
  };
}
