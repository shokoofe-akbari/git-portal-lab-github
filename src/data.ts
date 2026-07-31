export type ZoneKey = "working" | "staging" | "local" | "remote";

export type SeedCommit = {
  id: string;
  message: string;
  branch: string;
  parents: string[];
  kind?: "commit" | "merge" | "revert";
};

export type ScenarioStep = {
  labelFa: string;
  command: string;
  match: RegExp;
};

export type Scenario = {
  id: string;
  label: string;
  level: string;
  reward: number;
  titleFa: string;
  briefFa: string;
  objectiveFa: string;
  seed: {
    initialized: boolean;
    working: string[];
    staging: string[];
    local: string[];
    remote: string[];
    currentBranch: string;
    branches: string[];
    commits: SeedCommit[];
  };
  steps: ScenarioStep[];
};

export const zones: Array<{
  id: ZoneKey;
  number: string;
  title: string;
  helperFa: string;
  color: string;
  glyph: string;
}> = [
  { id: "working", number: "01", title: "WORKING DIRECTORY", helperFa: "فایل‌های در حال ویرایش", color: "#35c8ff", glyph: "⌑" },
  { id: "staging", number: "02", title: "STAGING AREA", helperFa: "انتخاب برای کامیت بعدی", color: "#ffbd45", glyph: "▦" },
  { id: "local", number: "03", title: "LOCAL REPOSITORY", helperFa: "تاریخچه و اسنپ‌شات‌ها", color: "#b96cff", glyph: "◇" },
  { id: "remote", number: "04", title: "GITHUB REMOTE", helperFa: "نسخهٔ اشتراکی آنلاین", color: "#51ed87", glyph: "⬡" },
];

