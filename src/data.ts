export type Level = "beginner" | "intermediate" | "challenge";

export type QuizQuestion = {
  id: string;
  module: number;
  level: Level;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  topic: string;
};

type RawQuestion = Omit<QuizQuestion, "id" | "module">;

const q = (
  level: Level,
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
  topic: string,
): RawQuestion => ({ level, prompt, options, answer, explanation, topic });

const moduleQuestions: RawQuestion[][] = [
  [
    q("beginner", "Git چیست؟", ["سیستم کنترل نسخهٔ توزیع‌شده", "فضای ابری", "ویرایشگر کد", "زبان برنامه‌نویسی"], 0, "Git تاریخچهٔ تغییرات را به‌صورت محلی و توزیع‌شده مدیریت می‌کند.", "مبانی Git"),
    q("beginner", "برای دیدن نسخهٔ نصب‌شدهٔ Git کدام دستور درست است؟", ["git --version", "git versioning", "git -v-only", "git info"], 0, "git --version نسخهٔ نصب‌شده را چاپ می‌کند.", "راه‌اندازی"),
    q("beginner", "تنظیم نام سراسری کاربر با کدام دستور انجام می‌شود؟", ["git config --global user.name \"Sara\"", "git user Sara", "git name --all Sara", "git config Sara"], 0, "user.name در metadata کامیت‌ها ثبت می‌شود.", "Config"),
    q("beginner", "برای تنظیم ایمیل کامیت‌ها چه می‌زنیم؟", ["git config --global user.email \"you@example.com\"", "git email set", "git config email", "github email"], 0, "ایمیل همراه نام در author کامیت ذخیره می‌شود.", "Config"),
    q("beginner", "ساخت Repository در پوشهٔ فعلی؟", ["git init", "git new", "git start", "git create"], 0, "git init پوشهٔ .git و دیتابیس تاریخچه را می‌سازد.", "Repository"),
    q("intermediate", "تنظیم --global در کجا اثر دارد؟", ["روی همهٔ Repositoryهای همان کاربر", "فقط پوشهٔ فعلی", "فقط GitHub", "فقط یک Branch"], 0, "global در فایل تنظیمات سطح کاربر نوشته می‌شود.", "Config"),
    q("intermediate", "برای دیدن همهٔ تنظیمات و منبعشان؟", ["git config --list --show-origin", "git config --where", "git info --all", "git origin --list"], 0, "--show-origin مسیر فایل هر تنظیم را هم نشان می‌دهد.", "Config"),
    q("intermediate", "تغییر نام شاخهٔ اولیهٔ پیش‌فرض به main؟", ["git config --global init.defaultBranch main", "git init main", "git branch.default main", "git master --rename"], 0, "init.defaultBranch نام شاخهٔ اولیه در repoهای تازه را تعیین می‌کند.", "Config"),
    q("intermediate", "راهنمای کامل دستور commit را چگونه می‌بینیم؟", ["git help commit", "git commit --teach", "git docs open", "git about commit"], 0, "git help <command> مستندات همان دستور را باز می‌کند.", "Help"),
    q("intermediate", "Repository محلی تاریخچه را کجا نگه می‌دارد؟", ["در پوشهٔ .git", "در README", "روی GitHub", "در package.json"], 0, ".git شامل objects، refs و تنظیمات repository است.", "Repository"),
    q("challenge", "برای نام و ایمیل متفاوت فقط در پروژهٔ فعلی؟", ["git config user.name \"Sara\" و git config user.email \"sara@work.com\"", "هر دو با --global", "تغییر پروفایل GitHub", "git local-user"], 0, "نبودن --global تنظیم را در config همان repo می‌نویسد.", "Config scope"),
    q("challenge", "کدام داده جزو Commit نیست؟", ["فایل‌های Working Directory که stage نشده‌اند", "اشاره به parent", "پیام", "نام author"], 0, "کامیت snapshot ایندکس است، نه همهٔ تغییرات پوشهٔ کاری.", "Commit model"),
    q("challenge", "HEAD در Git معمولاً چیست؟", ["اشاره‌گر به شاخه یا commit فعلی", "آخرین فایل تغییرکرده", "Remote اصلی", "فهرست فایل‌های staged"], 0, "HEAD موقعیت فعلی شما در تاریخچه را مشخص می‌کند.", "HEAD"),
    q("challenge", "برای تشخیص config مؤثر user.name؟", ["git config --show-origin --get user.name", "git whoami", "git author --source", "git config --guess"], 0, "--get مقدار مؤثر و --show-origin منبع آن را می‌دهد.", "Config diagnosis"),
    q("challenge", "مزیت distributed بودن Git چیست؟", ["هر clone معمولاً تاریخچهٔ کامل و قابلیت commit آفلاین دارد", "فایل‌ها هیچ‌وقت merge نمی‌شوند", "نیازی به branch نیست", "همه‌چیز فقط روی سرور است"], 0, "هر توسعه‌دهنده یک repository کامل محلی دارد.", "Architecture"),
  ],
  [
    q("beginner", "وضعیت فایل‌ها را با چه دستوری می‌بینیم؟", ["git status", "git state", "git files", "git check"], 0, "status تفاوت Working Tree و Staging و HEAD را خلاصه می‌کند.", "Status"),
    q("beginner", "افزودن فایل app.js به Staging Area؟", ["git add app.js", "git stage --save app.js", "git commit app.js", "git push app.js"], 0, "git add snapshot فعلی فایل را وارد index می‌کند.", "Staging"),
    q("beginner", "ثبت فایل‌های staged در تاریخچه؟", ["git commit -m \"message\"", "git save", "git add -m", "git push -m"], 0, "commit از محتوای staging snapshot می‌سازد.", "Commit"),
    q("beginner", "دیدن تاریخچهٔ خلاصه؟", ["git log --oneline", "git history --short", "git status --log", "git commits"], 0, "--oneline هر commit را در یک خط نشان می‌دهد.", "Log"),
    q("beginner", "دیدن تغییرات stage‌نشده؟", ["git diff", "git status -d", "git compare HEAD", "git show working"], 0, "git diff پیش‌فرض Working Tree را با index مقایسه می‌کند.", "Diff"),
    q("intermediate", "دیدن تغییرات staged نسبت به HEAD؟", ["git diff --staged", "git diff --working", "git status --diff", "git show --index"], 0, "--staged یا --cached محتوای index را با HEAD مقایسه می‌کند.", "Diff"),
    q("intermediate", "خارج کردن app.js از Stage بدون حذف تغییرات؟", ["git restore --staged app.js", "git reset --hard app.js", "git rm app.js", "git clean app.js"], 0, "restore --staged فقط index را برمی‌گرداند و Working Tree می‌ماند.", "Restore"),
    q("intermediate", "لغو تغییرات stage‌نشدهٔ app.js؟", ["git restore app.js", "git revert app.js", "git reset --soft app.js", "git uncommit app.js"], 0, "restore فایل Working Tree را از index بازسازی می‌کند و تغییرات محلی از دست می‌روند.", "Restore"),
    q("intermediate", "ساخت commit معکوس برای یک commit منتشرشده؟", ["git revert <hash>", "git reset --hard <hash>", "git delete <hash>", "git restore <hash>"], 0, "revert تاریخچه را بازنویسی نمی‌کند؛ یک commit جدید می‌سازد.", "Revert"),
    q("intermediate", "نقش .gitignore چیست؟", ["نادیده گرفتن فایل‌های untracked مطابق الگوها", "حذف فایل از همهٔ commitها", "رمزنگاری فایل‌ها", "نادیده گرفتن branchها"], 0, "فایل tracked با اضافه شدن به .gitignore خودکار untrack نمی‌شود.", "gitignore"),
    q("challenge", "پس از git reset --soft HEAD~1 چه می‌ماند؟", ["تغییرات commit قبلی به‌صورت staged", "همه‌چیز حذف می‌شود", "فقط فایل‌های untracked", "Remote عقب می‌رود"], 0, "soft فقط ref را حرکت می‌دهد و index/working tree را دست‌نخورده نگه می‌دارد.", "Reset"),
    q("challenge", "git reset --mixed HEAD~1 چه می‌کند؟", ["commit را برمی‌گرداند و تغییرات را unstaged نگه می‌دارد", "تغییرات را پاک می‌کند", "commit معکوس می‌سازد", "Remote را reset می‌کند"], 0, "mixed حالت پیش‌فرض reset است: ref و index تغییر می‌کنند، فایل‌ها می‌مانند.", "Reset"),
    q("challenge", "خطر git reset --hard چیست؟", ["تغییرات tracked در index و working tree را حذف می‌کند", "فقط پیام commit را عوض می‌کند", "هیچ فایل محلی را لمس نمی‌کند", "فقط GitHub را تغییر می‌دهد"], 0, "hard می‌تواند تغییرات commit‌نشده را غیرقابل‌بازیابی کند.", "Reset safety"),
    q("challenge", "فایل secret.env قبلاً tracked است؛ برای نگه‌داشتن محلی و حذف از index؟", ["git rm --cached secret.env", "git ignore --force secret.env", "git restore secret.env", "git clean secret.env"], 0, "سپس الگو را به .gitignore اضافه و commit کنید.", "gitignore"),
    q("challenge", "Alias مناسب برای log گرافی؟", ["git config --global alias.lg \"log --oneline --graph --all --decorate\"", "git alias lg = log", "git log --alias lg", "git config lg"], 0, "alias.<name> یک میانبر Git تعریف می‌کند.", "Alias"),
  ],
  [
    q("beginner", "فهرست branchهای محلی؟", ["git branch", "git branches --local", "git status branch", "git list"], 0, "git branch بدون آرگومان branchها را فهرست می‌کند.", "Branch"),
    q("beginner", "ساخت و رفتن به feature/auth؟", ["git switch -c feature/auth", "git branch --go feature/auth", "git checkout-only feature/auth", "git merge feature/auth"], 0, "switch -c شاخه را می‌سازد و HEAD را به آن می‌برد.", "Switch"),
    q("beginner", "رفتن به branch موجود main؟", ["git switch main", "git branch main", "git move main", "git head main"], 0, "switch برای جابه‌جایی امن و خوانا بین branchهاست.", "Switch"),
    q("beginner", "ادغام feature/cart در branch فعلی؟", ["git merge feature/cart", "git merge current into feature/cart", "git join feature/cart", "git commit feature/cart"], 0, "اول به branch مقصد بروید، سپس source را merge کنید.", "Merge"),
    q("beginner", "حذف branch ادغام‌شده feature/cart؟", ["git branch -d feature/cart", "git remove feature/cart", "git branch --drop", "git clean branch"], 0, "-d اگر branch merge نشده باشد برای ایمنی خطا می‌دهد.", "Branch"),
    q("intermediate", "Fast-forward merge چه زمانی رخ می‌دهد؟", ["وقتی branch مقصد بعد از انشعاب commit تازه ندارد", "همیشه", "فقط با conflict", "فقط روی GitHub"], 0, "pointer مقصد مستقیم جلو می‌رود و merge commit لازم نیست.", "Fast-forward"),
    q("intermediate", "اجبار به merge commit حتی در حالت fast-forward؟", ["git merge --no-ff feature/x", "git merge --hard feature/x", "git commit --merge-only", "git merge --squash-only"], 0, "--no-ff توپولوژی branch را با یک merge commit حفظ می‌کند.", "Merge"),
    q("intermediate", "در conflict علامت ======= چه چیزی را جدا می‌کند؟", ["نسخهٔ فعلی و نسخهٔ branch ورودی", "دو commit مستقل GitHub", "staged و untracked", "local و remote URL"], 0, "بعد از ویرایش markerها، فایل را add و merge را commit می‌کنید.", "Conflict"),
    q("intermediate", "متوقف کردن merge درگیر conflict؟", ["git merge --abort", "git merge --stop-hard", "git reset merge", "git abort"], 0, "--abort تا حد ممکن وضعیت قبل از merge را بازمی‌گرداند.", "Conflict"),
    q("intermediate", "انتقال commit مشخص به branch فعلی؟", ["git cherry-pick <hash>", "git merge --one <hash>", "git copy-commit <hash>", "git rebase --pick <hash>"], 0, "cherry-pick patch آن commit را به‌صورت commit تازه اعمال می‌کند.", "Cherry-pick"),
    q("challenge", "هدف rebase feature روی main چیست؟", ["بازپخش commitهای feature روی نوک main", "ساخت Remote", "حذف commitها", "فقط تغییر نام branch"], 0, "rebase parentها و در نتیجه hash commitهای بازپخش‌شده را تغییر می‌دهد.", "Rebase"),
    q("challenge", "چرا روی branch مشترک منتشرشده با احتیاط rebase می‌کنیم؟", ["تاریخچه را بازنویسی و hashها را عوض می‌کند", "Git را حذف می‌کند", "merge را غیرممکن می‌کند", "فایل‌ها را همیشه پاک می‌کند"], 0, "همکاران ممکن است بر اساس تاریخچهٔ قبلی کار کرده باشند.", "Rebase safety"),
    q("challenge", "تبدیل چند commit feature به یک snapshot هنگام merge؟", ["git merge --squash feature/x سپس git commit", "git merge --hard feature/x", "git squash branch", "git rebase main --one"], 0, "--squash تغییرات را stage می‌کند اما merge commit واقعی نمی‌سازد.", "Squash"),
    q("challenge", "یافتن نویسندهٔ هر خط فایل؟", ["git blame path/to/file", "git log --author-line", "git who file", "git inspect owner"], 0, "blame commit و author مربوط به آخرین تغییر هر خط را نشان می‌دهد.", "Blame"),
    q("challenge", "برچسب annotated برای نسخهٔ v1.0؟", ["git tag -a v1.0 -m \"release v1.0\"", "git branch v1.0 --tag", "git release v1.0", "git tag --remote v1.0"], 0, "annotated tag پیام، tagger و metadata مستقل دارد.", "Tag"),
  ],
  [
    q("beginner", "کپی یک Remote Repository روی سیستم؟", ["git clone <url>", "git copy <url>", "git pull-new <url>", "git init <url>"], 0, "clone repo، تاریخچه و remote پیش‌فرض origin را می‌سازد.", "Clone"),
    q("beginner", "دیدن remoteها و URL آنها؟", ["git remote -v", "git origin --url", "git status --remote", "git remote --open"], 0, "-v آدرس fetch و push را نمایش می‌دهد.", "Remote"),
    q("beginner", "افزودن remote با نام origin؟", ["git remote add origin <url>", "git origin = <url>", "git add remote <url>", "git connect origin"], 0, "origin فقط یک نام قراردادی برای remote است.", "Remote"),
    q("beginner", "ارسال main و تنظیم upstream در بار اول؟", ["git push -u origin main", "git upload main", "git push main origin", "git remote main"], 0, "-u ارتباط tracking را برای push/pullهای بعدی ذخیره می‌کند.", "Push"),
    q("beginner", "دریافت اطلاعات remote بدون ادغام؟", ["git fetch origin", "git pull --no-files", "git clone --update", "git remote download"], 0, "fetch remote-tracking refها را به‌روز می‌کند و branch فعلی را تغییر نمی‌دهد.", "Fetch"),
    q("intermediate", "git pull به‌صورت مفهومی چیست؟", ["fetch سپس merge یا rebase", "push سپس clone", "commit سپس reset", "فقط download فایل‌ها"], 0, "نوع integration با تنظیمات یا flag تعیین می‌شود.", "Pull"),
    q("intermediate", "تغییر URL مربوط به origin؟", ["git remote set-url origin <url>", "git origin --change <url>", "git remote edit origin", "git config remote <url>"], 0, "set-url آدرس remote موجود را تغییر می‌دهد.", "Remote"),
    q("intermediate", "دیدن branchهای محلی و remote-tracking؟", ["git branch -a", "git remote branches", "git branch --github", "git log --branches-only"], 0, "-a هر دو دسته را فهرست می‌کند.", "Branch"),
    q("intermediate", "ساخت branch محلی بر اساس origin/feature؟", ["git switch -c feature --track origin/feature", "git clone origin/feature", "git merge origin/feature --new", "git branch origin feature"], 0, "--track upstream branch تازه را تنظیم می‌کند.", "Tracking"),
    q("intermediate", "حذف branch remote به نام old؟", ["git push origin --delete old", "git branch -d origin/old", "git remote rm old", "git delete origin old"], 0, "درخواست حذف ref آن branch به remote ارسال می‌شود.", "Remote branch"),
    q("challenge", "خطای non-fast-forward در push معمولاً یعنی چه؟", ["remote commitهایی دارد که branch محلی ندارد", "Git نصب نیست", "فایل stage نشده", "ایمیل تنظیم نشده"], 0, "ابتدا تغییرات remote را fetch/pull و به شکل امن ادغام کنید.", "Push diagnosis"),
    q("challenge", "تفاوت origin/main و main؟", ["اولی remote-tracking ref و دومی branch محلی است", "هیچ تفاوتی ندارند", "اولی tag است", "دومی فقط روی GitHub است"], 0, "origin/main آخرین وضعیت شناخته‌شدهٔ remote پس از fetch است.", "Remote refs"),
    q("challenge", "بعد از rebase شخصی و نیاز واقعی به force push امن‌تر؟", ["git push --force-with-lease", "git push --force-hard", "git push --overwrite-all", "git reset remote"], 0, "with-lease اگر remote برخلاف انتظار جلو رفته باشد push را رد می‌کند.", "Push safety"),
    q("challenge", "پاک کردن remote-tracking refهای حذف‌شده از سرور؟", ["git fetch --prune", "git clean remote", "git branch -d --all", "git remote reset"], 0, "prune ارجاع‌های stale را حذف می‌کند.", "Fetch"),
    q("challenge", "برای بررسی تغییرات remote پیش از ادغام چه توالی امنی است؟", ["git fetch origin سپس git log/diff HEAD..origin/main", "git pull --force", "git reset --hard origin/main", "git clone دوباره"], 0, "fetch جداگانه فرصت بررسی قبل از تغییر branch فعلی می‌دهد.", "Remote workflow"),
  ],
  [
    q("beginner", "Pull Request چیست؟", ["درخواست بررسی و ادغام تغییرات یک branch", "دستور دانلود Git", "نوع commit محلی", "فایل تنظیمات"], 0, "PR فضای گفتگو، review و checks پیش از merge است.", "Pull Request"),
    q("beginner", "Issue در GitHub برای چیست؟", ["پیگیری کار، باگ یا پیشنهاد", "ذخیرهٔ رمز", "اجرای commit", "ساخت branch محلی"], 0, "Issue می‌تواند assignee، label و milestone داشته باشد.", "Issues"),
    q("beginner", "Fork چیست؟", ["کپی مستقل repository در حساب دیگر", "حذف branch", "نوع merge", "نسخهٔ local-only"], 0, "Fork برای مشارکت بدون دسترسی نوشتن مستقیم رایج است.", "Fork"),
    q("beginner", "Review با Request changes چه معنایی دارد؟", ["قبل از merge اصلاح لازم است", "PR خودکار merge شد", "branch حذف شد", "تست‌ها موفق‌اند"], 0, "Reviewer تغییرهای مشخصی را لازم می‌داند.", "Review"),
    q("beginner", "بهتر است PR چه ویژگی داشته باشد؟", ["کوچک، متمرکز و دارای توضیح روشن", "صدها تغییر نامرتبط", "بدون عنوان", "مستقیم روی main"], 0, "PR کوچک سریع‌تر و دقیق‌تر review می‌شود.", "Pull Request"),
    q("intermediate", "برای sync کردن fork، remote رایج repo اصلی چه نام دارد؟", ["upstream", "origin2", "parent-local", "main-server"], 0, "origin معمولاً fork شخصی و upstream repo اصلی است.", "Fork workflow"),
    q("intermediate", "قبل از PR بهتر است feature را با چه چیزی همگام کنیم؟", ["آخرین branch مقصد مانند main", "یک tag تصادفی", "README fork دیگر", "هیچ‌چیز"], 0, "این کار conflictهای دیرهنگام را کم می‌کند.", "Collaboration"),
    q("intermediate", "Draft PR چه کاربردی دارد؟", ["نمایش کار در حال انجام بدون اعلام آمادگی برای merge", "حذف review", "مخفی کردن کد", "force push خودکار"], 0, "Draft بازخورد زودهنگام و visibility می‌دهد.", "Pull Request"),
    q("intermediate", "CODEOWNERS چه می‌کند؟", ["Reviewerهای مسئول مسیرهای کد را مشخص می‌کند", "مالک قانونی repo را عوض می‌کند", "رمزها را نگه می‌دارد", "commitها را squash می‌کند"], 0, "GitHub می‌تواند review مالک مسیر را خودکار درخواست کند.", "Review"),
    q("intermediate", "Resolve conversation در review یعنی؟", ["موضوع بازخورد رسیدگی یا توافق شده است", "commit حذف شده", "PR بسته شده", "Issue ساخته شده"], 0, "رشتهٔ گفتگو باقی می‌ماند اما resolved علامت می‌خورد.", "Review"),
    q("challenge", "برای جلوگیری از push مستقیم به main از چه استفاده می‌شود؟", ["Branch protection / ruleset", ".gitignore", "Fork visibility", "Release tag"], 0, "قواعد می‌توانند PR، review و checks موفق را الزامی کنند.", "Governance"),
    q("challenge", "Squash merge در PR چه نتیجه‌ای دارد؟", ["commitهای PR را به یک commit روی مقصد تبدیل می‌کند", "کل تاریخچه را حذف می‌کند", "فقط branch را rename می‌کند", "merge را لغو می‌کند"], 0, "تاریخچهٔ مقصد خطی‌تر می‌شود.", "Merge strategy"),
    q("challenge", "Merge queue برای چه مفید است؟", ["ادغام امن PRهای متعدد با اعتبارسنجی روی آخرین مقصد", "ذخیرهٔ issueها", "clone سریع‌تر", "تغییر license"], 0, "صف، PRها را به‌ترتیب و با checks معتبر ادغام می‌کند.", "Collaboration"),
    q("challenge", "بهترین واکنش به conflict در PR feature چیست؟", ["branch را با مقصد همگام، conflict را محلی حل، تست و push کنید", "main را force push کنید", "repo را پاک کنید", "review را dismiss کنید"], 0, "حل conflict باید قابل‌بررسی و همراه تست باشد.", "Conflict"),
    q("challenge", "برای اتصال خودکار PR به Issue شمارهٔ 42 در توضیح؟", ["Closes #42", "Delete #42", "Merge issue 42", "Tag @42"], 0, "کلیدواژه‌هایی مانند Closes/Fixes پس از merge Issue را می‌بندند.", "Issues"),
  ],
  [
    q("beginner", "فایل workflow معمولاً کجاست؟", [".github/workflows/*.yml", ".git/actions.txt", "workflow.json", "src/github.yml"], 0, "GitHub Actions فایل‌های YAML این مسیر را می‌خواند.", "Workflow"),
    q("beginner", "on در workflow چه چیزی را تعریف می‌کند؟", ["رویدادهای اجراکنندهٔ workflow", "سیستم‌عامل", "رمزها", "نام branch محلی"], 0, "push، pull_request و workflow_dispatch نمونه trigger هستند.", "Trigger"),
    q("beginner", "jobs شامل چیست؟", ["یک یا چند کار قابل اجرا", "فقط پیام commit", "تنظیمات Git محلی", "فهرست contributorها"], 0, "هر job روی runner اجرا و شامل steps است.", "Job"),
    q("beginner", "runs-on چه چیزی را تعیین می‌کند؟", ["نوع runner مانند ubuntu-latest", "branch مقصد", "نسخهٔ Git", "نام artifact"], 0, "runner ماشین اجرای job است.", "Runner"),
    q("beginner", "uses: actions/checkout چه می‌کند؟", ["کد repository را داخل runner checkout می‌کند", "PR را merge می‌کند", "Git را uninstall می‌کند", "artifact را publish می‌کند"], 0, "بیشتر jobهای build ابتدا کد را checkout می‌کنند.", "Action"),
    q("intermediate", "تفاوت uses و run در step؟", ["uses یک Action را مصرف می‌کند؛ run فرمان shell اجرا می‌کند", "هیچ تفاوتی ندارند", "run فقط ویندوز است", "uses فقط برای secret است"], 0, "هر step معمولاً یکی از این دو را دارد.", "Step"),
    q("intermediate", "ترتیب jobها با چه کلیدی کنترل می‌شود؟", ["needs", "after", "depends", "queue"], 0, "needs وابستگی و ترتیب اجرای job را می‌سازد.", "Job dependency"),
    q("intermediate", "Secret با نام TOKEN چگونه خوانده می‌شود؟", ["${{ secrets.TOKEN }}", "$TOKEN.public", "github.secret(TOKEN)", "{{ TOKEN }}"], 0, "Secretها نباید مستقیم در log چاپ شوند.", "Secrets"),
    q("intermediate", "اجرای دستی workflow؟", ["workflow_dispatch", "manual_push", "on: click", "action_start"], 0, "workflow_dispatch دکمهٔ Run workflow را فعال می‌کند.", "Trigger"),
    q("intermediate", "Matrix strategy چه کاربردی دارد؟", ["اجرای job برای چند نسخه یا سیستم‌عامل", "ادغام branchها", "رمزنگاری artifact", "حذف cache"], 0, "مثلاً تست Node 20 و 22 روی چند OS.", "Matrix"),
    q("challenge", "برای استفاده از خروجی build در job دیگر؟", ["upload-artifact سپس download-artifact", "git push dist", "cache-only", "checkout دوباره کافی است"], 0, "Artifact دادهٔ تولیدشده را بین jobها یا برای دانلود نگه می‌دارد.", "Artifact"),
    q("challenge", "Cache چه فرقی با Artifact دارد؟", ["Cache برای سرعت اجرای بعدی است؛ Artifact خروجی قابل‌نگهداری/دانلود", "هیچ تفاوتی ندارد", "Artifact فقط secret است", "Cache برای branch merge است"], 0, "Cache نباید روش اصلی انتقال خروجی حیاتی باشد.", "Cache"),
    q("challenge", "حداقل permission امن برای GITHUB_TOKEN؟", ["فقط دسترسی‌های لازم برای job", "write-all همیشه", "admin", "بدون محدودیت"], 0, "اصل least privilege سطح آسیب را کم می‌کند.", "Security"),
    q("challenge", "چرا Action را به SHA کامل pin می‌کنند؟", ["کاهش ریسک تغییر ناخواسته یا supply-chain", "برای نام کوتاه‌تر", "برای اجرای محلی", "برای ساخت branch"], 0, "SHA تغییرناپذیرتر از tag شناور است.", "Security"),
    q("challenge", "برای جلوگیری از deploy هم‌زمان ناسازگار؟", ["concurrency با group مناسب", "needs: none", "checkout: false", "git reset --hard"], 0, "concurrency می‌تواند اجرای قبلی گروه را لغو یا سری کند.", "Deployment"),
  ],
];

