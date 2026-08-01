import { FormEvent, useMemo, useRef, useState } from "react";
import { commandGroups, missions, modules, quizQuestions, type Level, type Mission, type QuizQuestion } from "./data";

type Tab = "home" | "playground" | "graph" | "quiz" | "roadmap" | "reference";
type Zone = "working" | "staging" | "local" | "remote";
type LabFile = { id: number; name: string; zone: Zone };
type GraphNode = { id: string; message: string; branch: string; parents: string[]; order: number };
type GraphState = { nodes: GraphNode[]; branches: Record<string, string>; current: string };
type Celebration = { title: string; xp: number; subtitle: string } | null;

const tabs: { id: Tab; label: string; fa: string; icon: string }[] = [
  { id: "home", label: "HOME", fa: "شروع", icon: "⌂" },
  { id: "playground", label: "STATE LAB", fa: "چهار در", icon: "◫" },
  { id: "graph", label: "GIT GRAPH", fa: "گراف", icon: "⑂" },
  { id: "quiz", label: "QUIZ + ORDER", fa: "آزمون", icon: "✓" },
  { id: "roadmap", label: "ROADMAP", fa: "مسیر", icon: "↗" },
  { id: "reference", label: "COMMANDS", fa: "دستورات", icon: ">_" },
];

const contacts = [
  { label: "GITHUB", handle: "shokoofe-akbari", href: "https://github.com/shokoofe-akbari", icon: "GH" },
  { label: "LINKEDIN", handle: "shokoofeh-akbari", href: "https://www.linkedin.com/in/shokoofeh-akbari", icon: "IN" },
  { label: "INSTAGRAM", handle: "shokoofeh.akbari_com", href: "https://www.instagram.com/shokoofeh.akbari_com", icon: "IG" },
  { label: "BUGCHARM", handle: "bugcharm.com", href: "https://www.bugcharm.com", icon: "WWW" },
  { label: "TELEGRAM", handle: "@BugCharm", href: "https://t.me/BugCharm", icon: "TG" },
];

const graphScenarios = [
  {
    id: "feature",
    title: "REAL FEATURE FLOW",
    fa: "دو شاخه و Merge واقعی",
    commands: ["git commit -m \"chore: baseline\"", "git commit -m \"feat: shell\"", "git switch -c feature/cart", "git commit -m \"feat: cart model\"", "git commit -m \"test: cart\"", "git switch main", "git commit -m \"fix: pricing\"", "git switch feature/cart", "git commit -m \"feat: cart UI\"", "git switch main", "git merge --no-ff feature/cart"],
  },
  {
    id: "ff",
    title: "FAST-FORWARD",
    fa: "ادغام بدون Merge Commit",
    commands: ["git commit -m \"initial\"", "git switch -c feature/docs", "git commit -m \"docs: intro\"", "git commit -m \"docs: api\"", "git switch main", "git merge feature/docs"],
  },
  {
    id: "three-way",
    title: "THREE-WAY MERGE",
    fa: "تاریخچهٔ واگرا و دو Parent",
    commands: ["git commit -m \"initial\"", "git switch -c feature/auth", "git commit -m \"feat: login\"", "git switch main", "git commit -m \"fix: config\"", "git switch feature/auth", "git commit -m \"test: login\"", "git switch main", "git merge feature/auth"],
  },
  {
    id: "squash",
    title: "SQUASH MERGE",
    fa: "چند Commit به یک Snapshot",
    commands: ["git commit -m \"initial\"", "git switch -c feature/ui", "git commit -m \"feat: header\"", "git commit -m \"feat: footer\"", "git commit -m \"style: responsive\"", "git switch main", "git merge --squash feature/ui"],
  },
  {
    id: "rebase",
    title: "REBASE",
    fa: "بازپخش Feature روی main",
    commands: ["git commit -m \"initial\"", "git switch -c feature/search", "git commit -m \"feat: search\"", "git commit -m \"test: search\"", "git switch main", "git commit -m \"fix: security\"", "git switch feature/search", "git rebase main"],
  },
];

const initialGraph = (): GraphState => ({ nodes: [], branches: { main: "" }, current: "main" });

