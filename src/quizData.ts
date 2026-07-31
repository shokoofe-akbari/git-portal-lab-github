export type QuizLevel = "BEGINNER" | "INTERMEDIATE" | "CHALLENGE";

export type QuizQuestion = {
  questionFa: string;
  options: string[];
  answer: number;
  whyFa: string;
  level: QuizLevel;
};

export type QuizModule = {
  id: string;
  number: string;
  label: string;
  titleFa: string;
  descriptionFa: string;
  questions: QuizQuestion[];
};

type QuestionSeed = [string, string[], number, string];

function questions(seeds: QuestionSeed[]): QuizQuestion[] {
  return seeds.map(([questionFa, options, answer, whyFa], index) => ({
    questionFa,
    options,
    answer,
    whyFa,
    level: index < 5 ? "BEGINNER" : index < 10 ? "INTERMEDIATE" : "CHALLENGE",
  }));
}

export const quizModules: QuizModule[] = [
  {
    id: "foundations",
    number: "01",
    label: "FOUNDATIONS",
    titleFa: "مبانی و راه‌اندازی",
    descriptionFa: "Git، GitHub، نصب، تنظیمات اولیه و ساخت Repository",
    questions: questions([
      ["Git در اصل چه نوع ابزاری است؟", ["ویرایشگر کد", "سیستم کنترل نسخهٔ توزیع‌شده", "فضای میزبانی ابری", "مدیر Package"], 1, "Git تاریخچهٔ تغییرها را به‌صورت محلی و توزیع‌شده مدیریت می‌کند."],
      ["GitHub چه نقشی دارد؟", ["جایگزین Git است", "سرویس میزبانی و همکاری روی Repositoryهای Git", "کامپایلر JavaScript است", "فقط ابزار Backup است"], 1, "GitHub سرویس میزبانی Repository و امکانات همکاری مانند PR و Issue است."],
      ["کدام دستور نصب و نسخهٔ Git را بررسی می‌کند؟", ["git status", "git --version", "git init", "git check"], 1, "git --version نسخهٔ Git نصب‌شده را بدون تغییر هیچ فایلی نمایش می‌دهد."],
      ["برای ثبت نام نویسندهٔ Commitها کدام تنظیم درست است؟", ["git user.name", "git config --global user.name", "git init user", "git author"], 1, "user.name در Config سراسری، نام نویسندهٔ Commitهای جدید را مشخص می‌کند."],
      ["دستور git init چه چیزی می‌سازد؟", ["یک Repository خالی در GitHub", "پوشهٔ .git و ساختار Repository محلی", "اولین Commit", "شاخهٔ Remote"], 1, "git init پوشهٔ مخفی .git را ایجاد می‌کند و فایل‌ها را جابه‌جا نمی‌کند."],
      ["اطلاعات اصلی یک Repository محلی کجا نگهداری می‌شود؟", ["node_modules", ".git", ".github", "README.md"], 1, "Objectها، Refها و تنظیمات Repository داخل پوشهٔ .git قرار دارند."],
      ["تفاوت Git و GitHub چیست؟", ["هیچ تفاوتی ندارند", "Git ابزار کنترل نسخه و GitHub سرویس میزبانی و همکاری است", "Git فقط آنلاین است", "GitHub فقط روی Windows کار می‌کند"], 1, "Git مستقل و محلی کار می‌کند؛ GitHub یک سرویس آنلاین بر پایهٔ Git است."],
      ["برای تنظیم ایمیل نویسنده در همهٔ Repositoryهای کاربر چه دستوری مناسب است؟", ["git config user.email", "git config --global user.email", "git remote email", "git commit --email"], 1, "گزینهٔ --global تنظیم را در سطح کاربر اعمال می‌کند."],
      ["Repository به چه معناست؟", ["فقط یک پوشهٔ معمولی", "پروژه به‌همراه تاریخچه و Metadata کنترل نسخه", "فقط فایل‌های Stageشده", "یک Branch حذف‌شده"], 1, "Repository شامل فایل‌های پروژه و داده‌های تاریخچهٔ Git است."],
      ["کدام دستور Configهای فعال و منبع آن‌ها را بهتر نشان می‌دهد؟", ["git config --list --show-origin", "git status --config", "git origin --list", "git show settings"], 0, "--show-origin علاوه‌بر مقدار، فایل تنظیماتِ منبع را هم نشان می‌دهد."],
      ["اگر git init را دوباره در یک Repository اجرا کنیم چه می‌شود؟", ["تمام تاریخچه پاک می‌شود", "Repository دوباره مقداردهی می‌شود و معمولاً تاریخچه حفظ می‌شود", "GitHub حذف می‌شود", "همیشه خطای Fatal می‌دهد"], 1, "اجرای دوبارهٔ init معمولاً امن است و Metadata موجود را نابود نمی‌کند."],
      ["کدام بخش هویت Commit را واقعاً تعیین می‌کند؟", ["نام پوشه", "user.name و user.email", "نام Branch", "آدرس Remote"], 1, "Git نام و ایمیل تنظیم‌شده را داخل Metadata هر Commit ثبت می‌کند."],
      ["چرا Commitهای یک نفر ممکن است در GitHub به پروفایلش متصل نشوند؟", ["نام Branch کوتاه است", "ایمیل Commit در حساب GitHub تأیید نشده است", "README وجود ندارد", "Repository Private است"], 1, "GitHub اتصال Commit به حساب را بر اساس ایمیل ثبت‌شده انجام می‌دهد."],
      ["HEAD در Repository چه مفهومی دارد؟", ["نسخهٔ Git", "اشاره‌گر جایگاه فعلی کاربر در تاریخچه", "آدرس GitHub", "فهرست فایل‌های Ignore"], 1, "HEAD معمولاً به Branch فعلی و از آنجا به آخرین Commit اشاره می‌کند."],
      ["کدام کار قبل از اولین Commit منطقی‌تر است؟", ["حذف .git", "بررسی status و تنظیم هویت نویسنده", "force push", "rebase کردن main"], 1, "بررسی State و هویت نویسنده از ثبت Commit اشتباه جلوگیری می‌کند."],
    ]),
  },
  {
    id: "local",
    number: "02",
    label: "LOCAL WORKFLOW",
    titleFa: "کار محلی و تاریخچه",
    descriptionFa: "Working Directory، Staging، Commit، Diff، Restore، Reset و Ignore",
    questions: questions([
      ["git status چه چیزی را نشان می‌دهد؟", ["فقط Remoteها", "وضعیت Working، Staging و Branch فعلی", "فقط Commit آخر", "رمز GitHub"], 1, "Status یک نمای کلی و بدون تغییر از State فعلی Repository می‌دهد."],
      ["git add app.js فایل را به کدام ناحیه می‌برد؟", ["Remote", "Staging Area", "Stash", "Branch جدید"], 1, "add محتوای فعلی فایل را برای Commit بعدی داخل Index قرار می‌دهد."],
      ["Commit از محتوای کدام ناحیه Snapshot می‌سازد؟", ["Working Directory", "Staging Area", "Remote", "Stash"], 1, "Commit دقیقاً Snapshot آماده‌شده در Staging Area را ثبت می‌کند."],
      ["git diff بدون Option چه اختلافی را نشان می‌دهد؟", ["Working با Staging", "Local با Remote", "دو Remote", "دو Tag"], 0, "git diff تغییرهای Stageنشده را با Index مقایسه می‌کند."],
      ["هدف اصلی .gitignore چیست؟", ["حذف فایل‌ها", "جلوگیری از Track شدن فایل‌های ناخواسته", "رمزگذاری پروژه", "ساخت Branch"], 1, ".gitignore الگوهایی را مشخص می‌کند که Git نباید به‌صورت Untracked پیشنهاد دهد."],
      ["برای دیدن تغییرهای آمادهٔ Commit چه دستوری درست است؟", ["git diff", "git diff --staged", "git show remote", "git add --list"], 1, "--staged اختلاف Index با آخرین Commit را نمایش می‌دهد."],
      ["git restore --staged app.js چه می‌کند؟", ["فایل را حذف می‌کند", "فایل را از Stage خارج و تغییر Working را حفظ می‌کند", "Commit را حذف می‌کند", "فایل را Push می‌کند"], 1, "این دستور فقط انتخاب فایل برای Commit بعدی را لغو می‌کند."],
      ["git restore app.js چه خطری دارد؟", ["Remote را حذف می‌کند", "تغییر ذخیره‌نشدهٔ Working را دور می‌ریزد", "Branch را Rename می‌کند", "Commit جدید می‌سازد"], 1, "Restore بدون --staged محتوای Working را بازنویسی می‌کند."],
      ["git reset --soft HEAD~1 بعد از اجرا تغییرها را کجا نگه می‌دارد؟", ["Remote", "Staging Area", "Stash", "حذف می‌کند"], 1, "Soft Reset فقط Pointer را عقب می‌برد و Index را نگه می‌دارد."],
      ["برای دیدن تاریخچهٔ فشرده و شاخه‌ای کدام دستور مناسب‌تر است؟", ["git log --oneline --graph --all", "git status -s", "git add -A", "git remote -v"], 0, "ترکیب oneline، graph و all ساختار تاریخچه و Branchها را روشن می‌کند."],
      ["تفاوت git reset و git revert در تاریخچهٔ مشترک چیست؟", ["تفاوتی ندارند", "Reset تاریخچه را جابه‌جا می‌کند؛ Revert Commit خنثی‌کننده می‌سازد", "Revert فایل را Stage می‌کند", "Reset همیشه Remote را تغییر می‌دهد"], 1, "Revert برای تاریخچهٔ منتشرشده امن‌تر است چون آن را بازنویسی نمی‌کند."],
      ["اگر فایلی قبلاً Track شده باشد و بعد به .gitignore اضافه شود چه می‌شود؟", ["فوراً Untrack می‌شود", "همچنان Track می‌شود تا از Index خارج شود", "حذف می‌شود", "به Stash می‌رود"], 1, ".gitignore روی فایل‌هایی که از قبل Track شده‌اند اثر خودکار ندارد."],
      ["Alias در Git چه کاربردی دارد؟", ["رمزگذاری Commit", "ساخت نام کوتاه برای دستورهای پرتکرار", "اتصال Remote", "حذف Branch"], 1, "Alias اجرای دستورهای طولانی و پرتکرار را سریع‌تر می‌کند."],
      ["git reset --hard HEAD~1 کدام Stateها را بازنویسی می‌کند؟", ["فقط Remote", "HEAD، Staging و Working", "فقط Config", "فقط Tag"], 1, "Hard Reset می‌تواند تغییرهای Commitنشده را برای همیشه از دسترس خارج کند."],
      ["برای خنثی‌کردن Commit اشتباهِ Push‌شده بهترین انتخاب عمومی چیست؟", ["git reset --hard", "git revert <hash>", "حذف .git", "git init"], 1, "Revert یک Commit جدید و قابل ردگیری می‌سازد و تاریخچهٔ تیم را نمی‌شکند."],
    ]),
  },
  {
    id: "branching",
    number: "03",
    label: "BRANCH & MERGE",
    titleFa: "شاخه‌سازی و ادغام",
    descriptionFa: "Branch، Switch، Merge، Conflict، Rebase، Squash، Cherry-pick، Tag و Stash",
    questions: questions([
      ["Branch در Git در ساده‌ترین تعریف چیست؟", ["کپی کامل پروژه", "Pointer متحرک به یک Commit", "Remote جدید", "پوشهٔ مخفی"], 1, "Branch فقط یک نام سبک‌وزن است که با Commitهای جدید جلو می‌رود."],
      ["برای ساخت و ورود هم‌زمان به شاخهٔ feature کدام دستور مناسب است؟", ["git switch -c feature", "git branch --delete feature", "git merge feature", "git init feature"], 0, "switch -c شاخه را از HEAD فعلی می‌سازد و بلافاصله روی آن قرار می‌گیرد."],
      ["git switch main چه چیزی را تغییر می‌دهد؟", ["Remote", "HEAD و Working Tree متناسب با main", "Config سراسری", "نام Repository"], 1, "تعویض Branch، HEAD و فایل‌های Working را با Snapshot مقصد هماهنگ می‌کند."],
      ["Fast-forward Merge چه زمانی ممکن است؟", ["وقتی شاخهٔ مقصد Commit مستقل ندارد", "وقتی Conflict وجود دارد", "فقط روی GitHub", "وقتی Remote حذف شده"], 0, "در Fast-forward تنها Pointer شاخه جلو می‌رود و Merge Commit لازم نیست."],
      ["کدام Option وجود Merge Commit را تضمین می‌کند؟", ["--squash", "--no-ff", "--hard", "--staged"], 1, "--no-ff حتی در حالت Fast-forward یک Node با دو مسیر تاریخی می‌سازد."],
      ["Conflict در Merge به چه معناست؟", ["Git نصب نیست", "Git نمی‌تواند تغییرهای هم‌پوشان را خودکار انتخاب کند", "Remote خصوصی است", "Branch خالی است"], 1, "Conflict نیازمند تصمیم انسانی دربارهٔ نسخهٔ نهایی خطوط درگیر است."],
      ["بعد از حل دستی Conflict معمولاً قدم بعدی چیست؟", ["git add فایل‌های حل‌شده و سپس commit", "git init", "git clone", "git remote remove"], 0, "Stage کردن فایل حل‌شده به Git اعلام می‌کند Conflict برطرف شده است."],
      ["Rebase چه اثری روی Commitهای منتقل‌شده دارد؟", ["Hash آن‌ها ثابت می‌ماند", "Commitها را با Hash جدید بازسازی می‌کند", "Remote را حذف می‌کند", "فایل‌ها را Ignore می‌کند"], 1, "چون Parent تغییر می‌کند، محتوای Commit object و در نتیجه Hash آن جدید می‌شود."],
      ["Cherry-pick برای چه کاری مناسب است؟", ["ادغام کامل دو Branch", "اعمال اثر یک Commit مشخص روی Branch فعلی", "حذف Repository", "ساخت Remote"], 1, "Cherry-pick تغییر یک Commit انتخابی را به Commit تازه‌ای روی شاخهٔ فعلی تبدیل می‌کند."],
      ["Stash چه مشکلی را حل می‌کند؟", ["ذخیرهٔ موقت تغییرها برای تعویض Context", "Push سریع‌تر", "ساخت Tag", "تغییر ایمیل"], 0, "Stash تغییرهای Commitنشده را موقتاً کنار می‌گذارد و Working را تمیز می‌کند."],
      ["تفاوت Merge و Rebase در شکل تاریخچه چیست؟", ["هیچ تفاوتی ندارند", "Merge مسیرها را حفظ می‌کند؛ Rebase Commitها را روی پایهٔ جدید بازمی‌سازد", "Merge Hash همه را عوض می‌کند", "Rebase فقط Remote است"], 1, "Merge تاریخچهٔ شاخه‌ای را نگه می‌دارد؛ Rebase معمولاً تاریخچه‌ای خطی‌تر می‌سازد."],
      ["Squash Merge چه نتیجه‌ای دارد؟", ["تمام Commitهای Branch را به یک تغییر تجمیعی تبدیل می‌کند", "همهٔ فایل‌ها را حذف می‌کند", "Branch را Remote می‌کند", "Conflict را غیرممکن می‌کند"], 0, "Squash تغییرهای شاخه را در یک Commit روی شاخهٔ مقصد خلاصه می‌کند."],
      ["Tag معمولاً برای چه چیزی استفاده می‌شود؟", ["نام‌گذاری نسخه یا نقطهٔ Release", "Stage کردن فایل", "حل Conflict", "ساخت Alias"], 0, "Tag یک نام پایدار برای Commit مهمی مانند نسخهٔ منتشرشده فراهم می‌کند."],
      ["چرا Rebase کردن Branch عمومی خطرناک است؟", ["سرعت را کم می‌کند", "Hashهای مشترک را تغییر می‌دهد و تاریخچهٔ دیگران را ناسازگار می‌کند", "GitHub را حذف می‌کند", "همیشه Conflict می‌سازد"], 1, "بازنویسی Commitهای منتشرشده باعث واگرایی Cloneهای اعضای تیم می‌شود."],
      ["Merge Commit چند Parent دارد؟", ["همیشه صفر", "معمولاً دو یا بیشتر", "دقیقاً یک", "Parent ندارد"], 1, "Merge Commit اتصال دو مسیر تاریخچه را با بیش از یک Parent ثبت می‌کند."],
    ]),
  },
  {
    id: "remote",
    number: "04",
    label: "REMOTE & GITHUB",
    titleFa: "Remote و GitHub",
    descriptionFa: "Origin، Clone، Push، Pull، Fetch، Tracking و خطاهای اتصال",
    questions: questions([
      ["Remote در Git چیست؟", ["یک Branch محلی", "نامی برای آدرس یک Repository دیگر", "نوع Commit", "فایل Ignore"], 1, "Remote مانند origin یک نام کوتاه برای URL Repository دیگر است."],
      ["origin معمولاً به چه چیزی اشاره می‌کند؟", ["آخرین Commit", "Remote پیش‌فرضی که Clone شده یا اضافه شده است", "Working Directory", "Stash"], 1, "origin یک قرارداد نام‌گذاری رایج برای Remote اصلی پروژه است."],
      ["git clone چه اجزایی می‌سازد؟", ["فقط Working Directory", "Local history، origin و Working checkout", "فقط Staging", "فقط یک Tag"], 1, "Clone تاریخچه را دریافت می‌کند، Remote را می‌سازد و Branch را Checkout می‌کند."],
      ["git push مسیر کدام State را طی می‌کند؟", ["Working به Staging", "Local Repository به Remote", "Remote به Working", "Stash به Local"], 1, "Push Commitها و Refهای Local را به Remote ارسال می‌کند."],
      ["git fetch چه چیزی را تغییر نمی‌دهد؟", ["Remote-tracking refs", "Working Directory", "Object database محلی", "origin/main"], 1, "Fetch داده‌های Remote را می‌گیرد اما فایل‌های Working را Checkout یا Merge نمی‌کند."],
      ["git pull در حالت معمول ترکیب کدام عملیات است؟", ["add + commit", "fetch + merge", "clone + push", "reset + stash"], 1, "Pull ابتدا Fetch و سپس تغییرها را در Branch فعلی ادغام می‌کند."],
      ["گزینهٔ -u در اولین Push چه می‌کند؟", ["فایل‌ها را Untrack می‌کند", "Upstream Branch را تنظیم می‌کند", "کاربر جدید می‌سازد", "Remote را حذف می‌کند"], 1, "Upstream باعث می‌شود Push و Pull بعدی بدون نام Remote و Branch قابل اجرا باشند."],
      ["origin/main چیست؟", ["Branch قابل ویرایش مستقیم", "Remote-tracking ref از وضعیت main روی origin", "Tag", "Stash"], 1, "origin/main نمای محلیِ آخرین وضعیت شناخته‌شدهٔ Branch دوردست است."],
      ["برای دیدن URLهای Fetch و Push چه دستوری مناسب است؟", ["git remote -v", "git log -v", "git status --url", "git origin"], 0, "remote -v نام و URLهای تعریف‌شده را نمایش می‌دهد."],
      ["Push چرا ممکن است با non-fast-forward رد شود؟", ["نام فایل کوتاه است", "Remote Commitهایی دارد که Local هنوز ندارد", "README موجود است", "Branch main است"], 1, "برای جلوگیری از حذف تاریخچهٔ دیگران، Remote Push عقب‌تر را رد می‌کند."],
      ["قبل از رفع خطای non-fast-forward چه کاری منطقی است؟", ["حذف .git", "Fetch/Pull و بررسی تغییرهای Remote", "Reset --hard بدون بررسی", "تعویض ایمیل"], 1, "ابتدا تاریخچهٔ جدید را دریافت و ادغام یا Rebase کن، سپس Push بزن."],
      ["تفاوت clone و pull چیست؟", ["تفاوتی ندارند", "Clone Repository جدید می‌سازد؛ Pull Repository موجود را به‌روز می‌کند", "Pull فقط بار اول است", "Clone Commit می‌سازد"], 1, "Clone برای ایجاد نسخهٔ محلی و Pull برای همگام‌سازی نسخهٔ موجود است."],
      ["کدام دستور Remote جدیدی به نام origin تعریف می‌کند؟", ["git remote add origin URL", "git origin URL", "git push --new URL", "git clone --origin-only"], 0, "remote add فقط اتصال را ثبت می‌کند و هنوز چیزی Upload نمی‌شود."],
      ["force-with-lease نسبت به force چه حفاظتی دارد؟", ["هیچ", "اگر Remote از آخرین مشاهده تغییر کرده باشد Push را متوقف می‌کند", "فایل‌ها را Encrypt می‌کند", "فقط Tag را می‌فرستد"], 1, "Lease جلوی بازنویسی ناآگاهانهٔ Commitهای تازهٔ هم‌تیمی را می‌گیرد."],
      ["اگر Fetch انجام شود ولی Merge نه، تغییرهای جدید کجا قابل مشاهده‌اند؟", ["فقط در Working", "در Remote-tracking refs مانند origin/main", "در Staging", "در .gitignore"], 1, "Fetch origin/main را جلو می‌برد و Branch فعلی را دست‌نخورده می‌گذارد."],
    ]),
  },
  {
    id: "teamwork",
    number: "05",
    label: "TEAMWORK",
    titleFa: "همکاری تیمی",
    descriptionFa: "Pull Request، Review، Issue، Fork، Contribution Workflow و Conflict تیمی",
    questions: questions([
      ["Pull Request چه هدفی دارد؟", ["نصب Git", "پیشنهاد و بررسی تغییرهای یک Branch پیش از ادغام", "حذف Remote", "ساخت Stash"], 1, "PR فضای گفتگو، Review و اجرای Checkها قبل از Merge فراهم می‌کند."],
      ["Code Review خوب بیشتر روی چه چیزی تمرکز می‌کند؟", ["شخص نویسنده", "درستی، خوانایی و اثر تغییر", "رنگ Editor", "تعداد Commitها فقط"], 1, "Review باید دربارهٔ کد و ریسک تغییر باشد، نه دربارهٔ فرد."],
      ["Issue معمولاً برای چه کاری است؟", ["ثبت کار، Bug یا پیشنهاد قابل پیگیری", "Stage فایل", "ساخت Commit", "تغییر Config"], 0, "Issue یک واحد قابل گفتگو و قابل پیگیری برای کار تیمی است."],
      ["Fork چیست؟", ["یک Tag", "کپی مستقل Repository در حساب دیگر", "نوع Merge", "پوشهٔ .git"], 1, "Fork اجازه می‌دهد بدون دسترسی Write روی نسخهٔ مستقل کار کنی."],
      ["بعد از Fork، تغییر معمولاً از چه مسیری به پروژهٔ اصلی پیشنهاد می‌شود؟", ["Hard Reset", "Pull Request از Fork", "حذف Branch", "git init"], 1, "PR تغییرهای Branch در Fork را برای ادغام در Upstream پیشنهاد می‌دهد."],
      ["Review comment مؤثر چگونه نوشته می‌شود؟", ["مبهم و دستوری", "مشخص، محترمانه و همراه دلیل یا پیشنهاد", "فقط با ایموجی", "بدون اشاره به خط"], 1, "Feedback دقیق و استدلال‌دار سریع‌تر به اصلاح قابل اقدام تبدیل می‌شود."],
      ["چرا Branch Protection استفاده می‌شود؟", ["برای جلوگیری از Clone", "برای الزام Review و Check پیش از تغییر Branch مهم", "برای مخفی‌کردن README", "برای حذف History"], 1, "قانون محافظت از ادغام مستقیم و تغییرهای کنترل‌نشده جلوگیری می‌کند."],
      ["Draft Pull Request چه زمانی مناسب است؟", ["وقتی کار هنوز آمادهٔ Merge نیست ولی Feedback زودهنگام می‌خواهیم", "بعد از حذف Repository", "فقط برای Release", "برای تغییر ایمیل"], 0, "Draft وضعیت ناتمام را شفاف می‌کند و امکان گفتگو را زودتر می‌دهد."],
      ["بهترین زمان Sync کردن Branch طولانی‌مدت با main چه زمانی است؟", ["فقط روز Merge", "به‌صورت منظم برای کاهش Conflict بزرگ", "هیچ‌وقت", "بعد از حذف main"], 1, "همگام‌سازی منظم اختلاف‌ها را کوچک و حل Conflict را ساده‌تر می‌کند."],
      ["در Conflict تیمی چه کسی باید نسخهٔ نهایی را انتخاب کند؟", ["Git به‌تنهایی", "فردی با درک Context تغییرها و هماهنگی با نویسندگان", "GitHub تصادفی", "اولین Reviewer"], 1, "حل Conflict یک تصمیم معنایی است و نیاز به شناخت هدف هر دو تغییر دارد."],
      ["چرا Commitهای کوچک و متمرکز برای Review بهترند؟", ["Hash کوتاه‌تر می‌شود", "هدف و اثر هر تغییر راحت‌تر فهمیده و بازگردانده می‌شود", "Conflict غیرممکن می‌شود", "Push حذف می‌شود"], 1, "Commit اتمیک، Review، Bisect و Revert را قابل اعتمادتر می‌کند."],
      ["Approve کردن PR به چه معناست؟", ["کد حتماً بدون Bug است", "Reviewer تغییر را در محدودهٔ بررسی‌شده قابل قبول می‌داند", "Branch حذف شده", "Deploy انجام شده"], 1, "Approve تأیید Review است و جای Test یا Checkهای خودکار را نمی‌گیرد."],
      ["upstream در Workflow مبتنی بر Fork معمولاً چیست؟", ["Fork شخصی", "Repository اصلی پروژه", "Branch موقت", "یک Commit محلی"], 1, "upstream نام رایج Remote پروژهٔ اصلی و origin معمولاً Fork شخصی است."],
      ["کدام Merge strategy تاریخچهٔ PR را در یک Commit خلاصه می‌کند؟", ["Squash and merge", "Fast-forward only", "Rebase --abort", "Cherry-pick --continue"], 0, "Squash and merge مجموعهٔ تغییرهای PR را به یک Commit روی Branch مقصد تبدیل می‌کند."],
      ["پیش از Merge نهایی PR کدام مجموعه منطقی‌تر است؟", ["Review، Checkهای سبز و Branch به‌روز", "فقط تعداد Like", "حذف Testها", "Force Push روی main"], 0, "ترکیب Review انسانی، Automation و وضعیت به‌روز ریسک ادغام را کم می‌کند."],
    ]),
  },
  {
    id: "actions",
    number: "06",
    label: "GITHUB ACTIONS",
    titleFa: "اتوماسیون با GitHub Actions",
    descriptionFa: "Workflow، Trigger، Job، Step، Runner، Secret و Pipelineهای build/test/publish",
    questions: questions([
      ["فایل‌های Workflow معمولاً در چه مسیری قرار می‌گیرند؟", [".git/actions", ".github/workflows", "src/actions", "node_modules/workflows"], 1, "GitHub فایل‌های YAML داخل .github/workflows را به‌عنوان Workflow شناسایی می‌کند."],
      ["Trigger یا on در Workflow چه چیزی را مشخص می‌کند؟", ["سیستم‌عامل کاربر", "رویدادی که Workflow را اجرا می‌کند", "نام Repository", "Branch فعلی Local"], 1, "on می‌تواند رویدادهایی مانند push، pull_request یا workflow_dispatch باشد."],
      ["Job در GitHub Actions چیست؟", ["یک Commit", "مجموعه Stepهایی که روی یک Runner اجرا می‌شوند", "یک Remote", "یک Issue"], 1, "هر Job محیط Runner و توالی Stepهای خودش را دارد."],
      ["Step معمولاً چه کاری انجام می‌دهد؟", ["یک Command یا Action را اجرا می‌کند", "Repository را حذف می‌کند", "Branch Protection می‌سازد", "Issue را می‌بندد"], 0, "Step کوچک‌ترین واحد اجرایی داخل Job است."],
      ["Runner چیست؟", ["محیط یا ماشین اجرای Job", "نام Branch", "نوع Commit", "فایل Config Git"], 0, "Runner زیرساختی است که Stepهای Job روی آن اجرا می‌شوند."],
      ["actions/checkout چه کاری می‌کند؟", ["کد Repository را روی Runner دریافت می‌کند", "PR را Merge می‌کند", "Secret می‌سازد", "Tag را حذف می‌کند"], 0, "بیشتر Jobها برای دسترسی به فایل‌های پروژه ابتدا Checkout انجام می‌دهند."],
      ["برای اجرای دستی Workflow از کدام Trigger استفاده می‌شود؟", ["push", "workflow_dispatch", "issues", "schedule-only"], 1, "workflow_dispatch دکمهٔ Run workflow و ورودی‌های اختیاری فراهم می‌کند."],
      ["Secretها را چگونه باید استفاده کرد؟", ["داخل README", "از context امن secrets و بدون چاپ در Log", "داخل نام Branch", "در Commit message"], 1, "Secret نباید داخل Repository یا Log آشکار شود."],
      ["needs بین Jobها چه مفهومی دارد؟", ["ترتیب و وابستگی Jobها", "نسخهٔ Git", "URL Remote", "نام Runner"], 0, "Job وابسته پس از موفقیت Jobهای مشخص‌شده در needs اجرا می‌شود."],
      ["Matrix strategy چه مزیتی دارد؟", ["اجرای یک Job روی چند ترکیب نسخه یا سیستم‌عامل", "حذف همهٔ Jobها", "ساخت Fork", "مخفی‌کردن Log"], 0, "Matrix تست چند محیط را با تعریف فشرده و اجرای موازی ممکن می‌کند."],
      ["برای Pipeline دانشجویی build/test/publish ترتیب منطقی چیست؟", ["publish سپس test", "checkout، setup، install، test، build و سپس publish", "حذف Dependency", "فقط push"], 1, "انتشار باید تنها پس از نصب، Test و Build موفق انجام شود."],
      ["چرا باید نسخهٔ Actionهای شخص ثالث Pin شود؟", ["برای زیباترشدن YAML", "برای کاهش ریسک تغییر ناگهانی یا Supply-chain", "برای حذف Runner", "برای سریع‌ترشدن Git add"], 1, "ارجاع پایدار به Tag معتبر یا SHA رفتار و امنیت Workflow را قابل کنترل‌تر می‌کند."],
      ["Artifact در Actions چیست؟", ["خروجی ذخیره‌شدهٔ یک Workflow مانند Build یا Report", "Branch محلی", "Remote URL", "Conflict Marker"], 0, "Artifact فایل خروجی Job را برای دانلود یا استفادهٔ Job دیگر نگه می‌دارد."],
      ["Cache با Artifact چه تفاوتی دارد؟", ["هیچ", "Cache برای سرعت Dependencyهاست؛ Artifact خروجی قابل نگهداری Workflow است", "Artifact فقط Secret است", "Cache Commit می‌سازد"], 1, "Cache اجرای بعدی را سریع می‌کند، درحالی‌که Artifact محصول یا گزارش اجراست."],
      ["برای جلوگیری از Publish روی PR خارجی چه نکته‌ای مهم است؟", ["قرار دادن Secret در کد", "محدودکردن Permission و شرط‌گذاری Event/Branch", "استفاده از reset --hard", "خاموش‌کردن Test"], 1, "کمینه‌کردن Permission و شرط دقیق مانع دسترسی ناخواسته به فرایند انتشار می‌شود."],
    ]),
  },
];
