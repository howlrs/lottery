---
description: How to add new translations
---
1. Open `src/i18n/translations.ts`.
2. Add the new key-value pair to the `en` object.
3. Add the corresponding key-value pair to the `ja` object.
4. Use the new translation in your component:
   ```tsx
   const { t } = useLanguage();
   // ...
   <span>{t.yourNewKey}</span>
   ```