function shuffle<T>(list: T[]): T[] {
  const result = [...list];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function shortMessage(command: string) {
  return command.match(/-m\s+["'](.+?)["']/)?.[1] ?? "snapshot";
}

function ancestors(state: GraphState, id: string): Set<string> {
  const found = new Set<string>();
  const visit = (nodeId: string) => {
    if (!nodeId || found.has(nodeId)) return;
    found.add(nodeId);
    const node = state.nodes.find((item) => item.id === nodeId);
    node?.parents.forEach(visit);
  };
  visit(id);
  return found;
}

function executeGraphCommand(previous: GraphState, raw: string): GraphState {
  const command = raw.trim();
  if (!command) return previous;
  const next: GraphState = { nodes: [...previous.nodes], branches: { ...previous.branches }, current: previous.current };
  const makeNode = (message: string, parents: string[], branch = next.current) => {
    const id = (next.nodes.length + 1).toString(16).padStart(3, "0");
    next.nodes.push({ id, message, parents: parents.filter(Boolean), branch, order: next.nodes.length });
    next.branches[branch] = id;
  };
  const createMatch = command.match(/^git (?:switch -c|checkout -b)\s+([^\s]+)/);
  if (createMatch) {
    next.branches[createMatch[1]] = next.branches[next.current] ?? "";
    next.current = createMatch[1];
    return next;
  }
  const switchMatch = command.match(/^git (?:switch|checkout)\s+([^\s]+)/);
  if (switchMatch && next.branches[switchMatch[1]] !== undefined) {
    next.current = switchMatch[1];
    return next;
  }
  if (command.startsWith("git commit")) {
    makeNode(shortMessage(command), [next.branches[next.current]]);
    return next;
  }
  const mergeMatch = command.match(/^git merge(?:\s+--(?:no-ff|squash))?\s+([^\s]+)/);
  if (mergeMatch) {
    const source = mergeMatch[1];
    const sourceHead = next.branches[source];
    const targetHead = next.branches[next.current];
    if (!sourceHead) return next;
    if (command.includes("--squash")) {
      makeNode(`squash: ${source}`, [targetHead]);
    } else if (!command.includes("--no-ff") && ancestors(next, sourceHead).has(targetHead)) {
      next.branches[next.current] = sourceHead;
    } else {
      makeNode(`merge: ${source}`, [targetHead, sourceHead]);
    }
    return next;
  }
  const rebaseMatch = command.match(/^git rebase\s+([^\s]+)/);
  if (rebaseMatch && next.branches[rebaseMatch[1]] !== undefined) {
    const targetHead = next.branches[rebaseMatch[1]];
    const oldHead = next.branches[next.current];
    const targetAncestors = ancestors(next, targetHead);
    const replay = next.nodes.filter((node) => ancestors(next, oldHead).has(node.id) && !targetAncestors.has(node.id) && node.branch === next.current);
    next.branches[next.current] = targetHead;
    replay.forEach((node) => makeNode(`${node.message} (rebased)`, [next.branches[next.current]]));
    return next;
  }
  return next;
}

function normalizeCommand(value: string) {
  return value.trim().replace(/\s+/g, " ").replace(/[“”]/g, '"');
}

function equivalentOrder(current: string[], mission: Mission) {
  const expected = mission.steps.map(normalizeCommand);
  const actual = current.map(normalizeCommand);
  if (actual.join("\n") === expected.join("\n")) return true;
  if (!mission.movableGroups) return false;
  const canonicalize = (items: string[]) => {
    const output = [...items];
    mission.movableGroups?.forEach((group) => {
      const normalizedGroup = group.map(normalizeCommand);
      const indexes = normalizedGroup.map((item) => output.indexOf(item)).sort((a, b) => a - b);
      if (indexes.some((index) => index < 0)) return;
      const sorted = normalizedGroup.slice().sort();
      indexes.forEach((index, offset) => { output[index] = sorted[offset]; });
    });
    return output.join("\n");
  };
  return canonicalize(actual) === canonicalize(expected);
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand ${compact ? "brand-compact" : ""}`}>
      <img src="/bugcharm-logo.png" alt="BugCharm" />
      <span><b>BUGCHARM</b><small>GIT STATE LAB</small></span>
    </span>
  );
}

function ContactHub() {
  return (
    <section className="contact-hub" aria-label="راه‌های ارتباطی با مدرس">
      <div className="contact-owner">
        <img src="/bugcharm-logo.png" alt="BugCharm" />
        <div><span>YOUR INSTRUCTOR</span><strong>شکوفه اکبری</strong><small>Shokoufeh Akbari · BugCharm</small></div>
      </div>
      <div className="contact-links">
        {contacts.map((contact) => (
          <a href={contact.href} target="_blank" rel="noreferrer" key={contact.label}>
            <i>{contact.icon}</i><span><b>{contact.label}</b><small>{contact.handle}</small></span><em>↗</em>
          </a>
        ))}
      </div>
    </section>
  );
}

function Guide({ eyebrow, title, text, steps }: { eyebrow: string; title: string; text: string; steps: string[] }) {
  return (
    <div className="guide-card">
      <img src="/bugcharm-logo.png" alt="" />
      <div className="guide-intro"><span>{eyebrow}</span><h3>{title}</h3><p>{text}</p></div>
      <div className="guide-steps">
        {steps.map((step, index) => <div key={step}><b>{String(index + 1).padStart(2, "0")}</b><p>{step}</p></div>)}
      </div>
    </div>
  );
}

function CelebrationLayer({ value, onClose }: { value: Celebration; onClose: () => void }) {
  if (!value) return null;
  return (
    <div className="celebration" role="dialog" aria-modal="true">
      <div className="balloons" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ "--i": index } as React.CSSProperties} />)}</div>
      <div className="celebration-card">
        <img src="/bugcharm-logo.png" alt="" />
        <span>LEVEL COMPLETE</span>
        <h2>{value.title}</h2>
        <div className="xp-pop">+{value.xp} XP</div>
        <p>{value.subtitle}</p>
        <button onClick={onClose}>CONTINUE →</button>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [score, setScore] = useState(0);
  const [celebration, setCelebration] = useState<Celebration>(null);

  const openTab = (tab: Tab) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main>
      <CelebrationLayer value={celebration} onClose={() => setCelebration(null)} />
      <header className="topbar">
        <button className="brand-button" onClick={() => openTab("home")}><Brand /></button>
        <div className="topbar-contact">
          <span>INSTRUCTOR</span><b>شکوفه اکبری</b>
          <a href="https://www.bugcharm.com" target="_blank" rel="noreferrer">BUGCHARM.COM ↗</a>
        </div>
        <div className="score-chip"><span>WORKSHOP XP</span><strong>{score.toString().padStart(4, "0")}</strong></div>
      </header>

      <nav className="workspace-tabs" aria-label="بخش‌های آزمایشگاه">
        {tabs.map((tab) => (
          <button className={activeTab === tab.id ? "active" : ""} onClick={() => openTab(tab.id)} key={tab.id}>
            <img src="/bugcharm-logo.png" alt="" /><i>{tab.icon}</i><span><b>{tab.label}</b><small>{tab.fa}</small></span>
          </button>
        ))}
      </nav>

      <div className="tab-shell" key={activeTab}>
        {activeTab === "home" && <HomeTab openTab={openTab} />}
        {activeTab === "playground" && <PlaygroundTab setScore={setScore} />}
        {activeTab === "graph" && <GraphTab />}
        {activeTab === "quiz" && <QuizTab setScore={setScore} setCelebration={setCelebration} />}
        {activeTab === "roadmap" && <RoadmapTab openTab={openTab} />}
        {activeTab === "reference" && <ReferenceTab />}
      </div>

      <ContactHub />
      <footer className="site-footer"><Brand compact /><p>طراحی و تدریس: <b>شکوفه اکبری</b> · یک محیط امن برای ساختن مدل ذهنی عمیق از Git</p><span>© 2026 BUGCHARM</span></footer>
    </main>
  );
}

function HomeTab({ openTab }: { openTab: (tab: Tab) => void }) {
  return (
    <section className="home-tab">
      <div className="hero-glow" />
      <div className="hero-copy">
        <div className="hero-brand"><img src="/bugcharm-logo.png" alt="BugCharm" /><span>VISUAL GIT WORKSHOP · PRACTICE ENVIRONMENT</span></div>
        <h1><span>LEARN GIT</span><br /><em>BY SEEING STATE.</em></h1>
        <p>دستور را اجرا کن، جابه‌جایی واقعی فایل‌ها را بین چهار وضعیت ببین، تاریخچه بساز و آموخته‌هایت را با آزمون‌های سطح‌بندی‌شده محک بزن.</p>
        <div className="hero-actions">
          <button className="primary" onClick={() => openTab("playground")}>OPEN STATE LAB <span>→</span></button>
          <button onClick={() => openTab("quiz")}>START A QUIZ <span>↗</span></button>
        </div>
        <div className="hero-metrics">
          <div><strong>04</strong><span>STATE ZONES</span><small>درک مسیر هر فایل</small></div>
          <div><strong>90</strong><span>LEVELLED QUESTIONS</span><small>شش فصل کامل</small></div>
          <div><strong>20</strong><span>ORDER MISSIONS</span><small>سناریوی اجرایی</small></div>
          <div><strong>∞</strong><span>GRAPH HISTORY</span><small>با Zoom و Scroll</small></div>
        </div>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="mini-graph">
          <span className="line l1" /><span className="line l2" /><span className="line l3" />
          <i className="node n1">A</i><i className="node n2">B</i><i className="node n3">C</i><i className="node n4">M</i>
          <b className="branch-label main-label">main</b><b className="branch-label feature-label">feature</b>
        </div>
        <div className="terminal-card"><span>STATE TRANSITION</span><code><i>$</i> git add app.js</code><p>working tree <b>→</b> staging area</p></div>
        <img className="hero-watermark" src="/bugcharm-logo.png" alt="" />
      </div>
    </section>
  );
}

function SectionHead({ index, label, title, description }: { index: string; label: string; title: string; description: string }) {
  return (
    <div className="section-head">
      <div><span>{index} / {label}</span><h1>{title}</h1></div>
      <p>{description}</p>
    </div>
  );
}

function PlaygroundTab({ setScore }: { setScore: React.Dispatch<React.SetStateAction<number>> }) {
  const [files, setFiles] = useState<LabFile[]>([
    { id: 1, name: "app.js", zone: "working" },
    { id: 2, name: "README.md", zone: "working" },
    { id: 3, name: "style.css", zone: "working" },
  ]);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [message, setMessage] = useState("سه فایل در Working Directory منتظر اولین دستور هستند.");
  const [activeMove, setActiveMove] = useState<Zone | null>(null);
  const nextId = useRef(4);

  const move = (from: Zone | Zone[], to: Zone, matcher?: (file: LabFile) => boolean) => {
    const sources = Array.isArray(from) ? from : [from];
    let moved = false;
    setFiles((current) => current.map((file) => {
      if (sources.includes(file.zone) && (!matcher || matcher(file))) { moved = true; return { ...file, zone: to }; }
      return file;
    }));
    setActiveMove(to);
    window.setTimeout(() => setActiveMove(null), 850);
    return moved;
  };

  const run = (input = command) => {
    const raw = normalizeCommand(input);
    if (!raw) return;
    let result = "این دستور وضعیت فایل‌های چهار در را تغییر نمی‌دهد، اما در تاریخچه ثبت شد.";
    if (/^touch\s+/.test(raw)) {
      const name = raw.split(" ")[1];
      setFiles((current) => [...current, { id: nextId.current++, name, zone: "working" }]);
      setActiveMove("working");
      result = `${name} در Working Directory ساخته شد.`;
    } else if (/^git add(?:\s+\. |\s+\.$)/.test(`${raw} `)) {
      move("working", "staging"); result = "همهٔ فایل‌های Working Directory وارد Staging Area شدند.";
    } else if (/^git add\s+/.test(raw)) {
      const name = raw.replace(/^git add\s+/, "");
      move("working", "staging", (file) => file.name === name); result = `${name} وارد Staging Area شد.`;
    } else if (/^git commit/.test(raw)) {
      move("staging", "local"); result = "فایل‌های staged در یک Commit داخل Local Repository ثبت شدند.";
    } else if (/^git push/.test(raw)) {
      move("local", "remote"); result = "Commitهای محلی به Remote Repository فرستاده شدند.";
    } else if (/^git (fetch|pull)/.test(raw)) {
      move("remote", raw.startsWith("git pull") ? "working" : "local");
      result = raw.startsWith("git pull") ? "اطلاعات Remote دریافت و در Working Directory ادغام شد." : "اطلاعات Remote بدون تغییر Working Directory به Local Repository رسید.";
    } else if (/^git reset --soft/.test(raw)) {
      move("local", "staging"); result = "HEAD عقب رفت و Snapshot قبلی به‌صورت staged باقی ماند.";
    } else if (/^git restore --staged/.test(raw) || /^git reset(?:\s+HEAD)?(?:\s+.+)?$/.test(raw)) {
      move("staging", "working"); result = "فایل‌ها از Stage خارج و به Working Directory برگشتند.";
    } else if (/^git restore\s+/.test(raw)) {
      result = "تغییر محلی فایل لغو شد؛ فایل همچنان در Working Directory است.";
    }
    setHistory((current) => [raw, ...current].slice(0, 8));
    setMessage(result);
    setCommand("");
    setScore((value) => value + 2);
  };

  const presets = ["git add app.js", "git add .", "git commit -m \"feat: snapshot\"", "git push -u origin main", "git fetch origin", "git pull", "git restore --staged app.js", "git reset --soft HEAD~1", "touch test.js"];
  const zones: { id: Zone; title: string; subtitle: string; color: string; icon: string }[] = [
    { id: "working", title: "WORKING DIRECTORY", subtitle: "فایل‌های در حال ویرایش", color: "cyan", icon: "01" },
    { id: "staging", title: "STAGING AREA", subtitle: "Snapshot بعدی", color: "amber", icon: "02" },
    { id: "local", title: "LOCAL REPOSITORY", subtitle: "Commitهای ثبت‌شده", color: "violet", icon: "03" },
    { id: "remote", title: "REMOTE REPOSITORY", subtitle: "تاریخچهٔ مشترک", color: "green", icon: "04" },
  ];

  return (
    <section className="page-section state-page">
      <SectionHead index="01" label="STATE PLAYGROUND" title="چهار در؛ یک مدل ذهنی واقعی" description="هر فایل دقیقاً در وضعیت مقصد می‌ماند تا دستور بعدی آن را جابه‌جا کند. از فرمان‌های آماده استفاده کن یا دستور خودت را در ترمینال بنویس." />
      <Guide eyebrow="راهنمای استفاده" title="دستور بزن و مسیر فایل را ببین" text="این محیط Git واقعی اجرا نمی‌کند؛ رفتار مفهومی دستورها را به‌صورت امن و دیداری شبیه‌سازی می‌کند." steps={["یک دستور آماده را انتخاب کن یا در Terminal بنویس.", "حرکت فایل را بین چهار در دنبال کن.", "توضیح دقیق اثر دستور را زیر Terminal بخوان."]} />
      <div className="portal-map">
        <div className="flow-label add-flow">git add →</div><div className="flow-label commit-flow">git commit →</div><div className="flow-label push-flow">git push →</div>
        {zones.map((zone) => (
          <article className={`portal portal-${zone.color} ${activeMove === zone.id ? "receiving" : ""}`} key={zone.id}>
            <div className="portal-number">{zone.icon}</div>
            <div className="portal-arch"><span className="arch-light" /><div className="portal-core">
              <div className="zone-files">
                {files.filter((file) => file.zone === zone.id).map((file) => <div className="file-token" key={file.id}><i>◇</i><b>{file.name}</b><span>{zone.id}</span></div>)}
                {!files.some((file) => file.zone === zone.id) && <p className="empty-zone">NO FILES YET</p>}
              </div>
            </div></div>
            <h3>{zone.title}</h3><p>{zone.subtitle}</p>
          </article>
        ))}
      </div>
      <div className="lab-console">
        <div className="console-main">
          <div className="console-bar"><span><i /> SAFE SIMULATION TERMINAL</span><b>{files.length} FILE OBJECTS</b></div>
          <form onSubmit={(event) => { event.preventDefault(); run(); }}><span>$</span><input dir="ltr" value={command} onChange={(event) => setCommand(event.target.value)} placeholder="type a Git command…" aria-label="Git command" /><button>RUN ↵</button></form>
          <div className="command-effect"><b>STATE EFFECT</b><p>{message}</p></div>
          <div className="preset-row"><span>SUGGESTED</span>{presets.map((preset) => <button onClick={() => run(preset)} key={preset}><code>{preset}</code></button>)}</div>
        </div>
        <aside><span>SESSION HISTORY</span>{history.length ? history.map((item, index) => <code key={`${item}-${index}`}>› {item}</code>) : <p>دستوری اجرا نشده است.</p>}<button onClick={() => { setFiles([{ id: 1, name: "app.js", zone: "working" }, { id: 2, name: "README.md", zone: "working" }, { id: 3, name: "style.css", zone: "working" }]); setHistory([]); setMessage("آزمایشگاه به وضعیت اولیه برگشت."); }}>RESET LAB</button></aside>
      </div>
    </section>
  );
}

function GraphTab() {
  const [graph, setGraph] = useState<GraphState>(initialGraph);
  const [scenarioId, setScenarioId] = useState(graphScenarios[0].id);
  const [executed, setExecuted] = useState(0);
  const [custom, setCustom] = useState("");
  const [zoom, setZoom] = useState(1);
  const scenario = graphScenarios.find((item) => item.id === scenarioId)!;
  const lanes = useMemo(() => Array.from(new Set(["main", ...graph.nodes.map((node) => node.branch), ...Object.keys(graph.branches)])), [graph]);
  const width = Math.max(1080, graph.nodes.length * 150 + 260);
  const height = Math.max(400, lanes.length * 112 + 150);
  const coords = (node: GraphNode) => ({ x: 120 + node.order * 145, y: 100 + lanes.indexOf(node.branch) * 112 });

  const reset = (newScenario = scenarioId) => { setGraph(initialGraph()); setExecuted(0); setScenarioId(newScenario); };
  const runCommand = (command: string) => setGraph((value) => executeGraphCommand(value, command));
  const runNext = () => {
    if (executed >= scenario.commands.length) return;
    runCommand(scenario.commands[executed]);
    setExecuted((value) => value + 1);
  };
  const buildAll = () => {
    let result = initialGraph();
    scenario.commands.forEach((command) => { result = executeGraphCommand(result, command); });
    setGraph(result); setExecuted(scenario.commands.length);
  };
  const submitCustom = (event: FormEvent) => { event.preventDefault(); runCommand(custom); setCustom(""); };

  return (
    <section className="page-section graph-page">
      <SectionHead index="02" label="INTERACTIVE HISTORY" title="BUILD A REAL GIT GRAPH" description="Branch بساز، روی هر شاخه چند Commit ثبت کن، بین شاخه‌ها جابه‌جا شو و نتیجهٔ Fast-forward، Three-way، Squash و Rebase را روی گراف ببین." />
      <Guide eyebrow="راهنمای استفاده" title="فرمان را اجرا کن و اثرش را روی تاریخچه بخوان" text="هر Node یک Commit و هر خط رابطهٔ Parent است. رنگ مسیر، branch سازندهٔ commit را نشان می‌دهد." steps={["یک سناریوی آماده انتخاب کن.", "مرحله‌به‌مرحله یا کامل اجرا کن.", "برای تاریخچه‌های بلند با Zoom و Scroll جزئیات را بررسی کن."]} />
      <div className="scenario-tabs">
        {graphScenarios.map((item, index) => <button className={scenarioId === item.id ? "active" : ""} onClick={() => reset(item.id)} key={item.id}><i>{String(index + 1).padStart(2, "0")}</i><span><b>{item.title}</b><small>{item.fa}</small></span><em>{item.commands.length} COMMANDS</em></button>)}
      </div>
      <div className="graph-workbench">
        <div className="graph-toolbar">
          <div><span>ACTIVE SCENARIO</span><h3>{scenario.title}</h3><p>{scenario.fa}</p></div>
          <div className="graph-actions"><button onClick={runNext} disabled={executed >= scenario.commands.length}>RUN NEXT →</button><button className="bright" onClick={buildAll}>BUILD COMPLETE GRAPH</button><button onClick={() => reset()}>RESET</button></div>
        </div>
        <div className="command-sequence">
          {scenario.commands.map((command, index) => <button className={index < executed ? "done" : index === executed ? "next" : ""} onClick={() => { if (index === executed) runNext(); }} key={`${command}-${index}`}><i>{index < executed ? "✓" : index + 1}</i><code>{command}</code></button>)}
        </div>
        <div className="graph-statusbar">
          <p>HEAD → <b>{graph.current}</b><span>{graph.nodes.length} COMMIT NODES</span><span>{Object.keys(graph.branches).length} BRANCHES</span></p>
          <div className="zoom-control"><span>GRAPH ZOOM</span><button onClick={() => setZoom((value) => Math.max(.65, +(value - .15).toFixed(2)))}>−</button><output>{Math.round(zoom * 100)}%</output><input type="range" min="65" max="180" value={zoom * 100} onChange={(event) => setZoom(+event.target.value / 100)} /><button onClick={() => setZoom((value) => Math.min(1.8, +(value + .15).toFixed(2)))}>+</button><button onClick={() => setZoom(1)}>100%</button></div>
        </div>
        <div className="graph-stage">
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: width * zoom, height: height * zoom, minWidth: width * zoom, minHeight: height * zoom }} aria-label="Git commit graph">
            <defs><filter id="glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
            {lanes.map((lane, index) => <g key={lane}><line className="lane-line" x1="60" x2={width - 40} y1={100 + index * 112} y2={100 + index * 112} /><text className="lane-name" x="50" y={76 + index * 112}>{lane}</text></g>)}
            {graph.nodes.flatMap((node) => node.parents.map((parentId) => {
              const parent = graph.nodes.find((item) => item.id === parentId); if (!parent) return null;
              const a = coords(parent); const b = coords(node);
              return <path className={`edge edge-${lanes.indexOf(node.branch) % 5}`} key={`${node.id}-${parentId}`} d={`M ${a.x} ${a.y} C ${a.x + 58} ${a.y}, ${b.x - 58} ${b.y}, ${b.x} ${b.y}`} />;
            }))}
            {graph.nodes.map((node) => { const point = coords(node); return <g className={`commit-node node-color-${lanes.indexOf(node.branch) % 5}`} transform={`translate(${point.x} ${point.y})`} key={node.id}><circle r="22" /><circle className="node-core" r="9" /><text className="node-hash" y="48">{node.id}</text><text className="node-message" y="68">{node.message.length > 22 ? `${node.message.slice(0, 21)}…` : node.message}</text></g>; })}
            {Object.entries(graph.branches).map(([branch, head]) => { const node = graph.nodes.find((item) => item.id === head); if (!node) return null; const point = coords(node); return <g className="branch-pointer" transform={`translate(${point.x - 2} ${point.y - 47})`} key={branch}><rect x="-46" y="-16" width="92" height="25" rx="4" /><text y="2">{graph.current === branch ? "HEAD → " : ""}{branch}</text></g>; })}
            {!graph.nodes.length && <g className="empty-graph"><circle cx="220" cy="100" r="23" /><text x="270" y="107">Run a commit command to create the first node</text></g>}
          </svg>
        </div>
        <form className="custom-graph-command" onSubmit={submitCustom}><label><span>CUSTOM GRAPH BUILDER</span><small>commit · switch -c · switch · merge · merge --no-ff · merge --squash · rebase</small></label><div><b>$</b><input dir="ltr" value={custom} onChange={(event) => setCustom(event.target.value)} placeholder={'git commit -m "your message"'} /><button>EXECUTE ↵</button></div></form>
      </div>
    </section>
  );
}

type QuizResult = { question: QuizQuestion; selected: number };

function QuizTab({ setScore, setCelebration }: { setScore: React.Dispatch<React.SetStateAction<number>>; setCelebration: (value: Celebration) => void }) {
  const [mode, setMode] = useState<"quiz" | "order">("quiz");
  return (
    <section className="page-section quiz-page">
      <SectionHead index="03" label="ASSESSMENT LAB" title="QUIZ & COMMAND ORDER" description="دانش مفهومی را با آزمون بسنج یا دستورهای یک سناریوی واقعی را به ترتیب اجرایی درست بچین. هر دو مسیر امتیاز، جشن و بازخورد آموزشی دارند." />
      <div className="mode-switch"><button className={mode === "quiz" ? "active" : ""} onClick={() => setMode("quiz")}><i>01</i><span><b>LEVELLED QUIZ</b><small>آزمون تصادفی و سطح‌بندی‌شده</small></span></button><button className={mode === "order" ? "active" : ""} onClick={() => setMode("order")}><i>02</i><span><b>PUT COMMANDS IN ORDER</b><small>۲۰ مأموریت اجرایی واقعی</small></span></button></div>
      {mode === "quiz" ? <QuizMode setScore={setScore} setCelebration={setCelebration} /> : <OrderMode setScore={setScore} setCelebration={setCelebration} />}
    </section>
  );
}

function QuizMode({ setScore, setCelebration }: { setScore: React.Dispatch<React.SetStateAction<number>>; setCelebration: (value: Celebration) => void }) {
  const [module, setModule] = useState(1);
  const [level, setLevel] = useState<Level | "all">("all");
  const pool = useMemo(() => quizQuestions.filter((item) => item.module === module && (level === "all" || item.level === level)), [module, level]);
  const [count, setCount] = useState(10);
  const [session, setSession] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [complete, setComplete] = useState(false);
  const maxCount = pool.length;
  const safeCount = Math.min(count, maxCount);

  const begin = () => { setSession(shuffle(pool).slice(0, safeCount)); setIndex(0); setSelected(null); setResults([]); setComplete(false); };
  const answer = (option: number) => { if (selected !== null) return; setSelected(option); };
  const next = () => {
    if (selected === null) return;
    const updated = [...results, { question: session[index], selected }];
    setResults(updated);
    if (index + 1 >= session.length) {
      const correct = updated.filter((item) => item.selected === item.question.answer).length;
      const xp = correct * 10;
      setScore((value) => value + xp); setComplete(true);
      setCelebration({ title: "آزمون تمام شد!", xp, subtitle: `${correct} پاسخ درست از ${updated.length} سؤال؛ گزارش دقیق اشتباهات پایین صفحه آماده است.` });
    } else { setIndex((value) => value + 1); setSelected(null); }
  };
  const mistakes = results.filter((item) => item.selected !== item.question.answer);
  const topics = Array.from(new Set(mistakes.map((item) => item.question.topic)));

  if (!session.length) return (
    <div className="quiz-setup">
      <Guide eyebrow="تنظیم آزمون" title="فصل، سطح و تعداد را خودت انتخاب کن" text="هر بار سؤال‌ها از بانک همان فصل به‌صورت تصادفی انتخاب می‌شوند. بیشینهٔ تعداد با فیلتر انتخابی هماهنگ است." steps={["یکی از شش فصل را انتخاب کن.", "سطح مناسب را مشخص کن.", "تعداد دلخواه را تا سقف بانک سؤال تعیین و شروع کن."]} />
      <div className="module-grid">{modules.map((item) => <button className={module === item.id ? "active" : ""} onClick={() => { setModule(item.id); setCount(10); }} key={item.id}><i>{String(item.id).padStart(2, "0")}</i><span><b>{item.en}</b><strong>{item.title}</strong><small>{item.description}</small></span><em>15 Q</em></button>)}</div>
      <div className="quiz-controls">
        <div><label>QUESTION LEVEL</label><div className="segmented">{(["all", "beginner", "intermediate", "challenge"] as const).map((item) => <button className={level === item ? "active" : ""} onClick={() => { setLevel(item); setCount(10); }} key={item}>{item.toUpperCase()}</button>)}</div></div>
        <div className="count-control"><label>YOUR QUESTION COUNT <b>{safeCount}</b> / {maxCount}</label><input type="range" min="1" max={Math.max(1, maxCount)} value={safeCount || 1} onChange={(event) => setCount(+event.target.value)} /><div><button onClick={() => setCount(Math.min(5, maxCount))}>5</button><button onClick={() => setCount(Math.min(10, maxCount))}>10</button><button onClick={() => setCount(maxCount)}>MAX · {maxCount}</button></div></div>
        <button className="start-quiz" disabled={!maxCount} onClick={begin}>GENERATE RANDOM QUIZ <span>→</span></button>
      </div>
    </div>
  );

  if (complete) {
    const correct = results.length - mistakes.length;
    const percent = Math.round((correct / results.length) * 100);
    return (
      <div className="result-report">
        <div className="result-hero"><span>SESSION COMPLETE</span><h2>{percent}%</h2><strong>{correct} درست از {results.length} سؤال</strong><div className="result-bar"><i style={{ width: `${percent}%` }} /></div><button onClick={() => setSession([])}>BUILD ANOTHER QUIZ</button></div>
        <div className="practice-card"><span>NEXT PRACTICE</span><h3>{mistakes.length ? "این موضوع‌ها را بیشتر تمرین کن" : "عالی بود؛ آمادهٔ سطح بعدی هستی"}</h3><div>{topics.length ? topics.map((topic) => <b key={topic}>{topic}</b>) : <b>NO WEAK TOPICS</b>}</div></div>
        <div className="mistake-list"><h3>ANSWER REVIEW <span>{mistakes.length} اشتباه</span></h3>{mistakes.length ? mistakes.map((item, mistakeIndex) => <article key={item.question.id}><i>{String(mistakeIndex + 1).padStart(2, "0")}</i><div><h4>{item.question.prompt}</h4><p className="wrong">پاسخ شما: {item.question.options[item.selected]}</p><p className="correct">پاسخ درست: {item.question.options[item.question.answer]}</p><small>{item.question.explanation}</small></div></article>) : <div className="perfect">همهٔ جواب‌ها درست بود. هیچ اشتباهی برای مرور وجود ندارد.</div>}</div>
      </div>
    );
  }

  const question = session[index];
  return (
    <div className="question-stage">
      <div className="question-progress"><span>QUESTION {index + 1} / {session.length}</span><div><i style={{ width: `${((index + 1) / session.length) * 100}%` }} /></div><b>{question.level.toUpperCase()}</b></div>
      <article className="question-card"><div className="question-meta"><span>MODULE {String(question.module).padStart(2, "0")}</span><b>{question.topic}</b></div><h2>{question.prompt}</h2><div className="options">{question.options.map((option, optionIndex) => <button className={selected === null ? "" : optionIndex === question.answer ? "correct" : optionIndex === selected ? "wrong" : "muted"} onClick={() => answer(optionIndex)} key={option}><i>{String.fromCharCode(65 + optionIndex)}</i><span dir="auto">{option}</span></button>)}</div>{selected !== null && <div className={`answer-feedback ${selected === question.answer ? "ok" : "bad"}`}><strong>{selected === question.answer ? "درست گفتی!" : "این پاسخ درست نیست."}</strong><p>{question.explanation}</p></div>}<button className="next-question" disabled={selected === null} onClick={next}>{index + 1 === session.length ? "FINISH & SHOW REPORT" : "NEXT QUESTION"} →</button></article>
    </div>
  );
}

function OrderMode({ setScore, setCelebration }: { setScore: React.Dispatch<React.SetStateAction<number>>; setCelebration: (value: Celebration) => void }) {
  const [missionId, setMissionId] = useState(1);
  const mission = missions.find((item) => item.id === missionId)!;
  const [ordered, setOrdered] = useState<string[]>(() => shuffle(mission.steps));
  const [result, setResult] = useState<"idle" | "correct" | "wrong">("idle");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const choose = (id: number) => { const next = missions.find((item) => item.id === id)!; setMissionId(id); setOrdered(shuffle(next.steps)); setResult("idle"); };
  const move = (from: number, to: number) => { setOrdered((items) => { const next = [...items]; const [picked] = next.splice(from, 1); next.splice(to, 0, picked); return next; }); setResult("idle"); };
  const check = () => {
    const correct = equivalentOrder(ordered, mission);
    setResult(correct ? "correct" : "wrong");
    if (correct) { const xp = mission.level === "challenge" ? 80 : mission.level === "intermediate" ? 55 : 35; setScore((value) => value + xp); setCelebration({ title: "ترتیب دستورها درست است!", xp, subtitle: `مأموریت «${mission.title}» با موفقیت کامل شد.` }); }
  };

  return (
    <div className="order-lab">
      <Guide eyebrow="راهنمای مأموریت" title="دستورهای به‌هم‌ریخته را به جریان اجرایی تبدیل کن" text="شمارهٔ کنار هر دستور جای فعلی آن است. کارت‌ها را Drag کن یا با فلش‌ها جابه‌جا کن، سپس پاسخ را بررسی کن." steps={["سطح و مأموریت را انتخاب کن.", "فقط دستورهای ضروری را مرتب کن.", "پاسخ را بررسی و ترتیب مرجع را مطالعه کن."]} />
      <div className="mission-filter">{(["beginner", "intermediate", "challenge"] as Level[]).map((level) => <div key={level}><span>{level.toUpperCase()}</span>{missions.filter((item) => item.level === level).map((item) => <button className={missionId === item.id ? "active" : ""} onClick={() => choose(item.id)} key={item.id}>{String(item.id).padStart(2, "0")}</button>)}</div>)}</div>
      <div className="mission-card">
        <div className="mission-prompt"><div><span>MISSION {String(mission.id).padStart(2, "0")} · {mission.level.toUpperCase()}</span><h2>{mission.title}</h2><p>{mission.prompt}</p></div><aside><b>HINT</b><p>{mission.hint}</p></aside></div>
        <div className="sortable-list">{ordered.map((command, index) => <div draggable onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragIndex !== null) move(dragIndex, index); setDragIndex(null); }} className={dragIndex === index ? "dragging" : ""} key={`${command}-${index}`}><i>{String(index + 1).padStart(2, "0")}</i><span>⠿</span><code>{command}</code><nav><button disabled={index === 0} onClick={() => move(index, index - 1)}>↑</button><button disabled={index === ordered.length - 1} onClick={() => move(index, index + 1)}>↓</button></nav></div>)}</div>
        <div className="mission-actions"><button onClick={() => { setOrdered(shuffle(mission.steps)); setResult("idle"); }}>SHUFFLE ↻</button><button className="check-order" onClick={check}>CHECK ORDER →</button></div>
        {result !== "idle" && <div className={`order-result ${result}`}><strong>{result === "correct" ? "ترتیب درست است؛ آفرین!" : "هنوز ترتیب اجرای دستورها درست نیست."}</strong><p>{result === "correct" ? "جریان کامل شد. ترتیب مرجع را برای تثبیت مدل ذهنی مرور کن." : "ترتیب مرجع را ببین، دلیل تقدم هر مرحله را بررسی کن و دوباره بچین."}</p><div className="reference-answer"><span>CORRECT REFERENCE</span>{mission.steps.map((step, index) => <code key={step}><i>{index + 1}</i>{step}</code>)}</div></div>}
      </div>
    </div>
  );
}

function RoadmapTab({ openTab }: { openTab: (tab: Tab) => void }) {
  return (
    <section className="page-section roadmap-page">
      <SectionHead index="04" label="WORKSHOP PATH" title="نقشهٔ راه Git و GitHub" description="از مبانی و کار محلی شروع کن، بعد تاریخچهٔ شاخه‌ها و Remote را بفهم و در پایان وارد همکاری تیمی و اتوماسیون شو." />
      <Guide eyebrow="نحوهٔ استفاده" title="هر ایستگاه را یاد بگیر، تمرین کن و بسنج" text="ترتیب فصل‌ها عمدی است. تا زمانی که State محلی را نفهمیده‌ای، Merge و Remote فقط مجموعه‌ای از دستورهای حفظی می‌مانند." steps={["مفهوم‌ها را در مسیر فصل بخوان.", "همان فصل را در State Lab یا Graph تمرین کن.", "آزمون ۱۵ سؤالی فصل را کامل کن."]} />
      <div className="roadmap-track">
        {modules.map((item, index) => <article key={item.id}><div className="road-index">{String(item.id).padStart(2, "0")}</div><div className="road-node"><img src="/bugcharm-logo.png" alt="" /></div><div className="road-copy"><span>{item.en}</span><h2>{item.title}</h2><p>{item.description}</p><button onClick={() => openTab(index < 2 ? "playground" : index === 2 ? "graph" : "quiz")}>OPEN PRACTICE →</button></div></article>)}
      </div>
      <div className="outcomes"><span>COURSE OUTCOMES</span><div><article><b>01</b><h3>تسلط عملی بر Git</h3><p>به‌جای حفظ دستور، تغییر State را پیش‌بینی می‌کنی.</p></article><article><b>02</b><h3>تاریخچهٔ حرفه‌ای</h3><p>Branch، Merge و Rebase را آگاهانه انتخاب می‌کنی.</p></article><article><b>03</b><h3>همکاری در GitHub</h3><p>PR، Review و Conflict را در جریان تیمی مدیریت می‌کنی.</p></article><article><b>04</b><h3>آمادگی پروژهٔ واقعی</h3><p>Workflow تست، Build و Publish را می‌سازی.</p></article></div></div>
    </section>
  );
}

function ReferenceTab() {
  const [query, setQuery] = useState("");
  const filtered = commandGroups.map((group) => ({ ...group, commands: group.commands.filter(([command, description]) => `${command} ${description}`.toLowerCase().includes(query.toLowerCase())) })).filter((group) => group.commands.length);
  const [copied, setCopied] = useState("");
  const copy = async (command: string) => { await navigator.clipboard.writeText(command); setCopied(command); window.setTimeout(() => setCopied(""), 1200); };
  return (
    <section className="page-section reference-page">
      <SectionHead index="05" label="COMMAND REFERENCE" title="مرجع قابل کپی دستورات دوره" description="دستور را جست‌وجو کن، اثر دقیقش را بخوان و با یک کلیک کپی کن. دستورهای خطرناک با هشدار روشن مشخص شده‌اند." />
      <Guide eyebrow="راهنمای مرجع" title="از دستور به مدل ذهنی برس" text="قبل از اجرا وضعیت فعلی را با git status بررسی کن. به‌خصوص reset --hard و force push را فقط وقتی اثرشان را دقیق می‌دانی اجرا کن." steps={["نام یا کاربرد دستور را جست‌وجو کن.", "توضیح فارسی و Syntax را بخوان.", "کپی کن و در Repository آزمایشی اجرا کن."]} />
      <label className="command-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search commands or Persian descriptions…" /></label>
      <div className="command-groups">{filtered.map((group, groupIndex) => <article key={group.title}><header><i>{String(groupIndex + 1).padStart(2, "0")}</i><div><span>{group.title}</span><p>{group.description}</p></div><b>{group.commands.length} COMMANDS</b></header><div>{group.commands.map(([command, description]) => <div className={command.includes("--hard") || command.includes("force") ? "danger-command" : ""} key={command}><section><code dir="ltr">{command}</code>{(command.includes("--hard") || command.includes("force")) && <em>CAUTION</em>}<p>{description}</p></section><button onClick={() => copy(command)}>{copied === command ? "COPIED ✓" : "COPY"}</button></div>)}</div></article>)}</div>
    </section>
  );
}
