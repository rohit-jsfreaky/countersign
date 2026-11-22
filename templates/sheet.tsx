/**
 * The sign-off sheet: an A4 PDF of a Terraform plan for the person who approves the apply. The risky changes come
 * first (data stores destroyed or replaced, ports opened to the internet, wildcard IAM), each with Terraform's reason
 * and the attribute that forces it; then everything else in one line each; then the decision and signature.
 * A Document page doesn't flow by itself, so the pages are planned from estimated heights.
 */
import { Fragment, type ReactNode } from "react";
import { Column, Document, Heading, PageBreak, PageFooter, PageNumber, Row, Text } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { BRAND, DECISION, FONT_FILES, INK, INK2, LINE, MONO, MUTED, PAPER, RED, RISK_COLOR, RISK_SOFT, SANS, WASH, Mark, Tag, example, fields, flagged, headline, longDate, summaryLine, type Item, type Values } from "./_shared/doc.tsx";

const W = 682; // A4 at 96 dpi (794 px) minus two 56 px margins
const PAGE = 940; // usable height per page, under the footer
const label = { fontFamily: MONO, fontSize: 7.5, letterSpacing: 0.4, textTransform: "uppercase", color: MUTED } as const;
const lines = (text: string, perLine: number) => Math.max(1, Math.ceil(text.length / perLine));

function Card({ c }: { c: Item }) {
  return (
    <Column style={{ width: W, gap: 6, padding: [10, 12], border: `0.75px solid ${LINE}`, backgroundColor: PAPER }}>
      <Row style={{ width: W - 26, alignItems: "center", gap: 6 }}>
        <Mark action={c.action} size={11} width={30} />
        <Column style={{ width: W - 26 - 30 - 6 - 150 - 6 }}>
          <Text style={{ fontFamily: MONO, fontWeight: 600, fontSize: 10.5 }}>{c.address}</Text>
        </Column>
        <Row style={{ width: 150, gap: 6, justifyContent: "end", alignItems: "center" }}>
          {c.checked ? <Text style={{ fontFamily: MONO, fontSize: 7.5, color: BRAND }}>CHECKED</Text> : null}
          <Tag risk={c.risk} />
        </Row>
      </Row>
      <Text style={{ fontSize: 9.5, color: INK2, lineHeight: 1.45 }}>{`${c.action === "delete" ? "Destroy. " : ""}${c.why}`}</Text>
      {c.flags.length ? (
        <Column style={{ gap: 3, padding: [0, 0, 0, 10], border: { left: `2px solid ${RISK_COLOR[c.risk]}` } }}>
          {c.flags.map((f) => (
            <Text key={f} style={{ fontSize: 9.5, color: INK, lineHeight: 1.4 }}>
              {f}
            </Text>
          ))}
        </Column>
      ) : null}
      {c.diffs.length ? (
        <Column style={{ gap: 2, backgroundColor: WASH, padding: [6, 8] }}>
          {c.diffs.map((d) => (
            <Row key={d.path} style={{ gap: 8 }}>
              <Column style={{ width: 210 }}>
                <Text style={{ fontFamily: MONO, fontSize: 8, color: c.forcedBy.includes(d.path) ? RED : INK2 }}>{`${d.path}${c.forcedBy.includes(d.path) ? "  # forces replacement" : ""}`}</Text>
              </Column>
              <Column>
                <Text style={{ fontFamily: MONO, fontSize: 8, color: INK }}>{`${d.before} → ${d.after}`}</Text>
              </Column>
            </Row>
          ))}
        </Column>
      ) : null}
    </Column>
  );
}
const cardHeight = (c: Item) => 20 + 22 + 14 * lines(c.why, 120) + (c.flags.length ? 6 + c.flags.reduce((h, f) => h + 14 * lines(f, 115), 0) : 0) + (c.diffs.length ? 18 + 13 * c.diffs.reduce((n, d) => n + lines(`${d.before} → ${d.after}`, 80), 0) : 0) + 6 * 3;

function Line({ c }: { c: Item }) {
  const detail = c.diffs.length ? c.diffs.slice(0, 2).map((d) => `${d.path}: ${d.before} → ${d.after}`).join("; ") : c.why;
  return (
    <Row style={{ width: W, gap: 6, padding: [5, 0], border: { top: `0.75px solid ${LINE}` }, alignItems: "start" }}>
      <Mark action={c.action} size={9} width={30} />
      <Column style={{ width: 250 }}>
        <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 600 }}>{c.address}</Text>
      </Column>
      <Column style={{ width: W - 30 - 250 - 12 }}>
        <Text style={{ fontSize: 8.5, color: INK2 }}>{[...c.flags, detail].join(" ")}</Text>
      </Column>
    </Row>
  );
}
const lineHeight = (c: Item) => 10 + 13 * Math.max(lines(c.address, 42), lines([...c.flags, c.diffs.length ? "x".repeat(70) : c.why].join(" "), 75));

