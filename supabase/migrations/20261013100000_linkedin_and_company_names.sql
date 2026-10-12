/*
# LinkedIn link and official company names for the footer

- legal_name_ar / legal_name_en: the official registered company name shown
  under "الاسم التجاري / Company Name" in the footer (both languages at once).
  company_name_ar / company_name_en stay the short brand (سحاب / SAHAB) used
  by the logo.
*/
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS legal_name_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS legal_name_en text NOT NULL DEFAULT '';

UPDATE site_settings SET
  linkedin_url = 'https://www.linkedin.com/in/%D8%B4%D8%B1%D9%83%D8%A9-%D8%B3%D8%AD%D8%A7%D8%A8-%D9%84%D8%AA%D8%A3%D8%AC%D9%8A%D8%B1-%D8%A7%D9%84%D9%85%D8%B9%D8%AF%D8%A7%D8%AA-%D9%88%D8%A7%D9%84%D9%85%D9%82%D8%A7%D9%88%D9%84%D8%A7%D8%AA-714957440/',
  legal_name_ar = 'شركة سحاب للمقاولات و تاجير المعدات',
  legal_name_en = 'sihab lilmuqawalat wa tajir almudat Company',
  company_name_ar = 'سحاب',
  company_name_en = 'SAHAB'
WHERE id = 1;
