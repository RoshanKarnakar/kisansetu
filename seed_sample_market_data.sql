-- ====================================================================
-- SEED DATA FOR KISANSETU: CROPS, PROCUREMENT CENTRES & MARKET DATA
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ====================================================================

-- 1. SEED CROPS CATALOGUE
INSERT INTO public.crops (id, name_en, name_hi, category, current_msp_per_quintal, quality_parameters, is_procurement_active)
VALUES
  ('wheat', 'Wheat (Sharbati / PBW 550)', 'गेहूं (शरबती / पीबीडब्ल्यू)', 'Cereal', 2275.00, '{"max_moisture": 12.0, "foreign_matter_max": 0.75}', true),
  ('paddy_basmati', 'Paddy (Basmati 1121)', 'धान (बासमती 1121)', 'Cereal', 2320.00, '{"max_moisture": 14.0, "broken_grains_max": 2.0}', true),
  ('mustard', 'Mustard (RH 725 / Pusa Bold)', 'सरसों (आरएच 725)', 'Oilseed', 5650.00, '{"max_moisture": 8.0, "oil_content_min": 40.0}', true),
  ('gram', 'Gram / Chana (JG 14)', 'चना (देसी / जेजी 14)', 'Pulse', 5440.00, '{"max_moisture": 10.0, "damaged_grains_max": 1.5}', true),
  ('cotton', 'Cotton (Medium Staple)', 'कपास (मध्यम रेशा)', 'Fiber', 7121.00, '{"max_moisture": 8.5, "trash_max": 3.0}', true)
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_hi = EXCLUDED.name_hi,
  current_msp_per_quintal = EXCLUDED.current_msp_per_quintal;

-- 2. SEED PROCUREMENT CENTRES
INSERT INTO public.procurement_centres (id, name, district, state, gates, active_crops, operational_hours, contact_phone, daily_capacity, is_active)
VALUES
  ('karnal-main', 'Karnal Main APMC Mandi Yard', 'Karnal', 'Haryana', '{"Gate 1 (North)", "Gate 2 (Weighbridge)", "Gate 3 (Exit)"}', '{"wheat", "paddy_basmati", "mustard"}', '08:00 AM - 06:00 PM', '0184-2254301', 80, true),
  ('taraori-sub', 'Taraori APMC Sub-Yard', 'Karnal', 'Haryana', '{"Gate 1", "Gate 2"}', '{"wheat", "paddy_basmati"}', '08:30 AM - 05:30 PM', '0184-2458902', 45, true),
  ('panipat-mandi', 'Panipat New Grain Market', 'Panipat', 'Haryana', '{"Gate A", "Gate B"}', '{"wheat", "mustard", "gram"}', '08:00 AM - 06:00 PM', '0180-2641120', 60, true),
  ('kurukshetra-apmc', 'Kurukshetra Anaj Mandi', 'Kurukshetra', 'Haryana', '{"Gate 1", "Gate 2"}', '{"wheat", "paddy_basmati"}', '08:00 AM - 06:00 PM', '01744-238410', 70, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  daily_capacity = EXCLUDED.daily_capacity;

-- 3. SEED CROP MARKET DATA (Live Supply, Demand Index & Regional APMC Prices)
INSERT INTO public.crop_market_data (
  crop_id, district, state, date, demand_index, total_estimated_supply_quintals,
  min_price_per_quintal, max_price_per_quintal, modal_price_per_quintal,
  price_forecast_next_week, recommendation_text
)
VALUES
  (
    'wheat', 'Karnal', 'Haryana', CURRENT_DATE, 1.85, 14500.00,
    2275.00, 2480.00, 2410.00, 2450.00,
    'Strong flour mill demand in Karnal APMC. Modal price is trending ₹135 above MSP. Optimal harvest window: book delivery slot for Thursday or Friday.'
  ),
  (
    'paddy_basmati', 'Karnal', 'Haryana', CURRENT_DATE, 2.15, 28500.00,
    3850.00, 4420.00, 4260.00, 4380.00,
    'High exporter competition for Basmati 1121 with moisture under 12%. Buyers actively placing bids with quick 24-hr payment settlement.'
  ),
  (
    'mustard', 'Karnal', 'Haryana', CURRENT_DATE, 1.45, 8200.00,
    5650.00, 5980.00, 5840.00, 5880.00,
    'Crushing mills active across northern Haryana. Steady spot trading at ₹190 above MSP. Demand is stable.'
  ),
  (
    'gram', 'Karnal', 'Haryana', CURRENT_DATE, 1.30, 4200.00,
    5440.00, 5750.00, 5620.00, 5650.00,
    'Firm pulse mill procurement with minimal arrival queues. Direct mandi gate unloading available.'
  ),
  (
    'wheat', 'Panipat', 'Haryana', CURRENT_DATE, 1.65, 12800.00,
    2275.00, 2430.00, 2390.00, 2420.00,
    'Panipat market arrivals steady. Steady mill procurement. Suggested slot booking: morning 08:00 - 10:00.'
  ),
  (
    'paddy_basmati', 'Kurukshetra', 'Haryana', CURRENT_DATE, 2.25, 31000.00,
    3900.00, 4480.00, 4310.00, 4420.00,
    'Very high buyer inquiry from national procurement agencies. Premium offered on dry, sorted grain.'
  )
ON CONFLICT (crop_id, district, date) DO UPDATE SET
  demand_index = EXCLUDED.demand_index,
  total_estimated_supply_quintals = EXCLUDED.total_estimated_supply_quintals,
  min_price_per_quintal = EXCLUDED.min_price_per_quintal,
  max_price_per_quintal = EXCLUDED.max_price_per_quintal,
  modal_price_per_quintal = EXCLUDED.modal_price_per_quintal,
  price_forecast_next_week = EXCLUDED.price_forecast_next_week,
  recommendation_text = EXCLUDED.recommendation_text,
  updated_at = NOW();