export const quizQuestions: QuizQuestion[] = moduleQuestions.flatMap((items, moduleIndex) =>
  items.map((item, questionIndex) => ({
    ...item,
    id: `m${moduleIndex + 1}-q${questionIndex + 1}`,
    module: moduleIndex + 1,
  })),
);

export const modules = [
  { id: 1, title: "مبانی و راه‌اندازی", en: "FOUNDATIONS", description: "Git، نصب، Config، Repository و HEAD" },
  { id: 2, title: "کار محلی با Git", en: "LOCAL GIT", description: "Status، Diff، Stage، Commit، Restore و Reset" },
  { id: 3, title: "Branch و Merge", en: "BRANCHING", description: "Branch، Conflict، Merge، Rebase، Tag و Stash" },
  { id: 4, title: "Remote و GitHub", en: "REMOTES", description: "Clone، Origin، Fetch، Pull، Push و Tracking" },
  { id: 5, title: "همکاری تیمی", en: "TEAMWORK", description: "Pull Request، Review، Issues، Fork و Contribution" },
  { id: 6, title: "GitHub Actions", en: "AUTOMATION", description: "Workflow، Trigger، Job، Step، Test و Deploy" },
];

export type Mission = {
  id: number;
  level: Level;
  title: string;
  prompt: string;
  steps: string[];
  movableGroups?: string[][];
  hint: string;
};

