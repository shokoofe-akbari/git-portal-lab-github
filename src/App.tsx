import { FormEvent, useMemo, useRef, useState } from "react";

type ZoneKey = "working" | "staging" | "local" | "remote";
type FlowKey =
  | "working-staging"
  | "staging-working"
  | "staging-local"
  | "local-staging"
  | "local-remote"
  | "remote-local"
  | "remote-working"
  | "idle";

type TerminalLine = {
  id: number;
  kind: "command" | "success" | "info" | "warning" | "error";
  text: string;
};

type CommitNode = {
  id: string;
  message: string;
  branch: string;
  type: "commit" | "merge" | "rebase" | "revert" | "cherry-pick";
};

type CommandDoc = {
  group: "شروع" | "محلی" | "شاخه" | "ریموت" | "تیمی" | "اکشن";
  title: string;
  command: string;
  summary: string;
  deep: string;
  effect: string;
  risk?: "safe" | "careful" | "danger";
};

const zones: Array<{
  id: ZoneKey;
  eyebrow: string;
  title: string;
  icon: string;
  hint: string;
  color: string;
}> = [
  {
    id: "working",
    eyebrow: "درِ اول",
    title: "پوشهٔ کاری",
    icon: "◰",
    hint: "فایل‌هایی که همین حالا تغییر می‌دهی",
    color: "#43c8ff",
  },
  {
    id: "staging",
    eyebrow: "درِ دوم",
    title: "Staging Area",
    icon: "▦",
    hint: "تغییرهای آماده برای Commit بعدی",
    color: "#ffbd3d",
  },
  {
    id: "local",
    eyebrow: "درِ سوم",
    title: "Local Repository",
    icon: "◇",
    hint: "تاریخچه و Commitهای ذخیره‌شده",
    color: "#bd66ff",
  },
  {
    id: "remote",
    eyebrow: "درِ چهارم",
    title: "GitHub Remote",
    icon: "⬡",
    hint: "نسخهٔ آنلاین برای همکاری تیمی",
    color: "#5df28a",
  },
];

const quickCommands = [
  "git init",
  "git status",
  "git add .",
  'git commit -m "first commit"',
  "git push",
  "git fetch",
  "git pull",
  "git log --oneline",
];

const courseSteps = [
  ["01", "مبانی و راه‌اندازی", "Git چیست، نصب، تنظیمات اولیه و آشنایی با GitHub"],
  ["02", "کار محلی با Git", "Repository، Commit، History، Status، Diff و بازیابی"],
  ["03", "Branch و Merge", "شاخه‌ها، Conflict، Rebase، Squash، Tag و Stash"],
  ["04", "Remote و GitHub", "Origin، Clone، Push، Pull، Fetch و خطاهای اتصال"],
  ["05", "همکاری تیمی", "Pull Request، Review، Issues، Fork و جریان مشارکت"],
  ["06", "GitHub Actions", "Workflow، Trigger، Job، Step و اتوماسیون Build/Test"],
];

