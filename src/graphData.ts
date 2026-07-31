export type GraphScenario = {
  id: string;
  label: string;
  titleFa: string;
  descriptionFa: string;
  concept: string;
  commands: string[];
};

export const graphScenarios: GraphScenario[] = [
  {
    id: "real-feature",
    label: "REAL FEATURE FLOW",
    titleFa: "تاریخچهٔ واقعی با دو شاخهٔ فعال",
    descriptionFa: "چند Commit روی main بساز، Feature را جدا کن، روی هر دو شاخه تغییر ثبت کن و در پایان یک Merge Commit واقعی بساز.",
    concept: "DIVERGENCE + NO-FF MERGE",
    commands: [
      "git commit -m \"chore: bootstrap project\"",
      "git commit -m \"docs: add project guide\"",
      "git switch -c feature/auth",
      "git commit -m \"feat: add auth form\"",
      "git commit -m \"test: cover auth form\"",
      "git switch main",
      "git commit -m \"fix: production config\"",
      "git switch feature/auth",
      "git commit -m \"feat: validate credentials\"",
      "git switch main",
      "git merge --no-ff feature/auth",
    ],
  },
  {
    id: "fast-forward",
    label: "FAST-FORWARD",
    titleFa: "ادغام بدون Merge Commit",
    descriptionFa: "بعد از ساخت Feature، شاخهٔ main تغییر نمی‌کند؛ بنابراین Merge فقط Pointer شاخه را جلو می‌برد.",
    concept: "POINTER MOVE • NO NEW NODE",
    commands: [
      "git commit -m \"chore: initial project\"",
      "git switch -c feature/search",
      "git commit -m \"feat: add search input\"",
      "git commit -m \"test: add search tests\"",
      "git switch main",
      "git merge feature/search",
    ],
  },
  {
    id: "three-way",
    label: "THREE-WAY MERGE",
    titleFa: "ادغام دو تاریخچهٔ واگرا",
    descriptionFa: "main و Feature هر دو بعد از جداشدن Commit دارند؛ Merge معمولی برای اتصال آن‌ها یک Node با دو Parent می‌سازد.",
    concept: "DIVERGED HISTORY + MERGE NODE",
    commands: [
      "git commit -m \"chore: baseline\"",
      "git switch -c feature/cart",
      "git commit -m \"feat: add cart\"",
      "git switch main",
      "git commit -m \"fix: update pricing\"",
      "git switch feature/cart",
      "git commit -m \"test: cover cart\"",
      "git switch main",
      "git merge feature/cart",
    ],
  },
  {
    id: "squash",
    label: "SQUASH MERGE",
    titleFa: "تبدیل چند Commit به یک Snapshot نهایی",
    descriptionFa: "Commitهای آزمایشی Feature در Graph باقی می‌مانند اما main فقط یک Commit تجمیعی و بدون Parent دوم دریافت می‌کند.",
    concept: "COMBINE CHANGES • SINGLE PARENT",
    commands: [
      "git commit -m \"chore: baseline\"",
      "git switch -c feature/dashboard",
      "git commit -m \"wip: dashboard shell\"",
      "git commit -m \"wip: dashboard cards\"",
      "git commit -m \"test: dashboard widgets\"",
      "git switch main",
      "git merge --squash feature/dashboard",
    ],
  },
  {
    id: "rebase",
    label: "REBASE",
    titleFa: "بازسازی Feature روی نوک main",
    descriptionFa: "پس از جلو رفتن main، Commitهای Feature با Hashهای جدید روی پایهٔ تازه بازسازی می‌شوند.",
    concept: "REWRITE FEATURE HISTORY",
    commands: [
      "git commit -m \"chore: baseline\"",
      "git switch -c feature/profile",
      "git commit -m \"feat: add profile\"",
      "git commit -m \"test: cover profile\"",
      "git switch main",
      "git commit -m \"fix: update api client\"",
      "git switch feature/profile",
      "git rebase main",
      "git switch main",
      "git merge feature/profile",
    ],
  },
];
