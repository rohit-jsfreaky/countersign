import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, ArrowUpRight, Database01, FileCheck02, Globe01, Image01, Key01, Lock01, Mail01, Server01 } from "@untitledui/icons";
import { Logo } from "@/components/Logo";

const WRAP = "mx-auto max-w-[1200px] px-6";

export default function Home() {
  return (
    <div className="bg-paper text-ink">
      <Nav />
      <Hero />
      <Why />
      <Translate />
      <Checks />
      <How />
      <Outputs />
      <Private />
      <Faq />
      <Close />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-line">
      <div className={`${WRAP} h-16 flex items-center gap-4 md:gap-8`}>
        <Link href="/" className="flex items-center gap-2 font-semibold text-[19px]">
          <Logo /> Countersign
        </Link>
        <nav className="hidden md:flex gap-6 text-[14px] font-medium text-muted">
          <a href="#why" className="hover:text-ink">Why</a>
          <a href="#checks" className="hover:text-ink">What it checks</a>
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#outputs" className="hover:text-ink">What you get</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <div className="flex-1" />
        <Link href="/review" className="btn btn-ink">
          <span className="hidden sm:inline">Review a plan</span>
          <span className="sm:hidden">Start</span> <ArrowRight size={16} />
        </Link>
      </div>
    </header>
  );
}

const PLAN_LINES: Array<[string, string?]> = [
  ["  # aws_db_instance.orders must be replaced"],
  ["-/+ resource \"aws_db_instance\" \"orders\" {", "text-red"],
  ["      + address                = (known after apply)"],
  ["      ~ arn                    = \"arn:aws:rds:eu-west-1:…\" -> (known after apply)"],
  ["      + availability_zone      = (known after apply)"],
  ["      + backup_retention_period = (known after apply)"],
  ["        …"],
  ["      ~ storage_encrypted      = false -> true # forces replacement", "text-[#ffb4ab] font-semibold"],
  ["        …"],
  ["Plan: 3 to add, 4 to change, 3 to destroy."],
];

function Hero() {
  return (
    <section className="border-b border-line">
      <div className={`${WRAP} pt-16 md:pt-24 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center`}>
        <div>
          <p className="label">For whoever approves terraform apply</p>
          <h1 className="mt-5 font-semibold text-[42px] md:text-[64px] leading-[1.02] tracking-[-0.025em]">
            See what the plan <span className="text-red">destroys</span> before you sign it.
          </h1>
          <p className="mt-6 text-[18px] leading-relaxed text-ink-2 max-w-[560px]">
            Drop in <code className="font-mono text-[16px] bg-wash px-1.5 py-0.5 rounded">terraform show -json</code>. Countersign puts the database replacements, the destroys, the ports opened to the internet and the wildcard IAM first, each with Terraform&apos;s own reason. Then it makes the sign-off sheet, the approver&apos;s email and a card for the pull request.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/review" className="btn btn-ink !px-5 !py-3 !text-[15px]">
              Review a plan <ArrowRight size={17} />
            </Link>
            <a href="/landing/sign-off.pdf" className="btn btn-line !px-5 !py-3 !text-[15px]">
              Sample sign-off sheet (PDF)
            </a>
          </div>
        </div>
        <figure className="min-w-0 rounded-xl bg-ink text-[#c9d2e3] shadow-[0_30px_70px_-30px_rgb(20_27_45/0.6)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 h-9 border-b border-white/10 font-mono text-[11.5px] text-white/50">
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="ml-2">terraform plan · 183 lines</span>
          </div>
          <pre className="px-4 py-4 font-mono text-[11.5px] md:text-[12.5px] leading-[1.7] overflow-x-auto">
            {PLAN_LINES.map(([l, cls]) => (
              <span key={l} className={`block ${cls ?? ""}`}>
                {l}
              </span>
            ))}
          </pre>
          <figcaption className="px-4 py-3 border-t border-white/10 text-[13px] text-white/70">The one line that matters for the database is line 62 of 183. It sits in a 52-line block of &ldquo;known after apply&rdquo;.</figcaption>
        </figure>
      </div>
      <div className={`${WRAP} mt-14`}>
        <figure className="rounded-t-2xl border border-b-0 border-rule bg-paper p-2.5 pb-0 shadow-[0_-24px_60px_-34px_rgb(20_27_45/0.4)]">
          <Image src="/landing/review.png" alt="Countersign showing a real plan: 4 high-risk changes need a sign-off, the database replacement first with the attribute that forces it" width={1440} height={900} priority className="w-full h-auto rounded-t-xl border border-b-0 border-line" />
        </figure>
      </div>
    </section>
  );
}

