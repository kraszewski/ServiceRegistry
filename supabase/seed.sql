/*
 * Seed data for ServiceRegistry database
 * Purpose: Initialize database with essential data for development and testing
 * 
 * IMPORTANT NOTES:
 * ================
 * 1. This file is executed AFTER all migrations when running `supabase db reset`
 * 
 * 2. Creating the owner account:
 *    - In production, create the first owner account through Supabase Auth Dashboard
 *      or Auth API (signUp method), then manually update the role
 *    
 *    - Steps to create owner account:
 *      a) Create user through Supabase Auth (Dashboard or API)
 *      b) The trigger will automatically create a profile with role='worker'
 *      c) Manually update the profile role:
 *         UPDATE profiles SET role = 'owner' WHERE id = '<user-id-from-auth>';
 * 
 * 3. For local development:
 *    - You can use Supabase CLI to create test users
 *    - Example: Use Supabase Studio (http://localhost:54323) after `supabase start`
 * 
 * 4. Security considerations:
 *    - NEVER commit actual passwords or credentials to version control
 *    - Use environment variables or secure secret management in production
 *    - This seed file should only contain non-sensitive test data
 */

-- Initialize equipment counter for current year
insert into equipment_counter (year, counter) 
values (extract(year from now())::integer, 0)
on conflict (year) do nothing;

-- Create test user if none exists
-- This is safe for local development only
do $$
declare
  test_user_id uuid;
  test_email text := 'admin@example.com';
  test_password text := 'admin123';