function Box({ on }: { on: boolean }) {
  return (
    <Column style={{ width: 11, height: 11, border: `1px solid ${INK}`, backgroundColor: on ? INK : PAPER }}>
      <Text style={{ fontSize: 1, color: on ? INK : PAPER }}> </Text>
    </Column>
  );
}

function SignOff({ v }: { v: Values }) {
  const blank = (w: number, text?: string) => (
    <Column style={{ width: w, gap: 4 }}>
      <Column style={{ width: w, height: 26, border: { bottom: `1px solid ${INK}` }, justifyContent: "end" }}>
        <Text style={{ fontSize: 11, color: INK }}>{text ?? " "}</Text>
      </Column>
    </Column>
  );
  return (
    <Column style={{ width: W, gap: 12, padding: [14, 16], border: `1.5px solid ${INK}` }}>
      <Row style={{ width: W - 35, alignItems: "end" }}>
        <Column>
          <Text style={{ fontWeight: 600, fontSize: 14 }}>Sign-off</Text>
        </Column>
        <Column style={{ width: 300 }}>
          <Text style={{ ...label, textAlign: "right" }}>{v.decision === "pending" ? "To be completed by the approver" : `Recorded in Countersign · ${longDate(v.date)}`}</Text>
        </Column>
      </Row>
      <Row style={{ width: W - 35, gap: 22 }}>
        {(["approved", "conditions", "rejected"] as const).map((d) => (
          <Row key={d} style={{ gap: 7, alignItems: "center" }}>
            <Box on={v.decision === d} />
            <Text style={{ fontSize: 10.5, fontWeight: v.decision === d ? 600 : 400 }}>{DECISION[d]}</Text>
          </Row>
        ))}
      </Row>
      <Column style={{ width: W - 35, gap: 3 }}>
        <Text style={label}>Conditions / note</Text>
        {v.note ? <Text style={{ fontSize: 10, color: INK, lineHeight: 1.5 }}>{v.note}</Text> : null}
        {v.note ? null : (
          <Column style={{ gap: 0 }}>
            {blank(W - 35)}
            {blank(W - 35)}
          </Column>
        )}
      </Column>
      <Row style={{ width: W - 35, gap: 20 }}>
        <Column style={{ width: 220, gap: 3 }}>
          <Text style={label}>Approver</Text>
          {blank(220, v.reviewer)}
        </Column>
        <Column style={{ width: 250, gap: 3 }}>
          <Text style={label}>Signature</Text>
          {blank(250)}
        </Column>
        <Column style={{ width: W - 35 - 220 - 250 - 40, gap: 3 }}>
          <Text style={label}>Date</Text>
          {blank(W - 35 - 220 - 250 - 40, v.decision === "pending" ? undefined : longDate(v.date))}
        </Column>
      </Row>
    </Column>
  );
}
const SIGN_OFF = 270;

function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <Row style={{ width: W, alignItems: "end", padding: [6, 0, 2] }}>
      <Column>
        <Heading level={2} style={{ fontWeight: 600, fontSize: 15 }}>
          {title}
        </Heading>
      </Column>
      <Column style={{ width: 260 }}>
        <Text style={{ ...label, textAlign: "right" }}>{sub}</Text>
      </Column>
    </Row>
  );
}

