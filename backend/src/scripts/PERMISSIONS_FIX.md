# Veritabanu0131 u0130zin Sorunlaru0131 u00c7u00f6zu00fcm Ku0131lavuzu

## Tespit Edilen Sorunlar

1. `users` tablosuna eriu015fim izni sorunu: `permission denied for table users`
2. AnimalController'da supabase import sorunu

## u00c7u00f6zu00fcm Adu0131mlaru0131

### 1. Supabase Tablo u0130zinlerini Du00fczeltme

Supabase yu00f6netim panelinde SQL editu00f6ru00fcnu00fc au00e7u0131n ve au015fau011fu0131daki SQL komutlaru0131nu0131 u00e7alu0131u015ftu0131ru0131n:

```sql
-- Users tablosu iu00e7in RLS'yi devre du0131u015fu0131 bu0131rak
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Diu011fer tablolar iu00e7in de aynu0131 iu015flemi yapabilirsiniz
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals DISABLE ROW LEVEL SECURITY;
```

Alternatif olarak, daha gu00fcvenli bir yaklau015fu0131m iu00e7in RLS politikalaru0131 ekleyebilirsiniz:

```sql
-- Users tablosu iu00e7in RLS politikasu0131
CREATE POLICY "users tablosuna tam eriu015fim" ON public.users
    USING (true)
    WITH CHECK (true);
```

### 2. u0130zin Kontrolu00fc u00c7alu0131u015ftu0131rma

Yaptu0131u011fu0131nu0131z deu011fiu015fiklikleri kontrol etmek iu00e7in au015fau011fu0131daki komutu u00e7alu0131u015ftu0131ru0131n:

```bash
node src/scripts/fixDatabasePermissions.js
```

Veya sadece users tablosunu kontrol etmek iu00e7in:

```bash
node src/scripts/fixUsersTablePermissions.js
```

### 3. Uygulama Kodundaki Du00fczeltmeler

AnimalController.js dosyasu0131ndaki import ifadesi du00fczeltildi:

```javascript
// Eski hatalu0131 kod
const { supabase } = require('../config/supabase');

// Yeni dou011fru kod
const { supabaseAdmin: supabase } = require('../config/supabase');
```

## Notlar

- Supabase'de Row Level Security (RLS) politikalaru0131, veritabanu0131 tablolaru0131na eriu015fimi kontrol eder.
- Service role anahtaru0131 kullanu0131rken bile, RLS politikalaru0131 eriu015fimi engelleyebilir.
- Geliu015ftirme ortamu0131nda RLS'yi devre du0131u015fu0131 bu0131rakmak pratik olabilir, ancak u00fcretim ortamu0131nda uygun gu00fcvenlik politikalaru0131 uygulanmalu0131du0131r.