begin
  -- Check if user already exists
  select id into test_user_id from auth.users where email = test_email limit 1;
  
  -- If user doesn't exist, create one
  if test_user_id is null then
    -- Insert into auth.users (trigger will create profile automatically)
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      test_email,
      crypt(test_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Admin User"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) returning id into test_user_id;
    
    -- Set the user as owner (update the auto-created profile)
    update profiles set role = 'owner' where id = test_user_id;
    
    raise notice 'Created test user: % (password: %)', test_email, test_password;
  else
    raise notice 'Test user already exists: %', test_email;
  end if;
end $$;

-- Get current user ID for created_by/updated_by fields
do $$
declare
  current_user_id uuid;
  equipment_id_1 uuid;
  equipment_id_2 uuid;
  equipment_id_3 uuid;
  equipment_id_4 uuid;
  equipment_id_5 uuid;
  equipment_id_6 uuid;
  equipment_id_7 uuid;
  equipment_id_8 uuid;
  equipment_id_9 uuid;
  equipment_id_10 uuid;
begin
  -- Get the first user from profiles table (owner or first created user)
  select id into current_user_id from profiles limit 1;
  
  -- If no user exists, exit (shouldn't happen after user creation above)
  if current_user_id is null then
    raise exception 'No user found in profiles table. Please create a user first.';
  end if;

  -- Insert 30 equipment items
  -- Computers (10 items) - we'll capture IDs for first 10
  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values ('Dell Latitude 5520', 'computer', 'Dell', 'Latitude 5520', 'DL-LAT-2024-001', 'Laptop biznesowy, Intel i7, 16GB RAM, 512GB SSD', 'Biuro - pokój 101', '2024-01-15', current_user_id, current_user_id)
  returning id into equipment_id_1;

  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values ('HP EliteBook 850 G8', 'computer', 'HP', 'EliteBook 850 G8', 'HP-EB-2024-002', 'Laptop premium, Intel i7, 32GB RAM, 1TB SSD', 'Biuro - pokój 102', '2024-02-20', current_user_id, current_user_id)
  returning id into equipment_id_2;

  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values ('Lenovo ThinkPad X1 Carbon', 'computer', 'Lenovo', 'ThinkPad X1 Carbon Gen 9', 'LN-X1C-2024-003', 'Ultrabook, Intel i5, 16GB RAM, 512GB SSD', 'Biuro - pokój 103', '2024-03-10', current_user_id, current_user_id)
  returning id into equipment_id_3;

  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values ('Apple MacBook Pro 16"', 'computer', 'Apple', 'MacBook Pro 16" M2', 'APL-MBP-2024-004', 'MacBook Pro z procesorem M2 Pro, 32GB RAM, 1TB SSD', 'Dział IT', '2024-04-05', current_user_id, current_user_id)
  returning id into equipment_id_4;

  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values ('Dell OptiPlex 7090', 'computer', 'Dell', 'OptiPlex 7090', 'DL-OPT-2024-005', 'Komputer stacjonarny, Intel i7, 16GB RAM, 512GB SSD', 'Recepcja', '2024-01-25', current_user_id, current_user_id)
  returning id into equipment_id_5;

  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values ('HP ProDesk 600 G6', 'computer', 'HP', 'ProDesk 600 G6', 'HP-PD-2024-006', 'Mini PC, Intel i5, 8GB RAM, 256GB SSD', 'Sala konferencyjna A', '2024-02-15', current_user_id, current_user_id)
  returning id into equipment_id_6;

  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values ('Lenovo IdeaCentre AIO', 'computer', 'Lenovo', 'IdeaCentre AIO 5', 'LN-AIO-2024-007', 'Komputer All-in-One, 24", Intel i5, 16GB RAM', 'Biuro - pokój 104', '2024-05-12', current_user_id, current_user_id)
  returning id into equipment_id_7;

  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values ('ASUS VivoBook Pro 15', 'computer', 'ASUS', 'VivoBook Pro 15 M3500', 'AS-VBP-2024-008', 'Laptop graficzny, AMD Ryzen 7, 16GB RAM, NVIDIA GTX 1650', 'Dział grafiki', '2024-03-20', current_user_id, current_user_id)
  returning id into equipment_id_8;

  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values ('Microsoft Surface Laptop 5', 'computer', 'Microsoft', 'Surface Laptop 5', 'MS-SL5-2024-009', 'Laptop premium, Intel i7, 16GB RAM, 512GB SSD', 'Zarząd', '2024-04-18', current_user_id, current_user_id)
  returning id into equipment_id_9;

  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values ('Acer Aspire 5', 'computer', 'Acer', 'Aspire 5 A515-57', 'AC-ASP-2024-010', 'Laptop standardowy, Intel i5, 8GB RAM, 512GB SSD', 'Biuro - pokój 105', '2024-06-01', current_user_id, current_user_id)
  returning id into equipment_id_10;

  -- Printers (5 items)
  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values 
    ('HP LaserJet Pro M404dn', 'printer', 'HP', 'LaserJet Pro M404dn', 'HP-LJ-2024-011', 'Drukarka laserowa mono, duplex, sieciowa', 'Biuro - drukarnia', '2024-01-10', current_user_id, current_user_id),
    ('Canon PIXMA TR8620', 'printer', 'Canon', 'PIXMA TR8620', 'CN-PIX-2024-012', 'Drukarka wielofunkcyjna kolor, A4', 'Recepcja', '2024-02-05', current_user_id, current_user_id),
    ('Epson EcoTank L3250', 'printer', 'Epson', 'EcoTank L3250', 'EP-ECO-2024-013', 'Drukarka atramentowa z systemem ciągłego zasilania', 'Biuro - pokój 201', '2024-03-15', current_user_id, current_user_id),
    ('Brother HL-L2350DW', 'printer', 'Brother', 'HL-L2350DW', 'BR-HLL-2024-014', 'Drukarka laserowa mono, WiFi', 'Biuro - pokój 202', '2024-04-22', current_user_id, current_user_id),
    ('Xerox WorkCentre 6515', 'printer', 'Xerox', 'WorkCentre 6515', 'XR-WC-2024-015', 'Urządzenie wielofunkcyjne kolor, A4', 'Sala konferencyjna B', '2024-05-08', current_user_id, current_user_id);

  -- Monitors (5 items)
  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values 
    ('Dell UltraSharp U2722DE', 'monitor', 'Dell', 'UltraSharp U2722DE', 'DL-MON-2024-016', 'Monitor 27" QHD, IPS, USB-C', 'Biuro - pokój 101', '2024-01-15', current_user_id, current_user_id),
    ('LG 27UK850-W', 'monitor', 'LG', '27UK850-W', 'LG-MON-2024-017', 'Monitor 27" 4K, IPS, HDR', 'Dział grafiki', '2024-02-20', current_user_id, current_user_id),
    ('BenQ PD2700U', 'monitor', 'BenQ', 'PD2700U', 'BQ-MON-2024-018', 'Monitor profesjonalny 27" 4K, IPS', 'Biuro - pokój 102', '2024-03-12', current_user_id, current_user_id),
    ('ASUS ProArt PA278QV', 'monitor', 'ASUS', 'ProArt PA278QV', 'AS-MON-2024-019', 'Monitor profesjonalny 27" WQHD, kalibrowany', 'Dział IT', '2024-04-05', current_user_id, current_user_id),
    ('Samsung Odyssey G7', 'monitor', 'Samsung', 'Odyssey G7', 'SM-MON-2024-020', 'Monitor gamingowy 32" QHD, 240Hz, curved', 'Sala testowa', '2024-05-18', current_user_id, current_user_id);

  -- Network devices (5 items)
  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values 
    ('Cisco Catalyst 2960-X', 'network_device', 'Cisco', 'Catalyst 2960-X', 'CS-CAT-2024-021', 'Switch 24-port Gigabit Ethernet', 'Serwerownia - szafa A1', '2024-01-05', current_user_id, current_user_id),
    ('UniFi Dream Machine Pro', 'network_device', 'Ubiquiti', 'UDM-Pro', 'UB-UDM-2024-022', 'Router/Firewall/Switch all-in-one', 'Serwerownia - szafa A1', '2024-02-10', current_user_id, current_user_id),
    ('TP-Link Archer AX6000', 'network_device', 'TP-Link', 'Archer AX6000', 'TPL-AX6-2024-023', 'Router WiFi 6, dual-band', 'Biuro - główne', '2024-03-08', current_user_id, current_user_id),
    ('Netgear GS108Tv3', 'network_device', 'Netgear', 'GS108Tv3', 'NG-GS1-2024-024', 'Switch 8-port Gigabit, managed', 'Biuro - pokój 201', '2024-04-15', current_user_id, current_user_id),
    ('MikroTik hEX S', 'network_device', 'MikroTik', 'hEX S', 'MT-HEX-2024-025', 'Router gigabitowy z SFP', 'Serwerownia - szafa B2', '2024-05-22', current_user_id, current_user_id);

  -- Phones and Tablets (3 items)
  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values 
    ('iPhone 14 Pro', 'phone', 'Apple', 'iPhone 14 Pro', 'APL-IP14-2024-026', 'Smartphone 256GB, Space Black', 'Zarząd', '2024-02-28', current_user_id, current_user_id),
    ('Samsung Galaxy Tab S8', 'tablet', 'Samsung', 'Galaxy Tab S8', 'SM-TAB-2024-027', 'Tablet 11", 128GB, z rysikiem S Pen', 'Sala konferencyjna A', '2024-03-15', current_user_id, current_user_id),
    ('iPad Air 5th Gen', 'tablet', 'Apple', 'iPad Air 5', 'APL-IPA-2024-028', 'Tablet 10.9", 256GB, Space Gray', 'Biuro - pokój 103', '2024-04-20', current_user_id, current_user_id);

  -- Peripherals (2 items)
  insert into equipment (name, category, manufacturer, model, serial_number, description, location, purchase_date, created_by, updated_by)
  values 
    ('Logitech MX Master 3S', 'peripheral', 'Logitech', 'MX Master 3S', 'LG-MXM-2024-029', 'Mysz bezprzewodowa, ergonomiczna', 'Biuro - pokój 101', '2024-01-15', current_user_id, current_user_id),
    ('Logitech MX Keys', 'peripheral', 'Logitech', 'MX Keys', 'LG-MXK-2024-030', 'Klawiatura bezprzewodowa, backlight', 'Biuro - pokój 102', '2024-02-20', current_user_id, current_user_id);

  -- Insert 5 service entries for equipment 1
  insert into service_entries (equipment_id, service_timestamp, service_type, description, performer_id, created_by, updated_by)
  values 
    (equipment_id_1, now() - interval '90 days', 'inspection', 'Przegląd techniczny po otrzymaniu sprzętu. Sprawdzono poprawność działania wszystkich komponentów, zainstalowano niezbędne oprogramowanie i aktualizacje.', current_user_id, current_user_id, current_user_id),
    (equipment_id_1, now() - interval '60 days', 'maintenance', 'Konserwacja rutynowa - czyszczenie układu chłodzenia, usuwanie kurzu z wentylatorów, aktualizacja sterowników systemowych.', current_user_id, current_user_id, current_user_id),
    (equipment_id_1, now() - interval '40 days', 'repair', 'Naprawa klawiatury - wymiana uszkodzonych klawiszy. Części zamawiane na gwarancji. Czas naprawy: 3h.', current_user_id, current_user_id, current_user_id),
    (equipment_id_1, now() - interval '20 days', 'inspection', 'Kontrola stanu technicznego po naprawie. Wszystkie komponenty działają poprawnie. Przeprowadzono testy obciążeniowe i termiczne.', current_user_id, current_user_id, current_user_id),
    (equipment_id_1, now() - interval '5 days', 'maintenance', 'Aktualizacja oprogramowania - instalacja najnowszych patchy bezpieczeństwa, aktualizacja systemu operacyjnego i aplikacji firmowych. Wykonano backup danych.', current_user_id, current_user_id, current_user_id);

  -- Insert 5 service entries for equipment 2
  insert into service_entries (equipment_id, service_timestamp, service_type, description, performer_id, created_by, updated_by)
  values 
    (equipment_id_2, now() - interval '90 days', 'inspection', 'Przegląd techniczny po otrzymaniu sprzętu. Sprawdzono poprawność działania wszystkich komponentów, zainstalowano niezbędne oprogramowanie i aktualizacje.', current_user_id, current_user_id, current_user_id),
    (equipment_id_2, now() - interval '60 days', 'maintenance', 'Konserwacja rutynowa - czyszczenie układu chłodzenia, usuwanie kurzu z wentylatorów, aktualizacja sterowników systemowych.', current_user_id, current_user_id, current_user_id),
    (equipment_id_2, now() - interval '40 days', 'repair', 'Wymiana dysku twardego - zastąpienie uszkodzonego SSD nowym dyskiem. Przywrócono dane z backupu.', current_user_id, current_user_id, current_user_id),
    (equipment_id_2, now() - interval '20 days', 'inspection', 'Kontrola stanu technicznego po naprawie. Wszystkie komponenty działają poprawnie. Przeprowadzono testy obciążeniowe i termiczne.', current_user_id, current_user_id, current_user_id),
    (equipment_id_2, now() - interval '5 days', 'maintenance', 'Aktualizacja oprogramowania - instalacja najnowszych patchy bezpieczeństwa, aktualizacja systemu operacyjnego i aplikacji firmowych. Wykonano backup danych.', current_user_id, current_user_id, current_user_id);

  -- Insert 5 service entries for equipment 3
  insert into service_entries (equipment_id, service_timestamp, service_type, description, performer_id, created_by, updated_by)
  values 
    (equipment_id_3, now() - interval '90 days', 'inspection', 'Przegląd techniczny po otrzymaniu sprzętu. Sprawdzono poprawność działania wszystkich komponentów, zainstalowano niezbędne oprogramowanie i aktualizacje.', current_user_id, current_user_id, current_user_id),
    (equipment_id_3, now() - interval '60 days', 'maintenance', 'Konserwacja rutynowa - czyszczenie układu chłodzenia, usuwanie kurzu z wentylatorów, aktualizacja sterowników systemowych.', current_user_id, current_user_id, current_user_id),
    (equipment_id_3, now() - interval '40 days', 'repair', 'Naprawa portu USB - przylutowano odłączony port. Sprawdzono działanie wszystkich portów.', current_user_id, current_user_id, current_user_id),
    (equipment_id_3, now() - interval '20 days', 'inspection', 'Kontrola stanu technicznego po naprawie. Wszystkie komponenty działają poprawnie. Przeprowadzono testy obciążeniowe i termiczne.', current_user_id, current_user_id, current_user_id),
    (equipment_id_3, now() - interval '5 days', 'maintenance', 'Aktualizacja oprogramowania - instalacja najnowszych patchy bezpieczeństwa, aktualizacja systemu operacyjnego i aplikacji firmowych. Wykonano backup danych.', current_user_id, current_user_id, current_user_id);

  -- Insert 5 service entries for equipment 4
  insert into service_entries (equipment_id, service_timestamp, service_type, description, performer_id, created_by, updated_by)
  values 
    (equipment_id_4, now() - interval '90 days', 'inspection', 'Przegląd techniczny po otrzymaniu sprzętu. Sprawdzono poprawność działania wszystkich komponentów, zainstalowano niezbędne oprogramowanie i aktualizacje.', current_user_id, current_user_id, current_user_id),
    (equipment_id_4, now() - interval '60 days', 'maintenance', 'Konserwacja rutynowa - czyszczenie układu chłodzenia, usuwanie kurzu z wentylatorów, aktualizacja sterowników systemowych.', current_user_id, current_user_id, current_user_id),
    (equipment_id_4, now() - interval '40 days', 'repair', 'Wymiana baterii - bateria traciła pojemność. Zainstalowano oryginalną baterię producenta.', current_user_id, current_user_id, current_user_id),
    (equipment_id_4, now() - interval '20 days', 'inspection', 'Kontrola stanu technicznego po naprawie. Wszystkie komponenty działają poprawnie. Przeprowadzono testy obciążeniowe i termiczne.', current_user_id, current_user_id, current_user_id),
    (equipment_id_4, now() - interval '5 days', 'maintenance', 'Aktualizacja oprogramowania - instalacja najnowszych patchy bezpieczeństwa, aktualizacja systemu operacyjnego i aplikacji firmowych. Wykonano backup danych.', current_user_id, current_user_id, current_user_id);

  -- Insert 5 service entries for equipment 5
  insert into service_entries (equipment_id, service_timestamp, service_type, description, performer_id, created_by, updated_by)
  values 
    (equipment_id_5, now() - interval '90 days', 'inspection', 'Przegląd techniczny po otrzymaniu sprzętu. Sprawdzono poprawność działania wszystkich komponentów, zainstalowano niezbędne oprogramowanie i aktualizacje.', current_user_id, current_user_id, current_user_id),
    (equipment_id_5, now() - interval '60 days', 'maintenance', 'Konserwacja rutynowa - czyszczenie układu chłodzenia, usuwanie kurzu z wentylatorów, aktualizacja sterowników systemowych.', current_user_id, current_user_id, current_user_id),
    (equipment_id_5, now() - interval '40 days', 'repair', 'Naprawa układu chłodzenia - wymiana wentylatora oraz pasta termoprzewodząca.', current_user_id, current_user_id, current_user_id),
    (equipment_id_5, now() - interval '20 days', 'inspection', 'Kontrola stanu technicznego po naprawie. Wszystkie komponenty działają poprawnie. Przeprowadzono testy obciążeniowe i termiczne.', current_user_id, current_user_id, current_user_id),
    (equipment_id_5, now() - interval '5 days', 'maintenance', 'Aktualizacja oprogramowania - instalacja najnowszych patchy bezpieczeństwa, aktualizacja systemu operacyjnego i aplikacji firmowych. Wykonano backup danych.', current_user_id, current_user_id, current_user_id);

  -- Insert 5 service entries for equipment 6
  insert into service_entries (equipment_id, service_timestamp, service_type, description, performer_id, created_by, updated_by)
  values 
    (equipment_id_6, now() - interval '90 days', 'inspection', 'Przegląd techniczny po otrzymaniu sprzętu. Sprawdzono poprawność działania wszystkich komponentów, zainstalowano niezbędne oprogramowanie i aktualizacje.', current_user_id, current_user_id, current_user_id),
    (equipment_id_6, now() - interval '60 days', 'maintenance', 'Konserwacja rutynowa - czyszczenie układu chłodzenia, usuwanie kurzu z wentylatorów, aktualizacja sterowników systemowych.', current_user_id, current_user_id, current_user_id),
    (equipment_id_6, now() - interval '40 days', 'repair', 'Wymiana RAM - jeden z modułów pamięci uszkodzony. Zastąpiono nowym 8GB DDR4.', current_user_id, current_user_id, current_user_id),
    (equipment_id_6, now() - interval '20 days', 'inspection', 'Kontrola stanu technicznego po naprawie. Wszystkie komponenty działają poprawnie. Przeprowadzono testy obciążeniowe i termiczne.', current_user_id, current_user_id, current_user_id),
    (equipment_id_6, now() - interval '5 days', 'maintenance', 'Aktualizacja oprogramowania - instalacja najnowszych patchy bezpieczeństwa, aktualizacja systemu operacyjnego i aplikacji firmowych. Wykonano backup danych.', current_user_id, current_user_id, current_user_id);

  -- Insert 5 service entries for equipment 7
  insert into service_entries (equipment_id, service_timestamp, service_type, description, performer_id, created_by, updated_by)
  values 
    (equipment_id_7, now() - interval '90 days', 'inspection', 'Przegląd techniczny po otrzymaniu sprzętu. Sprawdzono poprawność działania wszystkich komponentów, zainstalowano niezbędne oprogramowanie i aktualizacje.', current_user_id, current_user_id, current_user_id),
    (equipment_id_7, now() - interval '60 days', 'maintenance', 'Konserwacja rutynowa - czyszczenie układu chłodzenia, usuwanie kurzu z wentylatorów, aktualizacja sterowników systemowych.', current_user_id, current_user_id, current_user_id),
    (equipment_id_7, now() - interval '40 days', 'repair', 'Naprawa ekranu - pęknięta matryca po upadku. Wymieniono na nową, oryginalną część.', current_user_id, current_user_id, current_user_id),
    (equipment_id_7, now() - interval '20 days', 'inspection', 'Kontrola stanu technicznego po naprawie. Wszystkie komponenty działają poprawnie. Przeprowadzono testy obciążeniowe i termiczne.', current_user_id, current_user_id, current_user_id),
    (equipment_id_7, now() - interval '5 days', 'maintenance', 'Aktualizacja oprogramowania - instalacja najnowszych patchy bezpieczeństwa, aktualizacja systemu operacyjnego i aplikacji firmowych. Wykonano backup danych.', current_user_id, current_user_id, current_user_id);

  -- Insert 5 service entries for equipment 8
  insert into service_entries (equipment_id, service_timestamp, service_type, description, performer_id, created_by, updated_by)
  values 
    (equipment_id_8, now() - interval '90 days', 'inspection', 'Przegląd techniczny po otrzymaniu sprzętu. Sprawdzono poprawność działania wszystkich komponentów, zainstalowano niezbędne oprogramowanie i aktualizacje.', current_user_id, current_user_id, current_user_id),
    (equipment_id_8, now() - interval '60 days', 'maintenance', 'Konserwacja rutynowa - czyszczenie układu chłodzenia, usuwanie kurzu z wentylatorów, aktualizacja sterowników systemowych.', current_user_id, current_user_id, current_user_id),
    (equipment_id_8, now() - interval '40 days', 'repair', 'Czyszczenie głębsze - usunięcie wirusów i malware. Reinstalacja systemu operacyjnego.', current_user_id, current_user_id, current_user_id),
    (equipment_id_8, now() - interval '20 days', 'inspection', 'Kontrola stanu technicznego po naprawie. Wszystkie komponenty działają poprawnie. Przeprowadzono testy obciążeniowe i termiczne.', current_user_id, current_user_id, current_user_id),
    (equipment_id_8, now() - interval '5 days', 'maintenance', 'Aktualizacja oprogramowania - instalacja najnowszych patchy bezpieczeństwa, aktualizacja systemu operacyjnego i aplikacji firmowych. Wykonano backup danych.', current_user_id, current_user_id, current_user_id);

  -- Insert 5 service entries for equipment 9
  insert into service_entries (equipment_id, service_timestamp, service_type, description, performer_id, created_by, updated_by)
  values 
    (equipment_id_9, now() - interval '90 days', 'inspection', 'Przegląd techniczny po otrzymaniu sprzętu. Sprawdzono poprawność działania wszystkich komponentów, zainstalowano niezbędne oprogramowanie i aktualizacje.', current_user_id, current_user_id, current_user_id),
    (equipment_id_9, now() - interval '60 days', 'maintenance', 'Konserwacja rutynowa - czyszczenie układu chłodzenia, usuwanie kurzu z wentylatorów, aktualizacja sterowników systemowych.', current_user_id, current_user_id, current_user_id),
    (equipment_id_9, now() - interval '40 days', 'repair', 'Wymiana zasilacza - oryginalny zasilacz uszkodzony. Zainstalowano nowy, certyfikowany.', current_user_id, current_user_id, current_user_id),
    (equipment_id_9, now() - interval '20 days', 'inspection', 'Kontrola stanu technicznego po naprawie. Wszystkie komponenty działają poprawnie. Przeprowadzono testy obciążeniowe i termiczne.', current_user_id, current_user_id, current_user_id),
    (equipment_id_9, now() - interval '5 days', 'maintenance', 'Aktualizacja oprogramowania - instalacja najnowszych patchy bezpieczeństwa, aktualizacja systemu operacyjnego i aplikacji firmowych. Wykonano backup danych.', current_user_id, current_user_id, current_user_id);

  -- Insert 5 service entries for equipment 10
  insert into service_entries (equipment_id, service_timestamp, service_type, description, performer_id, created_by, updated_by)
  values 
    (equipment_id_10, now() - interval '90 days', 'inspection', 'Przegląd techniczny po otrzymaniu sprzętu. Sprawdzono poprawność działania wszystkich komponentów, zainstalowano niezbędne oprogramowanie i aktualizacje.', current_user_id, current_user_id, current_user_id),
    (equipment_id_10, now() - interval '60 days', 'maintenance', 'Konserwacja rutynowa - czyszczenie układu chłodzenia, usuwanie kurzu z wentylatorów, aktualizacja sterowników systemowych.', current_user_id, current_user_id, current_user_id),
    (equipment_id_10, now() - interval '40 days', 'repair', 'Naprawa gniazda ładowania - poluzowane gniazdo. Wymiana złącza i sprawdzenie obwodu.', current_user_id, current_user_id, current_user_id),
    (equipment_id_10, now() - interval '20 days', 'inspection', 'Kontrola stanu technicznego po naprawie. Wszystkie komponenty działają poprawnie. Przeprowadzono testy obciążeniowe i termiczne.', current_user_id, current_user_id, current_user_id),
    (equipment_id_10, now() - interval '5 days', 'maintenance', 'Aktualizacja oprogramowania - instalacja najnowszych patchy bezpieczeństwa, aktualizacja systemu operacyjnego i aplikacji firmowych. Wykonano backup danych.', current_user_id, current_user_id, current_user_id);

  raise notice 'Successfully inserted 30 equipment items and 50 service entries';
end $$;
