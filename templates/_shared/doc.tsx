/**
 * What every Countersign template shares: the fields (a Terraform plan, ranked by risk, and who signs it), the look of
 * a change-approval form, and small pieces: the action mark (+ ~ -/+ −) and the risk tag.
 */
import { Column, Text, defineTheme, prop } from "@hyper-elements/react";
import sample from "./example.ts";
import type { Action, Decision, Risk } from "./plan.ts";

export const fields = {
  project: prop.text({ label: "Project / workspace", required: true, maxLength: 60 }),
  date: prop.date({ label: "Reviewed on", required: true }),
  requestedBy: prop.text({ label: "Requested by", maxLength: 40 }),
  reviewer: prop.text({ label: "Reviewer", maxLength: 40 }),
  link: prop.text({ label: "Change link (PR, run)", maxLength: 200, pattern: "^https://\\S+$" }),
  decision: prop.choice(["pending", "approved", "conditions", "rejected"], { label: "Decision", required: true }),
  note: prop.text({ label: "Reviewer's note / conditions", maxLength: 400 }),
  terraform: prop.text({ label: "Terraform version", maxLength: 20 }),
  drift: prop.number({ label: "Drifted resources", min: 0, integer: true }),
  errored: prop.boolean({ label: "Plan errored" }),
  add: prop.number({ label: "To add", required: true, min: 0, integer: true }),
  change: prop.number({ label: "To change", required: true, min: 0, integer: true }),
  destroy: prop.number({ label: "To destroy", required: true, min: 0, integer: true }),
  replace: prop.number({ label: "Replacements", required: true, min: 0, integer: true }),
  high: prop.number({ label: "High-risk changes", required: true, min: 0, integer: true }),
  medium: prop.number({ label: "Medium-risk changes", required: true, min: 0, integer: true }),
  changes: prop.list(
    prop.object(
      {
        address: prop.text({ label: "Address", required: true, maxLength: 120 }),
        type: prop.text({ label: "Resource type", required: true, maxLength: 80 }),
        action: prop.choice(["create", "update", "replace", "delete", "forget"], { label: "Action", required: true }),
        risk: prop.choice(["high", "medium", "low"], { label: "Risk", required: true }),
        why: prop.text({ label: "Why", required: true, maxLength: 200 }),
        forcedBy: prop.list(prop.text({ label: "Attribute", maxLength: 80 }), { label: "Forces replacement", max: 6 }),
        flags: prop.list(prop.text({ label: "Flag", maxLength: 120 }), { label: "Risk flags", max: 8 }),
        diffs: prop.list(
          prop.object(
            {
              path: prop.text({ label: "Attribute", required: true, maxLength: 80 }),
              before: prop.text({ label: "Before", required: true, maxLength: 80 }),
              after: prop.text({ label: "After", required: true, maxLength: 80 }),
            },
            { label: "Attribute change" },
          ),
          { label: "Attribute changes", max: 8 },
        ),
        checked: prop.boolean({ label: "Checked by the reviewer" }),
      },
      { label: "Change" },
    ),
    { label: "Changes", required: true, max: 60 },
  ),
  more: prop.number({ label: "Changes not listed", min: 0, integer: true }),
};

export type Diff = { path: string; before: string; after: string };
export type Item = { address: string; type: string; action: Action; risk: Risk; why: string; forcedBy: string[]; flags: string[]; diffs: Diff[]; checked?: boolean };
export type Values = { project: string; date: string; requestedBy?: string; reviewer?: string; link?: string; decision: Decision; note?: string; terraform?: string; drift?: number; errored?: boolean; add: number; change: number; destroy: number; replace: number; high: number; medium: number; changes: Item[]; more?: number };

/** The sample: a real plan made with Terraform 1.17.2 and the AWS provider against a sample stack (no real account). */
export const example = sample as unknown as Values;

/* ---------- look: a change-approval form ---------- */

export const INK = "#141B2D";
export const INK2 = "#3D4659";
export const MUTED = "#5A6378";
export const LINE = "#DCE1EA";
export const WASH = "#F3F5F9";
export const PAPER = "#FFFFFF";
export const BRAND = "#0B6E5F";
export const RED = "#B42318";
export const RED_SOFT = "#FDECEA";
export const AMBER = "#A14A06";
export const AMBER_SOFT = "#FEF3E2";
export const GREEN = "#0B6E3A";
export const BLUE = "#1D4ED8";

export const SANS = "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif";
export const MONO = "'IBM Plex Mono', Menlo, Consolas, monospace";

