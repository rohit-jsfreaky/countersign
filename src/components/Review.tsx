"use client";

import NextLink from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, CheckSquare, Download01, FileCheck02, Image01, Lock01, Mail01, Upload01, XClose } from "@untitledui/icons";
import { DECISION, counts, parsePlan, summaryLine, toValues, type Action, type Change, type Decision, type Plan, type Risk } from "../../templates/_shared/plan.ts";
import { renderLocal } from "@/lib/render-local";
import { SAMPLE_META } from "@/lib/sample";
import { Logo } from "./Logo";

type Out = "sheet" | "request" | "card";
const OUTS: Array<{ key: Out; label: string; icon: ReactNode; file: string }> = [
  { key: "sheet", label: "Sign-off sheet", icon: <FileCheck02 size={16} />, file: "sign-off.pdf" },
  { key: "request", label: "Email", icon: <Mail01 size={16} />, file: "sign-off-request.html" },
  { key: "card", label: "Card", icon: <Image01 size={16} />, file: "plan-card.png" },
];
const MARK: Record<Action, string> = { create: "+", update: "~", replace: "-/+", delete: "−", forget: "·" };
const MARK_COLOR: Record<Action, string> = { create: "text-green", update: "text-blue", replace: "text-red", delete: "text-red", forget: "text-muted" };
const RISK_TAG: Record<Risk, string> = { high: "bg-red-soft text-red", medium: "bg-amber-soft text-amber", low: "bg-wash text-muted" };
const today = () => new Date().toISOString().slice(0, 10);
const blank = { project: "", requestedBy: "", reviewer: "", link: "", note: "" };

