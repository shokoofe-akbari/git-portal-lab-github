import { type FormEvent, useMemo, useState } from "react";
import { commandReferences } from "./data";
import { graphScenarios } from "./graphData";
import { orderMissions, type MissionLevel } from "./missionData";
import { quizModules } from "./quizData";

type CommitKind = "commit" | "merge" | "squash" | "rebase";

type GraphNode = {
  id: string;
  message: string;
  branch: string;
  parents: string[];
  kind: CommitKind;
};

type GraphState = {
  nodes: GraphNode[];
  branches: string[];
  heads: Record<string, string | null>;
  currentBranch: string;
  serial: number;
  notice: string;
};

const emptyGraph = (): GraphState => ({
  nodes: [],
  branches: ["main"],
  heads: { main: null },
  currentBranch: "main",
  serial: 1,
  notice: "Graph is empty — execute the first Commit command.",
});

const graphColors = ["#62f59b", "#52cfff", "#bd73ff", "#ffc453", "#ff7c79", "#58e5d4"];

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function hashFromSerial(serial: number) {
  return (0x8d21a0 + serial * 0x91f3).toString(16).slice(-7).padStart(7, "0");
}

function isAncestor(ancestor: string | null, descendant: string | null, nodes: GraphNode[]) {
  if (!ancestor || !descendant) return false;
  const stack = [descendant];
  const visited = new Set<string>();
  while (stack.length) {
    const id = stack.pop()!;
    if (id === ancestor) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodes.find((item) => item.id === id);
    if (node) stack.push(...node.parents);
  }
  return false;
}

function nearestCommonAncestor(first: string | null, second: string | null, nodes: GraphNode[]) {
  if (!first || !second) return null;
  const firstAncestors = new Set<string>();
  const stack = [first];
  while (stack.length) {
    const id = stack.pop()!;
    if (firstAncestors.has(id)) continue;
    firstAncestors.add(id);
    const node = nodes.find((item) => item.id === id);
    if (node) stack.push(...node.parents);
  }
  let cursor: string | null = second;
  while (cursor) {
    if (firstAncestors.has(cursor)) return cursor;
    cursor = nodes.find((item) => item.id === cursor)?.parents[0] ?? null;
  }
  return null;
}