const commandDocs: CommandDoc[] = [
  { group: "شروع", title: "بررسی نسخه", command: "git --version", summary: "نسخهٔ نصب‌شدهٔ Git را نمایش می‌دهد.", deep: "اولین تست برای اطمینان از نصب درست و قابل دسترس بودن Git در PATH است.", effect: "وضعیت چهار ناحیه را تغییر نمی‌دهد.", risk: "safe" },
  { group: "شروع", title: "نام نویسنده", command: "git config --global user.name \"Your Name\"", summary: "نام ثبت‌شونده در Commitها را تنظیم می‌کند.", deep: "این مقدار بخشی از هویت هر Commit است؛ با نام کاربری GitHub یکی نیست، اما بهتر است قابل‌شناسایی باشد.", effect: "تنظیم سراسری؛ بدون جابه‌جایی فایل.", risk: "safe" },
  { group: "شروع", title: "ایمیل نویسنده", command: "git config --global user.email \"you@example.com\"", summary: "ایمیل نویسندهٔ Commit را مشخص می‌کند.", deep: "GitHub با تطبیق این ایمیل، Commit را به پروفایل شما متصل می‌کند. می‌توان از ایمیل noreply نیز استفاده کرد.", effect: "تنظیم سراسری؛ بدون تغییر Repository.", risk: "safe" },
  { group: "شروع", title: "ساخت Repository", command: "git init", summary: "پوشهٔ فعلی را به Repository تبدیل می‌کند.", deep: "Git پوشهٔ مخفی .git را می‌سازد؛ تمام تاریخچه، Refها و تنظیمات محلی داخل آن نگهداری می‌شوند.", effect: "Working Directory → Repository قابل‌ردیابی", risk: "safe" },
  { group: "شروع", title: "ساخت Alias", command: "git config --global alias.lg \"log --oneline --graph --all\"", summary: "برای یک دستور طولانی نام کوتاه می‌سازد.", deep: "Alias فقط میان‌بر متنی است و رفتار اصلی Git را تغییر نمی‌دهد. این نمونه با git lg اجرا می‌شود.", effect: "تنظیم سراسری؛ بدون تغییر فایل.", risk: "safe" },
  { group: "محلی", title: "وضعیت Repository", command: "git status", summary: "وضعیت فایل‌های تغییرکرده، Stage و شاخه را نشان می‌دهد.", deep: "قبل و بعد از هر عملیات مهم اجرا کن؛ status چیزی را تغییر نمی‌دهد و امن‌ترین ابزار تشخیص است.", effect: "فقط مشاهدهٔ Working و Staging.", risk: "safe" },
  { group: "محلی", title: "Stage یک فایل", command: "git add app.js", summary: "نسخهٔ فعلی یک فایل را برای Commit بعدی انتخاب می‌کند.", deep: "Git خود فایل را جابه‌جا نمی‌کند؛ Snapshot محتوای فعلی را در Index می‌گذارد. تغییر بعدی همان فایل دوباره Unstaged می‌شود.", effect: "Working Directory → Staging Area", risk: "safe" },
  { group: "محلی", title: "Stage همهٔ تغییرها", command: "git add .", summary: "تغییرهای مسیر فعلی را Stage می‌کند.", deep: "قبل از اجرا status و diff را ببین تا فایل ناخواسته، Secret یا خروجی Build وارد Commit نشود.", effect: "Working Directory → Staging Area", risk: "careful" },
  { group: "محلی", title: "ثبت Snapshot", command: "git commit -m \"feat: add login\"", summary: "تغییرهای Stageشده را در تاریخچه ثبت می‌کند.", deep: "Commit فقط محتوای Stage را ذخیره می‌کند، نه همهٔ فایل‌های تغییرکرده. هر Commit به والد قبلی اشاره می‌کند.", effect: "Staging Area → Local Repository", risk: "safe" },
  { group: "محلی", title: "دیدن تغییرها", command: "git diff", summary: "تفاوت Working Directory با Stage را نمایش می‌دهد.", deep: "برای دیدن تغییرهای Stageشده باید از --staged استفاده کنی؛ diff معمولی آن‌ها را نشان نمی‌دهد.", effect: "مشاهدهٔ Working ↔ Staging", risk: "safe" },
  { group: "محلی", title: "دیدن تغییرهای Stage", command: "git diff --staged", summary: "محتوای دقیق Commit بعدی را نشان می‌دهد.", deep: "بهترین کنترل نهایی پیش از Commit است؛ خروجی دقیقاً اختلاف Index با آخرین Commit را نمایش می‌دهد.", effect: "مشاهدهٔ Staging ↔ Local", risk: "safe" },
  { group: "محلی", title: "تاریخچهٔ فشرده", command: "git log --oneline --graph --all", summary: "Commitها و شاخه‌ها را به‌صورت گراف فشرده می‌بیند.", deep: "HEAD محل فعلی شماست، نام شاخه یک Pointer متحرک است و Hash شناسهٔ محتوایی Commit است.", effect: "مشاهدهٔ Local Repository", risk: "safe" },
  { group: "محلی", title: "لغو تغییر فایل", command: "git restore app.js", summary: "تغییر Stageنشدهٔ فایل را کنار می‌گذارد.", deep: "محتوای Working Directory با نسخهٔ Index جایگزین می‌شود. تغییرهای ذخیره‌نشده معمولاً قابل‌بازیابی نیستند.", effect: "Staging/HEAD → Working Directory", risk: "danger" },
  { group: "محلی", title: "خارج کردن از Stage", command: "git restore --staged app.js", summary: "فایل را از Commit بعدی خارج می‌کند.", deep: "تغییرهای داخل فایل باقی می‌مانند؛ فقط Snapshot آن از Index برداشته می‌شود.", effect: "Staging Area → Working Directory", risk: "safe" },
  { group: "محلی", title: "Reset نرم", command: "git reset --soft HEAD~1", summary: "آخرین Commit را باز می‌کند و تغییرها را Stage نگه می‌دارد.", deep: "Pointer شاخه عقب می‌رود، اما Index و Working Tree دست‌نخورده می‌مانند؛ برای اصلاح Commit اخیر مناسب است.", effect: "Local Repository → Staging Area", risk: "careful" },
  { group: "محلی", title: "Reset معمولی", command: "git reset HEAD~1", summary: "Commit را باز می‌کند و تغییرها را از Stage خارج می‌کند.", deep: "حالت پیش‌فرض mixed است: HEAD و Index تغییر می‌کنند، اما فایل‌های Working Directory حفظ می‌شوند.", effect: "Local Repository → Working Directory", risk: "careful" },
  { group: "محلی", title: "Reset سخت", command: "git reset --hard HEAD~1", summary: "Commit و تغییرهای محلی را کنار می‌گذارد.", deep: "HEAD، Index و Working Tree همزمان بازنویسی می‌شوند. روی تاریخچهٔ Pushشده یا کار بازیابی‌نشده بسیار خطرناک است.", effect: "حذف تغییر از Local، Stage و Working", risk: "danger" },
  { group: "محلی", title: "برگرداندن امن Commit", command: "git revert HEAD", summary: "Commit جدیدی می‌سازد که اثر Commit قبلی را خنثی می‌کند.", deep: "تاریخچه بازنویسی نمی‌شود؛ به همین دلیل برای شاخه‌های اشتراکی از reset امن‌تر است.", effect: "Commit جدید در Local Repository", risk: "safe" },
  { group: "محلی", title: "نادیده گرفتن فایل‌ها", command: "printf \"node_modules/\\n.env\\n\" >> .gitignore", summary: "الگوهای فایل‌های خارج از کنترل نسخه را ثبت می‌کند.", deep: ".gitignore روی فایل‌هایی که قبلاً Track شده‌اند اثر ندارد؛ برای آن‌ها ابتدا git rm --cached لازم است.", effect: "فیلتر Working Directory", risk: "careful" },
  { group: "شاخه", title: "فهرست شاخه‌ها", command: "git branch", summary: "شاخه‌ها و شاخهٔ فعلی را نمایش می‌دهد.", deep: "شاخه در Git فقط یک نام متحرک روی آخرین Commit است؛ ستاره شاخه‌ای را نشان می‌دهد که HEAD به آن متصل است.", effect: "مشاهدهٔ Pointerهای Local", risk: "safe" },
  { group: "شاخه", title: "ساخت و ورود به شاخه", command: "git switch -c feature/login", summary: "شاخهٔ جدید می‌سازد و HEAD را روی آن می‌برد.", deep: "شاخه از Commit فعلی منشعب می‌شود؛ Commitهای بعدی فقط Pointer همین شاخه را جلو می‌برند.", effect: "ساخت Branch Pointer در Local", risk: "safe" },
  { group: "شاخه", title: "تعویض شاخه", command: "git switch main", summary: "HEAD و فایل‌های کاری را روی شاخهٔ مقصد می‌برد.", deep: "Git ممکن است با وجود تغییرهای ناسازگار اجازهٔ Switch ندهد؛ ابتدا Commit یا Stash کن.", effect: "Local Repository → Working Directory", risk: "careful" },
  { group: "شاخه", title: "ادغام شاخه", command: "git merge feature/login", summary: "تاریخچهٔ شاخهٔ مقصد را وارد شاخهٔ فعلی می‌کند.", deep: "اگر مسیر خطی باشد Fast-forward رخ می‌دهد؛ در غیر این صورت Merge Commit با دو والد ساخته می‌شود.", effect: "Branch → Branch در Local", risk: "careful" },
  { group: "شاخه", title: "بازپایه‌گذاری", command: "git rebase main", summary: "Commitهای شاخه را روی نوک main دوباره می‌سازد.", deep: "Hash Commitها عوض می‌شود؛ روی Commitهای اشتراکی Rebase نکن، چون تاریخچه را بازنویسی می‌کند.", effect: "بازنویسی تاریخچهٔ Local", risk: "danger" },
  { group: "شاخه", title: "Squash تعاملی", command: "git rebase -i HEAD~3", summary: "چند Commit اخیر را مرتب، اصلاح یا یکی می‌کند.", deep: "در فهرست تعاملی pick را به squash یا fixup تغییر می‌دهی. نتیجه تاریخچه‌ای خواناتر اما با Hashهای جدید است.", effect: "بازنویسی چند Commit محلی", risk: "danger" },
  { group: "شاخه", title: "انتخاب یک Commit", command: "git cherry-pick a1b2c3d", summary: "اثر یک Commit مشخص را روی شاخهٔ فعلی اعمال می‌کند.", deep: "Commit تازه‌ای با والد و Hash جدید ساخته می‌شود؛ برای انتقال اصلاح کوچک میان شاخه‌ها مناسب است.", effect: "Commit منتخب → Branch فعلی", risk: "careful" },
  { group: "شاخه", title: "ذخیرهٔ موقت", command: "git stash", summary: "تغییرهای Trackشده را موقتاً کنار می‌گذارد.", deep: "برای تعویض سریع Context مفید است، اما جای Commit را نمی‌گیرد. با -u فایل‌های Untracked هم ذخیره می‌شوند.", effect: "Working Directory → Stash", risk: "careful" },
  { group: "شاخه", title: "بازگردانی Stash", command: "git stash pop", summary: "آخرین Stash را اعمال و از فهرست حذف می‌کند.", deep: "اگر تغییرهای فعلی ناسازگار باشند Conflict ایجاد می‌شود. apply برخلاف pop ورودی Stash را نگه می‌دارد.", effect: "Stash → Working Directory", risk: "careful" },
  { group: "شاخه", title: "نسخه‌گذاری", command: "git tag -a v1.0.0 -m \"first release\"", summary: "برای یک Commit نام نسخهٔ پایدار می‌سازد.", deep: "Annotated Tag شامل نویسنده، تاریخ و پیام است. Tagها با Push عادی ارسال نمی‌شوند مگر نامشان یا --tags را بدهی.", effect: "برچسب روی Commit محلی", risk: "safe" },
  { group: "شاخه", title: "ردیابی نویسندهٔ خط", command: "git blame app.js", summary: "آخرین Commit و نویسندهٔ هر خط را نشان می‌دهد.", deep: "ابزار سرزنش نیست؛ برای پیدا کردن Context تغییر و سپس خواندن Commit مربوط استفاده می‌شود.", effect: "مشاهدهٔ تاریخچهٔ فایل", risk: "safe" },
  { group: "ریموت", title: "دیدن Remoteها", command: "git remote -v", summary: "نام و آدرس Fetch/Push ریموت‌ها را نمایش می‌دهد.", deep: "origin فقط نام قراردادی Remote پیش‌فرض است و معنای ویژه‌ای در هستهٔ Git ندارد.", effect: "مشاهدهٔ اتصال Local ↔ Remote", risk: "safe" },
  { group: "ریموت", title: "افزودن origin", command: "git remote add origin https://github.com/user/repo.git", summary: "Repository محلی را به آدرس GitHub متصل می‌کند.", deep: "این کار چیزی Upload نمی‌کند؛ فقط نام origin را به URL نگاشت می‌کند. Push مرحلهٔ جداگانه است.", effect: "ایجاد مسیر Local ↔ GitHub", risk: "safe" },
  { group: "ریموت", title: "Clone", command: "git clone https://github.com/user/repo.git", summary: "Repository، تاریخچه و Working Tree را دریافت می‌کند.", deep: "Clone عملاً پوشه می‌سازد، Remote به نام origin تنظیم می‌کند، Fetch انجام می‌دهد و شاخهٔ پیش‌فرض را Checkout می‌کند.", effect: "GitHub → Local + Working", risk: "safe" },
  { group: "ریموت", title: "اولین Push شاخه", command: "git push -u origin main", summary: "Commitها را ارسال و شاخهٔ Upstream را تنظیم می‌کند.", deep: "گزینهٔ -u ارتباط main محلی با origin/main را ذخیره می‌کند تا دفعات بعد git push کافی باشد.", effect: "Local Repository → GitHub", risk: "safe" },
  { group: "ریموت", title: "Fetch", command: "git fetch origin", summary: "Commitها و Refهای جدید Remote را دانلود می‌کند.", deep: "Working Tree و شاخهٔ فعلی تغییر نمی‌کنند؛ ابتدا با log یا diff بررسی کن و سپس Merge/Rebase تصمیم بگیر.", effect: "GitHub → Remote-tracking refs در Local", risk: "safe" },
  { group: "ریموت", title: "Pull با Rebase", command: "git pull --rebase origin main", summary: "دریافت تغییرها و قرار دادن Commitهای محلی روی آن‌هاست.", deep: "تقریباً fetch + rebase است و تاریخچهٔ خطی می‌سازد؛ Conflict باید در Rebase حل و continue شود.", effect: "GitHub → Local → Working", risk: "careful" },
  { group: "ریموت", title: "Force امن‌تر", command: "git push --force-with-lease", summary: "پس از Rebase تاریخچهٔ Remote را با محافظ بازنویسی می‌کند.", deep: "فقط وقتی Push می‌کند که Remote از آخرین مشاهدهٔ شما تغییر نکرده باشد؛ از --force خام امن‌تر است.", effect: "بازنویسی محافظت‌شدهٔ GitHub", risk: "danger" },
  { group: "تیمی", title: "حل Conflict", command: "git add conflicted-file && git commit", summary: "پس از ویرایش Conflict، حل‌شدن فایل را ثبت می‌کند.", deep: "Markerهای <<<<<<< و ======= و >>>>>>> را آگاهانه پاک کن، خروجی نهایی را تست کن و سپس فایل را Stage کن.", effect: "Working → Stage → Merge Commit", risk: "careful" },
  { group: "تیمی", title: "ساخت Pull Request", command: "gh pr create --fill", summary: "با GitHub CLI از شاخهٔ فعلی Pull Request می‌سازد.", deep: "PR یک شیء Git نیست؛ لایهٔ همکاری GitHub برای بحث، Review، Check و Merge روی تفاوت دو شاخه است.", effect: "Branch Remote → Pull Request", risk: "safe" },
  { group: "تیمی", title: "دیدن Issueها", command: "gh issue list", summary: "Issueهای Repository را در ترمینال فهرست می‌کند.", deep: "Issue برای ردیابی کار و گفتگوست؛ با شمارهٔ Issue در پیام Commit یا PR می‌توان ارتباط ساخت.", effect: "مشاهدهٔ داده‌های GitHub", risk: "safe" },
  { group: "اکشن", title: "Workflow سادهٔ CI", command: "name: CI\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm test", summary: "روی Push و Pull Request تست را اجرا می‌کند.", deep: "Workflow در .github/workflows ذخیره می‌شود؛ Trigger زمان اجرا، Job ماشین و Step واحد کار را تعریف می‌کند.", effect: "Push روی GitHub → اجرای خودکار CI", risk: "safe" },
];