export function Review() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [meta, setMeta] = useState(blank);
  const [decision, setDecision] = useState<Decision>("pending");
  const [checked, setChecked] = useState<string[]>([]);
  const [show, setShow] = useState<"flagged" | "all">("flagged");
  const [sheet, setSheet] = useState<Out | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start(text: Promise<string>, sample = false) {
    setBusy(true);
    setError(null);
    try {
      const p = parsePlan(await text);
      if (!p.changes.length) throw new Error("No changes in this plan: nothing to sign off.");
      setPlan(p);
      setChecked([]);
      setDecision(sample ? "conditions" : "pending");
      setMeta(sample ? SAMPLE_META : { ...blank, reviewer: meta.reviewer });
      setShow(p.changes.some((c) => c.risk !== "low") ? "flagged" : "all");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const values = useMemo(() => (plan ? toValues(plan, { ...meta, date: today(), decision, checked }) : null), [plan, meta, decision, checked]);
  if (!plan || !values) return <Start busy={busy} error={error} start={start} />;

  const c = counts(plan.changes);
  const risky = plan.changes.filter((x) => x.risk !== "low");
  const list = show === "flagged" ? risky : plan.changes;
  const done = risky.filter((x) => checked.includes(x.address)).length;
  const toggle = (a: string) => setChecked(checked.includes(a) ? checked.filter((x) => x !== a) : [...checked, a]);

  return (
    <div className="min-h-dvh flex flex-col bg-wash">
      <header className="h-14 shrink-0 bg-paper border-b border-line flex items-center gap-3 px-4 md:px-6">
        <NextLink href="/" className="flex items-center gap-2 font-semibold text-[18px]" aria-label="Countersign home">
          <Logo /> <span className="max-[420px]:hidden">Countersign</span>
        </NextLink>
        <span className="hidden md:inline font-mono text-[12px] text-muted truncate">{summaryLine(c)}</span>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          {OUTS.map((o) => (
            <button key={o.key} className={`btn !py-1.5 max-lg:!px-2.5 ${o.key === "sheet" ? "btn-ink" : "btn-line"}`} onClick={() => setSheet(o.key)} aria-label={o.label}>
              {o.icon} <span className="hidden lg:inline">{o.label}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-line !py-1.5 max-sm:!px-2.5" onClick={() => setPlan(null)} aria-label="Another plan">
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Another plan</span>
        </button>
      </header>

      <div className="flex-1 mx-auto w-full max-w-[1240px] px-4 md:px-6 py-6 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <main className="min-w-0 space-y-4">
          <section className="bg-paper border border-line rounded-xl p-5 md:p-6">
            <p className="label">{`${values.project}${plan.terraform ? ` · Terraform ${plan.terraform}` : ""}`}</p>
            <h1 className="mt-1 font-semibold text-[24px] md:text-[32px] leading-tight">
              {values.high ? `${values.high} high-risk ${values.high === 1 ? "change needs" : "changes need"} a sign-off` : values.medium ? `${values.medium} ${values.medium === 1 ? "change" : "changes"} to look at, nothing high-risk` : "Routine plan: nothing flagged"}
            </h1>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <Stat n={`+${c.add}`} label="to add" tone="text-green" />
              <Stat n={`~${c.change}`} label="to change" tone="text-blue" />
              <Stat n={`−${c.destroy}`} label="to destroy" tone={c.destroy ? "text-red" : ""} />
              <Stat n={`-/+${c.replace}`} label="replaced" tone={c.replace ? "text-red" : ""} />
              <Stat n={String(values.high)} label="high risk" tone={values.high ? "text-red" : ""} soft={values.high ? "bg-red-soft" : undefined} />
            </div>
            {plan.errored || plan.drift ? (
              <p className="mt-3 flex gap-2 text-[13px] text-amber">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                {[plan.errored && "Terraform reported errors while planning: this plan may be incomplete.", plan.drift && `${plan.drift} resources drifted since the last apply.`].filter(Boolean).join(" ")}
              </p>
            ) : null}
          </section>

          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex gap-1 bg-paper border border-line rounded-lg p-1" role="tablist" aria-label="Which changes">
              {(["flagged", "all"] as const).map((k) => (
                <button key={k} role="tab" aria-selected={show === k} onClick={() => setShow(k)} className={`rounded-md px-3 py-1 text-[13px] font-semibold ${show === k ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
                  {k === "flagged" ? `Flagged (${risky.length})` : `All changes (${plan.changes.length})`}
                </button>
              ))}
            </div>
            {risky.length ? <p className="text-[13px] text-muted font-mono">{`${done} of ${risky.length} flagged checked`}</p> : null}
          </div>

          <section className="space-y-3">
            {list.map((x) => (
              <Row key={x.address} c={x} on={checked.includes(x.address)} toggle={() => toggle(x.address)} />
            ))}
            {!list.length ? <p className="bg-paper border border-line rounded-xl p-5 text-[14px] text-muted">Nothing flagged. Switch to all changes to see the routine ones.</p> : null}
          </section>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="bg-paper border border-line rounded-xl p-5 space-y-3">
            <p className="label">The change</p>
            <Field label="Project / workspace" value={meta.project} onChange={(v) => setMeta({ ...meta, project: v })} placeholder="payments · production" max={60} />
            <Field label="Requested by" value={meta.requestedBy} onChange={(v) => setMeta({ ...meta, requestedBy: v })} placeholder="Who opened the change" />
            <Field label="Link (PR or run)" value={meta.link} onChange={(v) => setMeta({ ...meta, link: v })} placeholder="https://…" max={200} />
          </section>
          <section className="bg-paper border border-line rounded-xl p-5 space-y-3">
            <p className="label">Sign-off</p>
            <Field label="Approver" value={meta.reviewer} onChange={(v) => setMeta({ ...meta, reviewer: v })} placeholder="Your name" />
            <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Decision">
              {(["pending", "approved", "conditions", "rejected"] as const).map((d) => (
                <button key={d} role="radio" aria-checked={decision === d} onClick={() => setDecision(d)} className={`rounded-lg border px-2 py-1.5 text-[12.5px] font-semibold text-left ${decision === d ? (d === "rejected" ? "border-red bg-red-soft text-red" : d === "pending" ? "border-ink bg-wash" : "border-brand bg-brand-soft text-brand") : "border-line text-muted hover:text-ink"}`}>
                  {d === "pending" ? "Not decided" : DECISION[d]}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="text-[12px] font-semibold text-ink-2">Conditions / note</span>
              <textarea className="input mt-1 !text-[13.5px] h-24" maxLength={400} value={meta.note} onChange={(e) => setMeta({ ...meta, note: e.target.value })} placeholder="e.g. Snapshot the database first" />
            </label>
          </section>
          <p className="text-[12.5px] text-muted px-1 flex gap-2">
            <Lock01 size={15} className="shrink-0 mt-0.5" /> The plan is read in this tab and never uploaded. Sensitive values stay masked in every output.
          </p>
        </aside>
      </div>

      {sheet ? <Sheet out={sheet} setOut={setSheet} values={values} onClose={() => setSheet(null)} /> : null}
    </div>
  );
}

function Row({ c, on, toggle }: { c: Change; on: boolean; toggle: () => void }) {
  return (
    <article className={`bg-paper border rounded-xl p-4 ${c.risk === "high" ? "border-l-4 border-l-red border-line" : c.risk === "medium" ? "border-l-4 border-l-amber border-line" : "border-line"}`}>
      <div className="flex items-start gap-3">
        <span className={`font-mono font-semibold text-[15px] w-8 shrink-0 ${MARK_COLOR[c.action]}`} aria-label={c.action}>
          {MARK[c.action]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono font-semibold text-[14px] break-all">{c.address}</p>
            <span className={`rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase ${RISK_TAG[c.risk]}`}>{c.risk}</span>
          </div>
          <p className="mt-1 text-[13.5px] text-ink-2">{c.why}</p>
          {c.flags.length ? (
            <ul className="mt-2 space-y-1">
              {c.flags.map((f) => (
                <li key={f} className="text-[13.5px] flex gap-2">
                  <span className={`mt-[7px] size-1.5 rounded-full shrink-0 ${c.risk === "high" ? "bg-red" : c.risk === "medium" ? "bg-amber" : "bg-muted"}`} />
                  {f}
                </li>
              ))}
            </ul>
          ) : null}
          {c.diffs.length ? (
            <div className="mt-2.5 rounded-lg bg-wash px-3 py-2 overflow-x-auto">
              {c.diffs.map((d) => (
                <p key={d.path} className="font-mono text-[12px] leading-relaxed whitespace-nowrap">
                  <span className={c.forcedBy.includes(d.path) ? "text-red font-semibold" : "text-ink-2"}>{d.path}</span>
                  <span className="text-muted">{" = "}</span>
                  {d.before} <span className="text-muted">→</span> {d.after}
                  {c.forcedBy.includes(d.path) ? <span className="text-red"> # forces replacement</span> : null}
                </p>
              ))}
            </div>
          ) : null}
        </div>
        {c.risk !== "low" ? (
          <label className={`shrink-0 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[12.5px] font-semibold cursor-pointer ${on ? "border-brand bg-brand-soft text-brand" : "border-line text-muted"}`}>
            <input type="checkbox" className="sr-only" checked={on} onChange={toggle} />
            <CheckSquare size={15} /> {on ? "Checked" : "Check"}
          </label>
        ) : null}
      </div>
    </article>
  );
}

function Stat({ n, label, tone, soft }: { n: string; label: string; tone: string; soft?: string }) {
  return (
    <div className={`rounded-lg px-3 py-2.5 ${soft ?? "bg-wash"}`}>
      <p className={`font-mono font-semibold text-[20px] leading-none ${tone}`}>{n}</p>
      <p className="mt-1 text-[12px] text-muted">{label}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, max = 40 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; max?: number }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-ink-2">{label}</span>
      <input className="input mt-1 !py-1.5 !text-[13.5px]" maxLength={max} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/* ---------- start ---------- */

function Start({ busy, error, start }: { busy: boolean; error: string | null; start: (text: Promise<string>, sample?: boolean) => void }) {
  const [text, setText] = useState("");
  const [over, setOver] = useState(false);
  const file = (f?: File) => {
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) return start(Promise.reject(new Error("That file is over 25 MB. Is it the JSON plan (terraform show -json)?")));
    start(f.text());
  };
  return (
    <div className="min-h-dvh grid place-items-center p-4 md:p-8 bg-wash">
      <div className="w-full max-w-[640px] bg-paper border border-line rounded-2xl overflow-hidden shadow-[0_30px_60px_-34px_rgb(20_27_45/0.35)]">
        <div className="p-6 md:p-8 border-b border-line">
          <NextLink href="/" className="flex items-center gap-2 font-semibold text-[18px]">
            <Logo /> Countersign
          </NextLink>
          <h1 className="mt-6 font-semibold text-[28px] md:text-[34px] leading-[1.1]">Which plan are we signing?</h1>
          <p className="mt-2 text-[15px] text-muted leading-relaxed">Save the plan, then turn it into JSON. Countersign reads the JSON right here in your browser.</p>
          <pre className="mt-3 rounded-lg bg-ink text-[#d7f5ee] font-mono text-[12.5px] px-4 py-3 overflow-x-auto">{"terraform plan -out=tfplan\nterraform show -json tfplan > plan.json"}</pre>
        </div>
        <div className="p-6 md:p-8 space-y-4">
          <label
            onDragOver={(e) => (e.preventDefault(), setOver(true))}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => (e.preventDefault(), setOver(false), file(e.dataTransfer.files[0]))}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer ${over ? "border-brand bg-brand-soft" : "border-rule hover:border-ink"}`}
          >
            <Upload01 size={22} className="text-muted" />
            <span className="font-semibold text-[14px]">Drop plan.json here, or choose the file</span>
            <span className="text-[12.5px] text-muted">The plan holds secrets in plain text. It is never uploaded.</span>
            <input type="file" accept=".json,application/json" className="sr-only" onChange={(e) => file(e.target.files?.[0])} />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-ink-2">Or paste the JSON</span>
            <textarea className="input mt-1 font-mono !text-[12.5px] h-24" placeholder='{"format_version":"1.2","terraform_version":"1.17.2",…}' value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ink" disabled={!text.trim() || busy} onClick={() => start(Promise.resolve(text))}>
              Review the plan
            </button>
            <button className="btn btn-line" disabled={busy} onClick={() => start(fetch("/samples/plan.json").then((r) => r.text()), true)}>
              Sample: a real plan with a database replacement
            </button>
          </div>
          {busy ? <p className="text-[13px] text-muted font-mono">Reading the plan…</p> : null}
          {error ? (
            <p className="text-[13px] text-red flex gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------- outputs ---------- */

function Sheet({ out, setOut, values, onClose }: { out: Out; setOut: (o: Out) => void; values: ReturnType<typeof toValues>; onClose: () => void }) {
  const [view, setView] = useState<{ url?: string; html?: string; issues?: string[] } | null>(null);
  const key = JSON.stringify(values);
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      const res = await renderLocal({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ output: out, values }) });
      const type = res.headers.get("Content-Type") ?? "";
      const next = type.includes("json")
        ? await res.json().then((j) => (res.ok ? { html: j.html as string } : { issues: (j.diagnostics ?? [{ message: j.error }]).map((d: { message: string; path?: string }) => `${d.path ? `${d.path.replace(/^values\./, "")}: ` : ""}${d.message}`) }))
        : { url: URL.createObjectURL(await res.blob()) };
      if (!alive) return;
      setView((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return next;
      });
    }, 150);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [out, key]);

  function download() {
    if (!view || view.issues) return;
    const a = document.createElement("a");
    a.href = view.url ?? URL.createObjectURL(new Blob([view.html ?? ""], { type: "text/html" }));
    a.download = `${values.project.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${OUTS.find((o) => o.key === out)!.file}`;
    a.click();
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/35" onClick={onClose}>
      <div className="w-full md:w-[min(1040px,94vw)] h-full bg-paper flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="h-14 shrink-0 border-b border-line flex items-center gap-1 sm:gap-2 px-3 sm:px-5">
          {OUTS.map((o) => (
            <button key={o.key} onClick={() => o.key !== out && (setOut(o.key), setView(null))} className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[13px] sm:text-[13.5px] font-semibold ${out === o.key ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
              {o.label}
            </button>
          ))}
          <div className="flex-1" />
          <button className="btn btn-ink" onClick={download} disabled={!view || !!view.issues} aria-label="Download">
            <Download01 size={16} /> <span className="hidden sm:inline">Download</span>
          </button>
          <button className="text-muted hover:text-ink ml-1" onClick={onClose} aria-label="Close">
            <XClose size={20} />
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-wash flex">
          {view?.issues ? (
            <div className="m-6 rounded-xl bg-red-soft p-4 space-y-1 self-start">
              <p className="font-semibold text-red text-[14px]">The template refused these values</p>
              {view.issues.map((m) => (
                <p key={m} className="text-[13px]">
                  {m}
                </p>
              ))}
            </div>
          ) : view?.url && out === "sheet" ? (
            <iframe title="Sign-off sheet" src={view.url} className="flex-1" />
          ) : view?.url ? (
            <div className="flex-1 grid place-items-center p-6 overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={view.url} alt="Plan card" className="max-h-full max-w-full border border-line rounded-lg shadow-lg" />
            </div>
          ) : view?.html ? (
            <iframe title="Sign-off email" srcDoc={view.html} className="flex-1 bg-white" />
          ) : (
            <p className="m-auto text-[14px] text-muted">Rendering with Hyper Elements…</p>
          )}
        </div>
      </div>
    </div>
  );
}