export const missions: Mission[] = [
  { id: 1, level: "beginner", title: "اولین Snapshot", prompt: "یک repository بساز، app.js را stage کن و اولین commit را ثبت کن.", steps: ["git init", "git add app.js", "git commit -m \"feat: first snapshot\""], hint: "اول repo، بعد Stage و در پایان Commit." },
  { id: 2, level: "beginner", title: "ثبت دو فایل", prompt: "README و index.html را در یک commit ثبت کن.", steps: ["git add README.md index.html", "git commit -m \"docs: add project files\""], hint: "هر دو فایل می‌توانند با یک add وارد Stage شوند." },
  { id: 3, level: "beginner", title: "اصلاح Stage", prompt: "app.js را stage کرده‌ای اما نمی‌خواهی commit شود؛ از Stage خارجش کن.", steps: ["git add app.js", "git restore --staged app.js"], hint: "restore --staged فایل Working Tree را پاک نمی‌کند." },
  { id: 4, level: "beginner", title: "شاخهٔ Feature", prompt: "شاخه feature/login را بساز، تغییر را stage و commit کن.", steps: ["git switch -c feature/login", "git add login.js", "git commit -m \"feat: add login\""], hint: "قبل از commit روی branch درست قرار بگیر." },
  { id: 5, level: "beginner", title: "ارسال اولین main", prompt: "remote را اضافه کن و main را با upstream ارسال کن.", steps: ["git remote add origin https://github.com/user/project.git", "git push -u origin main"], hint: "Remote باید قبل از push معرفی شود." },
  { id: 6, level: "beginner", title: "لغو تغییر محلی", prompt: "تغییر اشتباه style.css را پیش از Stage لغو کن.", steps: ["git restore style.css"], hint: "این عملیات تغییر commit‌نشده را حذف می‌کند." },
  { id: 7, level: "intermediate", title: "Fast-forward Merge", prompt: "روی feature یک commit بساز، به main برگرد و merge کن.", steps: ["git switch -c feature/cart", "git add cart.js", "git commit -m \"feat: add cart\"", "git switch main", "git merge feature/cart"], hint: "branch مقصد main است." },
  { id: 8, level: "intermediate", title: "Merge Commit اجباری", prompt: "feature/docs را با حفظ ردپای branch در main ادغام کن.", steps: ["git switch main", "git merge --no-ff feature/docs"], hint: "--no-ff حتی در مسیر خطی merge commit می‌سازد." },
  { id: 9, level: "intermediate", title: "Conflict حل‌شده", prompt: "پس از merge و اصلاح دستی conflict فایل app.js، ادغام را کامل کن.", steps: ["git merge feature/theme", "git add app.js", "git commit -m \"merge: resolve theme conflict\""], hint: "پس از اصلاح conflict فایل resolved را Stage کن." },
  { id: 10, level: "intermediate", title: "Fetch قبل از Merge", prompt: "تغییرات origin را بگیر و بعد origin/main را در main ادغام کن.", steps: ["git fetch origin", "git switch main", "git merge origin/main"], movableGroups: [["git fetch origin", "git switch main"]], hint: "fetch تاریخچه را می‌گیرد؛ merge آن را وارد branch می‌کند." },
  { id: 11, level: "intermediate", title: "Revert امن", prompt: "کامیت bad123 منتشر شده؛ بدون بازنویسی تاریخچه آن را خنثی و push کن.", steps: ["git revert bad123", "git push origin main"], hint: "برای تاریخچهٔ مشترک revert از reset امن‌تر است." },
  { id: 12, level: "intermediate", title: "Cherry-pick", prompt: "کامیت a1b2c3 را روی release اعمال و ارسال کن.", steps: ["git switch release", "git cherry-pick a1b2c3", "git push origin release"], hint: "اول branch مقصد را انتخاب کن." },
  { id: 13, level: "intermediate", title: "Tag نسخه", prompt: "برای HEAD یک tag annotated بساز و آن را ارسال کن.", steps: ["git tag -a v1.0.0 -m \"release v1.0.0\"", "git push origin v1.0.0"], hint: "tag به‌صورت خودکار با push معمولی ارسال نمی‌شود." },
  { id: 14, level: "intermediate", title: "Stash موقت", prompt: "کار نیمه‌تمام را کنار بگذار، main را به‌روز و سپس کار را برگردان.", steps: ["git stash push -m \"wip\"", "git switch main", "git pull --ff-only", "git switch feature/profile", "git stash pop"], hint: "برای switch تمیز ابتدا stash کن." },
  { id: 15, level: "challenge", title: "Rebase روی main", prompt: "feature/search را روی آخرین origin/main بازپخش کن.", steps: ["git fetch origin", "git switch feature/search", "git rebase origin/main"], hint: "اول remote-tracking refs را تازه کن." },
  { id: 16, level: "challenge", title: "Push پس از Rebase", prompt: "branch شخصی rebase شده را با محافظت در برابر overwrite ارسال کن.", steps: ["git push --force-with-lease origin feature/search"], hint: "force-with-lease از force امن‌تر است." },
  { id: 17, level: "challenge", title: "Squash Merge", prompt: "تغییرات feature/ui را به یک commit روی main تبدیل و ارسال کن.", steps: ["git switch main", "git merge --squash feature/ui", "git commit -m \"feat: add complete UI\"", "git push origin main"], hint: "--squash فقط تغییرها را Stage می‌کند؛ commit جدا لازم است." },
  { id: 18, level: "challenge", title: "حذف Secret پیگیری‌شده", prompt: "فایل .env را از tracking خارج، ignore و اصلاح را ثبت کن.", steps: ["git rm --cached .env", "git add .gitignore", "git commit -m \"chore: stop tracking env\"", "git push origin main"], hint: "خود .env را دوباره add نکن." },
  { id: 19, level: "challenge", title: "همگام‌سازی Fork", prompt: "main فورک را با upstream/main به‌صورت fast-forward همگام و به origin بفرست.", steps: ["git fetch upstream", "git switch main", "git merge --ff-only upstream/main", "git push origin main"], movableGroups: [["git fetch upstream", "git switch main"]], hint: "upstream منبع اصلی و origin فورک شماست." },
  { id: 20, level: "challenge", title: "Release Hotfix", prompt: "از tag v2.0 شاخه hotfix بساز، اصلاح را commit، روی main merge و tag جدید را push کن.", steps: ["git switch -c hotfix/payment v2.0.0", "git add payment.js", "git commit -m \"fix: payment timeout\"", "git switch main", "git merge --no-ff hotfix/payment", "git tag -a v2.0.1 -m \"release v2.0.1\"", "git push origin main", "git push origin v2.0.1"], hint: "ترتیب branch، commit، merge، tag و push مهم است." },
];

