# الرحلة / EL REHLA

منصة عربية بسيطة لتوليد طلبات السفر (Travel Lead-Generation + Trust Marketplace).

> هذه منصة **توليد طلبات** وثقة، **وليست محرك حجز**. في V1: العميل يبحث عن عروض، يرى العرض والوكيل الموثوق، يرسل طلب تواصل، الوكيل يستلم الطلب ويرد، وتتحدث حالة الطلب. الوكيل يسجّل، يتوثق، ينشئ عروضًا، تمر بالمراجعة ثم النشر.

## البنية الحالية

Next.js (App Router) + TypeScript + PostgreSQL (Drizzle ORM). واجهة العرض القديمة
محفوظة في `public/` كما هي، وسيتم ربطها بالخادم تدريجيًا.

### صفحات الواجهة المحفوظة (static prototype)
- `public/index.html` (الرئيسية)
- `public/tickets.html` / `public/visas.html` (العروض)
- `public/request.html` (طلب عرض)
- `public/join-agent.html` (انضم كوكيل)
- `public/agent.html` / `public/offer-details.html`
- `public/admin.html` (لوحة تجريبية)

يتم توجيه `/` إلى `public/index.html`.

### الخادم (App Router `/api`)
- `auth` — register / login / logout / session / csrf
- `agents` — إنشاء وتحديث الملف الشخصي + الملف العام
- `offers` — إنشاء وتحديث وتقديم للمراجعة ونشر + القائمة والتفاصيل العامة
- `contacts` — إنشاء طلب تواصل + صندوق الوارد + رؤية رد إغلاق (دورة الطلب)
- `admin` — قوائم المعاينة للوكلاء والعروض + قبول/رفض

## المتطلبات

- Node.js >= 20
- PostgreSQL (عبر `DATABASE_URL`)

### الإعداد المحلي

```bash
# 1) انسخ ملف البيئة
cp .env.example .env
# 2) شغّل PostgreSQL (اختياري عبر Docker أو أي مثيل محلي)
docker compose up -d
# 3) ثبّت الاعتماديات
npm install
# 4) نفّذ الهجرة لإنشاء الجداول
npm run db:migrate
# 5) ابدأ التطوير
npm run dev
```

## الأوامر

| الأمر | الوصف |
|---|---|
| `npm run dev` | خادم التطوير |
| `npm run build` | بناء الإنتاج |
| `npm run start` | تشغيل بناء الإنتاج |
| `npm run typecheck` | فحص الأنواع (tsc) |
| `npm run lint` | فحص الكود (eslint) |
| `npm run test` | تشغيل الاختبارات (vitest) |
| `npm run db:generate` | توليد ملف هجرة من المخطط |
| `npm run db:migrate` | تطبيق الهجرات على قاعدة البيانات |
| `npm run db:push` | مزامنة المخطط مباشرة |
| `npm run db:studio` | Drizzle Studio |

## كيانات قاعدة البيانات

`accounts`, `sessions`, `agents`, `offers`, `contact_requests`, `reviews`, `notifications`, `admin_actions`

- المخطط في `src/lib/db/schema.ts`
- الهجرات في `drizzle/`

## الأمان

- كلمات المرور تُخزّن مشفّرة (`bcryptjs`).
- الجلسات من جهة الخادم؛ يُخزّن فقط `hash` الرمز، والكوكي `HttpOnly` + `SameSite=Lax` + `Secure` في الإنتاج.
- لا تُعتمد أي `accountId` من المتصفح لعمليات الامتياز — تُشتق من الجلسة.
- حماية CSRF (double-submit) وحدّ معدل الطلبات، مع رؤوس أمان HTTP.
- لا تنكشف أسرار البيئة للكود العميل.

## ملاحظة عن قاعدة البيانات

البنيّة تعمل محليًا حتى بدون قاعدة بيانات (المسار الافتراضي `/` والواجهة القديمة).
عند غياب الاتصال بـ PostgreSQL تعيد نقاط الـ API استجابة JSON آمنة (500) بدون تسريب
تفاصيل، ويعرض `/api/health` الحالة (`database: "unavailable"`). لتشغيل الوظائف الفعلية
يلزم توفير `DATABASE_URL` لمثيل PostgreSQL حقيقي (خارجي).