const missions = [
  {
    title: "اولین انتشار",
    level: "مقدماتی",
    reward: 100,
    description: "یک Repository بساز، فایل‌ها را ثبت کن و اولین نسخه را به GitHub بفرست.",
    steps: [
      { label: "ساخت Repository", match: /^git init$/ },
      { label: "Stage کردن فایل‌ها", match: /^git add \.$/ },
      { label: "ساخت اولین Commit", match: /^git commit(?:\s|$)/ },
      { label: "ارسال به GitHub", match: /^git push(?:\s|$)/ },
    ],
  },
  {
    title: "نجات از Stage اشتباه",
    level: "متوسط",
    reward: 140,
    description: "app.js را اشتباهی Stage کرده‌ای؛ بدون حذف تغییرها آن را اصلاح و Commit کن.",
    steps: [
      { label: "ساخت Repository", match: /^git init$/ },
      { label: "Stage کردن همه", match: /^git add \.$/ },
      { label: "خارج کردن app.js از Stage", match: /^git restore --staged app\.js$/ },
      { label: "Stage دوبارهٔ app.js", match: /^git add app\.js$/ },
      { label: "ثبت نسخهٔ صحیح", match: /^git commit(?:\s|$)/ },
    ],
  },
  {
    title: "سفر شاخهٔ Feature",
    level: "پیشرفته",
    reward: 200,
    description: "یک Feature را روی شاخهٔ جدا توسعه بده، Merge کن و به Remote بفرست.",
    steps: [
      { label: "ساخت Repository", match: /^git init$/ },
      { label: "ساخت feature/login", match: /^git (?:switch -c|checkout -b) feature\/login$/ },
      { label: "Stage کردن تغییرها", match: /^git add \.$/ },
      { label: "Commit روی Feature", match: /^git commit(?:\s|$)/ },
      { label: "بازگشت به main", match: /^git (?:switch|checkout) main$/ },
      { label: "Merge شاخه", match: /^git merge feature\/login$/ },
      { label: "Push نتیجه", match: /^git push(?:\s|$)/ },
    ],
  },
];

