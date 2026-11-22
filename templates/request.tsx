/**
 * The request: the email to the person who approves the apply. Before the decision it asks for a sign-off and lists
 * only what needs one; after, it records the decision and the conditions. The sign-off sheet goes as the attachment.
 */
import { Button, Column, Email, Heading, Row, Section, Text } from "@hyper-elements/react";
import { lint } from "@hyper-elements/lint";
import { template } from "@hyper-elements/react/template";
import { ACTION_COLOR, BRAND, DECISION, FONT_URLS, INK2, MARK, MONO, MUTED, RISK_COLOR, RISK_SOFT, WASH, example, fields, flagged, headline, longDate, summaryLine, theme, type Values } from "./_shared/doc.tsx";

const label = { fontFamily: MONO, fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase", color: MUTED } as const;

export default template({
  id: "countersign.Request",
  version: "1.0.0",
  label: "Sign-off request (email)",
  guidance: "Send it to the approver with the sign-off sheet attached. After the decision, send it again: it then records the decision.",
  root: "Email",
  fields,
  rules: { plugins: { lint: lint() }, require: { lint: ["lang", "contrast", "link-text"] }, root: { previewText: true } },
  example,
  render(input) {
    const v = input as unknown as Values;
    const risky = flagged(v);
    const pending = v.decision === "pending";
    const title = pending ? `Sign-off needed: ${v.project}` : `${DECISION[v.decision]}: ${v.project}`;
    const preview = pending ? `${summaryLine(v)} ${v.high ? `${v.high} high-risk: ${headline(v)}.` : "No high-risk changes."}` : `${DECISION[v.decision]} by ${v.reviewer ?? "the reviewer"} on ${longDate(v.date)}.${v.note ? ` ${v.note}` : ""}`;
    return (
      <Email theme={theme} lang="en" width={600} fonts={FONT_URLS} title={title} previewText={preview.slice(0, 140)} style={{ gap: 0 }}>
        <Section style={{ padding: [28, 24, 14] }}>
          <Text style={{ ...label, color: BRAND }}>Countersign · Terraform change review</Text>
        </Section>
        <Column style={{ apply: ["card"] }}>
          <Heading level={1}>{title}</Heading>
          <Text style={{ fontFamily: MONO, fontSize: 14, color: INK2 }}>{summaryLine(v)}</Text>
          {pending ? (
            <Text>{`${v.requestedBy ? `${v.requestedBy} wants` : "Someone wants"} to apply this plan${v.reviewer ? `, and ${v.reviewer} is down as the approver` : ""}. ${risky.length ? `${risky.length} ${risky.length === 1 ? "change is" : "changes are"} flagged below; the rest are routine.` : "Nothing in it is flagged."}`}</Text>
          ) : (
            <Column style={{ padding: [12, 16], backgroundColor: v.decision === "rejected" ? RISK_SOFT.high : WASH, border: { left: `4px solid ${v.decision === "rejected" ? RISK_COLOR.high : BRAND}` }, gap: 4 }}>
              <Text style={label}>{`${DECISION[v.decision]} · ${v.reviewer ?? "reviewer"} · ${longDate(v.date)}`}</Text>
              {v.note ? <Text style={{ color: INK2 }}>{v.note}</Text> : null}
            </Column>
          )}
          {risky.length ? (
            <Column style={{ gap: 10 }}>
              <Text style={label}>{pending ? "Needs your eyes" : "What was flagged"}</Text>
              {risky.map((c) => (
                <Column key={c.address} style={{ gap: 2, padding: [0, 0, 0, 12], border: { left: `3px solid ${RISK_COLOR[c.risk]}` } }}>
                  <Row style={{ gap: 8 }}>
                    <Column style={{ width: 34 }}>
                      <Text style={{ fontFamily: MONO, fontWeight: 600, fontSize: 14, color: ACTION_COLOR[c.action] }}>{MARK[c.action]}</Text>
                    </Column>
                    <Column>
                      <Text style={{ fontFamily: MONO, fontWeight: 600, fontSize: 14 }}>{c.address}</Text>
                    </Column>
                  </Row>
                  <Text style={{ fontSize: 14, color: INK2 }}>{[c.flags[0], (c.flags[0] ?? "").length < 20 ? c.why : "", c.forcedBy.length ? `Forced by ${c.forcedBy.join(", ")}.` : ""].filter(Boolean).join(" ")}</Text>
                </Column>
              ))}
            </Column>
          ) : null}
          {v.link ? <Button href={v.link}>Open the change</Button> : null}
          <Text style={{ fontSize: 14, color: MUTED }}>The sign-off sheet (PDF) is attached: every change, the attribute that forces each replacement, and a place to sign.</Text>
        </Column>
        <Section style={{ padding: [16, 24, 28] }}>
          <Text style={{ fontSize: 13, color: MUTED }}>{`Read from terraform show -json${v.terraform ? ` (Terraform ${v.terraform})` : ""}. Sensitive values are masked. ${longDate(v.date)}.`}</Text>
        </Section>
      </Email>
    );
  },
});
