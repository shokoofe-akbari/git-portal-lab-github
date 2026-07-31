import { CSSProperties, FormEvent, useMemo, useRef, useState } from "react";
import {
  commandReferences,
  quizQuestions,
  scenarios,
  zones,
  type Scenario,
  type ZoneKey,
} from "./data";

type TerminalLine = {
  id: number;
  type: "command" | "success" | "info" | "warning" | "error";
  text: string;
};

type CommitNode = {
  id: string;
  message: string;
  branch: string;
  parents: string[];
  kind: "commit" | "merge" | "revert" | "cherry-pick" | "rebase";
};

type Motion = {
  id: number;
  from: ZoneKey;
  to: ZoneKey;
  label: string;
};

const zonePosition: Record<ZoneKey, number> = {
  working: 12.5,
  staging: 37.5,
  local: 62.5,
  remote: 87.5,
};

const genericCommands = [
  "git status",
  "git add .",
  'git commit -m "feat: update project"',
  "git log --oneline --graph --all",
  "git fetch origin",
  "git pull origin main",
  "git reset --soft HEAD~1",
  "git restore --staged app.js",
];

function unique(items: string[]) {
  return Array.from(new Set(items));
}

function shortHash() {
  return Math.random().toString(16).slice(2, 9).padEnd(7, "0");
}

function orderedProgress(steps: Scenario["steps"], history: string[]) {
  let complete = 0;
  for (const command of history) {
    if (steps[complete]?.match.test(command)) complete += 1;
    if (complete === steps.length) break;
  }
  return complete;
}

function headsFromScenario(scenario: Scenario) {
  const heads: Record<string, string | null> = {};
  for (const branch of scenario.seed.branches) heads[branch] = null;
  for (const commit of scenario.seed.commits) heads[commit.branch] = commit.id;
  return heads;
}

