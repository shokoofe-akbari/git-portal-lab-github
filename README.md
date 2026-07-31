# Git Portal Lab

یک آزمایشگاه تعاملی و فارسی برای آموزش Git و GitHub؛ دانشجو دستورها را در ترمینال شبیه‌سازی‌شده اجرا می‌کند و حرکت فایل‌ها را میان چهار ناحیه می‌بیند:

- Working Directory
- Staging Area
- Local Repository
- GitHub Remote

## امکانات

- Playground آزاد با بیش از ۳۰ دستور و سناریوی آموزشی
- جابه‌جایی تصویری فایل‌ها متناسب با `add`، `commit`، `push`، `fetch`، `pull`، `restore` و `reset`
- مأموریت‌های مرحله‌ای و سیستم XP
- آزمون تعاملی با بازخورد مفهومی
- گراف زندهٔ Branch، Commit، Merge و Rebase
- مرجع قابل جست‌وجو و کپی دستورها
- رابط فارسی RTL و واکنش‌گرا

## اجرای محلی

نیازمندی: Node.js نسخهٔ 22.13 یا جدیدتر

```bash
npm ci
npm run dev
```

آدرسی که Vite در ترمینال نمایش می‌دهد را در مرورگر باز کنید.

## بررسی نسخهٔ Production

```bash
npm run build
```

## قراردادن در GitHub

پس از خارج‌کردن فایل‌ها از ZIP، داخل پوشهٔ پروژه اجرا کنید:

```bash
git init
git add .
git commit -m "Initial commit: Git Portal Lab"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/git-portal-lab.git
git push -u origin main
```

قبل از اجرای دو دستور آخر، یک Repository خالی به نام `git-portal-lab` در GitHub بسازید و `YOUR_USERNAME` را تغییر دهید.

## GitHub Actions

فایل `.github/workflows/ci.yml` با هر Push و Pull Request نصب وابستگی‌ها و Build پروژه را بررسی می‌کند.

## ساختار اصلی

```text
app/page.tsx       رابط و منطق شبیه‌ساز
app/globals.css    طراحی و انیمیشن‌ها
public/            تصاویر دوره
.github/workflows  فرایند CI
```

## نکته

این پروژه شبیه‌ساز آموزشی است و دستورها را روی فایل‌های واقعی سیستم کاربر اجرا نمی‌کند.