const quizQuestions = [
  { question: "کدام دستور فقط اطلاعات Remote را می‌گیرد و Working Directory را تغییر نمی‌دهد؟", options: ["git pull", "git fetch", "git clone", "git push"], answer: 1, why: "fetch فقط Remote-tracking refها را به‌روز می‌کند؛ Pull مرحلهٔ ادغام هم دارد." },
  { question: "فایل را Stage کرده‌ای اما می‌خواهی تغییرهایش حفظ شود. چه می‌زنی؟", options: ["git restore app.js", "git reset --hard", "git restore --staged app.js", "git revert app.js"], answer: 2, why: "restore --staged فقط فایل را از Index خارج می‌کند و محتوای Working باقی می‌ماند." },
  { question: "Commit دقیقاً از محتوای کدام ناحیه ساخته می‌شود؟", options: ["Working Directory", "Staging Area", "Remote", "Stash"], answer: 1, why: "Commit یک Snapshot از Index یا همان Staging Area می‌سازد." },
  { question: "برای یک شاخهٔ عمومی، کدام روش بازگردانی امن‌تر است؟", options: ["reset --hard", "revert", "rebase -i", "force push"], answer: 1, why: "revert تاریخچه را پاک نمی‌کند؛ یک Commit خنثی‌کنندهٔ تازه می‌سازد." },
  { question: "در Fast-forward Merge چه اتفاقی می‌افتد؟", options: ["همیشه Conflict می‌شود", "شاخه حذف می‌شود", "Pointer شاخه جلو می‌رود", "Commitها Squash می‌شوند"], answer: 2, why: "وقتی مسیر تاریخچه خطی است، Git فقط Pointer شاخهٔ مقصد را جلو می‌برد." },
  { question: "کدام بخش GitHub Actions زمان اجرای Workflow را مشخص می‌کند؟", options: ["jobs", "steps", "runs-on", "on"], answer: 3, why: "کلید on رویدادهایی مثل push، pull_request یا schedule را تعریف می‌کند." },
];

const initialZones: Record<ZoneKey, string[]> = {
  working: ["index.html", "app.js", "style.css"],
  staging: [],
  local: [],
  remote: [],
};

function unique(items: string[]) {
  return Array.from(new Set(items));
}

function orderedMissionProgress(
  steps: Array<{ label: string; match: RegExp }>,
  history: string[],
) {
  let completed = 0;
  for (const item of history) {
    if (steps[completed]?.match.test(item)) completed += 1;
    if (completed === steps.length) break;
  }
  return completed;
}

