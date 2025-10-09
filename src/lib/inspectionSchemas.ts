// src/lib/inspectionSchemas.ts
import { z } from "zod";

/* -------------------- option lists (exported for UI) -------------------- */

export const brandOptions = [
  "Tata",
  "Ashok Leyland",
  "Eicher",
  "Mahindra",
  "BharatBenz",
  "Force",
] as const;

export const clearLevels = ["Clear", "Partially Clear", "Unclear"] as const;
export const goodFairPoor = ["Good", "Fair", "Poor"] as const;
const goodFairPoorNA = ["Good", "Fair", "Poor", "Not Applicable"] as const;

export const excellentToPoor = ["Excellent", "Good", "Fair", "Poor"] as const;
export const workingDamagedMissing = ["Working", "Damaged", "Missing"] as const;
export const gearQuality = ["Smooth", "Rough", "Difficult"] as const;
export const clutchQuality = ["Smooth", "Rough", "Slipping"] as const;

const dentsScale = ["None", "Minor", "Moderate", "Severe"] as const;
const tempScale = ["Normal", "High", "Overheating"] as const;
const smokeScale = ["Clear", "White", "Black", "Blue"] as const;
const vibrationScale = ["Minimal", "Moderate", "Excessive"] as const;

export const loadBodyType = [
  "Open",
  "Closed",
  "Tanker",
  "Flatbed",
  "Tipper",
  "Container",
  "Reefer",
] as const;

export const loadBodyBuild = ["Steel", "Aluminium", "Fiber", "Wood"] as const;

const seatBelts = ["All Working", "Some Faulty", "Missing"] as const;
const powerOptions = ["Good", "Fair", "Poor", "Manual"] as const;
const vehicleCranks = ["Easy", "Difficult", "Won't Crank"] as const;
const hydraulicOperation = ["Good", "Fair", "Poor", "Not Applicable"] as const;

const tyreCondition = ["Good", "Fair", "Poor", "Needs Replacement"] as const;
const treadDepthScale = ["Good", "Moderate", "Worn"] as const;
const brandConsistency = ["All Same", "Mixed Brands"] as const;
const spareTyreCond = ["Good", "Fair", "Poor", "Missing"] as const;
const rimCondition = ["Good", "Minor Damage", "Major Damage"] as const;

const modificationsScale = ["None", "Minor", "Major"] as const;

export const purchaseRecommendation = [
  "Highly Recommended",
  "Recommended",
  "Conditional",
  "Not Recommended",
] as const;

export const requiredMedia = z
  .unknown()
  .refine((v) => {
    if (!v) return false;
    if (typeof v === "string") return v.length > 0;
    if (Array.isArray(v)) return v.length > 0 && v.every((x) => !!(x as { key?: string }).key);
    if (typeof v === "object") return typeof (v as { key?: unknown }).key === "string";
    return false;
  }, "Required");

/* ----------------------------- common atoms ----------------------------- */

const year = z.coerce.number().int().min(1950).max(new Date().getFullYear());
const nonEmpty = z.string().trim().min(1);
const bool = z.coerce.boolean().default(false);

/* -------------------------------- steps --------------------------------- */

// Step 1: Vehicle Identification & Basic (+ GPS)
export const Step1 = z.object({
  vehicle_brand: z.enum(brandOptions),
  vehicle_model: nonEmpty,
  manufacturing_year: year,

  // FULL IDs
  chassis_number: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{6,22}$/, "6–22 chars, A–Z, 0–9, hyphen allowed"),
  chassis_clarity: z.enum(clearLevels),
  engine_number: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{6,20}$/, "6–20 chars, A–Z, 0–9, hyphen allowed"),

  // photo flags (media captured in Capture flow)
  vin_plate_photo_uploaded: bool,
  chassis_photo_uploaded: bool,
  engine_no_photo_uploaded: bool,

  // GPS proof (required)
  inspection_gps: z.object({
    lat: z.coerce.number(),
    long: z.coerce.number(),
    accuracy_m: z.coerce.number(),
    timestamp: nonEmpty, // ISO string
  }),
});

// Step 2: Specs & Registration
export const Step2 = z.object({
  body_length_m: z.coerce.number().min(1).max(40),
  meter_km: z.coerce.number().min(0).max(9_999_999),
  hours_run: z.coerce.number().min(0).max(99_999).optional(),

  hsrp_present: z.enum(["Yes", "No"]),
  hsrp_photo_uploaded: bool,

  load_body_type: z.enum(loadBodyType),
  load_body_build: z.enum(loadBodyBuild),
});