export default function App() {
  const initialScenario = scenarios[1];
  const [scenarioIndex, setScenarioIndex] = useState(1);
  const [initialized, setInitialized] = useState(initialScenario.seed.initialized);
  const [zoneFiles, setZoneFiles] = useState<Record<ZoneKey, string[]>>({
    working: initialScenario.seed.working,
    staging: initialScenario.seed.staging,
    local: initialScenario.seed.local,
    remote: initialScenario.seed.remote,
  });
  const [currentBranch, setCurrentBranch] = useState(initialScenario.seed.currentBranch);
  const [branches, setBranches] = useState(initialScenario.seed.branches);
  const [branchHeads, setBranchHeads] = useState<Record<string, string | null>>(
    headsFromScenario(initialScenario),
  );
  const [commits, setCommits] = useState<CommitNode[]>(
    initialScenario.seed.commits.map((item) => ({ ...item, kind: item.kind ?? "commit" })),
  );
  const [stashFiles, setStashFiles] = useState<string[]>([]);
  const [fetchedRef, setFetchedRef] = useState(false);
  const [motion, setMotion] = useState<Motion | null>(null);
  const [lastEffect, setLastEffect] = useState("No command executed yet — state is seeded by the selected mission.");
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [copied, setCopied] = useState("");
  const [logs, setLogs] = useState<TerminalLine[]>([
    { id: 1, type: "info", text: "ماموریت آماده است؛ دستور قدم اول را اجرا کن." },
  ]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizPoints, setQuizPoints] = useState(0);
  const [referenceGroup, setReferenceGroup] = useState("ALL");
  const [referenceQuery, setReferenceQuery] = useState("");
  const terminalRef = useRef<HTMLDivElement>(null);

  const activeScenario = scenarios[scenarioIndex];
  const missionProgress = orderedProgress(activeScenario.steps, history);
  const nextMissionStep = activeScenario.steps[missionProgress];

  const branchNames = useMemo(
    () => unique(["main", ...branches, ...commits.map((commit) => commit.branch)]),
    [branches, commits],
  );

  const filteredReferences = useMemo(() => {
    const query = referenceQuery.trim().toLowerCase();
    return commandReferences.filter((item) => {
      const groupMatch = referenceGroup === "ALL" || item.group === referenceGroup;
      const textMatch =
        !query ||
        `${item.command} ${item.titleFa} ${item.explanationFa}`.toLowerCase().includes(query);
      return groupMatch && textMatch;
    });
  }, [referenceGroup, referenceQuery]);

  const addLog = (type: TerminalLine["type"], text: string) => {
    setLogs((current) => [...current, { id: Date.now() + Math.random(), type, text }]);
    requestAnimationFrame(() => {
      terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const animate = (from: ZoneKey, to: ZoneKey, label: string) => {
    const id = Date.now() + Math.random();
    setMotion(null);
    requestAnimationFrame(() => setMotion({ id, from, to, label }));
    window.setTimeout(
      () => setMotion((current) => (current?.id === id ? null : current)),
      1080,
    );
  };

  const animateSequence = (
    first: [ZoneKey, ZoneKey, string],
    second: [ZoneKey, ZoneKey, string],
  ) => {
    animate(...first);
    window.setTimeout(() => animate(...second), 860);
  };

  const moveFiles = (
    source: ZoneKey,
    destination: ZoneKey,
    requested: string[] | "all",
    keepSource = false,
  ) => {
    setZoneFiles((current) => {
      const moving =
        requested === "all"
          ? current[source]
          : current[source].filter((file) => requested.includes(file));
      return {
        ...current,
        [source]: keepSource
          ? current[source]
          : current[source].filter((file) => !moving.includes(file)),
        [destination]: unique([...current[destination], ...moving]),
      };
    });
  };

  const markSuccessfulCommand = (normalized: string, points = 10) => {
    setScore((current) => current + points);
    const nextHistory = [...history, normalized];
    setHistory(nextHistory);

    if (!activeScenario.steps.length) return;
    const progress = orderedProgress(activeScenario.steps, nextHistory);
    if (
      progress === activeScenario.steps.length &&
      !completedMissions.includes(activeScenario.id)
    ) {
      setCompletedMissions((current) => [...current, activeScenario.id]);
      setScore((current) => current + activeScenario.reward);
      window.setTimeout(
        () => addLog("success", `ماموریت کامل شد — ${activeScenario.reward} امتیاز جایزه گرفتی.`),
        80,
      );
    }
  };

  const appendCommit = (
    message: string,
    kind: CommitNode["kind"] = "commit",
    customParents?: string[],
  ) => {
    const id = shortHash();
    const currentHead = branchHeads[currentBranch];
    const parents = customParents ?? (currentHead ? [currentHead] : []);
    const node: CommitNode = { id, message, branch: currentBranch, parents, kind };
    setCommits((current) => [...current, node]);
    setBranchHeads((current) => ({ ...current, [currentBranch]: id }));
    return node;
  };

  const selectScenario = (index: number) => {
    const scenario = scenarios[index];
    setScenarioIndex(index);
    setInitialized(scenario.seed.initialized);
    setZoneFiles({
      working: [...scenario.seed.working],
      staging: [...scenario.seed.staging],
      local: [...scenario.seed.local],
      remote: [...scenario.seed.remote],
    });
    setCurrentBranch(scenario.seed.currentBranch);
    setBranches([...scenario.seed.branches]);
    setBranchHeads(headsFromScenario(scenario));
    setCommits(scenario.seed.commits.map((item) => ({ ...item, kind: item.kind ?? "commit" })));
    setStashFiles([]);
    setFetchedRef(false);
    setMotion(null);
    setHistory([]);
    setLastEffect(`Mission state loaded: ${scenario.label}`);
    setLogs([
      {
        id: Date.now(),
        type: "info",
        text: scenario.steps.length
          ? `ماموریت «${scenario.titleFa}» بارگذاری شد. از قدم اول شروع کن.`
          : "حالت آزاد فعال شد؛ هر دستور پشتیبانی‌شده‌ای را امتحان کن.",
      },
    ]);
    document.querySelector("#mission-lab")?.scrollIntoView({ behavior: "smooth" });
  };

  const executeCommand = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    const normalized = value.replace(/\s+/g, " ");
    addLog("command", `$ ${value}`);
    setCommand("");

    if (normalized === "clear") {
      setLogs([]);
      return;
    }

    if (normalized === "git --version") {
      addLog("info", "git version 2.47.1 — Git is installed and available.");
      markSuccessfulCommand(normalized, 5);
      return;
    }

    if (normalized.startsWith("git config ")) {
      addLog("success", "Global author configuration saved. Repository state did not change.");
      setLastEffect("GLOBAL CONFIG — no file movement");
      markSuccessfulCommand(normalized, 5);
      return;
    }

    if (normalized === "git init") {
      if (initialized) {
        addLog("warning", "Repository already exists. Running git init again is harmless here.");
        return;
      }
      setInitialized(true);
      setLastEffect("INIT — .git metadata created; files stay in Working Directory");
      addLog("success", "Repository initialized. No file moved; Git metadata was created.");
      markSuccessfulCommand(normalized, 10);
      return;
    }

    if (normalized.startsWith("git clone ")) {
      const files = ["README.md", "index.html", "app.js"];
      setInitialized(true);
      setZoneFiles({ working: files, staging: [], local: files, remote: files });
      const node: CommitNode = {
        id: shortHash(),
        message: "clone remote repository",
        branch: "main",
        parents: [],
        kind: "commit",
      };
      setCommits([node]);
      setBranches(["main"]);
      setCurrentBranch("main");
      setBranchHeads({ main: node.id });
      animateSequence(["remote", "local", "OBJECTS"], ["local", "working", "CHECKOUT"]);
      setLastEffect("CLONE — Remote → Local objects → Working checkout (Staging is bypassed)");
      addLog("success", "Clone completed: history, origin and a checked-out Working Tree were created.");
      markSuccessfulCommand(normalized, 25);
      return;
    }

    if (!initialized && normalized.startsWith("git ")) {
      addLog("error", "No Repository exists. Run git init first.");
      return;
    }

    if (normalized === "git status" || normalized === "git status -s") {
      const working = zoneFiles.working.length
        ? `Working: ${zoneFiles.working.join(", ")}`
        : "Working tree clean";
      const staged = zoneFiles.staging.length
        ? `Staged: ${zoneFiles.staging.join(", ")}`
        : "Nothing staged";
      addLog("info", `${working}  •  ${staged}  •  HEAD → ${currentBranch}`);
      setLastEffect("STATUS — read-only inspection of Working, Staging and HEAD");
      markSuccessfulCommand(normalized, 5);
      return;
    }

    if (normalized === "git diff" || normalized === "git diff --staged") {
      const staged = normalized.endsWith("--staged");
      const files = staged ? zoneFiles.staging : zoneFiles.working;
      addLog("info", files.length ? `Diff: ${files.join(", ")}` : "No differences to show.");
      setLastEffect(staged ? "DIFF --STAGED — compare Staging with Local HEAD" : "DIFF — compare Working with Staging");
      markSuccessfulCommand(normalized, 5);
      return;
    }

    if (normalized === "git add ." || normalized === "git add -A") {
      if (!zoneFiles.working.length) {
        addLog("warning", "Working Directory has no pending changes.");
        return;
      }
      moveFiles("working", "staging", "all");
      animate("working", "staging", "SNAPSHOT");
      setLastEffect("ADD — Working Directory → Staging Area");
      addLog("success", "All current changes were copied into the Staging snapshot.");
      markSuccessfulCommand(normalized, 15);
      return;
    }

    if (normalized.startsWith("git add ")) {
      const file = normalized.slice("git add ".length).trim();
      if (!zoneFiles.working.includes(file)) {
        addLog("error", `${file} is not a pending Working Directory change.`);
        return;
      }
      moveFiles("working", "staging", [file]);
      animate("working", "staging", file);
      setLastEffect(`ADD ${file} — Working Directory → Staging Area`);
      addLog("success", `${file} is now part of the next Commit snapshot.`);
      markSuccessfulCommand(normalized, 15);
      return;
    }

    if (normalized.startsWith("git restore --staged")) {
      const file = normalized.slice("git restore --staged".length).trim();
      const candidates = file ? [file] : [...zoneFiles.staging];
      const actual = candidates.filter((item) => zoneFiles.staging.includes(item));
      if (!actual.length) {
        addLog("error", "That file is not in Staging Area.");
        return;
      }
      moveFiles("staging", "working", actual);
      animate("staging", "working", file || "CHANGES");
      setLastEffect("RESTORE --STAGED — Staging Area → Working Directory; content is preserved");
      addLog("success", "The file left Staging, but its Working Directory changes were preserved.");
      markSuccessfulCommand(normalized, 15);
      return;
    }

    if (/^git commit(?:\s|$)/.test(normalized)) {
      if (!zoneFiles.staging.length) {
        addLog("error", "Staging Area is empty. Run git add before committing.");
        return;
      }
      const message = normalized.match(/-m\s+["'](.+?)["']/)?.[1] ?? "untitled commit";
      const stagedFiles = [...zoneFiles.staging];
      moveFiles("staging", "local", stagedFiles);
      const node = appendCommit(message);
      animate("staging", "local", "COMMIT");
      setLastEffect(`COMMIT ${node.id} — Staging Area → Local Repository on ${currentBranch}`);
      addLog("success", `Commit ${node.id} created on ${currentBranch}: ${message}`);
      markSuccessfulCommand(normalized, 25);
      return;
    }

    if (normalized === "git branch" || normalized === "git branch --list") {
      addLog(
        "info",
        branches.map((branch) => `${branch === currentBranch ? "*" : " "} ${branch}`).join("  •  "),
      );
      setLastEffect("BRANCH — read Local branch pointers");
      markSuccessfulCommand(normalized, 5);
      return;
    }

    if (/^git (?:switch -c|checkout -b) /.test(normalized)) {
      const branch = normalized.replace(/^git (?:switch -c|checkout -b) /, "").trim();
      if (branches.includes(branch)) {
        addLog("error", `Branch ${branch} already exists.`);
        return;
      }
      setBranches((current) => [...current, branch]);
      setBranchHeads((current) => ({ ...current, [branch]: current[currentBranch] ?? null }));
      setCurrentBranch(branch);
      setLastEffect(`SWITCH -C — new pointer ${branch} created at current HEAD`);
      addLog("success", `Created and switched to ${branch}. No file was committed yet.`);
      markSuccessfulCommand(normalized, 15);
      return;
    }

    if (/^git (?:switch|checkout) /.test(normalized)) {
      const branch = normalized.replace(/^git (?:switch|checkout) /, "").trim();
      if (!branches.includes(branch)) {
        addLog("error", `Branch ${branch} does not exist.`);
        return;
      }
      setCurrentBranch(branch);
      animate("local", "working", "CHECKOUT");
      setLastEffect(`SWITCH — Local snapshot (${branch}) → Working Directory; Staging is bypassed`);
      addLog("success", `HEAD now points to ${branch}. Working Tree was checked out from Local Repository.`);
      markSuccessfulCommand(normalized, 15);
      return;
    }

    if (normalized.startsWith("git merge ")) {
      const noFastForward = normalized.includes("--no-ff");
      const branch = normalized.replace(/^git merge(?: --no-ff)? /, "").trim();
      if (!branches.includes(branch) || branch === currentBranch) {
        addLog("error", "Choose another existing Branch to merge.");
        return;
      }
      const currentHead = branchHeads[currentBranch];
      const targetHead = branchHeads[branch];
      if (!targetHead) {
        addLog("error", `Branch ${branch} has no Commit to merge.`);
        return;
      }
      if (noFastForward) {
        const parents = [currentHead, targetHead].filter(Boolean) as string[];
        const node = appendCommit(`merge ${branch} into ${currentBranch}`, "merge", parents);
        setLastEffect(`MERGE --NO-FF — node ${node.id} created with two parents`);
        addLog("success", `Merge Commit ${node.id} created with parents ${parents.join(" + ")}.`);
      } else {
        setBranchHeads((current) => ({ ...current, [currentBranch]: targetHead }));
        setLastEffect(`FAST-FORWARD MERGE — ${currentBranch} pointer moved to ${targetHead}; no node created`);
        addLog("success", "Fast-forward completed: the Branch pointer moved; no new Commit was necessary.");
      }
      markSuccessfulCommand(normalized, 30);
      return;
    }

    if (normalized.startsWith("git rebase ")) {
      const target = normalized.replace(/^git rebase(?: -i)? /, "").trim();
      if (!branches.includes(target)) {
        addLog("error", `Branch ${target} does not exist.`);
        return;
      }
      const node = appendCommit(`rebased change onto ${target}`, "rebase");
      setLastEffect(`REBASE — local Commit recreated as ${node.id}; history was rewritten`);
      addLog("warning", `History rewritten. New Commit ${node.id} replaces the previous local identity.`);
      markSuccessfulCommand(normalized, 25);
      return;
    }

    if (normalized.startsWith("git cherry-pick ")) {
      const source = normalized.slice("git cherry-pick ".length).trim();
      const node = appendCommit(`cherry-pick ${source}`, "cherry-pick");
      setLastEffect(`CHERRY-PICK — selected change copied into new Commit ${node.id}`);
      addLog("success", `The effect of ${source} became new Commit ${node.id} on ${currentBranch}.`);
      markSuccessfulCommand(normalized, 20);
      return;
    }

    if (normalized === "git stash" || normalized === "git stash -u") {
      if (!zoneFiles.working.length) {
        addLog("warning", "Working Directory has no pending changes to stash.");
        return;
      }
      setStashFiles(zoneFiles.working);
      setZoneFiles((current) => ({ ...current, working: [] }));
      setLastEffect("STASH — Working changes moved to a temporary stack outside the four zones");
      addLog("success", "Working changes saved in Stash. Working Directory is now clean.");
      markSuccessfulCommand(normalized, 10);
      return;
    }

    if (normalized === "git stash pop") {
      if (!stashFiles.length) {
        addLog("warning", "Stash is empty.");
        return;
      }
      setZoneFiles((current) => ({ ...current, working: unique([...current.working, ...stashFiles]) }));
      setStashFiles([]);
      setLastEffect("STASH POP — temporary changes restored to Working Directory");
      addLog("success", "Latest Stash restored to Working Directory and removed from the stack.");
      markSuccessfulCommand(normalized, 10);
      return;
    }

    if (normalized.startsWith("git tag ")) {
      addLog("success", "Annotated Tag attached to the current Local Commit. Push it separately when needed.");
      setLastEffect("TAG — label attached to Local HEAD; no file movement");
      markSuccessfulCommand(normalized, 10);
      return;
    }

    if (normalized.startsWith("git reset --soft")) {
      const headId = branchHeads[currentBranch];
      const head = commits.find((item) => item.id === headId);
      if (!head) {
        addLog("error", "Current Branch has no Commit to reset.");
        return;
      }
      setBranchHeads((current) => ({ ...current, [currentBranch]: head.parents[0] ?? null }));
      moveFiles("local", "staging", "all");
      animate("local", "staging", "RESET --SOFT");
      setLastEffect("RESET --SOFT — Local HEAD moved back; changes remain in Staging");
      addLog("warning", "HEAD moved back, while the reverted Commit content stayed staged.");
      markSuccessfulCommand(normalized, 15);
      return;
    }

    if (normalized.startsWith("git reset --hard")) {
      const headId = branchHeads[currentBranch];
      const head = commits.find((item) => item.id === headId);
      if (!head) {
        addLog("error", "Current Branch has no Commit to reset.");
        return;
      }
      setBranchHeads((current) => ({ ...current, [currentBranch]: head.parents[0] ?? null }));
      setZoneFiles((current) => ({ ...current, working: [], staging: [] }));
      setLastEffect("RESET --HARD — HEAD, Staging and Working changes were discarded");
      addLog("warning", "Destructive reset completed. Uncommitted Working and Staging changes were removed.");
      markSuccessfulCommand(normalized, 10);
      return;
    }

    if (/^git reset (?!-)/.test(normalized)) {
      const headId = branchHeads[currentBranch];
      const head = commits.find((item) => item.id === headId);
      if (!head) {
        addLog("error", "Current Branch has no Commit to reset.");
        return;
      }
      setBranchHeads((current) => ({ ...current, [currentBranch]: head.parents[0] ?? null }));
      setZoneFiles((current) => ({
        ...current,
        working: unique([...current.working, ...current.local]),
        staging: [],
      }));
      animate("local", "working", "MIXED RESET");
      setLastEffect("RESET (MIXED) — Local HEAD moved back; changes returned to Working");
      addLog("warning", "Commit opened and its changes returned to Working Directory, unstaged.");
      markSuccessfulCommand(normalized, 15);
      return;
    }

    if (normalized.startsWith("git revert ")) {
      const node = appendCommit(`revert ${normalized.slice("git revert ".length)}`, "revert");
      setLastEffect(`REVERT — new Local Commit ${node.id} safely negates an earlier Commit`);
      addLog("success", `Revert Commit ${node.id} created. Shared history was not rewritten.`);
      markSuccessfulCommand(normalized, 20);
      return;
    }

    if (normalized.startsWith("git restore ")) {
      const file = normalized.slice("git restore ".length).trim();
      if (!zoneFiles.working.includes(file)) {
        addLog("error", `${file} has no pending Working Directory change.`);
        return;
      }
      setZoneFiles((current) => ({
        ...current,
        working: current.working.filter((item) => item !== file),
      }));
      animate("local", "working", "RESTORE");
      setLastEffect("RESTORE — Local/Index version overwrote the Working change; Staging was bypassed");
      addLog("warning", `${file} was restored. Its uncommitted Working change was discarded.`);
      markSuccessfulCommand(normalized, 10);
      return;
    }

    if (normalized === "git log" || normalized.startsWith("git log ")) {
      addLog(
        "info",
        commits.length
          ? commits.slice(-5).reverse().map((item) => `${item.id} ${item.message}`).join("  •  ")
          : "Local history is empty.",
      );
      setLastEffect("LOG — read Local Commit graph; no file movement");
      markSuccessfulCommand(normalized, 5);
      return;
    }

    if (normalized === "git remote -v") {
      addLog("info", "origin  https://github.com/workshop/git-portal-lab.git (fetch/push)");
      setLastEffect("REMOTE -V — read connection metadata");
      markSuccessfulCommand(normalized, 5);
      return;
    }

    if (normalized.startsWith("git remote add origin")) {
      addLog("success", "origin now points to the supplied GitHub Repository. Nothing was uploaded yet.");
      setLastEffect("REMOTE ADD — connection created; no file movement");
      markSuccessfulCommand(normalized, 10);
      return;
    }

    if (normalized === "git fetch" || normalized.startsWith("git fetch ")) {
      setFetchedRef(true);
      animate("remote", "local", "REF + OBJECTS");
      setLastEffect("FETCH — Remote → Local objects/refs only; Working Directory remains unchanged");
      addLog("success", "Remote objects and origin/main updated. Working Directory did not change.");
      markSuccessfulCommand(normalized, 15);
      return;
    }

    if (normalized === "git pull" || normalized.startsWith("git pull ")) {
      const incoming = zoneFiles.remote.length ? zoneFiles.remote : ["README.md"];
      setZoneFiles((current) => ({
        ...current,
        local: unique([...current.local, ...incoming]),
        working: unique([...current.working, ...incoming]),
      }));
      animateSequence(["remote", "local", "FETCH"], ["local", "working", "MERGE + CHECKOUT"]);
      setFetchedRef(true);
      setLastEffect("PULL — Remote → Local, then Local → Working; Staging is not used");
      addLog("success", "Remote history fetched, integrated into Local, then checked out into Working Directory.");
      markSuccessfulCommand(normalized, 20);
      return;
    }

    if (normalized === "git push" || normalized.startsWith("git push ")) {
      if (!commits.length || !zoneFiles.local.length) {
        addLog("error", "There is no Local Commit to push.");
        return;
      }
      moveFiles("local", "remote", "all", true);
      animate("local", "remote", "COMMITS");
      setLastEffect("PUSH — Local Repository → GitHub Remote; Working and Staging are not involved");
      addLog("success", `Local branch ${currentBranch} and its Commit objects were uploaded to GitHub.`);
      markSuccessfulCommand(normalized, 25);
      return;
    }

    if (normalized.startsWith("gh pr create")) {
      addLog("success", "Pull Request created from the current Remote Branch for review.");
      setLastEffect("PULL REQUEST — GitHub collaboration layer; Git object state does not move");
      markSuccessfulCommand(normalized, 20);
      return;
    }

    if (normalized === "help") {
      addLog("info", "Supported: init, status, diff, add, commit, branch, switch, merge, rebase, cherry-pick, stash, reset, restore, revert, log, remote, clone, fetch, pull, push.");
      return;
    }

    addLog("error", "Command not recognized in this simulator. Type help or use the suggested commands.");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    executeCommand(command);
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(""), 1200);
  };

  const answerQuiz = (index: number) => {
    if (quizAnswer !== null) return;
    setQuizAnswer(index);
    if (index === quizQuestions[quizIndex].answer) {
      setQuizPoints((current) => current + 1);
      setScore((current) => current + 25);
    }
  };

  const nextQuiz = () => {
    setQuizIndex((current) => (current + 1) % quizQuestions.length);
    setQuizAnswer(null);
  };

  const graphWidth = Math.max(1080, branchNames.length * 230 + 240);
  const graphHeight = Math.max(500, commits.length * 92 + 170);
  const branchX = (branch: string) => 160 + branchNames.indexOf(branch) * 220;
  const commitY = (index: number) => 100 + index * 92;
  const branchColor = (branch: string) =>
    ["#55ed8a", "#3bc9ff", "#bc70ff", "#ffbd45", "#ff7e78"][
      branchNames.indexOf(branch) % 5
    ];

  return (
    <main className="app-shell" dir="ltr">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Git State Lab home">
          <span className="brand-cube">G</span>
          <span><b>GIT STATE LAB</b><small>Interactive workshop environment</small></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#mission-lab">LAB</a>
          <a href="#graph">GRAPH</a>
          <a href="#quiz">QUIZ</a>
          <a href="#reference">REFERENCE</a>
        </nav>
        <div className="score"><span>XP</span><b>{score}</b></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-image" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">VISUAL GIT WORKSHOP • LIVE STATE ENGINE</p>
          <h1>SEE WHAT GIT<br /><span>ACTUALLY MOVES.</span></h1>
          <p className="hero-fa fa" lang="fa" dir="rtl">
            دستور را اجرا کن، مسیر واقعی تغییرها را ببین و به‌جای حفظ‌کردن، مدل ذهنی Git را بساز.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#mission-lab">START MISSION <span>↓</span></a>
            <a className="button secondary" href="#reference">OPEN COMMAND MAP</a>
          </div>
          <div className="hero-metrics">
            <div><b>4</b><span>STATE ZONES</span></div>
            <div><b>3</b><span>GUIDED MISSIONS</span></div>
            <div><b>32</b><span>COMMAND CARDS</span></div>
          </div>
        </div>
      </section>

      <section className="mission-lab section" id="mission-lab">
        <div className="section-title">
          <div><span>01 / MISSION CONTROL</span><h2>CHOOSE A SCENARIO</h2></div>
          <p className="fa" lang="fa" dir="rtl">با انتخاب هر مأموریت، صورت سؤال و State چهار ناحیه فوراً متناسب با همان سناریو بازسازی می‌شود.</p>
        </div>

        <div className="scenario-tabs" role="tablist" aria-label="Mission scenarios">
          {scenarios.map((scenario, index) => (
            <button
              className={scenarioIndex === index ? "active" : ""}
              key={scenario.id}
              onClick={() => selectScenario(index)}
              role="tab"
              type="button"
            >
              <span>{scenario.label}</span>
              <b>{scenario.level}</b>
              {completedMissions.includes(scenario.id) && <i>COMPLETED ✓</i>}
            </button>
          ))}
        </div>

        <article className="challenge-board">
          <div className="challenge-index">
            <span>{activeScenario.label}</span>
            <b>{activeScenario.reward ? `+${activeScenario.reward} XP` : "SANDBOX"}</b>
          </div>
          <div className="challenge-copy fa" lang="fa" dir="rtl">
            <span>صورت مسئله</span>
            <h3>{activeScenario.titleFa}</h3>
            <p>{activeScenario.briefFa}</p>
            <strong>{activeScenario.objectiveFa}</strong>
          </div>
          <div className="challenge-progress">
            <b>{activeScenario.steps.length ? `${missionProgress}/${activeScenario.steps.length}` : "∞"}</b>
            <span>{activeScenario.steps.length ? "STEPS COMPLETE" : "FREE MODE"}</span>
          </div>
        </article>

        {activeScenario.steps.length > 0 && (
          <div className="step-track">
            {activeScenario.steps.map((step, index) => {
              const state = index < missionProgress ? "done" : index === missionProgress ? "current" : "locked";
              return (
                <article className={state} key={step.command}>
                  <span>{index < missionProgress ? "✓" : String(index + 1).padStart(2, "0")}</span>
                  <div className="fa" lang="fa" dir="rtl"><b>{step.labelFa}</b><small>{state === "current" ? "قدم بعدی" : state === "done" ? "انجام شد" : "در انتظار"}</small></div>
                  <button onClick={() => copy(step.command)} type="button" title="Copy command">{copied === step.command ? "✓" : "COPY"}</button>
                </article>
              );
            })}
          </div>
        )}

        <div className="route-readout">
          <span>LAST STATE TRANSITION</span>
          <b>{lastEffect}</b>
          <i className={initialized ? "ready" : ""}>{initialized ? `.git READY • HEAD → ${currentBranch}` : ".git NOT INITIALIZED"}</i>
        </div>

        <div className="zones-stage">
          <div className="zone-rail" aria-hidden="true" />
          {motion && (
            <div
              className="transfer-token"
              key={motion.id}
              style={
                {
                  "--from-x": `${zonePosition[motion.from]}%`,
                  "--to-x": `${zonePosition[motion.to]}%`,
                  "--token-color": zones.find((zone) => zone.id === motion.to)?.color,
                } as CSSProperties
              }
            >
              <span>{motion.label}</span>
            </div>
          )}
          {zones.map((zone) => {
            const active = motion?.from === zone.id || motion?.to === zone.id;
            return (
              <article
                className={`state-zone ${active ? "active" : ""}`}
                key={zone.id}
                style={{ "--zone-color": zone.color } as CSSProperties}
              >
                <header><span>{zone.number}</span><i>{zoneFiles[zone.id].length}</i></header>
                <div className="zone-chamber">
                  <div className="zone-glyph">{zone.glyph}</div>
                  <div className="zone-beam" />
                </div>
                <h3>{zone.title}</h3>
                <p className="fa" lang="fa" dir="rtl">{zone.helperFa}</p>
                {zone.id === "local" && (
                  <div className="zone-meta"><span>HEAD → {currentBranch}</span>{fetchedRef && <span>origin/main fetched</span>}</div>
                )}
                {zone.id === "remote" && <div className="zone-meta"><span>origin/main</span></div>}
                <div className="zone-files">
                  {zoneFiles[zone.id].length ? zoneFiles[zone.id].map((file) => (
                    <span key={file}><i />{file}</span>
                  )) : <em>NO PENDING ITEMS</em>}
                </div>
              </article>
            );
          })}
        </div>

        <div className="terminal">
          <div className="terminal-head">
            <div className="window-dots"><i /><i /><i /></div>
            <span>git-state-lab — {activeScenario.label.toLowerCase()}</span>
            <button onClick={() => setLogs([])} type="button">CLEAR</button>
          </div>
          <div className="terminal-body" ref={terminalRef} aria-live="polite">
            {logs.map((line) => (
              <div className={`terminal-line ${line.type}`} key={line.id}>
                {line.type !== "command" && <span>›</span>}
                <p dir={line.type === "command" ? "ltr" : "auto"}>{line.text}</p>
              </div>
            ))}
          </div>
          <form className="terminal-form" onSubmit={submit}>
            <span>➜</span>
            <input
              aria-label="Git command"
              autoComplete="off"
              onChange={(event) => setCommand(event.target.value)}
              placeholder={nextMissionStep?.command ?? "git status"}
              spellCheck={false}
              value={command}
            />
            <button type="submit">RUN COMMAND</button>
          </form>
          <div className="command-suggestions">
            <span>SUGGESTED</span>
            {(nextMissionStep ? [nextMissionStep.command, ...genericCommands.slice(0, 5)] : genericCommands).map((item) => (
              <button key={item} onClick={() => executeCommand(item)} type="button">{item}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="graph-section section" id="graph">
        <div className="section-title">
          <div><span>02 / HISTORY ENGINE</span><h2>BRANCH & COMMIT GRAPH</h2></div>
          <p className="fa" lang="fa" dir="rtl">هر Commit یک Node می‌سازد. Branch فقط یک Pointer است و Merge با گزینهٔ no-ff یک Node با دو والد ایجاد می‌کند.</p>
        </div>
        <div className="graph-toolbar">
          <div className="branch-legend">
            {branchNames.map((branch) => <span key={branch}><i style={{ background: branchColor(branch) }} />{branch}{branch === currentBranch && <b>HEAD</b>}</span>)}
          </div>
          <button onClick={() => selectScenario(3)} type="button">LOAD BRANCH MISSION</button>
        </div>
        <div className="graph-stage">
          {commits.length ? (
            <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} role="img" aria-label="Dynamic Git commit graph">
              {commits.flatMap((commit, index) => {
                const childX = branchX(commit.branch);
                const childY = commitY(index);
                return commit.parents.map((parentId) => {
                  const parentIndex = commits.findIndex((item) => item.id === parentId);
                  if (parentIndex < 0) return null;
                  const parent = commits[parentIndex];
                  const parentX = branchX(parent.branch);
                  const parentY = commitY(parentIndex);
                  return (
                    <path
                      d={`M ${parentX} ${parentY} C ${parentX} ${parentY + 44}, ${childX} ${childY - 44}, ${childX} ${childY}`}
                      fill="none"
                      key={`${parentId}-${commit.id}`}
                      stroke={branchColor(commit.branch)}
                      strokeOpacity=".72"
                      strokeWidth={commit.kind === "merge" ? 4 : 3}
                    />
                  );
                });
              })}
              {commits.map((commit, index) => {
                const x = branchX(commit.branch);
                const y = commitY(index);
                const color = branchColor(commit.branch);
                const isHead = branchHeads[currentBranch] === commit.id;
                return (
                  <g key={commit.id}>
                    {isHead && <circle cx={x} cy={y} fill="none" r="24" stroke={color} strokeDasharray="4 5" strokeWidth="2" />}
                    <circle cx={x} cy={y} fill="#061210" r={commit.kind === "merge" ? 13 : 10} stroke={color} strokeWidth="5" />
                    <text className="graph-branch" fill={color} x={x + 24} y={y - 12}>{commit.branch}</text>
                    <text className="graph-message" fill="#edf8f3" x={x + 24} y={y + 8}>{commit.message}</text>
                    <text className="graph-hash" fill="#799089" x={x + 24} y={y + 28}>{commit.id} • {commit.kind.toUpperCase()}</text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="graph-empty">
              <span>◇</span><b>NO COMMITS YET</b>
              <p className="fa" lang="fa" dir="rtl">در مأموریت اول ابتدا فایل‌ها را Stage و سپس Commit کن تا اولین Node ساخته شود.</p>
            </div>
          )}
        </div>
        <div className="graph-explainer">
          <article><span>COMMIT</span><p className="fa" lang="fa" dir="rtl">یک Snapshot با شناسهٔ محتوایی و اشاره به والد قبلی.</p></article>
          <article><span>BRANCH</span><p className="fa" lang="fa" dir="rtl">یک نام متحرک که به آخرین Commit همان مسیر اشاره می‌کند.</p></article>
          <article><span>MERGE NODE</span><p className="fa" lang="fa" dir="rtl">Commit ویژه‌ای با دو Parent که دو مسیر تاریخچه را وصل می‌کند.</p></article>
        </div>
      </section>

      <section className="quiz-section section" id="quiz">
        <div className="section-title centered">
          <div><span>03 / KNOWLEDGE CHECK</span><h2>QUIZ ARENA</h2></div>
          <p className="fa" lang="fa" dir="rtl">هر سؤال یک بخش کامل دارد؛ پاسخ را انتخاب کن و دلیل درست را همان لحظه ببین.</p>
        </div>
        <div className="quiz-progress"><i style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }} /></div>
        <article className="quiz-card">
          <header><span>QUESTION {String(quizIndex + 1).padStart(2, "0")}</span><b>{quizPoints}/{quizQuestions.length} CORRECT</b></header>
          <h3 className="fa" lang="fa" dir="rtl">{quizQuestions[quizIndex].questionFa}</h3>
          <div className="quiz-options">
            {quizQuestions[quizIndex].options.map((option, index) => {
              const answered = quizAnswer !== null;
              const correct = index === quizQuestions[quizIndex].answer;
              const selected = index === quizAnswer;
              return (
                <button
                  className={`${answered && correct ? "correct" : ""} ${answered && selected && !correct ? "wrong" : ""}`}
                  key={option}
                  onClick={() => answerQuiz(index)}
                  type="button"
                >
                  <span>{String.fromCharCode(65 + index)}</span><code>{option}</code>{answered && correct && <i>✓</i>}
                </button>
              );
            })}
          </div>
          {quizAnswer !== null && (
            <div className={`quiz-feedback ${quizAnswer === quizQuestions[quizIndex].answer ? "good" : "bad"}`}>
              <b>{quizAnswer === quizQuestions[quizIndex].answer ? "CORRECT • +25 XP" : "NOT QUITE • REVIEW THE MODEL"}</b>
              <p className="fa" lang="fa" dir="rtl">{quizQuestions[quizIndex].whyFa}</p>
            </div>
          )}
          <footer><span>{quizIndex + 1} OF {quizQuestions.length}</span><button disabled={quizAnswer === null} onClick={nextQuiz} type="button">NEXT QUESTION →</button></footer>
        </article>
      </section>

      <section className="roadmap-section section">
        <div className="section-title">
          <div><span>04 / COURSE MAP</span><h2>FROM LOCAL STATE TO AUTOMATION</h2></div>
          <p className="fa" lang="fa" dir="rtl">نقشهٔ کامل ورکشاپ؛ از مفاهیم پایه و تاریخچه تا همکاری تیمی و GitHub Actions.</p>
        </div>
        <figure><img src="/course-roadmap.png" alt="نقشه راه فارسی ورکشاپ Git و GitHub" /><figcaption>THE COMPLETE WORKSHOP ROADMAP</figcaption></figure>
      </section>

      <section className="reference-section section" id="reference">
        <div className="section-title">
          <div><span>05 / COMMAND REFERENCE</span><h2>READABLE. SEARCHABLE. COPYABLE.</h2></div>
          <p className="fa" lang="fa" dir="rtl">فونت دستورها بزرگ‌تر است و هر کارت مسیر اثر، سطح ریسک و توضیح فارسی روشن دارد.</p>
        </div>
        <div className="reference-tools">
          <label><span>⌕</span><input aria-label="Search commands" onChange={(event) => setReferenceQuery(event.target.value)} placeholder="Search command or concept..." value={referenceQuery} /></label>
          <div>
            {["ALL", ...unique(commandReferences.map((item) => item.group))].map((group) => (
              <button className={referenceGroup === group ? "active" : ""} key={group} onClick={() => setReferenceGroup(group)} type="button">{group}</button>
            ))}
          </div>
        </div>
        <div className="reference-grid">
          {filteredReferences.map((item) => (
            <article className={`reference-card ${item.risk.toLowerCase()}`} key={`${item.group}-${item.command}`}>
              <header><span>{item.group}</span><b>{item.risk}</b></header>
              <h3 className="fa" lang="fa" dir="rtl">{item.titleFa}</h3>
              <div className="code-block"><code>{item.command}</code><button onClick={() => copy(item.command)} type="button">{copied === item.command ? "COPIED ✓" : "COPY"}</button></div>
              <p className="fa" lang="fa" dir="rtl">{item.explanationFa}</p>
              <footer><span>STATE EFFECT</span><b>{item.movement}</b></footer>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <div className="brand"><span className="brand-cube">G</span><span><b>GIT STATE LAB</b><small>Built for learning by doing</small></span></div>
        <p className="fa" lang="fa" dir="rtl">هر دستور باید یک تغییر قابل توضیح در State ایجاد کند؛ اگر نمی‌کند، اول مدل ذهنی را بررسی کن.</p>
        <a href="#top">BACK TO TOP ↑</a>
      </footer>
    </main>
  );
}