export default function Home() {
  const [fileZones, setFileZones] = useState(initialZones);
  const [initialized, setInitialized] = useState(false);
  const [remoteReady, setRemoteReady] = useState(true);
  const [flow, setFlow] = useState<FlowKey>("idle");
  const [activeZone, setActiveZone] = useState<ZoneKey>("working");
  const [command, setCommand] = useState("");
  const [score, setScore] = useState(0);
  const [commitCount, setCommitCount] = useState(0);
  const [currentBranch, setCurrentBranch] = useState("main");
  const [branches, setBranches] = useState(["main"]);
  const [commits, setCommits] = useState<CommitNode[]>([]);
  const [stashFiles, setStashFiles] = useState<string[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [activeMission, setActiveMission] = useState(0);
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);
  const [commandQuery, setCommandQuery] = useState("");
  const [commandGroup, setCommandGroup] = useState<"همه" | CommandDoc["group"]>("همه");
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [copied, setCopied] = useState("");
  const [logs, setLogs] = useState<TerminalLine[]>([
    {
      id: 1,
      kind: "info",
      text: "آزمایشگاه آماده است. با git init شروع کن یا روی یکی از دستورهای پیشنهادی بزن.",
    },
  ]);
  const terminalRef = useRef<HTMLDivElement>(null);

  const totalFiles = useMemo(
    () => unique(Object.values(fileZones).flat()).length,
    [fileZones],
  );

  const filteredCommands = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    return commandDocs.filter((item) => {
      const inGroup = commandGroup === "همه" || item.group === commandGroup;
      const inQuery =
        !query ||
        `${item.title} ${item.command} ${item.summary} ${item.deep}`
          .toLowerCase()
          .includes(query);
      return inGroup && inQuery;
    });
  }, [commandGroup, commandQuery]);

  const missionProgress = useMemo(
    () => orderedMissionProgress(missions[activeMission].steps, commandHistory),
    [activeMission, commandHistory],
  );

  const addLog = (kind: TerminalLine["kind"], text: string) => {
    setLogs((current) => [
      ...current,
      { id: Date.now() + Math.random(), kind, text },
    ]);
    requestAnimationFrame(() => {
      terminalRef.current?.scrollTo({
        top: terminalRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  const animateFlow = (nextFlow: FlowKey, destination: ZoneKey) => {
    setFlow("idle");
    requestAnimationFrame(() => {
      setFlow(nextFlow);
      setActiveZone(destination);
      window.setTimeout(() => setFlow("idle"), 1250);
    });
  };

  const moveFiles = (
    source: ZoneKey,
    destination: ZoneKey,
    requested: string[] | "all",
    keepSource = false,
  ) => {
    setFileZones((current) => {
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

  const runCommand = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    const normalized = value.replace(/\s+/g, " ");
    addLog("command", `$ ${value}`);
    setCommand("");
    if (normalized.startsWith("git ")) {
      setCommandHistory((current) => [...current, normalized]);
    }

    if (normalized === "clear") {
      setLogs([]);
      return;
    }

    if (normalized === "reset lab") {
      setFileZones(initialZones);
      setInitialized(false);
      setCommitCount(0);
      setCurrentBranch("main");
      setBranches(["main"]);
      setCommits([]);
      setStashFiles([]);
      setCommandHistory([]);
      setScore(0);
      setActiveZone("working");
      addLog("info", "سناریو از ابتدا بارگذاری شد.");
      return;
    }

    if (normalized === "git --version") {
      addLog("info", "git version 2.47.1 — نصب Git درست است.");
      return;
    }

    if (normalized.startsWith("git config ")) {
      addLog("success", "تنظیم Git ذخیره شد؛ این دستور فایل‌های پروژه را تغییر نمی‌دهد.");
      setScore((current) => current + 5);
      return;
    }

    if (normalized.startsWith("git clone ")) {
      setInitialized(true);
      setRemoteReady(true);
      setCommitCount(1);
      setCurrentBranch("main");
      setBranches(["main"]);
      setCommits([{ id: "7a31fe2", message: "clone remote repository", branch: "main", type: "commit" }]);
      setFileZones({
        working: ["README.md", "index.html"],
        staging: [],
        local: ["README.md", "index.html"],
        remote: ["README.md", "index.html"],
      });
      animateFlow("remote-working", "working");
      setScore((current) => current + 20);
      addLog("success", "Repository، تاریخچه، origin و Working Tree دریافت شدند.");
      return;
    }

    if (normalized === "git init") {
      if (initialized) {
        addLog("warning", "Repository از قبل ساخته شده است؛ اجرای دوباره آسیبی نمی‌زند.");
      } else {
        setInitialized(true);
        setScore((current) => current + 10);
        addLog("success", "پوشهٔ مخفی .git ساخته شد؛ این مسیر حالا یک Repository است.");
      }
      setActiveZone("working");
      return;
    }

    if (!initialized && normalized.startsWith("git ")) {
      addLog("error", "هنوز Repository نساخته‌ای. ابتدا git init را اجرا کن.");
      return;
    }

    if (normalized === "git status" || normalized === "git status -s") {
      const parts = [
        fileZones.working.length
          ? `تغییرکرده: ${fileZones.working.join(", ")}`
          : "پوشهٔ کاری تمیز است",
        fileZones.staging.length
          ? `آمادهٔ Commit: ${fileZones.staging.join(", ")}`
          : "فایلی در Stage نیست",
      ];
      addLog("info", parts.join("  •  "));
      return;
    }

    if (normalized === "git diff" || normalized === "git diff --staged") {
      const staged = normalized.endsWith("--staged");
      const files = staged ? fileZones.staging : fileZones.working;
      addLog(
        "info",
        files.length
          ? `${staged ? "تغییرهای Stage" : "تغییرهای Working"}: ${files.join(", ")}`
          : "تفاوتی برای نمایش وجود ندارد.",
      );
      setActiveZone(staged ? "staging" : "working");
      return;
    }

    if (normalized === "git branch" || normalized === "git branch --list") {
      addLog(
        "info",
        branches.map((branch) => `${branch === currentBranch ? "*" : " "} ${branch}`).join("  •  "),
      );
      return;
    }

    if (/^git (?:switch -c|checkout -b) /.test(normalized)) {
      const name = normalized.replace(/^git (?:switch -c|checkout -b) /, "").trim();
      if (branches.includes(name)) {
        addLog("error", `شاخهٔ ${name} از قبل وجود دارد.`);
        return;
      }
      setBranches((current) => [...current, name]);
      setCurrentBranch(name);
      setScore((current) => current + 15);
      addLog("success", `شاخهٔ ${name} از HEAD فعلی ساخته و فعال شد.`);
      setActiveZone("local");
      return;
    }

    if (/^git (?:switch|checkout) /.test(normalized)) {
      const name = normalized.replace(/^git (?:switch|checkout) /, "").trim();
      if (!branches.includes(name)) {
        addLog("error", `شاخهٔ ${name} وجود ندارد. برای ساخت آن از switch -c استفاده کن.`);
        return;
      }
      setCurrentBranch(name);
      addLog("success", `HEAD اکنون روی شاخهٔ ${name} است و Working Tree با آن هماهنگ شد.`);
      setActiveZone("working");
      return;
    }

    if (normalized.startsWith("git merge ")) {
      const name = normalized.slice("git merge ".length).trim();
      if (!branches.includes(name)) {
        addLog("error", `شاخهٔ ${name} برای Merge پیدا نشد.`);
        return;
      }
      const node: CommitNode = {
        id: Math.random().toString(16).slice(2, 9),
        message: `merge ${name} into ${currentBranch}`,
        branch: currentBranch,
        type: "merge",
      };
      setCommits((current) => [...current, node]);
      setCommitCount((current) => current + 1);
      setScore((current) => current + 30);
      addLog("success", `شاخهٔ ${name} با ${currentBranch} Merge شد؛ گراف را ببین.`);
      setActiveZone("local");
      return;
    }

    if (normalized.startsWith("git rebase ")) {
      const target = normalized.replace(/^git rebase(?: -i)? /, "").trim();
      setCommits((current) => [
        ...current,
        {
          id: Math.random().toString(16).slice(2, 9),
          message: normalized.includes(" -i ") ? `squash on ${target}` : `rebase onto ${target}`,
          branch: currentBranch,
          type: "rebase",
        },
      ]);
      setScore((current) => current + 25);
      addLog("warning", "Commitها با Hash جدید روی پایهٔ مقصد بازسازی شدند؛ تاریخچه بازنویسی شد.");
      setActiveZone("local");
      return;
    }

    if (normalized.startsWith("git cherry-pick ")) {
      const hash = normalized.slice("git cherry-pick ".length).trim();
      setCommits((current) => [
        ...current,
        { id: Math.random().toString(16).slice(2, 9), message: `cherry-pick ${hash}`, branch: currentBranch, type: "cherry-pick" },
      ]);
      setCommitCount((current) => current + 1);
      addLog("success", `اثر Commit ${hash} به‌صورت Commit جدید روی ${currentBranch} اعمال شد.`);
      return;
    }

    if (normalized === "git stash" || normalized === "git stash -u") {
      if (!fileZones.working.length) {
        addLog("warning", "تغییر محلی برای Stash وجود ندارد.");
        return;
      }
      setStashFiles(fileZones.working);
      setFileZones((current) => ({ ...current, working: [] }));
      addLog("success", "تغییرها موقتاً در Stash ذخیره و Working Directory تمیز شد.");
      return;
    }

    if (normalized === "git stash pop") {
      if (!stashFiles.length) {
        addLog("warning", "Stash خالی است.");
        return;
      }
      setFileZones((current) => ({ ...current, working: unique([...current.working, ...stashFiles]) }));
      setStashFiles([]);
      addLog("success", "آخرین Stash به Working Directory بازگشت و از فهرست حذف شد.");
      setActiveZone("working");
      return;
    }

    if (normalized.startsWith("git tag ")) {
      const tag = normalized.match(/v?\d+(?:\.\d+){1,2}/)?.[0] ?? "tag";
      addLog("success", `${tag} روی آخرین Commit قرار گرفت؛ برای ارسال از git push origin ${tag} استفاده کن.`);
      setActiveZone("local");
      return;
    }

    if (normalized.startsWith("git blame ")) {
      addLog("info", "7a31fe2 (Sara 2026-07-31)  const portal = createPortal(); — برای Context، Commit را باز کن.");
      return;
    }

    if (normalized.startsWith("git check-ignore ")) {
      addLog("info", ".gitignore:2:.env  ← این فایل با قانون خط ۲ نادیده گرفته می‌شود.");
      return;
    }

    if (normalized === "git add ." || normalized === "git add -A") {
      if (!fileZones.working.length) {
        addLog("warning", "تغییر جدیدی برای Stage کردن وجود ندارد.");
        return;
      }
      moveFiles("working", "staging", "all");
      animateFlow("working-staging", "staging");
      setScore((current) => current + 10);
      addLog("success", "همهٔ تغییرها وارد Staging Area شدند؛ هنوز Commit نشده‌اند.");
      return;
    }

    if (normalized.startsWith("git add ")) {
      const file = normalized.slice("git add ".length).trim();
      if (!fileZones.working.includes(file)) {
        addLog("error", `${file} در پوشهٔ کاری پیدا نشد.`);
        return;
      }
      moveFiles("working", "staging", [file]);
      animateFlow("working-staging", "staging");
      setScore((current) => current + 10);
      addLog("success", `${file} برای Commit بعدی آماده شد.`);
      return;
    }

    if (normalized.startsWith("git restore --staged")) {
      const file = normalized.slice("git restore --staged".length).trim();
      const selected = file ? [file] : "all";
      if (!fileZones.staging.length) {
        addLog("warning", "Staging Area خالی است.");
        return;
      }
      moveFiles("staging", "working", selected);
      animateFlow("staging-working", "working");
      addLog("success", "فایل از Stage خارج شد؛ تغییرهای داخل آن همچنان باقی هستند.");
      return;
    }

    if (/^git commit(?:\s|$)/.test(normalized)) {
      if (!fileZones.staging.length) {
        addLog("error", "چیزی برای Commit وجود ندارد؛ ابتدا git add را اجرا کن.");
        return;
      }
      moveFiles("staging", "local", "all");
      animateFlow("staging-local", "local");
      setCommitCount((current) => current + 1);
      setScore((current) => current + 20);
      const message = normalized.match(/-m\s+["'](.+?)["']/)?.[1] ?? "بدون پیام";
      setCommits((current) => [
        ...current,
        {
          id: Math.random().toString(16).slice(2, 9),
          message,
          branch: currentBranch,
          type: "commit",
        },
      ]);
      addLog("success", `Commit #${commitCount + 1} با پیام «${message}» ثبت شد.`);
      return;
    }

    if (normalized === "git log" || normalized.startsWith("git log ")) {
      addLog(
        "info",
        commitCount
          ? `${commitCount} Commit وجود دارد. جدیدترین: HEAD → ${currentBranch}`
          : "هنوز Commitی در تاریخچه وجود ندارد.",
      );
      setActiveZone("local");
      return;
    }

    if (normalized === "git revert HEAD" || normalized.startsWith("git revert ")) {
      if (!commits.length) {
        addLog("error", "Commitی برای Revert وجود ندارد.");
        return;
      }
      setCommits((current) => [
        ...current,
        {
          id: Math.random().toString(16).slice(2, 9),
          message: `revert ${current.at(-1)?.id ?? "HEAD"}`,
          branch: currentBranch,
          type: "revert",
        },
      ]);
      setCommitCount((current) => current + 1);
      setScore((current) => current + 20);
      addLog("success", "یک Commit جدید اثر Commit قبلی را خنثی کرد؛ تاریخچه حفظ شد.");
      return;
    }

    if (normalized.startsWith("git reset --hard")) {
      if (!commits.length) {
        addLog("error", "Commit قبلی برای Reset وجود ندارد.");
        return;
      }
      setCommits((current) => current.slice(0, -1));
      setCommitCount((current) => Math.max(0, current - 1));
      setFileZones((current) => ({ ...current, working: [], staging: [] }));
      addLog("warning", "HEAD عقب رفت و تغییرهای Working و Stage حذف شدند؛ عملیات پرریسک انجام شد.");
      setActiveZone("local");
      return;
    }

    if (/^git reset (?!-)/.test(normalized)) {
      if (!commits.length) {
        addLog("error", "Commit قبلی برای Reset وجود ندارد.");
        return;
      }
      const restored = fileZones.local.length ? fileZones.local : ["app.js"];
      setCommits((current) => current.slice(0, -1));
      setCommitCount((current) => Math.max(0, current - 1));
      setFileZones((current) => ({ ...current, working: unique([...current.working, ...restored]), staging: [] }));
      animateFlow("local-staging", "working");
      addLog("warning", "HEAD عقب رفت و تغییرها به Working Directory برگشتند (mixed reset). ");
      return;
    }

    if (normalized.startsWith("git reset --soft")) {
      if (!fileZones.local.length) {
        addLog("error", "Commit قبلی برای Reset وجود ندارد.");
        return;
      }
      moveFiles("local", "staging", "all");
      animateFlow("local-staging", "staging");
      setCommitCount((current) => Math.max(0, current - 1));
      setCommits((current) => current.slice(0, -1));
      addLog("warning", "HEAD عقب رفت، اما تغییرها Stage باقی ماندند؛ چیزی حذف نشده است.");
      return;
    }

    if (normalized.startsWith("git restore ")) {
      const file = normalized.slice("git restore ".length).trim();
      if (!fileZones.working.includes(file)) {
        addLog("error", `${file} تغییر ثبت‌نشده‌ای در Working Directory ندارد.`);
        return;
      }
      setFileZones((current) => ({
        ...current,
        working: current.working.filter((item) => item !== file),
      }));
      addLog("warning", `تغییرهای ثبت‌نشدهٔ ${file} کنار گذاشته شد.`);
      return;
    }

    if (normalized === "git remote -v") {
      addLog(
        "info",
        remoteReady
          ? "origin  github.com/workshop/git-portal.git (fetch/push)"
          : "هنوز Remote تعریف نشده است.",
      );
      setActiveZone("remote");
      return;
    }

    if (normalized.startsWith("git remote add origin")) {
      setRemoteReady(true);
      setScore((current) => current + 10);
      addLog("success", "آدرس GitHub با نام origin به Repository محلی متصل شد.");
      setActiveZone("remote");
      return;
    }

    if (normalized === "git push" || normalized.startsWith("git push ")) {
      if (!remoteReady) {
        addLog("error", "Remote به نام origin پیدا نشد.");
        return;
      }
      if (!fileZones.local.length) {
        addLog("warning", "Commit جدیدی برای Push وجود ندارد.");
        return;
      }
      moveFiles("local", "remote", "all", true);
      animateFlow("local-remote", "remote");
      setScore((current) => current + 20);
      addLog("success", "Commitهای محلی روی GitHub منتشر شدند.");
      return;
    }

    if (normalized === "git fetch" || normalized.startsWith("git fetch ")) {
      animateFlow("remote-local", "local");
      addLog(
        "info",
        "اطلاعات جدید Remote دریافت شد، اما فایل‌های پوشهٔ کاری تغییر نکردند؛ فرق اصلی Fetch و Pull همین است.",
      );
      return;
    }

    if (normalized === "git pull" || normalized.startsWith("git pull ")) {
      const incoming = fileZones.remote.length ? fileZones.remote : ["README.md"];
      setFileZones((current) => ({
        ...current,
        local: unique([...current.local, ...incoming]),
        working: unique([...current.working, ...incoming]),
      }));
      animateFlow("remote-working", "working");
      setScore((current) => current + 10);
      addLog("success", "تغییرهای Remote دریافت و با شاخهٔ فعلی یکپارچه شدند.");
      return;
    }

    if (normalized.startsWith("gh pr create")) {
      setScore((current) => current + 30);
      addLog("success", "Pull Request ساخته شد؛ حالا Review و Checkهای تیم روی تفاوت شاخه‌ها انجام می‌شوند.");
      setActiveZone("remote");
      return;
    }

    if (normalized === "gh issue list") {
      addLog("info", "#12  login validation  •  #8  improve CI workflow  •  #3  update README");
      return;
    }

    if (normalized === "help") {
      addLog("info", "قابل اجرا: init, status, diff, add, commit, log, restore, reset, revert, branch, switch, merge, rebase, cherry-pick, stash, tag, blame, remote, clone, push, fetch, pull");
      return;
    }

    addLog("error", "این دستور در سناریوی فعلی شناخته نشد. help را اجرا کن یا از پیشنهادها کمک بگیر.");
  };

  const submitCommand = (event: FormEvent) => {
    event.preventDefault();
    runCommand(command);
  };

  const copyCommand = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(""), 1100);
  };

  const startMission = (index: number) => {
    setActiveMission(index);
    setFileZones(initialZones);
    setInitialized(false);
    setCurrentBranch("main");
    setBranches(["main"]);
    setCommits([]);
    setCommitCount(0);
    setStashFiles([]);
    setCommandHistory([]);
    setActiveZone("working");
    setLogs([
      {
        id: Date.now(),
        kind: "info",
        text: `مأموریت «${missions[index].title}» فعال شد. قدم‌ها را به ترتیب انجام بده.`,
      },
    ]);
    window.setTimeout(
      () => document.querySelector("#playground")?.scrollIntoView({ behavior: "smooth" }),
      40,
    );
  };

  const deliverMission = () => {
    const mission = missions[activeMission];
    if (missionProgress < mission.steps.length) {
      addLog("warning", `هنوز ${mission.steps.length - missionProgress} قدم باقی مانده است.`);
      document.querySelector("#playground")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (completedMissions.includes(activeMission)) return;
    setCompletedMissions((current) => [...current, activeMission]);
    setScore((current) => current + mission.reward);
    addLog("success", `مأموریت کامل شد؛ ${mission.reward} امتیاز جایزه گرفتی.`);
  };

  const answerQuiz = (answer: number) => {
    if (quizAnswer !== null) return;
    setQuizAnswer(answer);
    if (answer === quizQuestions[quizIndex].answer) {
      setQuizScore((current) => current + 1);
      setScore((current) => current + 25);
    }
  };

  const nextQuiz = () => {
    if (quizIndex === quizQuestions.length - 1) {
      setQuizIndex(0);
      setQuizScore(0);
    } else {
      setQuizIndex((current) => current + 1);
    }
    setQuizAnswer(null);
  };

  const graphBranches = unique(["main", ...branches, ...commits.map((item) => item.branch)]);
  const graphHeight = Math.max(260, commits.length * 74 + 120);
  const branchColor = (branch: string) =>
    ["#55f08c", "#43c8ff", "#bd66ff", "#ffbd3d", "#ff7f77"][
      graphBranches.indexOf(branch) % 5
    ];
  const branchX = (branch: string) => 600 - graphBranches.indexOf(branch) * 112;

  return (
    <main dir="rtl">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Git Portal Lab">
          <span className="brand-mark">G</span>
          <span>
            <b>Git Portal Lab</b>
            <small>آزمایشگاه تعاملی Git و GitHub</small>
          </span>
        </a>
        <nav aria-label="ناوبری اصلی">
          <a className="active" href="#playground">Playground</a>
          <a href="#missions">مأموریت‌ها</a>
          <a href="#graph">گراف</a>
          <a href="#quiz">آزمون</a>
          <a href="#roadmap">نقشه راه</a>
          <a href="#commands">دستورها</a>
        </nav>
        <div className="score-pill" aria-label={`${score} امتیاز`}>
          <span>✦</span>
          <b>{score}</b>
          <small>XP</small>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-art" aria-hidden="true" />
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="hero-copy">
            <div className="live-badge"><i /> WORKSHOP MODE</div>
            <h1>
              Git را حفظ نکن؛
              <span>حرکتش را ببین.</span>
            </h1>
            <p>
              دستور را بنویس و ببین فایل‌ها چگونه بین پوشهٔ کاری، Stage،
              Repository محلی و GitHub جابه‌جا می‌شوند.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#playground">ورود به آزمایشگاه <span>←</span></a>
              <a className="ghost-button" href="#roadmap">مشاهدهٔ مسیر دوره</a>
            </div>
          </div>
          <div className="hero-stats" aria-label="آمار دوره">
            <div><b>۶</b><span>فصل عملی</span></div>
            <div><b>۴</b><span>ناحیهٔ Git</span></div>
            <div><b>+۳۰</b><span>دستور و سناریو</span></div>
          </div>
        </div>
      </section>

      <section className="lab-shell" id="playground">
        <div className="section-heading">
          <div>
            <span className="kicker">PLAYGROUND / 01</span>
            <h2>چهار درِ سرنوشت فایل‌ها</h2>
            <p>هر در یک بخش واقعی از مدل ذهنی Git است؛ نور فعال، مقصد دستور اخیر را نشان می‌دهد.</p>
          </div>
          <div className="lab-health">
            <span className={initialized ? "health-dot ready" : "health-dot"} />
            {initialized ? `HEAD → ${currentBranch}  •  ${totalFiles} فایل${stashFiles.length ? `  •  Stash: ${stashFiles.length}` : ""}` : "منتظر git init"}
          </div>
        </div>

        <div className="portal-stage">
          <div className={`file-spark ${flow}`} aria-hidden="true"><span>FILE</span></div>
          {zones.map((zone) => (
            <article
              className={`portal-card portal-${zone.id} ${activeZone === zone.id ? "is-active" : ""}`}
              key={zone.id}
              style={{ "--portal-color": zone.color } as React.CSSProperties}
            >
              <div className="portal-topline">
                <span>{zone.eyebrow}</span>
                <i>{fileZones[zone.id].length}</i>
              </div>
              <div className="portal-door">
                <div className="portal-icon">{zone.icon}</div>
                <div className="portal-depth" />
              </div>
              <h3>{zone.title}</h3>
              <p>{zone.hint}</p>
              <div className="file-list">
                {fileZones[zone.id].length ? (
                  fileZones[zone.id].map((file) => (
                    <span className="file-chip" key={file}><i />{file}</span>
                  ))
                ) : (
                  <span className="empty-zone">هنوز خالی است</span>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="terminal-layout">
          <div className="terminal-panel">
            <div className="terminal-bar">
              <div className="terminal-dots"><i /><i /><i /></div>
              <span>~/git-workshop</span>
              <button onClick={() => setLogs([])} type="button">پاک‌کردن خروجی</button>
            </div>
            <div className="terminal-output" ref={terminalRef} aria-live="polite">
              {logs.map((line) => (
                <div className={`terminal-line ${line.kind}`} key={line.id}>
                  {line.kind !== "command" && <span>›</span>}
                  <p dir={line.kind === "command" ? "ltr" : "rtl"}>{line.text}</p>
                </div>
              ))}
            </div>
            <form className="terminal-input" onSubmit={submitCommand}>
              <span>➜</span>
              <input
                aria-label="دستور Git"
                autoComplete="off"
                dir="ltr"
                onChange={(event) => setCommand(event.target.value)}
                placeholder="git init"
                spellCheck={false}
                value={command}
              />
              <button type="submit">اجرا</button>
            </form>
          </div>

          <aside className="terminal-guide">
            <div className="guide-title">
              <span>⌁</span>
              <div><b>دستورهای پیشنهادی</b><small>برای اجرا کلیک کن</small></div>
            </div>
            <div className="quick-command-list">
              {quickCommands.map((item) => (
                <div className="quick-command" key={item}>
                  <button onClick={() => runCommand(item)} type="button" dir="ltr">{item}</button>
                  <button
                    className="copy-button"
                    aria-label={`کپی ${item}`}
                    onClick={() => copyCommand(item)}
                    type="button"
                  >{copied === item ? "✓" : "⧉"}</button>
                </div>
              ))}
            </div>
            <div className="concept-note">
              <b>نکتهٔ مفهومی</b>
              <p><code>git fetch</code> فقط اطلاعات Remote را می‌آورد؛ اما <code>git pull</code> آن را با شاخهٔ فعلی ترکیب می‌کند.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="learning-section missions-section" id="missions">
        <div className="section-heading">
          <div>
            <span className="kicker">MISSIONS / 02</span>
            <h2>مأموریت بگیر، دستور بزن، XP جمع کن</h2>
            <p>هر مأموریت یک سناریوی واقعی است؛ ترتیب دستورها مهم است و اشتباه‌کردن بخشی از یادگیری.</p>
          </div>
          <div className="xp-summary"><b>{completedMissions.length}</b><span>از ۳ مأموریت کامل</span></div>
        </div>
        <div className="mission-layout">
          <div className="mission-list">
            {missions.map((mission, index) => {
              const done = completedMissions.includes(index);
              return (
                <article className={`${activeMission === index ? "active" : ""} ${done ? "done" : ""}`} key={mission.title}>
                  <div className="mission-rank">{done ? "✓" : String(index + 1).padStart(2, "0")}</div>
                  <div className="mission-card-copy">
                    <div><span>{mission.level}</span><i>+{mission.reward} XP</i></div>
                    <h3>{mission.title}</h3>
                    <p>{mission.description}</p>
                  </div>
                  <button type="button" onClick={() => startMission(index)}>{done ? "اجرای دوباره" : "شروع"}</button>
                </article>
              );
            })}
          </div>
          <div className="mission-detail">
            <div className="mission-detail-head">
              <div>
                <span>مأموریت فعال</span>
                <h3>{missions[activeMission].title}</h3>
              </div>
              <strong>{Math.round((missionProgress / missions[activeMission].steps.length) * 100)}٪</strong>
            </div>
            <div className="mission-progress"><i style={{ width: `${(missionProgress / missions[activeMission].steps.length) * 100}%` }} /></div>
            <ol className="mission-steps">
              {missions[activeMission].steps.map((step, index) => (
                <li className={index < missionProgress ? "complete" : index === missionProgress ? "current" : ""} key={step.label}>
                  <span>{index < missionProgress ? "✓" : index + 1}</span>
                  <div><b>{step.label}</b><small>{index < missionProgress ? "انجام شد" : index === missionProgress ? "قدم بعدی" : "قفل"}</small></div>
                </li>
              ))}
            </ol>
            <button className="deliver-button" onClick={deliverMission} type="button">
              {completedMissions.includes(activeMission) ? "مأموریت تحویل شد ✓" : "تحویل مأموریت"}
            </button>
          </div>
        </div>
      </section>

      <section className="learning-section graph-quiz-section">
        <div className="graph-panel" id="graph">
          <div className="panel-heading">
            <div><span className="kicker">LIVE GRAPH / 03</span><h2>گراف زندهٔ Branch و Commit</h2></div>
            <div className="head-pointer"><i /> HEAD → {currentBranch}</div>
          </div>
          <div className="branch-legend">
            {graphBranches.map((branch) => <span key={branch}><i style={{ background: branchColor(branch) }} />{branch}</span>)}
          </div>
          <div className="graph-canvas">
            {commits.length ? (
              <svg viewBox={`0 0 720 ${graphHeight}`} role="img" aria-label="گراف Commitها و Branchها">
                {commits.map((node, index) => {
                  const x = branchX(node.branch);
                  const y = 70 + index * 74;
                  const previous = commits[index - 1];
                  const previousX = previous ? branchX(previous.branch) : x;
                  const previousY = previous ? 70 + (index - 1) * 74 : y - 40;
                  const color = branchColor(node.branch);
                  return (
                    <g key={`${node.id}-${index}`}>
                      <path d={`M ${previousX} ${previousY} C ${previousX} ${y - 30}, ${x} ${previousY + 30}, ${x} ${y}`} stroke={color} strokeWidth="3" fill="none" opacity=".72" />
                      <circle cx={x} cy={y} r={node.type === "merge" ? 11 : 8} fill="#061414" stroke={color} strokeWidth="4" />
                      <text x={x - 22} y={y - 17} fill={color} fontSize="10" textAnchor="middle">{node.branch}</text>
                      <text x={x - 24} y={y + 5} fill="#d9ebe4" fontSize="11" textAnchor="end">{node.message}</text>
                      <text x={x + 18} y={y + 4} fill="#718a82" fontSize="9">{node.id.slice(0, 7)}</text>
                    </g>
                  );
                })}
                <text x={branchX(currentBranch)} y={graphHeight - 25} fill={branchColor(currentBranch)} fontSize="11" textAnchor="middle">HEAD ↑</text>
              </svg>
            ) : (
              <div className="empty-graph">
                <span>⌘</span>
                <b>گراف هنوز خالی است</b>
                <p>در Playground یک Commit بساز؛ هر Branch، Merge و Rebase فوراً اینجا دیده می‌شود.</p>
              </div>
            )}
          </div>
          <div className="graph-actions">
            <button onClick={() => runCommand("git switch -c feature/login")} type="button"><code>switch -c</code><span>شاخهٔ جدید</span></button>
            <button onClick={() => runCommand("git merge feature/login")} type="button"><code>merge</code><span>ادغام</span></button>
            <button onClick={() => runCommand("git rebase main")} type="button"><code>rebase</code><span>بازپایه‌گذاری</span></button>
          </div>
        </div>

        <div className="quiz-panel" id="quiz">
          <div className="panel-heading quiz-head">
            <div><span className="kicker">QUIZ / 04</span><h2>فکر کن، بعد دستور بزن</h2></div>
            <div className="quiz-count">{quizIndex + 1}/{quizQuestions.length}</div>
          </div>
          <div className="quiz-track"><i style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }} /></div>
          <div className="quiz-body">
            <span className="quiz-label">سؤال {quizIndex + 1}</span>
            <h3>{quizQuestions[quizIndex].question}</h3>
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
                <b>{quizAnswer === quizQuestions[quizIndex].answer ? "درست بود! +25 XP" : "این یکی نیاز به مرور دارد"}</b>
                <p>{quizQuestions[quizIndex].why}</p>
              </div>
            )}
          </div>
          <div className="quiz-footer">
            <span>امتیاز آزمون: <b>{quizScore}</b></span>
            <button disabled={quizAnswer === null} onClick={nextQuiz} type="button">
              {quizIndex === quizQuestions.length - 1 ? "شروع دوباره" : "سؤال بعدی ←"}
            </button>
          </div>
        </div>
      </section>

      <section className="roadmap-preview" id="roadmap">
        <div className="section-heading compact">
          <div>
            <span className="kicker">COURSE MAP / 02</span>
            <h2>از ساحل Git تا اتوماسیون</h2>
            <p>شش ایستگاه دوره، از اولین Repository تا GitHub Actions.</p>
          </div>
        </div>
        <div className="roadmap-grid">
          <div className="roadmap-image-wrap">
            <img src="/course-roadmap.png" alt="نقشه راه تصویری ورکشاپ Git و GitHub" />
            <span>نقشهٔ اصلی دوره</span>
          </div>
          <div className="roadmap-list">
            {courseSteps.map(([number, title, description], index) => (
              <article key={number}>
                <span>{number}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
                <i>{index === 0 ? "در حال یادگیری" : `${index + 1}/6`}</i>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="command-library" id="commands">
        <div className="section-heading">
          <div>
            <span className="kicker">COMMAND LIBRARY / 05</span>
            <h2>مرجع عمیق و قابل‌کپی دستورها</h2>
            <p>هر کارت علاوه‌بر Syntax می‌گوید دستور در پشت صحنه چه می‌کند و روی کدام ناحیه اثر دارد.</p>
          </div>
          <div className="command-count"><b>{filteredCommands.length}</b><span>دستور پیدا شد</span></div>
        </div>
        <div className="command-tools">
          <label className="command-search">
            <span>⌕</span>
            <input
              aria-label="جست‌وجوی دستورها"
              onChange={(event) => setCommandQuery(event.target.value)}
              placeholder="مثلاً reset، branch یا staging..."
              value={commandQuery}
            />
          </label>
          <div className="command-filters" aria-label="فیلتر فصل">
            {(["همه", "شروع", "محلی", "شاخه", "ریموت", "تیمی", "اکشن"] as const).map((group) => (
              <button className={commandGroup === group ? "active" : ""} key={group} onClick={() => setCommandGroup(group)} type="button">{group}</button>
            ))}
          </div>
        </div>
        <div className="command-grid">
          {filteredCommands.map((item) => (
            <article className={`command-card risk-${item.risk ?? "safe"}`} key={`${item.group}-${item.title}`}>
              <div className="command-card-head">
                <span>{item.group}</span>
                <i>{item.risk === "danger" ? "پرریسک" : item.risk === "careful" ? "با دقت" : "امن"}</i>
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <div className="command-code">
                <pre dir="ltr"><code>{item.command}</code></pre>
                <button aria-label={`کپی ${item.title}`} onClick={() => copyCommand(item.command)} type="button">{copied === item.command ? "کپی شد ✓" : "کپی ⧉"}</button>
              </div>
              <div className="command-effect"><span>مسیر اثر</span><b>{item.effect}</b></div>
              <details>
                <summary>درک عمیق این دستور <span>＋</span></summary>
                <p>{item.deep}</p>
              </details>
            </article>
          ))}
        </div>
        {!filteredCommands.length && <div className="empty-commands">دستوری با این عبارت پیدا نشد؛ نام ناحیه یا مفهوم را جست‌وجو کن.</div>}
      </section>

      <footer>
        <div className="footer-brand"><span className="brand-mark">G</span><div><b>Git Portal Lab</b><p>یادگیری Git با دیدن، آزمودن و اشتباه‌کردن.</p></div></div>
        <a href="#top">بازگشت به بالا ↑</a>
      </footer>
    </main>
  );
}