// Step 3: Body & Exterior
export const Step3 = z.object({
  tail_gate: z.enum(goodFairPoorNA),
  tail_gate_photo_uploaded: bool,
  load_floor: z.enum(goodFairPoor),
  load_floor_photo_uploaded: bool,
  dents: z.enum(dentsScale),
  multi_exterior_photos_uploaded: bool,
  paint_condition: z.enum(excellentToPoor),
  chassis_condition: z.enum(excellentToPoor),
  chassis_run_video_uploaded: bool,
  bumper: z.enum(workingDamagedMissing),
  bumper_photo_uploaded: bool,
  head_lamps: z.enum(workingDamagedMissing),
  head_lamps_photos_uploaded: bool,
  door_left: z.enum(workingDamagedMissing),
  door_left_photo_uploaded: bool,
  door_right: z.enum(workingDamagedMissing),
  door_right_photo_uploaded: bool,
  wiper_left_ok: bool,
  wiper_right_ok: bool,
  wiper_left_photo_uploaded: z.coerce.boolean().optional(),
  wiper_right_photo_uploaded: z.coerce.boolean().optional(),
});

// Step 4: Interior & Cabin
export const Step4 = z.object({
  dashboard: z.enum(goodFairPoor),
  number_of_seats: z.coerce.number().int().min(1).max(50),
  driver_seat: z.enum(goodFairPoor),
  co_driver_seat: z.enum(goodFairPoorNA),
  sleeper_seat: z.enum(goodFairPoorNA).optional(),
  ac: bool,
  abs: bool,
});

// Step 5: Engine & Mechanical (+ Performance)
export const Step5 = z.object({
  engine_condition: z.enum(excellentToPoor),
  engine_start_sound: z.enum(["Smooth", "Rough", "Irregular"] as const),
  engine_oil_leaks: z.enum(dentsScale), // None/Minor/Moderate/Severe
  radiator_condenser: z.enum(goodFairPoor),
  fluid_leaks: z.enum(dentsScale),
  diesel_pump: z.enum(goodFairPoor),
  ignition_system: z.enum(goodFairPoor),

  performance: z.object({
    idle_rpm: z.coerce.number().min(400).max(2000),
    temperature: z.enum(tempScale),
    exhaust_smoke: z.enum(smokeScale),
    turbo_supercharger: z.enum(goodFairPoorNA).optional(),
    vibration: z.enum(vibrationScale),
    efficiency_kmpl: z.coerce.number().min(2).max(40).optional(),
  }),
});

// Step 6: Drivetrain & Transmission
export const Step6 = z.object({
  transmission: z.enum(goodFairPoor),
  gearshift: z.enum(gearQuality),
  clutch_engagement: z.enum(clutchQuality),
  axle_configuration: z.string().trim().max(20),
  differential: z.enum(goodFairPoor),
  vehicle_cranks: z.enum(vehicleCranks),
});

// Step 7: Steering & Suspension
export const Step7 = z.object({
  steering_power: z.enum(powerOptions),
  suspension: z.enum(goodFairPoor),
});

// Step 8: Hydraulics + Safety
export const Step8 = z.object({
  hydraulic_operation: z.enum(hydraulicOperation).optional(),
  hydraulic_video_uploaded: bool,

  safety: z.object({
    seat_belts: z.enum(seatBelts),
    fire_extinguisher: bool,
    first_aid_kit: bool,
    emergency_triangle: bool,
    vltd: z.coerce.boolean().optional(),
    speed_governor: z.coerce.boolean().optional(),
    jack_present: z.coerce.boolean().optional(),
    jack_rod_present: z.coerce.boolean().optional(),
    toolkit_present: z.coerce.boolean().optional(),
  }),
});

// Step 9: Brakes & Controls
export const Step9 = z.object({
  brake_pedal_functions: z.enum(goodFairPoor),
  accelerator_photo_uploaded: bool,
});

// Step 10: Electrical & Battery
export const Step10 = z.object({
  battery_brand: z.string().trim().max(30),
  battery_serial: z.string().trim().max(20),
  battery_ampere: z.coerce.number().min(20).max(500),
});

// Step 11: Tyres (dynamic) + Details
export const Step11 = z.object({
  tyre_count: z.coerce.number().int().min(4).max(22),

  details: z.object({
    brand_consistency: z.enum(brandConsistency),
    avg_tread_depth: z.enum(treadDepthScale),
    spare_tyre_condition: z.enum(spareTyreCond),
    rim_condition: z.enum(rimCondition),
  }),

  tyres: z
    .array(
      z.object({
        condition: z.enum(tyreCondition),
        brand: z.string().trim().max(30).optional(),
        tread_depth: z.enum(treadDepthScale),
        photo_uploaded: bool,
      })
    )
    .default([]),
});

// Step 12: Operational + Market + Final
export const Step12 = z.object({
  drive_forward_video_uploaded: bool,
  drive_backwards_video_uploaded: bool,

  market: z.object({
    modifications: z.enum(modificationsScale),
  }),

  final: z.object({
    overall_vehicle_rating10: z.coerce.number().int().min(1).max(10),
    immediate_repairs: z.string().trim().max(500).optional(),
    purchase_recommendation: z.enum(purchaseRecommendation),
    inspector_comments: z.string().trim().max(500).optional(),
    inspection_date: z.string().trim().min(1), // "YYYY-MM-DD" as text entry
    inspector_name: z.string().trim().max(50),
    inspector_signature_captured: bool,
  }),
});