export const scenarios: Scenario[] = [
  {
    id: "sandbox",
    label: "FREE PLAY",
    level: "Sandbox",
    reward: 0,
    titleFa: "آزمایشگاه آزاد",
    briefFa: "هر دستوری که می‌خواهی امتحان کن و اثر واقعی آن را روی چهار ناحیه ببین.",
    objectiveFa: "با git init شروع کن یا از پیشنهادهای ترمینال کمک بگیر.",
    seed: {
      initialized: false,
      working: ["index.html", "app.js", "style.css"],
      staging: [],
      local: [],
      remote: [],
      currentBranch: "main",
      branches: ["main"],
      commits: [],
    },
    steps: [],
  },
  {
    id: "first-release",
    label: "MISSION 01",
    level: "Beginner",
    reward: 120,
    titleFa: "اولین انتشار پروژه",
    briefFa: "سه فایل آماده داری اما هنوز Git آن‌ها را دنبال نمی‌کند. پروژه را به یک Repository تبدیل کن، Snapshot بساز و نسخهٔ اول را روی GitHub بفرست.",
    objectiveFa: "هدف: هر سه فایل باید در Remote دیده شوند و گراف حداقل یک Commit داشته باشد.",
    seed: {
      initialized: false,
      working: ["index.html", "app.js", "style.css"],
      staging: [],
      local: [],
      remote: [],
      currentBranch: "main",
      branches: ["main"],
      commits: [],
    },
    steps: [
      { labelFa: "ساخت Repository", command: "git init", match: /^git init$/ },
      { labelFa: "انتخاب همهٔ فایل‌ها", command: "git add .", match: /^git add \.$/ },
      { labelFa: "ساخت Snapshot", command: "git commit -m \"feat: first release\"", match: /^git commit(?:\s|$)/ },
      { labelFa: "ارسال به GitHub", command: "git push -u origin main", match: /^git push(?:\s|$)/ },
    ],
  },
  {
    id: "staging-rescue",
    label: "MISSION 02",
    level: "Intermediate",
    reward: 160,
    titleFa: "نجات از Stage اشتباه",
    briefFa: "فایل app.js اشتباهی Stage شده است؛ تغییر آن باید حفظ شود اما نباید داخل Commit مستندات قرار بگیرد. فقط README.md را Commit کن.",
    objectiveFa: "هدف: app.js به Working Directory برگردد و README.md به Local Repository برسد.",
    seed: {
      initialized: true,
      working: ["README.md"],
      staging: ["app.js"],
      local: ["index.html", "app.js"],
      remote: ["index.html", "app.js"],
      currentBranch: "main",
      branches: ["main"],
      commits: [{ id: "a41d2c0", message: "chore: project setup", branch: "main", parents: [] }],
    },
    steps: [
      { labelFa: "خارج‌کردن app.js از Stage", command: "git restore --staged app.js", match: /^git restore --staged app\.js$/ },
      { labelFa: "انتخاب README", command: "git add README.md", match: /^git add README\.md$/ },
      { labelFa: "Commit مستندات", command: "git commit -m \"docs: update readme\"", match: /^git commit(?:\s|$)/ },
    ],
  },
  {
    id: "feature-branch",
    label: "MISSION 03",
    level: "Advanced",
    reward: 240,
    titleFa: "توسعهٔ Feature روی Branch مستقل",
    briefFa: "تغییر احراز هویت داخل app.js آماده است. یک شاخهٔ feature/auth بساز، تغییر را Commit کن، به main برگرد، با Merge Commit ادغام کن و نتیجه را Push کن.",
    objectiveFa: "هدف: گراف باید شاخهٔ Feature، Commit آن و یک Merge Commit با دو والد را نمایش دهد.",
    seed: {
      initialized: true,
      working: ["app.js"],
      staging: [],
      local: ["index.html", "app.js"],
      remote: ["index.html", "app.js"],
      currentBranch: "main",
      branches: ["main"],
      commits: [{ id: "b709ae1", message: "chore: project baseline", branch: "main", parents: [] }],
    },
    steps: [
      { labelFa: "ساخت و ورود به Feature", command: "git switch -c feature/auth", match: /^git (?:switch -c|checkout -b) feature\/auth$/ },
      { labelFa: "Stage کردن app.js", command: "git add app.js", match: /^git add app\.js$/ },
      { labelFa: "Commit روی Feature", command: "git commit -m \"feat: add auth\"", match: /^git commit(?:\s|$)/ },
      { labelFa: "بازگشت به main", command: "git switch main", match: /^git (?:switch|checkout) main$/ },
      { labelFa: "ساخت Merge Commit", command: "git merge --no-ff feature/auth", match: /^git merge --no-ff feature\/auth$/ },
      { labelFa: "Push شاخهٔ main", command: "git push origin main", match: /^git push(?:\s|$)/ },
    ],
  },
];

export type CommandReference = {
  group: string;
  command: string;
  titleFa: string;
  explanationFa: string;
  movement: string;
  risk: "SAFE" | "CAREFUL" | "DANGER";
};