export const FONT_FILES = [
  { family: "IBM Plex Sans", src: "../fonts/IBMPlexSans-400.woff", weight: 400 },
  { family: "IBM Plex Sans", src: "../fonts/IBMPlexSans-600.woff", weight: 600 },
  { family: "IBM Plex Mono", src: "../fonts/IBMPlexMono-400.woff", weight: 400 },
  { family: "IBM Plex Mono", src: "../fonts/IBMPlexMono-600.woff", weight: 600 },
];
// The email loads its fonts from a CDN (Fontsource, OFL); clients that block web fonts fall back to Helvetica/Arial.
const CDN = "https://cdn.jsdelivr.net/npm/@fontsource";
export const FONT_URLS = [
  { family: "IBM Plex Sans", src: `${CDN}/ibm-plex-sans@5.2.7/files/ibm-plex-sans-latin-400-normal.woff2`, weight: 400 },
  { family: "IBM Plex Sans", src: `${CDN}/ibm-plex-sans@5.2.7/files/ibm-plex-sans-latin-600-normal.woff2`, weight: 600 },
  { family: "IBM Plex Mono", src: `${CDN}/ibm-plex-mono@5.2.7/files/ibm-plex-mono-latin-400-normal.woff2`, weight: 400 },
];

export const theme = defineTheme({
  colors: { background: WASH, foreground: INK, primary: INK, primaryForeground: PAPER, muted: MUTED, border: LINE, paper: PAPER },
  fonts: { body: SANS, heading: SANS },
  fontSizes: { body: 15 },
  lineHeights: { body: 1.55 },
  elements: { Heading: { fontWeight: 600, letterSpacing: -0.2, lineHeight: 1.2, by: { level: { 1: { fontSize: 24, mobile: { fontSize: 21 } }, 2: { fontSize: 17 } } } } },
  styles: {
    label: { fontFamily: MONO, fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase", color: MUTED },
    card: { backgroundColor: PAPER, padding: 26, gap: 16, border: `1px solid ${LINE}` },
  },
});

/* ---------- words and marks ---------- */

/** Terraform's own symbols for each action. */
export const MARK: Record<Action, string> = { create: "+", update: "~", replace: "-/+", delete: "−", forget: "·" };
export const VERB: Record<Action, string> = { create: "create", update: "update", replace: "replace", delete: "destroy", forget: "forget" };
export const ACTION_COLOR: Record<Action, string> = { create: GREEN, update: BLUE, replace: RED, delete: RED, forget: MUTED };
export const RISK_COLOR: Record<Risk, string> = { high: RED, medium: AMBER, low: MUTED };
export const RISK_SOFT: Record<Risk, string> = { high: RED_SOFT, medium: AMBER_SOFT, low: WASH };
export const DECISION: Record<Decision, string> = { pending: "Waiting for sign-off", approved: "Approved", conditions: "Approved with conditions", rejected: "Rejected" };

export const longDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "1 replacement, 2 destroys" — the part of the plan an approver asks about first. */
export function headline(v: Values) {
  const parts = [v.replace && `${v.replace} ${v.replace === 1 ? "replacement" : "replacements"}`, v.destroy - v.replace && `${v.destroy - v.replace} ${v.destroy - v.replace === 1 ? "destroy" : "destroys"}`].filter(Boolean);
  return parts.length ? parts.join(", ") : "nothing destroyed";
}
export const summaryLine = (v: Values) => `Plan: ${v.add} to add, ${v.change} to change, ${v.destroy} to destroy.`;
export const flagged = (v: Values) => v.changes.filter((c) => c.risk !== "low");

/** The action mark in a fixed-width box, Terraform-style. */
export function Mark({ action, size = 10, width = 26 }: { action: Action; size?: number; width?: number }) {
  return (
    <Column style={{ width, gap: 0 }}>
      <Text style={{ width, fontFamily: MONO, fontWeight: 600, fontSize: size, color: ACTION_COLOR[action] }}>{MARK[action]}</Text>
    </Column>
  );
}

/** A small risk tag: HIGH / MEDIUM / LOW. */
export function Tag({ risk, size = 7.5 }: { risk: Risk; size?: number }) {
  return (
    <Column style={{ width: Math.ceil(risk.length * size * 0.66 + size * 1.6), backgroundColor: RISK_SOFT[risk], padding: [Math.round(size * 0.3), Math.round(size * 0.8)], gap: 0 }}>
      <Text style={{ fontFamily: MONO, fontWeight: 600, fontSize: size, letterSpacing: 0.4, color: RISK_COLOR[risk] }}>{risk.toUpperCase()}</Text>
    </Column>
  );
}
