import { CSSProperties, FormEvent, useMemo, useRef, useState } from "react";
import {
  commandReferences,
  scenarios,
  zones,
  type Scenario,
  type ZoneKey,
} from "./data";
import { quizModules } from "./quizData";

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

function UsageGuide({
  title,
  items,
}: {
  title: string;
  items: Array<{ title: string; text: string }>;
}) {
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
  const [quizModuleIndex, setQuizModuleIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizPoints, setQuizPoints] = useState(0);
  const [referenceGroup, setReferenceGroup] = useState("ALL");
  const [referenceQuery, setReferenceQuery] = useState("");
  const terminalRef = useRef<HTMLDivElement>(null);

  const activeScenario = scenarios[scenarioIndex];
  const missionProgress = orderedProgress(activeScenario.steps, history);
  const nextMissionStep = activeScenario.steps[missionProgress];
  const activeQuizModule = quizModules[quizModuleIndex];
  const activeQuizQuestions = activeQuizModule.questions;
  const activeQuizQuestion = activeQuizQuestions[quizIndex];

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

  const selectScenario = (index: number, scrollToLab = true) => {
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
    if (scrollToLab) {
      document.querySelector("#mission-lab")?.scrollIntoView({ behavior: "smooth" });
    }
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
          <span><b>GIT STATE LAB</b><small>Workshop by Shokoufeh Akbari</small></span>
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
          <p className="eyebrow">VISUAL GIT WORKSHOP • PRACTICE ENVIRONMENT</p>
          <h1>LEARN GIT<br /><span>BY SEEING STATE.</span></h1>
          <p className="hero-fa fa" lang="fa" dir="rtl">
            دستورها را در یک محیط امن اجرا کن، مسیر واقعی تغییرها را ببین و برای کار با Git یک مدل ذهنی دقیق بساز.
          </p>
          <div className="instructor-tag"><span>INSTRUCTOR</span><b className="fa" lang="fa" dir="rtl">شکوفه اکبری</b></div>
          <div className="hero-actions">
            <a className="button primary" href="#mission-lab">START MISSION <span>↓</span></a>
            <a className="button secondary" href="#quiz">CHOOSE A QUIZ</a>
          </div>
          <div className="hero-metrics">
            <div><b>4</b><span>STATE ZONES</span></div>
            <div><b>3</b><span>GUIDED MISSIONS</span></div>
            <div><b>90</b><span>LEVELLED QUESTIONS</span></div>
          </div>
        </div>
      </section>

      <section className="mission-lab section" id="mission-lab">
        <div className="section-title">
          <div><span>01 / MISSION LAB</span><h2>PRACTICE WITH REAL STATES</h2></div>
          <p className="fa" lang="fa" dir="rtl">هر مأموریت از یک وضعیت واقعی شروع می‌شود. هدف این است که قبل از اجرای دستور، بتوانی مقصد فایل و اثر آن روی تاریخچه را پیش‌بینی کنی.</p>
        </div>

        <UsageGuide
          title="از انتخاب مأموریت تا بررسی نتیجه"
          items={[
            { title: "سناریو را انتخاب کن", text: "صورت مسئله را بخوان؛ چهار ناحیه با فایل‌های مخصوص همان مأموریت آماده می‌شوند." },
            { title: "دستور را اجرا کن", text: "فرمان را در Terminal بنویس یا از دکمهٔ پیشنهادشده استفاده کن. مسیر حرکت دقیقاً روی Stateها نمایش داده می‌شود." },
            { title: "State را بررسی کن", text: "فایل‌ها داخل ناحیهٔ مقصد باقی می‌مانند. قبل از قدم بعدی، Working، Staging، Local و Remote را با هم مقایسه کن." },
          ]}
        />

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
                  <div className="fa" lang="fa" dir="rtl"><b>{step.labelFa}</b><code dir="ltr">{step.command}</code><small>{state === "current" ? "قدم بعدی" : state === "done" ? "انجام شد" : "در انتظار"}</small></div>
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
                  <div className="zone-files">
                    <small>FILES IN THIS STATE</small>
                    {zoneFiles[zone.id].length ? zoneFiles[zone.id].map((file) => (
                      <span key={file}><i />{file}</span>
                    )) : <em>NO FILES HERE</em>}
                  </div>
                </div>
                <h3>{zone.title}</h3>
                <p className="fa" lang="fa" dir="rtl">{zone.helperFa}</p>
                {zone.id === "local" && (
                  <div className="zone-meta"><span>HEAD → {currentBranch}</span>{fetchedRef && <span>origin/main fetched</span>}</div>
                )}
                {zone.id === "remote" && <div className="zone-meta"><span>origin/main</span></div>}
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
            {(nextMissionStep ? [nextMissionStep.command, ...genericCommands.slice(0, 5)] : genericCommands).map((item, index) => (
              <button className={nextMissionStep && index === 0 ? "next-command" : ""} key={`${item}-${index}`} onClick={() => executeCommand(item)} type="button">{nextMissionStep && index === 0 ? `NEXT → ${item}` : item}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="graph-section section" id="graph">
        <div className="section-title">
          <div><span>02 / HISTORY LAB</span><h2>BUILD THE COMMIT GRAPH</h2></div>
          <p className="fa" lang="fa" dir="rtl">در این بخش خودت تاریخچه را می‌سازی: Branch یک اشاره‌گر است، Commit یک Node جدید می‌سازد و Merge Commit دو مسیر را به هم متصل می‌کند.</p>
        </div>
        <UsageGuide
          title="گراف را با دستور واقعی بساز"
          items={[
            { title: "آزمایشگاه Branch را آماده کن", text: "دکمهٔ Load را بزن تا یک Commit پایه روی main ساخته شود و فایل app.js برای تغییر آماده باشد." },
            { title: "فرمان روشن را اجرا کن", text: "دستورهای Branch، Add، Commit و Merge به‌ترتیب فعال می‌شوند؛ هر فرمان مستقیماً State و Graph را تغییر می‌دهد." },
            { title: "Node و Pointer را بخوان", text: "دایره‌ها Commit هستند، رنگ‌ها مسیر Branch را نشان می‌دهند و حلقهٔ خط‌چین جای HEAD را مشخص می‌کند." },
          ]}
        />
        <div className="graph-toolbar">
          <div className="branch-legend">
            {branchNames.map((branch) => <span key={branch}><i style={{ background: branchColor(branch) }} />{branch}{branch === currentBranch && <b>HEAD</b>}</span>)}
          </div>
          <button onClick={() => selectScenario(3, false)} type="button">{scenarioIndex === 3 ? "RESET BRANCH LAB" : "LOAD BRANCH LAB"}</button>
        </div>
        <div className="graph-command-lab">
          <header>
            <div><span>GUIDED GRAPH SEQUENCE</span><b>{scenarioIndex === 3 ? `${missionProgress}/${scenarios[3].steps.length} COMPLETE` : "NOT LOADED"}</b></div>
            <p className="fa" lang="fa" dir="rtl">برای ساخت گراف، فرمان فعال را اجرا کن. بعد از هر Commit یک Node تازه همان لحظه ظاهر می‌شود.</p>
          </header>
          <div className="graph-command-sequence">
            {scenarios[3].steps.map((step, index) => {
              const done = scenarioIndex === 3 && index < missionProgress;
              const current = scenarioIndex === 3 && index === missionProgress;
              return (
                <button
                  className={done ? "done" : current ? "current" : "locked"}
                  disabled={!current}
                  key={step.command}
                  onClick={() => executeCommand(step.command)}
                  type="button"
                >
                  <span>{done ? "✓" : String(index + 1).padStart(2, "0")}</span>
                  <code>{step.command}</code>
                </button>
              );
            })}
          </div>
          <footer><span>LAST GRAPH EFFECT</span><b>{lastEffect}</b></footer>
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
                const pointers = branchNames.filter((branch) => branchHeads[branch] === commit.id);
                return (
                  <g key={commit.id}>
                    {isHead && <circle cx={x} cy={y} fill="none" r="24" stroke={color} strokeDasharray="4 5" strokeWidth="2" />}
                    <circle cx={x} cy={y} fill="#061210" r={commit.kind === "merge" ? 13 : 10} stroke={color} strokeWidth="5" />
                    {pointers.map((branch, pointerIndex) => {
                      const pointerWidth = Math.max(92, branch.length * 8 + (branch === currentBranch ? 54 : 24));
                      return (
                        <g className="graph-pointer" key={branch} transform={`translate(${x + 23}, ${y - 53 - pointerIndex * 29})`}>
                          <rect fill="#0b1a15" height="22" rx="5" stroke={branchColor(branch)} width={pointerWidth} />
                          <text fill={branchColor(branch)} x="9" y="15">{branch}{branch === currentBranch ? " • HEAD" : ""}</text>
                        </g>
                      );
                    })}
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
        <div className="section-title">
          <div><span>03 / COURSE QUIZZES</span><h2>TEST YOUR GIT MODEL</h2></div>
          <p className="fa" lang="fa" dir="rtl">یکی از شش بخش ورکشاپ را انتخاب کن. هر بخش ۱۵ سؤال دارد و از مفاهیم پایه شروع می‌شود و به موقعیت‌های چالشی می‌رسد.</p>
        </div>
        <UsageGuide
          title="آزمون متناسب با بخش دوره"
          items={[
            { title: "بخش دوره را انتخاب کن", text: "برای هر سرفصل یک آزمون مستقل ۱۵ سؤالی طراحی شده است؛ امتیاز هر بخش جداگانه محاسبه می‌شود." },
            { title: "سطح سؤال را ببین", text: "پنج سؤال اول Beginner، پنج سؤال بعد Intermediate و پنج سؤال آخر Challenge هستند." },
            { title: "دلیل پاسخ را بخوان", text: "بعد از انتخاب گزینه، فقط درست یا غلط نمی‌بینی؛ توضیح مدل ذهنی درست هم نمایش داده می‌شود." },
          ]}
        />
        <div className="quiz-modules" role="tablist" aria-label="Quiz course sections">
          {quizModules.map((module, index) => (
            <button
              className={quizModuleIndex === index ? "active" : ""}
              key={module.id}
              onClick={() => selectQuizModule(index)}
              role="tab"
              type="button"
            >
              <span>{module.number}</span>
              <div><b>{module.label}</b><strong className="fa" lang="fa" dir="rtl">{module.titleFa}</strong></div>
              <i>15 QUESTIONS</i>
            </button>
          ))}
        </div>
        <div className="quiz-selection-summary">
          <div><span>SELECTED SECTION</span><b>{activeQuizModule.label}</b></div>
          <p className="fa" lang="fa" dir="rtl">{activeQuizModule.descriptionFa}</p>
        </div>
        <div className="quiz-progress"><i style={{ width: `${((quizIndex + 1) / activeQuizQuestions.length) * 100}%` }} /></div>
        <article className="quiz-card">
          <header>
            <span>QUESTION {String(quizIndex + 1).padStart(2, "0")} / {activeQuizQuestions.length}</span>
            <i className={`level-${activeQuizQuestion.level.toLowerCase()}`}>{activeQuizQuestion.level}</i>
            <b>{quizPoints}/{activeQuizQuestions.length} CORRECT</b>
          </header>
          <h3 className="fa" lang="fa" dir="rtl">{activeQuizQuestion.questionFa}</h3>
          <div className="quiz-options">
            {activeQuizQuestion.options.map((option, index) => {
              const answered = quizAnswer !== null;
              const correct = index === activeQuizQuestion.answer;
              const selected = index === quizAnswer;
              const isPersian = /[\u0600-\u06ff]/.test(option);
              return (
                <button
                  className={`${answered && correct ? "correct" : ""} ${answered && selected && !correct ? "wrong" : ""}`}
                  key={option}
                  onClick={() => answerQuiz(index)}
                  type="button"
                >
                  <span>{String.fromCharCode(65 + index)}</span><code className={isPersian ? "fa" : ""} dir={isPersian ? "rtl" : "ltr"}>{option}</code>{answered && correct && <i>✓</i>}
                </button>
              );
            })}
          </div>
          {quizAnswer !== null && (
            <div className={`quiz-feedback ${quizAnswer === activeQuizQuestion.answer ? "good" : "bad"}`}>
              <b>{quizAnswer === activeQuizQuestion.answer ? "CORRECT • +25 XP" : "NOT QUITE • READ THE EXPLANATION"}</b>
              <p className="fa" lang="fa" dir="rtl">{activeQuizQuestion.whyFa}</p>
            </div>
          )}
          <footer><span>{activeQuizModule.number} • {activeQuizModule.label}</span><button disabled={quizAnswer === null} onClick={nextQuiz} type="button">{quizIndex === activeQuizQuestions.length - 1 ? "RESTART SECTION ↻" : "NEXT QUESTION →"}</button></footer>
        </article>
      </section>

      <section className="roadmap-section section">
        <div className="section-title">
          <div><span>04 / LEARNING PATH</span><h2>YOUR WORKSHOP ROADMAP</h2></div>
          <p className="fa" lang="fa" dir="rtl">این نقشه ترتیب یادگیری دوره را نشان می‌دهد؛ هر مرحله روی دانشی ساخته می‌شود که در مرحلهٔ قبل تمرین کرده‌ای.</p>
        </div>
        <figure><img src="/course-roadmap.png" alt="نقشه راه فارسی ورکشاپ Git و GitHub" /><figcaption>THE COMPLETE WORKSHOP ROADMAP</figcaption></figure>
      </section>

      <section className="reference-section section" id="reference">
        <div className="section-title">
          <div><span>05 / COMMAND REFERENCE</span><h2>UNDERSTAND EACH COMMAND</h2></div>
          <p className="fa" lang="fa" dir="rtl">این بخش فقط فهرست دستورها نیست؛ برای هر فرمان می‌بینی از کدام State می‌خواند، کدام State را تغییر می‌دهد و چه زمانی باید با احتیاط اجرا شود.</p>
        </div>
        <UsageGuide
          title="از Reference برای مرور و تمرین استفاده کن"
          items={[
            { title: "گروه را محدود کن", text: "با انتخاب Setup، Local، Undo، Branch، Remote یا Team فقط دستورهای همان موضوع را ببین." },
            { title: "اثر State را بخوان", text: "عبارت State Effect مسیر واقعی دستور را خلاصه می‌کند؛ قبل از کپی‌کردن، آن را پیش‌بینی کن." },
            { title: "سطح ریسک را جدی بگیر", text: "Safe فقط می‌خواند یا تغییر قابل بازگشت دارد؛ Careful نیازمند بررسی است و Danger می‌تواند تاریخچه یا داده را بازنویسی کند." },
          ]}
        />
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
        <div className="brand"><span className="brand-cube">G</span><span><b>GIT STATE LAB</b><small>Learn by doing, verify by state</small></span></div>
        <div className="footer-credit"><span>WORKSHOP INSTRUCTOR</span><b className="fa" lang="fa" dir="rtl">شکوفه اکبری</b><p className="fa" lang="fa" dir="rtl">طراحی‌شده برای یادگیری عملی Git و GitHub</p></div>
        <a href="#top">BACK TO TOP ↑</a>
      </footer>
    </main>
  );
}
