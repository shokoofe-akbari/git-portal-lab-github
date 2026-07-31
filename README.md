# Git State Lab — Vercel Ready

نسخهٔ Vite + React و آمادهٔ دیپلوی مستقیم روی Vercel.

## دیپلوی بدون اجرای npm روی Windows

1. همهٔ فایل‌ها را در یک Repository روی GitHub قرار دهید.
2. وارد [vercel.com/new](https://vercel.com/new) شوید.
3. حساب GitHub را متصل و Repository را Import کنید.
4. Vercel به‌صورت خودکار Vite را تشخیص می‌دهد.
5. روی **Deploy** کلیک کنید.

تنظیمات آماده هستند:

```text
Build Command: npm run build
Output Directory: dist
```

هر Push بعدی به `main` به‌صورت خودکار Deploy می‌شود.

## اجرای محلی اختیاری

```bash
npm ci
npm run dev
```

## امکانات نسخهٔ بازطراحی‌شده

- رابط اصلی انگلیسی و LTR برای جلوگیری از به‌هم‌ریختگی جهت‌ها
- توضیحات، صورت مأموریت و آزمون‌ها به فارسی با فونت Vazir داخلی
- مأموریت‌های مرحله‌ای با State اولیهٔ مخصوص هر سناریو و XP
- شبیه‌سازی چهار ناحیهٔ Working، Staging، Local و Remote
- مسیرهای مستقل و صحیح برای `add`، `commit`، `push`، `fetch`، `pull`، `restore` و `reset`
- ترمینال تعاملی با پیشنهاد قدم بعدی مأموریت
- گراف بزرگ و زندهٔ Branch، Commit و Merge Commit
- آزمون مفهومی تمام‌عرض با توضیح پاسخ
- مرجع بزرگ، قابل جست‌وجو و قابل کپی دستورها
- طراحی واکنش‌گرا برای دسکتاپ، تبلت و موبایل
