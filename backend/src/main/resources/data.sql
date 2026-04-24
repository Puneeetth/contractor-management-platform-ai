-- Seed countries with currencies
INSERT IGNORE INTO countries (code, name, currency) VALUES
  ('IN', 'India', 'INR'),
  ('US', 'USA', 'USD'),
  ('GB', 'UK', 'GBP'),
  ('AE', 'UAE', 'AED'),
  ('CA', 'Canada', 'CAD'),
  ('DE', 'Germany', 'EUR'),
  ('FR', 'France', 'EUR'),
  ('AU', 'Australia', 'AUD'),
  ('SG', 'Singapore', 'SGD'),
  ('SA', 'Saudi Arabia', 'SAR'),
  ('ZA', 'South Africa', 'ZAR'),
  ('JP', 'Japan', 'JPY'),
  ('BR', 'Brazil', 'BRL'),
  ('MX', 'Mexico', 'MXN');