function applyGraphCommand(source: GraphState, rawCommand: string): GraphState {
  const command = rawCommand.trim().replace(/\s+/g, " ");
  const nodes = [...source.nodes];
  const branches = [...source.branches];
  const heads = { ...source.heads };
  let currentBranch = source.currentBranch;
  let serial = source.serial;
  let notice = "";

  const createNode = (message: string, branch: string, parents: string[], kind: CommitKind) => {
    const node: GraphNode = {
      id: hashFromSerial(serial),
      message,
      branch,
      parents: unique(parents.filter(Boolean)),
      kind,
    };
    serial += 1;
    nodes.push(node);
    heads[branch] = node.id;
    return node;
  };

  const commitMatch = command.match(/^git commit -m ["'](.+)["']$/);
  if (commitMatch) {
    const parent = heads[currentBranch];
    const node = createNode(commitMatch[1], currentBranch, parent ? [parent] : [], "commit");
    notice = `COMMIT ${node.id} created on ${currentBranch}.`;
  } else if (/^git switch -c /.test(command)) {
    const branch = command.slice("git switch -c ".length).trim();
    if (branches.includes(branch)) {
      notice = `Branch ${branch} already exists.`;
    } else {
      branches.push(branch);
      heads[branch] = heads[currentBranch] ?? null;
      currentBranch = branch;
      notice = `New pointer ${branch} created at current HEAD.`;
    }
  } else if (/^git switch /.test(command)) {
    const branch = command.slice("git switch ".length).trim();
    if (!branches.includes(branch)) {
      notice = `Branch ${branch} does not exist.`;
    } else {
      currentBranch = branch;
      notice = `HEAD switched to ${branch}.`;
    }
  } else if (/^git merge /.test(command)) {
    const squash = command.includes("--squash");
    const noFastForward = command.includes("--no-ff");
    const target = command.replace(/^git merge(?: --squash| --no-ff)? /, "").trim();
    const currentHead = heads[currentBranch];
    const targetHead = heads[target];

    if (!branches.includes(target) || target === currentBranch || !targetHead) {
      notice = "Choose another Branch with at least one Commit.";
    } else if (squash) {
      const node = createNode(`squash: ${target}`, currentBranch, currentHead ? [currentHead] : [], "squash");
      notice = `SQUASH ${node.id}: combined ${target} changes into one single-parent Commit.`;
    } else if (noFastForward) {
      const node = createNode(`merge ${target}`, currentBranch, [currentHead, targetHead].filter(Boolean) as string[], "merge");
      notice = `NO-FF MERGE ${node.id}: two-parent node created.`;
    } else if (!currentHead || isAncestor(currentHead, targetHead, nodes)) {
      heads[currentBranch] = targetHead;
      notice = `FAST-FORWARD: ${currentBranch} pointer moved to ${targetHead}; no node created.`;
    } else if (isAncestor(targetHead, currentHead, nodes)) {
      notice = `${currentBranch} already contains ${target}. No node was needed.`;
    } else {
      const node = createNode(`merge ${target}`, currentBranch, [currentHead, targetHead], "merge");
      notice = `THREE-WAY MERGE ${node.id}: diverged histories joined with two parents.`;
    }
  } else if (/^git rebase /.test(command)) {
    const target = command.slice("git rebase ".length).trim();
    const currentHead = heads[currentBranch];
    const targetHead = heads[target];
    if (!targetHead || !currentHead || target === currentBranch) {
      notice = "Rebase needs another Branch with a valid HEAD.";
    } else {
      const base = nearestCommonAncestor(currentHead, targetHead, nodes);
      const uniqueNodes: GraphNode[] = [];
      let cursor: string | null = currentHead;
      while (cursor && cursor !== base) {
        const node = nodes.find((item) => item.id === cursor);
        if (!node) break;
        uniqueNodes.push(node);
        cursor = node.parents[0] ?? null;
      }
      let replayParent = targetHead;
      for (const oldNode of uniqueNodes.reverse()) {
        const replayed = createNode(oldNode.message, currentBranch, [replayParent], "rebase");
        replayParent = replayed.id;
      }
      heads[currentBranch] = replayParent;
      notice = `REBASE: ${uniqueNodes.length} Commit(s) replayed on ${target} with new hashes.`;
    }
  } else {
    notice = `Unsupported graph command: ${command}`;
  }

  return { nodes, branches, heads, currentBranch, serial, notice };
}

function buildCompleteScenario(commands: string[]) {
  return commands.reduce((state, command) => applyGraphCommand(state, command), emptyGraph());
}

function scrambledCommands(commands: string[], seed: number) {
  const result = [...commands];
  let value = seed * 997 + 31;
  for (let index = result.length - 1; index > 0; index -= 1) {
    value = (value * 9301 + 49297) % 233280;
    const target = value % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  if (result.every((item, index) => item === commands[index]) && result.length > 1) {
    result.push(result.shift()!);
  }
  return result;
}

function UsageGuide({ title, items }: { title: string; items: Array<{ title: string; text: string }> }) {
  return (
    <aside className="usage-guide" lang="fa" dir="rtl">
      <header className="fa"><span>راهنمای استفاده</span><b>{title}</b></header>
      <div>
        {items.map((item, index) => (
          <article key={item.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div className="fa"><b>{item.title}</b><p>{item.text}</p></div>
          </article>
        ))}
      </div>
    </aside>
  );
}

export default function App() {
  const [score, setScore] = useState(0);
  const [copied, setCopied] = useState("");
  const [referenceGroup, setReferenceGroup] = useState("ALL");
  const [referenceQuery, setReferenceQuery] = useState("");

  const [graphScenarioIndex, setGraphScenarioIndex] = useState(0);
  const [graphStep, setGraphStep] = useState(0);
  const [graph, setGraph] = useState<GraphState>(emptyGraph);
  const [commitMessage, setCommitMessage] = useState("work in progress");
  const [newBranchName, setNewBranchName] = useState("feature/new-flow");
  const [mergeTarget, setMergeTarget] = useState("main");

  const [quizModuleIndex, setQuizModuleIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizPoints, setQuizPoints] = useState(0);

  const [missionLevel, setMissionLevel] = useState<"ALL" | MissionLevel>("ALL");
  const [missionIndex, setMissionIndex] = useState(0);
  const [missionOrder, setMissionOrder] = useState<string[]>([]);
  const [missionFeedback, setMissionFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);

  const activeGraphScenario = graphScenarios[graphScenarioIndex];
  const activeQuizModule = quizModules[quizModuleIndex];
  const activeQuizQuestions = activeQuizModule.questions;
  const activeQuizQuestion = activeQuizQuestions[quizIndex];
  const activeMission = orderMissions[missionIndex];
  const mixedMissionCommands = useMemo(
    () => scrambledCommands(activeMission.commands, missionIndex + 1),
    [activeMission, missionIndex],
  );

  const graphBranches = unique(["main", ...graph.branches, ...graph.nodes.map((node) => node.branch)]);
  const graphColor = (branch: string) => graphColors[graphBranches.indexOf(branch) % graphColors.length];
  const graphX = (index: number) => 140 + index * 210;
  const graphY = (branch: string) => 115 + graphBranches.indexOf(branch) * 135;
  const graphWidth = Math.max(1180, graph.nodes.length * 210 + 360);
  const graphHeight = Math.max(500, graphBranches.length * 135 + 150);
  const mergeTargets = graph.branches.filter((branch) => branch !== graph.currentBranch && graph.heads[branch]);
  const resolvedMergeTarget = mergeTargets.includes(mergeTarget) ? mergeTarget : mergeTargets[0] ?? "";

  const filteredReferences = useMemo(() => {
    const query = referenceQuery.trim().toLowerCase();
    return commandReferences.filter((item) => {
      const groupMatch = referenceGroup === "ALL" || item.group === referenceGroup;
      const textMatch = !query || `${item.command} ${item.titleFa} ${item.explanationFa}`.toLowerCase().includes(query);
      return groupMatch && textMatch;
    });
  }, [referenceGroup, referenceQuery]);

  const filteredMissions = orderMissions.filter((mission) => missionLevel === "ALL" || mission.level === missionLevel);

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(""), 1200);
  };

  const selectGraphScenario = (index: number) => {
    setGraphScenarioIndex(index);
    setGraphStep(0);
    setGraph(emptyGraph());
  };

  const runGraphCommand = (command: string, guided = false) => {
    setGraph((current) => applyGraphCommand(current, command));
    if (guided) setGraphStep((current) => Math.min(current + 1, activeGraphScenario.commands.length));
  };

  const runCompleteGraph = () => {
    setGraph(buildCompleteScenario(activeGraphScenario.commands));
    setGraphStep(activeGraphScenario.commands.length);
  };

  const commitToGraph = (event: FormEvent) => {
    event.preventDefault();
    const message = commitMessage.trim();
    if (!message) return;
    runGraphCommand(`git commit -m "${message}"`);
  };

  const createGraphBranch = (event: FormEvent) => {
    event.preventDefault();
    const branch = newBranchName.trim().replace(/\s+/g, "-");
    if (!branch) return;
    runGraphCommand(`git switch -c ${branch}`);
  };

  const answerQuiz = (index: number) => {
    if (quizAnswer !== null) return;
    setQuizAnswer(index);
    if (index === activeQuizQuestion.answer) {
      setQuizPoints((current) => current + 1);
      setScore((current) => current + 25);
    }
  };

  const nextQuiz = () => {
    if (quizIndex === activeQuizQuestions.length - 1) {
      setQuizIndex(0);
      setQuizPoints(0);
    } else {
      setQuizIndex((current) => current + 1);
    }
    setQuizAnswer(null);
  };

  const selectQuizModule = (index: number) => {
    setQuizModuleIndex(index);
    setQuizIndex(0);
    setQuizAnswer(null);
    setQuizPoints(0);
  };

  const selectMission = (index: number) => {
    setMissionIndex(index);
    setMissionOrder([]);
    setMissionFeedback("idle");
  };

  const filterMissionLevel = (level: "ALL" | MissionLevel) => {
    setMissionLevel(level);
    if (level !== "ALL" && activeMission.level !== level) {
      const firstMatch = orderMissions.findIndex((mission) => mission.level === level);
      if (firstMatch >= 0) selectMission(firstMatch);
    }
  };

  const addMissionCommand = (command: string) => {
    if (missionOrder.includes(command)) return;
    setMissionOrder((current) => [...current, command]);
    setMissionFeedback("idle");
  };

  const removeMissionCommand = (command: string) => {
    setMissionOrder((current) => current.filter((item) => item !== command));
    setMissionFeedback("idle");
  };

  const moveMissionCommand = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= missionOrder.length) return;
    setMissionOrder((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setMissionFeedback("idle");
  };

  const checkMission = () => {
    const correct = activeMission.commands.every((command, index) => missionOrder[index] === command);
    setMissionFeedback(correct ? "correct" : "wrong");
    if (correct && !completedMissions.includes(activeMission.id)) {
      setCompletedMissions((current) => [...current, activeMission.id]);
      setScore((current) => current + (activeMission.level === "ADVANCED" ? 180 : activeMission.level === "INTERMEDIATE" ? 120 : 80));
    }
  };

  return (
    <main className="app-shell" dir="ltr">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Git State Lab home">
          <span className="brand-cube">G</span>
          <span><b>GIT STATE LAB</b><small>Workshop by Shokoufeh Akbari</small></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#graph">GRAPH</a>
          <a href="#quiz">QUIZ</a>
          <a href="#ordering">CHALLENGES</a>
          <a href="#reference">REFERENCE</a>
        </nav>
        <div className="score"><span>XP</span><b>{score}</b></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-image" />
        <svg className="hero-graph-art" viewBox="0 0 1600 900" aria-hidden="true">
          <path d="M 690 445 C 820 445, 880 445, 990 445 S 1190 445, 1470 445" />
          <path className="feature" d="M 880 445 C 940 445, 930 275, 1030 275 S 1230 275, 1305 445" />
          <path className="release" d="M 1060 445 C 1120 445, 1120 625, 1220 625 S 1350 625, 1410 445" />
          {[720, 840, 970, 1100, 1305, 1450].map((x) => <circle className="main-node" cx={x} cy="445" key={`main-${x}`} r="11" />)}
          {[960, 1070, 1180].map((x) => <circle className="feature-node" cx={x} cy="275" key={`feature-${x}`} r="11" />)}
          {[1160, 1260, 1360].map((x) => <circle className="release-node" cx={x} cy="625" key={`release-${x}`} r="11" />)}
          <g className="hero-pointer" transform="translate(1360 398)"><rect width="150" height="32" rx="7" /><text x="75" y="21">main • HEAD</text></g>
          <g className="hero-pointer feature-label" transform="translate(1060 215)"><rect width="160" height="32" rx="7" /><text x="80" y="21">feature/auth</text></g>
          <g className="hero-pointer release-label" transform="translate(1190 675)"><rect width="140" height="32" rx="7" /><text x="70" y="21">release/2.0</text></g>
        </svg>
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-panel">
            <p className="eyebrow">INTERACTIVE GIT & GITHUB WORKSHOP</p>
            <h1>BUILD A CLEAR<br /><span>GIT MENTAL MODEL.</span></h1>
            <p className="hero-fa fa" lang="fa" dir="rtl">تاریخچه را بساز، تصمیم هر دستور را ببین و با آزمون‌ها و چالش‌های عملی برای کار تیمی واقعی آماده شو.</p>
            <div className="instructor-tag"><span>INSTRUCTOR</span><b className="fa" lang="fa" dir="rtl">شکوفه اکبری</b></div>
            <div className="hero-actions">
              <a className="button primary" href="#graph">OPEN GRAPH LAB <span>↓</span></a>
              <a className="button secondary" href="#quiz">CHOOSE A QUIZ</a>
            </div>
            <div className="hero-metrics">
              <div><b>5</b><span>GRAPH FLOWS</span></div>
              <div><b>6</b><span>QUIZ TOPICS</span></div>
              <div><b>20</b><span>ORDERING CHALLENGES</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="graph-section section" id="graph">
        <div className="section-title">
          <div><span>01 / INTERACTIVE HISTORY</span><h2>BUILD A REAL GIT GRAPH</h2></div>
          <p className="fa" lang="fa" dir="rtl">یک جریان آماده را انتخاب کن یا با ابزار Custom Build تاریخچهٔ خودت را بساز. هر Commit، Branch، Switch، Merge و Rebase مستقیماً روی Graph اعمال می‌شود.</p>
        </div>
        <UsageGuide
          title="فرمان را اجرا کن و اثرش را روی تاریخچه بخوان"
          items={[
            { title: "نوع تاریخچه را انتخاب کن", text: "سناریوهای واقعی، Fast-forward، Three-way، Squash و Rebase تفاوت شکل تاریخچه را نشان می‌دهند." },
            { title: "فرمان‌ها را قدم‌به‌قدم اجرا کن", text: "فقط فرمان روشن فعال است. با اجرای آن، Node یا Pointer مربوط همان لحظه روی Graph ساخته می‌شود." },
            { title: "تاریخچهٔ شخصی بساز", text: "در Custom Build پیام Commit و نام Branch را وارد کن، بین شاخه‌ها جابه‌جا شو و Merge دلخواهت را آزمایش کن." },
          ]}
        />

        <div className="graph-scenarios" role="tablist" aria-label="Graph scenarios">
          {graphScenarios.map((scenario, index) => (
            <button className={graphScenarioIndex === index ? "active" : ""} key={scenario.id} onClick={() => selectGraphScenario(index)} role="tab" type="button">
              <span>{String(index + 1).padStart(2, "0")}</span><div><b>{scenario.label}</b><strong className="fa" lang="fa" dir="rtl">{scenario.titleFa}</strong></div><i>{scenario.commands.length} COMMANDS</i>
            </button>
          ))}
        </div>

        <article className="graph-brief">
          <div><span>{activeGraphScenario.label}</span><b>{activeGraphScenario.concept}</b></div>
          <p className="fa" lang="fa" dir="rtl">{activeGraphScenario.descriptionFa}</p>
          <button onClick={runCompleteGraph} type="button">BUILD COMPLETE GRAPH</button>
        </article>

        <div className="graph-command-track">
          {activeGraphScenario.commands.map((command, index) => {
            const done = index < graphStep;
            const current = index === graphStep;
            return (
              <button className={done ? "done" : current ? "current" : "locked"} disabled={!current} key={`${command}-${index}`} onClick={() => runGraphCommand(command, true)} type="button">
                <span>{done ? "✓" : String(index + 1).padStart(2, "0")}</span><code>{command}</code>
              </button>
            );
          })}
        </div>

        <div className="graph-statusbar">
          <span>HEAD → <b>{graph.currentBranch}</b></span><span><b>{graph.nodes.length}</b> COMMIT NODES</span><p>{graph.notice}</p><button onClick={() => { setGraph(emptyGraph()); setGraphStep(0); }} type="button">RESET GRAPH</button>
        </div>

        <div className="graph-stage graph-stage-v2">
          <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} role="img" aria-label="Interactive Git commit graph">
            {graphBranches.map((branch) => (
              <g className="graph-lane" key={branch}>
                <line stroke={graphColor(branch)} strokeDasharray="4 12" strokeOpacity=".14" x1="92" x2={graphWidth - 70} y1={graphY(branch)} y2={graphY(branch)} />
                <text fill={graphColor(branch)} x="22" y={graphY(branch) + 4}>{branch}</text>
              </g>
            ))}
            {graph.nodes.flatMap((node, index) => node.parents.map((parentId) => {
              const parentIndex = graph.nodes.findIndex((item) => item.id === parentId);
              if (parentIndex < 0) return null;
              const parent = graph.nodes[parentIndex];
              const parentX = graphX(parentIndex);
              const childX = graphX(index);
              const parentY = graphY(parent.branch);
              const childY = graphY(node.branch);
              return <path d={`M ${parentX} ${parentY} C ${parentX + 70} ${parentY}, ${childX - 70} ${childY}, ${childX} ${childY}`} fill="none" key={`${parentId}-${node.id}`} stroke={graphColor(node.branch)} strokeOpacity=".76" strokeWidth={node.kind === "merge" ? 4 : 3} />;
            }))}
            {graph.nodes.map((node, index) => {
              const x = graphX(index);
              const y = graphY(node.branch);
              const color = graphColor(node.branch);
              const pointers = graphBranches.filter((branch) => graph.heads[branch] === node.id);
              const currentHead = graph.heads[graph.currentBranch] === node.id;
              return (
                <g key={node.id}>
                  {currentHead && <circle cx={x} cy={y} fill="none" r="27" stroke={color} strokeDasharray="4 5" strokeWidth="2" />}
                  <circle cx={x} cy={y} fill="#07120f" r={node.kind === "merge" ? 14 : 11} stroke={color} strokeWidth="5" />
                  <text className="graph-message" fill="#effaf4" textAnchor="middle" x={x} y={y + 49}>{node.message}</text>
                  <text className="graph-hash" fill="#778e84" textAnchor="middle" x={x} y={y + 69}>{node.id} • {node.kind.toUpperCase()}</text>
                  {pointers.map((branch, pointerIndex) => {
                    const width = Math.max(90, branch.length * 8 + (branch === graph.currentBranch ? 52 : 22));
                    return (
                      <g className="graph-pointer" key={branch} transform={`translate(${x - width / 2}, ${y - 48 - pointerIndex * 27})`}>
                        <rect fill="#0a1914" height="22" rx="5" stroke={graphColor(branch)} width={width} />
                        <text fill={graphColor(branch)} textAnchor="middle" x={width / 2} y="15">{branch}{branch === graph.currentBranch ? " • HEAD" : ""}</text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
          {!graph.nodes.length && <div className="graph-empty"><span>◇</span><b>NO COMMITS YET</b><p className="fa" lang="fa" dir="rtl">فرمان اول سناریو را اجرا کن یا دکمهٔ Build Complete Graph را بزن.</p></div>}
        </div>

        <div className="custom-graph-builder">
          <header><div><span>CUSTOM BUILD</span><h3>CREATE YOUR OWN HISTORY</h3></div><p className="fa" lang="fa" dir="rtl">این ابزار محدود به سناریوی آماده نیست؛ Commit بساز، Branch جدید ایجاد کن، شاخهٔ فعال را عوض کن و نوع Merge را خودت انتخاب کن.</p></header>
          <div className="custom-builder-grid">
            <form onSubmit={commitToGraph}><label>COMMIT ON <b>{graph.currentBranch}</b></label><div><input onChange={(event) => setCommitMessage(event.target.value)} value={commitMessage} /><button type="submit">git commit -m</button></div></form>
            <form onSubmit={createGraphBranch}><label>NEW BRANCH FROM HEAD</label><div><input onChange={(event) => setNewBranchName(event.target.value)} value={newBranchName} /><button type="submit">git switch -c</button></div></form>
          </div>
          <div className="branch-switch-panel"><span>SWITCH HEAD</span><div>{graph.branches.map((branch) => <button className={branch === graph.currentBranch ? "active" : ""} disabled={branch === graph.currentBranch} key={branch} onClick={() => runGraphCommand(`git switch ${branch}`)} type="button">git switch {branch}</button>)}</div></div>
          <div className="merge-panel"><div><span>MERGE TARGET</span><select onChange={(event) => setMergeTarget(event.target.value)} value={resolvedMergeTarget}>{mergeTargets.length ? mergeTargets.map((branch) => <option key={branch}>{branch}</option>) : <option value="">CREATE ANOTHER BRANCH FIRST</option>}</select></div><div><button disabled={!resolvedMergeTarget} onClick={() => runGraphCommand(`git merge ${resolvedMergeTarget}`)} type="button">git merge</button><button disabled={!resolvedMergeTarget} onClick={() => runGraphCommand(`git merge --no-ff ${resolvedMergeTarget}`)} type="button">git merge --no-ff</button><button disabled={!resolvedMergeTarget} onClick={() => runGraphCommand(`git merge --squash ${resolvedMergeTarget}`)} type="button">git merge --squash</button><button disabled={!resolvedMergeTarget} onClick={() => runGraphCommand(`git rebase ${resolvedMergeTarget}`)} type="button">git rebase</button></div></div>
        </div>

        <div className="graph-explainer">
          <article><span>COMMIT NODE</span><p className="fa" lang="fa" dir="rtl">هر Commit یک Node تازه با Hash و Parent مشخص ایجاد می‌کند.</p></article>
          <article><span>BRANCH POINTER</span><p className="fa" lang="fa" dir="rtl">Branch فقط اشاره‌گری است که با Commit یا Fast-forward جابه‌جا می‌شود.</p></article>
          <article><span>MERGE BEHAVIOR</span><p className="fa" lang="fa" dir="rtl">Fast-forward فقط Pointer را جلو می‌برد؛ Merge واقعی یک Node با دو Parent می‌سازد.</p></article>
        </div>
      </section>

      <section className="quiz-section section" id="quiz">
        <div className="section-title">
          <div><span>02 / COURSE QUIZZES</span><h2>TEST YOUR GIT MODEL</h2></div>
          <p className="fa" lang="fa" dir="rtl">یکی از شش بخش ورکشاپ را انتخاب کن. هر بخش ۱۵ سؤال دارد و از مفاهیم پایه شروع می‌شود و به موقعیت‌های چالشی می‌رسد.</p>
        </div>
        <UsageGuide title="آزمون متناسب با بخش دوره" items={[{ title: "بخش دوره را انتخاب کن", text: "برای هر سرفصل یک آزمون مستقل ۱۵ سؤالی طراحی شده است؛ امتیاز هر بخش جداگانه محاسبه می‌شود." }, { title: "سطح سؤال را ببین", text: "پنج سؤال اول Beginner، پنج سؤال بعد Intermediate و پنج سؤال آخر Challenge هستند." }, { title: "دلیل پاسخ را بخوان", text: "بعد از انتخاب گزینه، فقط درست یا غلط نمی‌بینی؛ توضیح مدل ذهنی درست هم نمایش داده می‌شود." }]} />
        <div className="quiz-modules" role="tablist" aria-label="Quiz course sections">
          {quizModules.map((module, index) => <button className={quizModuleIndex === index ? "active" : ""} key={module.id} onClick={() => selectQuizModule(index)} role="tab" type="button"><span>{module.number}</span><div><b>{module.label}</b><strong className="fa" lang="fa" dir="rtl">{module.titleFa}</strong></div><i>15 QUESTIONS</i></button>)}
        </div>
        <div className="quiz-selection-summary"><div><span>SELECTED SECTION</span><b>{activeQuizModule.label}</b></div><p className="fa" lang="fa" dir="rtl">{activeQuizModule.descriptionFa}</p></div>
        <div className="quiz-progress"><i style={{ width: `${((quizIndex + 1) / activeQuizQuestions.length) * 100}%` }} /></div>
        <article className="quiz-card">
          <header><span>QUESTION {String(quizIndex + 1).padStart(2, "0")} / {activeQuizQuestions.length}</span><i className={`level-${activeQuizQuestion.level.toLowerCase()}`}>{activeQuizQuestion.level}</i><b>{quizPoints}/{activeQuizQuestions.length} CORRECT</b></header>
          <h3 className="fa" lang="fa" dir="rtl">{activeQuizQuestion.questionFa}</h3>
          <div className="quiz-options">
            {activeQuizQuestion.options.map((option, index) => {
              const answered = quizAnswer !== null;
              const correct = index === activeQuizQuestion.answer;
              const selected = index === quizAnswer;
              const isPersian = /[\u0600-\u06ff]/.test(option);
              return <button className={`${answered && correct ? "correct" : ""} ${answered && selected && !correct ? "wrong" : ""}`} key={option} onClick={() => answerQuiz(index)} type="button"><span>{String.fromCharCode(65 + index)}</span><code className={isPersian ? "fa" : ""} dir={isPersian ? "rtl" : "ltr"}>{option}</code>{answered && correct && <i>✓</i>}</button>;
            })}
          </div>
          {quizAnswer !== null && <div className={`quiz-feedback ${quizAnswer === activeQuizQuestion.answer ? "good" : "bad"}`}><b>{quizAnswer === activeQuizQuestion.answer ? "CORRECT • +25 XP" : "NOT QUITE • READ THE EXPLANATION"}</b><p className="fa" lang="fa" dir="rtl">{activeQuizQuestion.whyFa}</p></div>}
          <footer><span>{activeQuizModule.number} • {activeQuizModule.label}</span><button disabled={quizAnswer === null} onClick={nextQuiz} type="button">{quizIndex === activeQuizQuestions.length - 1 ? "RESTART SECTION ↻" : "NEXT QUESTION →"}</button></footer>
        </article>
      </section>

      <section className="ordering-section section" id="ordering">
        <div className="section-title">
          <div><span>03 / ORDERING CHALLENGES</span><h2>PUT THE COMMANDS IN ORDER</h2></div>
          <p className="fa" lang="fa" dir="rtl">در هر مأموریت دستورهای واقعی Git به‌هم‌ریخته‌اند. آن‌ها را انتخاب کن، داخل جایگاه‌های شماره‌دار بچین و ترتیب اجرای خودت را ارزیابی کن.</p>
        </div>
        <UsageGuide title="ترتیب درست Workflow را پیدا کن" items={[{ title: "مأموریت را انتخاب کن", text: "۲۰ سناریو بر اساس مسیر دوره در سه سطح Beginner، Intermediate و Advanced طراحی شده‌اند." }, { title: "دستورها را شماره‌گذاری کن", text: "روی فرمان‌های مخلوط کلیک کن تا وارد پاسخ شوند؛ با فلش‌ها ترتیب را اصلاح و با × فرمان را خارج کن." }, { title: "پاسخ را ارزیابی کن", text: "وقتی همهٔ Slotها پر شد Check Order را بزن. در صورت خطا می‌توانی پاسخ را اصلاح کنی، نه اینکه جواب آماده ببینی." }]} />

        <div className="mission-filters">{(["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((level) => <button className={missionLevel === level ? "active" : ""} key={level} onClick={() => filterMissionLevel(level)} type="button">{level}<span>{level === "ALL" ? orderMissions.length : orderMissions.filter((mission) => mission.level === level).length}</span></button>)}</div>
        <div className="mission-catalog">
          {filteredMissions.map((mission) => {
            const index = orderMissions.findIndex((item) => item.id === mission.id);
            return <button className={`${missionIndex === index ? "active" : ""} ${completedMissions.includes(mission.id) ? "completed" : ""}`} key={mission.id} onClick={() => selectMission(index)} type="button"><span>{mission.number}</span><div><b className="fa" lang="fa" dir="rtl">{mission.titleFa}</b><small>{mission.module}</small></div><i>{completedMissions.includes(mission.id) ? "✓" : mission.level}</i></button>;
          })}
        </div>

        <article className="ordering-brief">
          <div><span>MISSION {activeMission.number}</span><b className={`mission-level ${activeMission.level.toLowerCase()}`}>{activeMission.level}</b></div>
          <section className="fa" lang="fa" dir="rtl"><small>{activeMission.module}</small><h3>{activeMission.titleFa}</h3><p>{activeMission.briefFa}</p><strong>{activeMission.objectiveFa}</strong></section>
          <aside><b>{missionOrder.length}/{activeMission.commands.length}</b><span>COMMANDS PLACED</span></aside>
        </article>

        <div className="ordering-workspace">
          <section className="command-bank"><header><div><span>SHUFFLED COMMANDS</span><b>SELECT A COMMAND</b></div><p className="fa" lang="fa" dir="rtl">فرمان بعدی را از این فهرست انتخاب کن.</p></header><div>{mixedMissionCommands.filter((command) => !missionOrder.includes(command)).map((command) => <button key={command} onClick={() => addMissionCommand(command)} type="button"><span>＋</span><code>{command}</code></button>)}{missionOrder.length === activeMission.commands.length && <div className="bank-empty"><span>✓</span><b>ALL COMMANDS PLACED</b></div>}</div></section>
          <section className="ordered-answer"><header><div><span>YOUR EXECUTION ORDER</span><b>NUMBERED WORKFLOW</b></div><button onClick={() => { setMissionOrder([]); setMissionFeedback("idle"); }} type="button">RESET ORDER</button></header><div>{activeMission.commands.map((_, index) => {
            const command = missionOrder[index];
            return <article className={command ? "filled" : "empty"} key={index}><span>{String(index + 1).padStart(2, "0")}</span>{command ? <><code>{command}</code><div><button disabled={index === 0} onClick={() => moveMissionCommand(index, -1)} type="button">↑</button><button disabled={index === missionOrder.length - 1} onClick={() => moveMissionCommand(index, 1)} type="button">↓</button><button onClick={() => removeMissionCommand(command)} type="button">×</button></div></> : <p className="fa" lang="fa" dir="rtl">فرمان این مرحله را انتخاب کن</p>}</article>;
          })}</div></section>
        </div>

        <div className={`mission-check ${missionFeedback}`}><div>{missionFeedback === "correct" ? <><b>WORKFLOW COMPLETE ✓</b><p className="fa" lang="fa" dir="rtl">ترتیب درست است؛ این مأموریت با موفقیت تکمیل شد.</p></> : missionFeedback === "wrong" ? <><b>ORDER NEEDS REVISION</b><p className="fa" lang="fa" dir="rtl">همهٔ فرمان‌ها انتخاب شده‌اند اما ترتیب اجرای بعضی مرحله‌ها درست نیست. وابستگی هر فرمان به State قبلی را دوباره بررسی کن.</p></> : <><b>READY TO CHECK</b><p className="fa" lang="fa" dir="rtl">پس از پرکردن همهٔ جایگاه‌ها، ترتیب Workflow را ارزیابی کن.</p></>}</div><button disabled={missionOrder.length !== activeMission.commands.length} onClick={checkMission} type="button">CHECK ORDER</button></div>
      </section>

      <section className="roadmap-section section">
        <div className="section-title"><div><span>04 / LEARNING PATH</span><h2>YOUR WORKSHOP ROADMAP</h2></div><p className="fa" lang="fa" dir="rtl">این نقشه ترتیب یادگیری دوره را نشان می‌دهد؛ هر مرحله روی دانشی ساخته می‌شود که در مرحلهٔ قبل تمرین کرده‌ای.</p></div>
        <figure><img src="/course-roadmap.png" alt="نقشه راه فارسی ورکشاپ Git و GitHub" /><figcaption>THE COMPLETE WORKSHOP ROADMAP</figcaption></figure>
      </section>

      <section className="reference-section section" id="reference">
        <div className="section-title"><div><span>05 / COMMAND REFERENCE</span><h2>UNDERSTAND EACH COMMAND</h2></div><p className="fa" lang="fa" dir="rtl">این بخش فقط فهرست دستورها نیست؛ برای هر فرمان می‌بینی از کدام State می‌خواند، کدام State را تغییر می‌دهد و چه زمانی باید با احتیاط اجرا شود.</p></div>
        <UsageGuide title="از Reference برای مرور و تمرین استفاده کن" items={[{ title: "گروه را محدود کن", text: "با انتخاب Setup، Local، Undo، Branch، Remote یا Team فقط دستورهای همان موضوع را ببین." }, { title: "اثر State را بخوان", text: "عبارت State Effect مسیر واقعی دستور را خلاصه می‌کند؛ قبل از کپی‌کردن، آن را پیش‌بینی کن." }, { title: "سطح ریسک را جدی بگیر", text: "Safe فقط می‌خواند یا تغییر قابل بازگشت دارد؛ Careful نیازمند بررسی است و Danger می‌تواند تاریخچه یا داده را بازنویسی کند." }]} />
        <div className="reference-tools"><label><span>⌕</span><input aria-label="Search commands" onChange={(event) => setReferenceQuery(event.target.value)} placeholder="Search command or concept..." value={referenceQuery} /></label><div>{["ALL", ...unique(commandReferences.map((item) => item.group))].map((group) => <button className={referenceGroup === group ? "active" : ""} key={group} onClick={() => setReferenceGroup(group)} type="button">{group}</button>)}</div></div>
        <div className="reference-grid">{filteredReferences.map((item) => <article className={`reference-card ${item.risk.toLowerCase()}`} key={`${item.group}-${item.command}`}><header><span>{item.group}</span><b>{item.risk}</b></header><h3 className="fa" lang="fa" dir="rtl">{item.titleFa}</h3><div className="code-block"><code>{item.command}</code><button onClick={() => copy(item.command)} type="button">{copied === item.command ? "COPIED ✓" : "COPY"}</button></div><p className="fa" lang="fa" dir="rtl">{item.explanationFa}</p><footer><span>STATE EFFECT</span><b>{item.movement}</b></footer></article>)}</div>
      </section>

      <footer className="site-footer"><div className="brand"><span className="brand-cube">G</span><span><b>GIT STATE LAB</b><small>Learn by doing, verify by history</small></span></div><div className="footer-credit"><span>WORKSHOP INSTRUCTOR</span><b className="fa" lang="fa" dir="rtl">شکوفه اکبری</b><p className="fa" lang="fa" dir="rtl">طراحی‌شده برای یادگیری عملی Git و GitHub</p></div><a href="#top">BACK TO TOP ↑</a></footer>
    </main>
  );
}