export const commandGroups = [
  { title: "SETUP", description: "هویت و ساخت Repository", commands: [["git --version", "نمایش نسخهٔ Git"], ["git config --global user.name \"Your Name\"", "تنظیم نام نویسنده"], ["git config --global user.email \"you@example.com\"", "تنظیم ایمیل"], ["git init", "ساخت Repository محلی"], ["git clone <url>", "کپی Repository موجود"]] },
  { title: "LOCAL STATE", description: "Working Tree، Stage و History", commands: [["git status", "دیدن وضعیت فایل‌ها"], ["git add <file>", "فرستادن فایل به Stage"], ["git add .", "Stage کردن تغییرات پوشه"], ["git commit -m \"message\"", "ساخت Snapshot"], ["git diff", "تغییرات stage‌نشده"], ["git diff --staged", "تغییرات staged"], ["git log --oneline --graph --all", "تاریخچهٔ گرافی"], ["git restore <file>", "لغو تغییر محلی"], ["git restore --staged <file>", "خارج کردن از Stage"], ["git revert <hash>", "کامیت معکوس امن"]] },
  { title: "BRANCH & MERGE", description: "ساخت مسیرها و ادغام", commands: [["git branch", "فهرست Branchها"], ["git switch -c <branch>", "ساخت و ورود"], ["git switch <branch>", "جابه‌جایی"], ["git merge <branch>", "ادغام"], ["git merge --no-ff <branch>", "Merge Commit"], ["git rebase <branch>", "بازپخش تاریخچه"], ["git cherry-pick <hash>", "انتقال یک Commit"], ["git tag -a v1.0 -m \"release\"", "Tag annotated"], ["git stash", "کنار گذاشتن موقت تغییرات"]] },
  { title: "REMOTE", description: "ارتباط Local و GitHub", commands: [["git remote -v", "نمایش Remoteها"], ["git remote add origin <url>", "افزودن Origin"], ["git fetch origin", "دریافت بدون ادغام"], ["git pull", "دریافت و ادغام"], ["git push -u origin main", "اولین Push"], ["git push", "ارسال Commitها"], ["git push --force-with-lease", "Force امن‌تر"]] },
  { title: "RECOVERY", description: "اصلاح آگاهانهٔ تاریخچه", commands: [["git reset --soft HEAD~1", "حذف commit و حفظ Stage"], ["git reset HEAD~1", "حذف commit و حفظ فایل‌ها"], ["git reset --hard HEAD~1", "حذف commit و تغییرات"], ["git reflog", "ردیابی حرکت HEAD"], ["git merge --abort", "لغو Merge"], ["git rebase --abort", "لغو Rebase"]] },
  { title: "TEAM & ACTIONS", description: "دستورات و مفاهیم GitHub", commands: [["gh pr create", "ساخت Pull Request با GitHub CLI"], ["gh pr checkout <number>", "دریافت PR"], ["gh issue create", "ساخت Issue"], [".github/workflows/*.yml", "مسیر Workflowها"], ["workflow_dispatch", "اجرای دستی Action"], ["actions/checkout@v4", "دریافت کد روی Runner"]] },
] as const;
