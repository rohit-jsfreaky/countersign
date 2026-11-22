/**
 * The card: a 1200 × 630 image of the plan for the pull request or the team channel. The counts in Terraform's own
 * symbols, the riskiest changes, and where the sign-off stands.
 */
import { Canvas, Column, Row, Text } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { ACTION_COLOR, BRAND, DECISION, FONT_FILES, GREEN, BLUE, INK, INK2, LINE, MARK, MONO, MUTED, PAPER, RED, RISK_COLOR, RISK_SOFT, SANS, WASH, example, fields, flagged, longDate, type Values } from "./_shared/doc.tsx";

const W = 1200;
const H = 630;
const PAD = 64;
const IN = W - 2 * PAD;

export default template({
  id: "countersign.Card",
  version: "1.0.0",
  label: "Plan card (image)",
  guidance: "Post it on the pull request or in the team channel: the counts, the riskiest changes, the sign-off state.",
  root: "Canvas",
  formats: { card: { width: W, height: H, scale: 1 } },
  fields,
  rules: { require: { core: ["image/overflow", "image/glyph", "image/fit"] } },
  example,
  render(input) {
    const v = input as unknown as Values;
    const top = flagged(v).slice(0, 3);
    const counts: Array<[string, number, string, string]> = [
      ["+", v.add, "to add", GREEN],
      ["~", v.change, "to change", BLUE],
      ["−", v.destroy, "to destroy", RED],
    ];
    const state = v.decision === "pending" ? (v.high ? `Needs sign-off · ${v.high} high risk` : "Waiting for sign-off") : `${DECISION[v.decision]}${v.reviewer ? ` by ${v.reviewer}` : ""}`;
    const stateColor = v.decision === "rejected" || (v.decision === "pending" && v.high) ? RED : BRAND;
    return (
      <Canvas width={W} height={H} fonts={FONT_FILES} style={{ backgroundColor: PAPER, fontFamily: SANS, color: INK, gap: 0 }}>
        <Column style={{ width: W, height: H - 74, padding: [52, PAD, 0], gap: 26 }}>
        <Row style={{ width: IN, alignItems: "center" }}>
          <Column style={{ width: IN - 300 }}>
            <Text style={{ width: IN - 300, fontFamily: MONO, fontSize: 18, letterSpacing: 1, color: BRAND }}>COUNTERSIGN · TERRAFORM PLAN</Text>
          </Column>
          <Column style={{ width: 300 }}>
            <Text style={{ width: 300, fontFamily: MONO, fontSize: 18, color: MUTED, textAlign: "right" }}>{longDate(v.date)}</Text>
          </Column>
        </Row>
        <Text fit={{ sizes: [52, 46, 40, 34], maxLines: 1 }} style={{ width: IN, fontWeight: 600, letterSpacing: -0.8 }}>
          {v.project}
        </Text>
        <Row style={{ width: IN, gap: 16 }}>
          {counts.map(([mark, n, word, color]) => (
            <Row key={word} style={{ width: 200, gap: 12, alignItems: "end", padding: [12, 16], backgroundColor: WASH }}>
              <Text fit={{ sizes: [44, 36, 30], maxLines: 1 }} style={{ width: 72, fontFamily: MONO, fontWeight: 600, lineHeight: 1, color }}>{`${mark}${n}`}</Text>
              <Text style={{ width: 84, fontSize: 18, color: INK2, padding: [0, 0, 4] }}>{word}</Text>
            </Row>
          ))}
          <Column style={{ width: IN - 3 * 200 - 3 * 16, padding: [12, 16], gap: 2, backgroundColor: v.replace ? RISK_SOFT.high : WASH }}>
            <Text style={{ width: IN - 3 * 200 - 3 * 16 - 32, fontFamily: MONO, fontWeight: 600, fontSize: 22, color: v.replace ? RED : INK2 }}>{`-/+ ${v.replace} replaced`}</Text>
            <Text style={{ width: IN - 3 * 200 - 3 * 16 - 32, fontSize: 16, color: INK2 }}>deleted, then created again</Text>
          </Column>
        </Row>
        <Column style={{ width: IN, gap: 14 }}>
          {top.length ? (
            top.map((c) => (
              <Row key={c.address} style={{ width: IN, gap: 14, alignItems: "start" }}>
                <Text style={{ width: 54, fontFamily: MONO, fontWeight: 600, fontSize: 22, color: ACTION_COLOR[c.action] }}>{MARK[c.action]}</Text>
                <Column style={{ width: IN - 54 - 110 - 2 * 14, gap: 2 }}>
                  <Text fit={{ sizes: [22, 19, 17], maxLines: 1 }} style={{ width: IN - 54 - 110 - 2 * 14, fontFamily: MONO, fontWeight: 600 }}>
                    {c.address}
                  </Text>
                  <Text fit={{ sizes: [19, 17, 15], maxLines: 1 }} style={{ width: IN - 54 - 110 - 2 * 14, color: INK2 }}>
                    {c.flags[0] ?? c.why}
                  </Text>
                </Column>
                <Text style={{ width: 110, fontFamily: MONO, fontWeight: 600, fontSize: 16, color: RISK_COLOR[c.risk], textAlign: "right", padding: [4, 0, 0] }}>{c.risk.toUpperCase()}</Text>
              </Row>
            ))
          ) : (
            <Text style={{ width: IN, fontSize: 24, color: INK2 }}>Nothing flagged: no data store touched, nothing opened to the internet.</Text>
          )}
        </Column>
        </Column>
        <Row style={{ width: W, height: 74, padding: [0, PAD], alignItems: "center", border: { top: `1px solid ${LINE}` }, backgroundColor: WASH }}>
          <Text style={{ width: IN - 360, fontWeight: 600, fontSize: 24, color: stateColor }}>{state}</Text>
          <Text style={{ width: 360, fontFamily: MONO, fontSize: 16, color: MUTED, textAlign: "right" }}>{v.terraform ? `terraform ${v.terraform} · show -json` : "terraform show -json"}</Text>
        </Row>
      </Canvas>
    );
  },
});