export const commandReferences: CommandReference[] = [
  { group: "SETUP", command: "git --version", titleFa: "بررسی نصب Git", explanationFa: "نسخهٔ نصب‌شده را نشان می‌دهد و هیچ بخشی از Repository را تغییر نمی‌دهد.", movement: "READ ONLY", risk: "SAFE" },
  { group: "SETUP", command: "git config --global user.name \"Your Name\"", titleFa: "تنظیم نام نویسنده", explanationFa: "نامی که داخل Metadata هر Commit ثبت می‌شود.", movement: "GLOBAL CONFIG", risk: "SAFE" },
  { group: "SETUP", command: "git config --global user.email \"you@example.com\"", titleFa: "تنظیم ایمیل نویسنده", explanationFa: "GitHub با این ایمیل Commitها را به حساب کاربری مرتبط می‌کند.", movement: "GLOBAL CONFIG", risk: "SAFE" },
  { group: "LOCAL", command: "git init", titleFa: "ساخت Repository", explanationFa: "پوشهٔ مخفی .git و ساختار تاریخچه را ایجاد می‌کند.", movement: "FOLDER → REPOSITORY", risk: "SAFE" },
  { group: "LOCAL", command: "git status", titleFa: "دیدن وضعیت", explanationFa: "تغییرهای Working، فایل‌های Stage و شاخهٔ فعلی را بدون تغییر State گزارش می‌کند.", movement: "READ ALL ZONES", risk: "SAFE" },
  { group: "LOCAL", command: "git add app.js", titleFa: "Stage یک فایل", explanationFa: "Snapshot محتوای فعلی فایل را برای Commit بعدی داخل Index می‌گذارد.", movement: "WORKING → STAGING", risk: "SAFE" },
  { group: "LOCAL", command: "git add .", titleFa: "Stage همهٔ تغییرها", explanationFa: "تمام تغییرهای مسیر فعلی را انتخاب می‌کند؛ قبل از آن Status و Diff را بررسی کن.", movement: "WORKING → STAGING", risk: "CAREFUL" },
  { group: "LOCAL", command: "git commit -m \"feat: add login\"", titleFa: "ساخت Snapshot", explanationFa: "فقط محتوای Stage را در تاریخچهٔ Local ثبت و Pointer شاخه را جلو می‌برد.", movement: "STAGING → LOCAL", risk: "SAFE" },
  { group: "LOCAL", command: "git diff", titleFa: "دیدن تغییرهای Stageنشده", explanationFa: "اختلاف Working Directory با Index را نمایش می‌دهد.", movement: "WORKING ↔ STAGING", risk: "SAFE" },
  { group: "LOCAL", command: "git diff --staged", titleFa: "بازبینی Commit بعدی", explanationFa: "اختلاف Stage با آخرین Commit را نشان می‌دهد.", movement: "STAGING ↔ LOCAL", risk: "SAFE" },
  { group: "LOCAL", command: "git log --oneline --graph --all", titleFa: "دیدن تاریخچه", explanationFa: "Commitها، Branchها، HEAD و رابطهٔ والدها را فشرده نمایش می‌دهد.", movement: "READ LOCAL HISTORY", risk: "SAFE" },
  { group: "UNDO", command: "git restore --staged app.js", titleFa: "خارج‌کردن از Stage", explanationFa: "فایل را از Commit بعدی خارج می‌کند اما تغییرهای آن حفظ می‌شوند.", movement: "STAGING → WORKING", risk: "SAFE" },
  { group: "UNDO", command: "git restore app.js", titleFa: "حذف تغییر محلی", explanationFa: "Working copy را با نسخهٔ Index جایگزین می‌کند؛ تغییر ذخیره‌نشده از بین می‌رود.", movement: "LOCAL/INDEX → WORKING", risk: "DANGER" },
  { group: "UNDO", command: "git reset --soft HEAD~1", titleFa: "بازکردن Commit و حفظ Stage", explanationFa: "Pointer شاخه عقب می‌رود اما فایل‌ها در Staging باقی می‌مانند.", movement: "LOCAL → STAGING", risk: "CAREFUL" },
  { group: "UNDO", command: "git reset HEAD~1", titleFa: "Mixed Reset", explanationFa: "Commit را باز می‌کند و تغییرها را به Working Directory برمی‌گرداند.", movement: "LOCAL → WORKING", risk: "CAREFUL" },
  { group: "UNDO", command: "git reset --hard HEAD~1", titleFa: "Hard Reset", explanationFa: "HEAD، Index و Working Tree را بازنویسی می‌کند و می‌تواند داده را حذف کند.", movement: "DELETE LOCAL CHANGES", risk: "DANGER" },
  { group: "UNDO", command: "git revert HEAD", titleFa: "بازگردانی امن Commit", explanationFa: "یک Commit تازه می‌سازد که اثر Commit قبلی را خنثی می‌کند.", movement: "NEW LOCAL COMMIT", risk: "SAFE" },
  { group: "BRANCH", command: "git branch", titleFa: "فهرست Branchها", explanationFa: "نام Branchها و شاخه‌ای که HEAD روی آن قرار دارد را نشان می‌دهد.", movement: "READ BRANCH POINTERS", risk: "SAFE" },
  { group: "BRANCH", command: "git switch -c feature/auth", titleFa: "ساخت Branch", explanationFa: "Pointer جدیدی از HEAD فعلی می‌سازد و روی آن قرار می‌گیرد.", movement: "NEW BRANCH POINTER", risk: "SAFE" },
  { group: "BRANCH", command: "git switch main", titleFa: "تعویض Branch", explanationFa: "HEAD و Working Tree را با Snapshot شاخهٔ مقصد هماهنگ می‌کند.", movement: "LOCAL → WORKING", risk: "CAREFUL" },
  { group: "BRANCH", command: "git merge --no-ff feature/auth", titleFa: "Merge Commit واقعی", explanationFa: "یک Node جدید با دو Parent می‌سازد و تاریخچهٔ دو شاخه را به هم متصل می‌کند.", movement: "BRANCH → BRANCH", risk: "CAREFUL" },
  { group: "BRANCH", command: "git rebase main", titleFa: "بازپایه‌گذاری", explanationFa: "Commitهای شاخه را روی نوک main دوباره می‌سازد و Hashها را عوض می‌کند.", movement: "REWRITE LOCAL HISTORY", risk: "DANGER" },
  { group: "BRANCH", command: "git cherry-pick a1b2c3d", titleFa: "انتخاب یک Commit", explanationFa: "اثر یک Commit مشخص را به‌صورت Commit تازه روی شاخهٔ فعلی اعمال می‌کند.", movement: "COMMIT → CURRENT BRANCH", risk: "CAREFUL" },
  { group: "BRANCH", command: "git stash", titleFa: "ذخیرهٔ موقت", explanationFa: "تغییرهای Working را موقتاً کنار می‌گذارد تا Context عوض شود.", movement: "WORKING → STASH", risk: "CAREFUL" },
  { group: "BRANCH", command: "git tag -a v1.0.0 -m \"release\"", titleFa: "برچسب نسخه", explanationFa: "یک نام پایدار و Metadataدار روی Commit قرار می‌دهد.", movement: "TAG → LOCAL COMMIT", risk: "SAFE" },
  { group: "REMOTE", command: "git remote add origin REPOSITORY_URL", titleFa: "تعریف Remote", explanationFa: "فقط نام origin را به URL وصل می‌کند و هنوز چیزی Upload نمی‌شود.", movement: "CONNECT LOCAL ↔ REMOTE", risk: "SAFE" },
  { group: "REMOTE", command: "git clone REPOSITORY_URL", titleFa: "دریافت کامل پروژه", explanationFa: "تاریخچه، Remote و Working Tree را در یک عملیات می‌سازد.", movement: "REMOTE → LOCAL + WORKING", risk: "SAFE" },
  { group: "REMOTE", command: "git push -u origin main", titleFa: "اولین Push", explanationFa: "Commitهای Local را می‌فرستد و Upstream شاخه را تنظیم می‌کند.", movement: "LOCAL → REMOTE", risk: "SAFE" },
  { group: "REMOTE", command: "git fetch origin", titleFa: "دریافت بدون ادغام", explanationFa: "فقط Refها و Objectهای Remote را می‌آورد؛ Working Tree تغییر نمی‌کند.", movement: "REMOTE → LOCAL REFS", risk: "SAFE" },
  { group: "REMOTE", command: "git pull --rebase origin main", titleFa: "دریافت و بازپایه‌گذاری", explanationFa: "ابتدا Fetch و سپس Commitهای محلی را روی تاریخچهٔ جدید بازسازی می‌کند.", movement: "REMOTE → LOCAL → WORKING", risk: "CAREFUL" },
  { group: "REMOTE", command: "git push --force-with-lease", titleFa: "Force محافظت‌شده", explanationFa: "فقط وقتی Remote تغییر نکرده باشد تاریخچهٔ جدید را Push می‌کند.", movement: "REWRITE REMOTE", risk: "DANGER" },
  { group: "TEAM", command: "gh pr create --fill", titleFa: "ساخت Pull Request", explanationFa: "از Branch فعلی Pull Request می‌سازد تا Review و Check انجام شود.", movement: "REMOTE BRANCH → PR", risk: "SAFE" },
];
