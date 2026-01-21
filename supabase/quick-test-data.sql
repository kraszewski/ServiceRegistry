-- Quick test data for Equipment Details view
-- Run this in Supabase SQL Editor or via psql

-- Insert test equipment
INSERT INTO equipment (
  equipment_id,
  name,
  category,
  manufacturer,
  model,
  serial_number,
  description,
  location,
  purchase_date,
  created_by,
  updated_by
) VALUES (
  'EQP-00001',
  'Laptop Dell Precision 5550',
  'computer',
  'Dell',
  'Precision 5550',
  'DL-2024-TEST-001',
  'Laptop służbowy z Windows 11 Pro, 32GB RAM, 1TB SSD',
  'Biuro - pokój 101',
  '2024-01-15',
  auth.uid(),
  auth.uid()
) RETURNING id;

-- Get the equipment ID (replace with actual UUID from above)
-- Then insert service entries:

INSERT INTO service_entries (
  equipment_id,
  service_timestamp,
  service_type,
  description,
  performer_id,
  created_by,
  updated_by
) VALUES 
(
  '<REPLACE_WITH_EQUIPMENT_UUID>',
  NOW() - INTERVAL '7 days',
  'inspection',
  'Przegląd techniczny - sprawdzenie wentylatorów, czyszczenie układu chłodzenia, aktualizacja sterowników',
  auth.uid(),
  auth.uid(),
  auth.uid()
),
(
  '<REPLACE_WITH_EQUIPMENT_UUID>',
  NOW() - INTERVAL '3 days',
  'repair',
  'Naprawa klawiatury - wymiana klawiszy Enter i Spacja. Czas naprawy: 2h. Części na gwarancji.',
  auth.uid(),
  auth.uid(),
  auth.uid()
),
(
  '<REPLACE_WITH_EQUIPMENT_UUID>',
  NOW() - INTERVAL '1 hour',
  'maintenance',
  'Konserwacja rutynowa - aktualizacja Windows, instalacja poprawek bezpieczeństwa, backup danych użytkownika',
  auth.uid(),
  auth.uid(),
  auth.uid()
);
