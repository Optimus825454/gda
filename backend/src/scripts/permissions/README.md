# Sayfa u0130zinleri Sistemi

## Genel Baku0131u015f

Bu sistem, SYSTEM_ADMIN rolu00fcndeki kullanu0131cu0131laru0131n tu00fcm sayfalara eriu015fimini sau011flamak iu00e7in geliu015ftirilmiu015ftir. Sayfa izinleri, kullanu0131cu0131laru0131n belirli sayfalara eriu015fimini kontrol etmek iu00e7in kullanu0131lu0131r.

## u0130zin Kodlaru0131

Sayfa izinleri iu00e7in au015fau011fu0131daki format kullanu0131lu0131r:

```
VIEW_[SAYFA_ADI]_PAGE
```

u00d6rneu011fin:
- `VIEW_ANIMALS_PAGE`: Hayvanlar sayfasu0131nu0131 gu00f6ru00fcntu00fcleme izni
- `VIEW_SHELTER_DETAILS_PAGE`: Baru0131nak detay sayfasu0131nu0131 gu00f6ru00fcntu00fcleme izni

## Kullanu0131m

### Backend

Backend'de sayfa izinlerini kontrol etmek iu00e7in `pagePermissions.js` middleware'i kullanu0131lu0131r:

```javascript
const { checkPagePermission } = require('../middleware/pagePermissions');

// Rota tanu0131mu0131
router.get('/animals', checkPagePermission('VIEW_ANIMALS_PAGE'), animalController.getAllAnimals);
```

### Frontend

Frontend'de sayfa izinlerini kontrol etmek iu00e7in `PagePermission` bileu015feni kullanu0131lu0131r:

```jsx
import PagePermission from '../components/auth/PagePermission';

function AnimalsPage() {
  return (
    <PagePermission permissionCode="VIEW_ANIMALS_PAGE">
      {/* Sayfa iu00e7eriu011fi */}
    </PagePermission>
  );
}
```

Veya `PrivateRoute` bileu015feni ile birlikte kullanu0131labilir:

```jsx
<Route 
  path="/animals" 
  element={
    <PrivateRoute 
      element={<AnimalsPage />} 
      permissionCode="VIEW_ANIMALS_PAGE" 
    />
  } 
/>
```

## SYSTEM_ADMIN Rolu00fc

SYSTEM_ADMIN rolu00fcne sahip kullanu0131cu0131lar otomatik olarak tu00fcm sayfalara eriu015febilir. Bu, hem backend hem de frontend tarafu0131nda kontrol edilir.

## u0130zinleri Bau015flatma

Sistem bau015fladu0131u011fu0131nda, `initPermissions.js` script'i u00e7alu0131u015ftu0131ru0131larak tu00fcm izinler ve rol-izin iliu015fkileri oluu015fturulur.

Manuel olarak u00e7alu0131u015ftu0131rmak iu00e7in:

```bash
node src/scripts/initPermissions.js
```

## Yeni Sayfa u0130zinleri Ekleme

Yeni bir sayfa izni eklemek iu00e7in:

1. `backend/src/config/supabase.js` dosyasu0131ndaki `PERMISSIONS` nesnesine yeni izin kodunu ekleyin.
2. `backend/src/scripts/permissions/initSystemAdminPermissions.js` dosyasu0131ndaki `pagePermissions` dizisine yeni izni ekleyin.
3. `frontend/src/contexts/AuthContext.js` dosyasu0131ndaki `ROLE_PERMISSIONS` nesnesinde SYSTEM_ADMIN rolu00fcne yeni izni ekleyin.
4. Sistemi yeniden bau015flatu0131n veya izinleri manuel olarak bau015flatu0131n.