const QUOTES = [
  {
    q: "These devs don't know how to read the plan, and have caused a number of outages from accidentally deleting mission critical resources.",
    who: "A platform team that posts every plan on the pull request",
    href: "https://www.reddit.com/r/Terraform/comments/1b0a1gh/",
    when: "r/Terraform, Feb 2024",
  },
  {
    q: "I wouldn't block on the replace itself, I'd block on replace with no explicit ok. … someone who owns that db signs off after seeing a fresh snapshot or backup exists.",
    who: "Answering “Do you block every Terraform plan that replaces a database?”",
    href: "https://www.reddit.com/r/Terraform/comments/1y11q0b/",
    when: "r/Terraform, Nov 2026",
  },
  {
    q: "We still have to manually approve Terraform plans. Every. Single. Time. It slows things down a lot.",
    who: "A team with dozens of deployments a day",
    href: "https://www.reddit.com/r/Terraform/comments/1ja5sz8/",
    when: "r/Terraform, Mar 2025",
  },
];

function Why() {
  return (
    <section id="why" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="01" eyebrow="Why" title="The approver reads the plan. The plan wasn't written for them.">
          Terraform prints every attribute of every resource. The approval step needs five things: what gets destroyed, what holds data, why it&apos;s being replaced, what opens up, and who said yes.
        </Head>
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {QUOTES.map((x) => (
            <blockquote key={x.href} className="border border-line rounded-xl p-6 flex flex-col">
              <p className="text-[17px] leading-snug font-medium flex-1">&ldquo;{x.q}&rdquo;</p>
              <footer className="mt-5 text-[13.5px] text-muted">
                {x.who}.{" "}
                <a className="underline underline-offset-2 hover:text-ink" href={x.href}>
                  {x.when}
                </a>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

const ROWS: Array<[string, string, string]> = [
  ["aws_db_instance.orders must be replaced", "storage_encrypted can't change in place, so Terraform deletes the database and creates a new, empty one. No final snapshot is taken (skip_final_snapshot = true).", "HIGH"],
  ["aws_s3_bucket.exports will be destroyed (because … is not in configuration)", "Holds data. It is no longer in the configuration: removed, or renamed or moved without a moved block.", "HIGH"],
  ["~ policy = jsonencode( … Action = \"s3:*\" … Resource = \"*\" )", "Allows s3:* on every resource (*). It was GetObject and PutObject on one bucket.", "HIGH"],
  ["+ aws_vpc_security_group_ingress_rule.ssh  cidr_ipv4 = \"0.0.0.0/0\"  from_port = 22", "Opens port 22 to the whole internet (0.0.0.0/0).", "HIGH"],
  ["~ instance_type = \"t3.small\" -> \"t3.medium\"", "AWS stops and starts the instance to change its type.", "LOW"],
];

function Translate() {
  return (
    <section className="border-b border-line bg-wash">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="02" eyebrow="A real plan" title="What Terraform says, and what the approver needs to hear.">
          A real plan from Terraform 1.17.2 and the AWS provider, made from a sample stack. 3 to add, 4 to change, 3 to destroy, and four of those ten need an owner&apos;s yes.
        </Head>
        <div className="mt-12 bg-paper border border-line rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_1fr_90px] gap-6 px-6 py-3 border-b border-line label">
            <span>Terraform says</span>
            <span>Countersign says</span>
            <span className="text-right">Risk</span>
          </div>
          {ROWS.map(([plan, says, risk]) => (
            <div key={plan} className="grid md:grid-cols-[1fr_1fr_90px] gap-2 md:gap-6 px-6 py-5 border-b border-line last:border-b-0">
              <p className="font-mono text-[12.5px] text-ink-2 break-words">{plan}</p>
              <p className="text-[15px] leading-relaxed">{says}</p>
              <p className={`font-mono text-[12px] font-semibold md:text-right ${risk === "HIGH" ? "text-red" : "text-muted"}`}>{risk}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const CHECKS: Array<[ReactNode, string, string]> = [
  [<Database01 key="d" size={20} />, "Data that would be lost", "Databases, buckets, tables, disks, queues, keys and DNS zones on AWS, Google Cloud and Azure, when they are destroyed or replaced. Plus the safety nets: final snapshot, deletion protection, force_destroy."],
  [<Server01 key="s" size={20} />, "Why it's replaced", "Terraform's own reason (cannot update, tainted, asked with -replace, gone from the config, count or for_each key) and the exact attribute that forces it, before → after."],
  [<AlertTriangle key="a" size={20} />, "The gap in between", "A replacement that deletes first and creates second means downtime. Countersign says which order Terraform will use."],
  [<Globe01 key="g" size={20} />, "Doors opened to the internet", "Ingress from 0.0.0.0/0 or ::/0 that wasn't there before. SSH, RDP and database ports are high risk; public 80 and 443 are left alone."],
  [<Key01 key="k" size={20} />, "Wildcard permissions", "Any IAM policy in the plan that now allows * or service:* on every resource. Read from the policy JSON, not guessed from names."],
  [<Lock01 key="l" size={20} />, "Secrets kept secret", "The plan JSON holds sensitive values in plain text. Countersign reads Terraform's sensitive markers and shows (sensitive) everywhere."],
];

function Checks() {
  return (
    <section id="checks" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="03" eyebrow="What it checks" title="Six questions, answered from the plan itself." />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line rounded-xl overflow-hidden">
          {CHECKS.map(([icon, t, d]) => (
            <div key={t} className="bg-paper p-7">
              <span className="grid place-items-center size-10 rounded-lg bg-brand-soft text-brand">{icon}</span>
              <h3 className="mt-4 font-semibold text-[19px]">{t}</h3>
              <p className="mt-2 text-[14.5px] text-ink-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function How() {
  const steps: Array<[string, ReactNode]> = [
    ["Save the plan as JSON", <code key="c" className="font-mono text-[13px]">terraform plan -out=tfplan<br />terraform show -json tfplan &gt; plan.json</code>],
    ["Drop it in", "Countersign ranks every change: high, medium, low. The risky ones come first with the reason and the attribute that forces them."],
    ["Check and decide", "Tick each flagged change as you look at it. Approve, approve with conditions, or reject, with a note."],
    ["Send the record", "The sign-off sheet goes on the change ticket, the email to the approver, the card on the pull request."],
  ];
  return (
    <section id="how" className="border-b border-line bg-wash">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="04" eyebrow="How it works" title="A plan in, a decision on record." />
        <ol className="mt-12 grid md:grid-cols-4 border-t-2 border-ink">
          {steps.map(([t, d], i) => (
            <li key={t} className="pt-6 pr-6 pb-2">
              <span className="font-mono text-[13px] text-brand font-semibold">{`STEP ${i + 1}`}</span>
              <h3 className="mt-2 font-semibold text-[20px]">{t}</h3>
              <div className="mt-2 text-[14.5px] text-ink-2 leading-relaxed">{d}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Outputs() {
  return (
    <section id="outputs" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="05" eyebrow="What you get" title="The sheet, the email, the card.">
          Three Hyper Elements templates, rendered in your browser or from the command line in CI.
        </Head>
        <div className="mt-12 grid md:grid-cols-12 gap-4">
          <Tile className="md:col-span-5 md:row-span-2" icon={<FileCheck02 size={17} />} name="The sign-off sheet" note="A4 PDF · risky changes first, every other change in a line, then the signature">
            <Image src="/landing/sheet.png" alt="Sign-off sheet page 1: shop-infra production, 4 high-risk changes, the database replacement with storage_encrypted forcing it" width={1241} height={1754} className="w-full h-auto rounded-lg border border-line" />
          </Tile>
          <Tile className="md:col-span-7" icon={<Mail01 size={17} />} name="The email" note="To the approver: what needs their eyes. After the decision, it records it">
            <div className="h-[330px] overflow-hidden rounded-lg border border-line bg-wash">
              <Image src="/landing/request.png" alt="Email: approved with conditions, shop-infra production, with the four flagged changes" width={760} height={900} className="w-full h-auto" />
            </div>
          </Tile>
          <Tile className="md:col-span-7" icon={<Image01 size={17} />} name="The card" note="1200 × 630 PNG · for the pull request or the team channel">
            <Image src="/landing/card.png" alt="Plan card: +3 to add, ~4 to change, −3 to destroy, 1 replaced, the three riskiest changes" width={1200} height={630} className="w-full h-auto rounded-lg border border-line" />
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({ className = "", icon, name, note, children }: { className?: string; icon: ReactNode; name: string; note: string; children: ReactNode }) {
  return (
    <div className={`min-w-0 border border-line rounded-2xl p-5 md:p-6 flex flex-col gap-5 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="grid place-items-center size-10 rounded-lg bg-ink text-white">{icon}</span>
        <div>
          <p className="font-semibold text-[18px] leading-tight">{name}</p>
          <p className="text-[12.5px] text-muted">{note}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Private() {
  return (
    <section className="border-b border-line bg-ink text-white">
      <div className={`${WRAP} py-20 md:py-24 grid md:grid-cols-2 gap-12 items-center`}>
        <div>
          <p className="label !text-[#5fd3bd]">06 · Private by design</p>
          <h2 className="mt-4 font-semibold text-[34px] md:text-[48px] leading-[1.05] tracking-[-0.02em]">Your plan never leaves the tab.</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-white/75">
            A plan JSON carries database passwords and keys in plain text, next to a marker that says they are sensitive. So Countersign has no server: the page reads the file, and the PDF, the email and the image are rendered by Hyper Elements in your browser.
          </p>
        </div>
        <pre className="rounded-xl bg-white/5 border border-white/10 p-5 font-mono text-[12.5px] leading-[1.8] overflow-x-auto text-white/80">
          {"\"before\": { \"password\": \"sample-only-not-…\" },\n\"before_sensitive\": { \"password\": true },\n\n"}
          <span className="text-[#5fd3bd]">{"→ password = (sensitive)"}</span>
        </pre>
      </div>
    </section>
  );
}

const FAQ = [
  ["Does it work with OpenTofu?", "OpenTofu writes the same JSON format: tofu show -json tfplan > plan.json, then drop it in."],
  ["Which clouds does it know?", "The risk checks know the data-holding resources of AWS, Google Cloud and Azure by name, and read ports and IAM policies from the values, whatever the provider. Everything else still shows up, ranked by what Terraform will do to it."],
  ["Is “high risk” a guess?", "No. Every flag comes from the plan: the action, Terraform's action_reason, replace_paths, the before and after values, and the sensitive markers. The rules are in one file (templates/_shared/plan.ts), with tests."],
  ["Does it replace deletion protection or policy checks?", "No. Keep deletion_protection, prevent_destroy and your OPA or Sentinel rules. Countersign is for the human who reads the plan and says yes."],
  ["Can it run in CI?", "The outputs are Hyper Elements templates. scripts/sample.ts turns a plan JSON into values, and npm run sheets renders the sheet, the email and the card from the command line."],
  ["What about the plan's secrets?", "Nothing is uploaded. Sensitive values show as (sensitive) on screen and in every file you download."],
  ["What does the sample contain?", "A real plan from Terraform 1.17.2 and hashicorp/aws, made from public/samples/main.tf against a sample state. No AWS account was touched; the ids, the password and the people are made up."],
] as const;

function Faq() {
  return (
    <section id="faq" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28 grid md:grid-cols-[360px_1fr] gap-12`}>
        <div className="md:sticky md:top-28 self-start">
          <Head n="07" eyebrow="FAQ" title="Before you approve." />
        </div>
        <div className="border-t border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-semibold text-[18px]">
                {q}
                <span className="grid place-items-center size-8 shrink-0 rounded-md border-[1.5px] border-ink font-mono text-[16px] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-6 pr-12 text-[15.5px] text-ink-2 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Close() {
  return (
    <>
      <section className="bg-wash border-b border-line">
        <div className={`${WRAP} py-20 md:py-24 grid md:grid-cols-[1fr_auto] gap-8 items-end`}>
          <div>
            <h2 className="font-semibold text-[38px] md:text-[60px] leading-[1.02] tracking-[-0.025em] max-w-[780px]">Sign the plan you actually read.</h2>
            <p className="mt-4 text-[17px] text-ink-2 max-w-[520px]">Drop in the JSON. The risky changes come first.</p>
          </div>
          <Link href="/review" className="btn btn-ink !px-6 !py-3.5 !text-[15px]">
            Review a plan <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <footer className={`${WRAP} py-10 flex flex-col md:flex-row gap-3 justify-between text-[13px] text-muted`}>
        <span className="flex items-center gap-2 font-semibold text-[18px] text-ink">
          <Logo size={22} /> Countersign
        </span>
        <p className="max-w-[720px] md:text-right">
          Built with{" "}
          <a className="underline underline-offset-2 hover:text-ink inline-flex items-center gap-0.5" href="https://github.com/hyper-elements/hyper-elements">
            Hyper Elements <ArrowUpRight size={12} />
          </a>
          . Reads Terraform&apos;s JSON output format. Not affiliated with HashiCorp. Sam Okafor and Lena Brandt are made up.
        </p>
      </footer>
    </>
  );
}

function Head({ n, eyebrow, title, children }: { n: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-[820px]">
      <p className="label">
        <span className="text-brand font-semibold">{n}</span> · {eyebrow}
      </p>
      <h2 className="mt-4 font-semibold text-[34px] md:text-[48px] leading-[1.06] tracking-[-0.022em]">{title}</h2>
      {children ? <p className="mt-5 text-[17px] leading-relaxed text-ink-2">{children}</p> : null}
    </div>
  );
}
