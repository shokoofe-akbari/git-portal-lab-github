# Git State Lab — BugCharm

آزمایشگاه تعاملی کارگاه Git و GitHub، طراحی و تدریس شکوفه اکبری.

## انتشار بدون اجرای محلی

این نسخه برای Build مستقیم روی Vercel تنظیم شده است و لازم نیست پیش از انتشار روی سیستم شخصی اجرا شود. فایل `vercel.json` به‌صورت صریح Framework، دستور نصب، دستور Build و پوشهٔ خروجی را تعیین می‌کند.

1. محتویات این پوشه را در ریشهٔ Repository قرار دهید؛ `package.json` و `vercel.json` باید مستقیماً در صفحهٔ اول Repository دیده شوند.
2. تغییرات را روی شاخهٔ متصل به Vercel، معمولاً `main`، Commit کنید.
3. در Vercel از مسیر **Project → Settings → Build and Deployment** مقدار **Framework Preset** را یک‌بار روی **Vite** قرار دهید.
4. در **Root Directory** مقدار `./` را انتخاب کنید.
5. آخرین Commit را Redeploy کنید. Pushهای بعدی به‌صورت خودکار Deploy می‌شوند.

تنظیمات قطعی این پروژه:

```text
Framework: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
Root Directory: ./
```

## محیط‌ها

- Home: معرفی و مسیرهای سریع
- State Lab: چهار در تعاملی Working، Staging، Local و Remote
- Git Graph: سناریوها، Custom Builder، Merge/Rebase و Zoom از 65 تا 180 درصد
- Quiz + Order: ۹۰ سؤال، انتخاب تعداد تصادفی، ۲۰ مأموریت ترتیب دستور و گزارش آموزشی
- Roadmap: شش فصل کارگاه
- Commands: مرجع قابل‌جست‌وجو و قابل‌کپی

## مدرس

شکوفه اکبری — [BugCharm](https://www.bugcharm.com)