export default template({
  id: "countersign.Sheet",
  version: "1.0.0",
  label: "Sign-off sheet (PDF)",
  guidance: "Attach it to the change, or print it for the approver. Risky changes first; signature at the end.",
  root: "Document",
  formats: { a4: { size: "A4", orientation: "portrait" } },
  fields,
  example,
  render(input) {
    const v = input as unknown as Values;
    const risky = flagged(v);
    const rest = v.changes.filter((c) => c.risk === "low");

    // Plan the pages: blocks with estimated heights, packed in order, the sign-off kept whole.
    const blocks: Array<{ h: number; node: ReactNode }> = [];
    if (risky.length) blocks.push({ h: 34, node: <Head title="Read these first" sub={`${risky.length} flagged · highest risk first`} /> });
    risky.forEach((c) => blocks.push({ h: cardHeight(c) + 12, node: <Card c={c} /> }));
    if (rest.length) blocks.push({ h: 34, node: <Head title={risky.length ? "Everything else" : "The changes"} sub={`${rest.length} low risk`} /> });
    rest.forEach((c) => blocks.push({ h: lineHeight(c), node: <Line c={c} /> }));
    if (v.more) blocks.push({ h: 24, node: <Text style={{ fontSize: 9, color: MUTED }}>{`+ ${v.more} more changes not listed here: see the full plan.`}</Text> });
    blocks.push({ h: SIGN_OFF, node: <SignOff v={v} /> });
    const pages: ReactNode[][] = [[]];
    let room = PAGE - 330; // the first page starts under the summary
    for (const b of blocks) {
      if (b.h > room && pages.at(-1)!.length) {
        pages.push([]);
        room = PAGE;
      }
      pages.at(-1)!.push(b.node);
      room -= b.h;
    }

    const stats: Array<[string, number, string?]> = [
      ["to add", v.add],
      ["to change", v.change],
      ["to destroy", v.destroy, v.destroy ? RED : undefined],
      ["replaced", v.replace, v.replace ? RED : undefined],
      ["high risk", v.high, v.high ? RED : undefined],
    ];
    return (
      <Document size="A4" margin={56} title={`Terraform change review: ${v.project}`} lang="en" fonts={FONT_FILES} style={{ fontFamily: SANS, fontSize: 10.5, color: INK, gap: 12 }}>
        <Row style={{ width: W, alignItems: "end", padding: [0, 0, 8], border: { bottom: `1.5px solid ${INK}` } }}>
          <Column>
            <Text style={{ ...label, color: BRAND }}>Countersign · Terraform change review</Text>
          </Column>
          <Column style={{ width: 300 }}>
            <Text style={{ ...label, textAlign: "right" }}>{`${v.terraform ? `Terraform ${v.terraform} · ` : ""}${longDate(v.date)}`}</Text>
          </Column>
        </Row>
        <Column style={{ width: W, gap: 5 }}>
          <Heading level={1} style={{ fontWeight: 600, fontSize: 26, lineHeight: 1.15 }}>
            {v.project}
          </Heading>
          <Text style={{ fontFamily: MONO, fontSize: 10, color: INK2 }}>{summaryLine(v)}</Text>
          <Text style={{ fontSize: 10, color: MUTED }}>{[v.requestedBy && `Requested by ${v.requestedBy}`, v.reviewer && `reviewer ${v.reviewer}`, v.link].filter(Boolean).join(" · ")}</Text>
        </Column>
        <Row style={{ width: W, gap: 8 }}>
          {stats.map(([k, n, color]) => (
            <Column key={k} style={{ backgroundColor: WASH, padding: [8, 10], gap: 2 }}>
              <Text style={{ fontFamily: MONO, fontWeight: 600, fontSize: 18, color: color ?? INK }}>{String(n)}</Text>
              <Text style={label}>{k}</Text>
            </Column>
          ))}
        </Row>
        <Column style={{ width: W, gap: 3, padding: [9, 12], backgroundColor: v.high ? RISK_SOFT.high : v.medium ? RISK_SOFT.medium : WASH, border: { left: `3px solid ${v.high ? RISK_COLOR.high : v.medium ? RISK_COLOR.medium : BRAND}` } }}>
          <Text style={{ fontWeight: 600, fontSize: 11.5 }}>
            {v.high ? `${v.high} high-risk ${v.high === 1 ? "change needs" : "changes need"} an owner's sign-off (${headline(v)}).` : v.medium ? `No high-risk changes; ${v.medium} to look at (${headline(v)}).` : `Routine: no data store touched, nothing opened up (${headline(v)}).`}
          </Text>
          <Text style={{ fontSize: 9, color: INK2 }}>
            {[v.errored ? "Terraform reported errors while planning: this plan may be incomplete." : "", v.drift ? `${v.drift} ${v.drift === 1 ? "resource has" : "resources have"} drifted from the state since the last apply.` : "", "Sensitive values are masked. Read from terraform show -json; checked against Terraform's reasons, not guessed."].filter(Boolean).join(" ")}
          </Text>
        </Column>

        {pages.map((page, i) => (
          <Fragment key={i}>
            {i ? <PageBreak /> : null}
            {page.map((node, j) => (
              <Fragment key={j}>{node}</Fragment>
            ))}
          </Fragment>
        ))}

        <PageFooter style={{ padding: [10, 0, 0], border: { top: `0.75px solid ${LINE}` } }}>
          <Row>
            <Column>
              <Text style={{ fontSize: 7.5, color: MUTED }}>{`Countersign · ${v.project} · ${summaryLine(v)}`}</Text>
            </Column>
            <Column style={{ width: 80 }}>
              <Text style={{ fontSize: 7.5, color: MUTED, textAlign: "right" }}>
                Page <PageNumber /> of <PageNumber total />
              </Text>
            </Column>
          </Row>
        </PageFooter>
      </Document>
    );
  },
});
