// src/pages/InspectionsNew.tsx
import * as React from "react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import AppShell from "@/layouts/AppShell";
import StepWizard, { type StepConfig, type SchemaLike } from "@/components/StepWizard";
import type { UseFormReturn } from "react-hook-form";
import { RHText, RHNumber, RHSelect, RHToggle } from "@/components/forms/RHFields";
import { RHImageCapture, RHVideoCapture } from "@/components/forms/RHUpload";
import { RHGeo } from "@/components/forms/RHGeo";
import { createInspectionDraft, saveInspectionStep } from "@/lib/inspections";
import { toast } from "sonner";
import {
  Step1, Step2, Step3, Step4, Step5, Step6, Step7, Step8, Step9, Step10, Step11, Step12,
  brandOptions, clearLevels, loadBodyType, loadBodyBuild, goodFairPoor, excellentToPoor,
  workingDamagedMissing, gearQuality, clutchQuality, purchaseRecommendation,
} from "@/lib/inspectionSchemas";

const DRAFT_KEY = "draft:inspection:new";

function loadDraft(): Record<string, unknown> | undefined {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

/* ---------- Field sections per step (inline capture) ---------- */

function Step1Fields({
  form,
  inspectionId,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  inspectionId?: string;
}) {
  const prefix = inspectionId ? `inspections/${inspectionId}` : "inspections/draft";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <RHSelect control={form.control} name="vehicle_brand" label="Vehicle Brand"
        options={brandOptions.map((v) => ({ label: v, value: v }))} />
      <RHText control={form.control} name="vehicle_model" label="Vehicle Model" />
      <RHNumber control={form.control} name="manufacturing_year" label="Year" />

      <RHText control={form.control} name="chassis_number_full" label="Chassis Number (Full)" />
      <RHSelect control={form.control} name="chassis_clarity" label="Chassis No. Clarity"
        options={clearLevels.map((v) => ({ label: v, value: v }))} />
      <RHText control={form.control} name="engine_number_full" label="Engine Number (Full)" />

      {/* Inline capture (required) */}
      <RHImageCapture control={form.control} name="vin_plate_photo" label="VIN Plate Photo" prefix={`${prefix}/vin`} required />
      <RHImageCapture control={form.control} name="chassis_number_photo" label="Chassis Number Photo" prefix={`${prefix}/chassis`} required />
      <RHImageCapture control={form.control} name="engine_number_photo" label="Engine Number Photo" prefix={`${prefix}/engine`} required />

      {/* One-tap GPS capture */}
      <div className="md:col-span-3">
        <RHGeo control={form.control} name="inspection_gps" label="Inspection GPS (auto)" required />
      </div>
    </div>
  );
}

function Step2Fields({ form }: { form: UseFormReturn<Record<string, unknown>> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <RHNumber control={form.control} name="body_length_m" label="Body Length (m)" />
    <RHNumber control={form.control} name="meter_km" label="Odometer (km)" />
    <RHNumber control={form.control} name="hours_run" label="Hours run" />

    <RHSelect control={form.control} name="hsrp_present" label="HSRP present?"
      options={[{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }]} />
    {/* HSRP photo inline */}
    <RHImageCapture control={form.control} name="hsrp_photo" label="HSRP Photo" prefix="inspections/hsrp" required />

    <RHSelect control={form.control} name="load_body_type" label="Load Body Type"
      options={loadBodyType.map((v) => ({ label: v, value: v }))} />
    <RHSelect control={form.control} name="load_body_build" label="Load Body Build"
      options={loadBodyBuild.map((v) => ({ label: v, value: v }))} />
    </div>
  );
}

function Step3Fields({
  form,
  inspectionId,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  inspectionId?: string;
}) {
  const prefix = inspectionId ? `inspections/${inspectionId}/exterior` : "inspections/draft/exterior";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <RHSelect control={form.control} name="tail_gate" label="Tail Gate"
        options={[...goodFairPoor, "Not Applicable"].map((v) => ({ label: String(v), value: String(v) }))} />
      <RHImageCapture control={form.control} name="tail_gate_photo" label="Tail Gate Photo" prefix={prefix} required />

      <RHSelect control={form.control} name="load_floor" label="Load Floor"
        options={goodFairPoor.map((v) => ({ label: v, value: v }))} />
      <RHImageCapture control={form.control} name="load_floor_photo" label="Load Floor Photo" prefix={prefix} required />

      <RHSelect control={form.control} name="dents" label="Dents"
        options={["None", "Minor", "Moderate", "Severe"].map((v) => ({ label: v, value: v }))} />

      <RHImageCapture control={form.control} name="exterior_photos" label="Exterior Photos (multi)"
        multiple prefix={prefix} required />

      <RHSelect control={form.control} name="paint_condition" label="Paint Condition"
        options={excellentToPoor.map((v) => ({ label: v, value: v }))} />
      <RHSelect control={form.control} name="chassis_condition" label="Chassis Condition"
        options={excellentToPoor.map((v) => ({ label: v, value: v }))} />
      <RHVideoCapture control={form.control} name="chassis_run_video" label="Chassis Full-Length Running (video)"
        prefix={inspectionId ? `inspections/${inspectionId}/videos` : "inspections/draft/videos"} required />

      <RHSelect control={form.control} name="bumper" label="Bumper"
        options={workingDamagedMissing.map((v) => ({ label: v, value: v }))} />
      <RHImageCapture control={form.control} name="bumper_photo" label="Bumper Photo" prefix={prefix} required />

      <RHSelect control={form.control} name="head_lamps" label="Head Lamps"
        options={workingDamagedMissing.map((v) => ({ label: v, value: v }))} />
      <RHImageCapture control={form.control} name="head_lamp_photos" label="Headlamp Photos (2+)"
        multiple prefix={prefix} required />

      <RHSelect control={form.control} name="door_left" label="Door - Left"
        options={workingDamagedMissing.map((v) => ({ label: v, value: v }))} />
      <RHImageCapture control={form.control} name="door_left_photo" label="Door—Left Photo" prefix={prefix} required />

      <RHSelect control={form.control} name="door_right" label="Door - Right"
        options={workingDamagedMissing.map((v) => ({ label: v, value: v }))} />
      <RHImageCapture control={form.control} name="door_right_photo" label="Door—Right Photo" prefix={prefix} required />

      {/* Optional wipers */}
      <RHToggle control={form.control} name="wiper_left_ok" label="Wiper Left OK?" />
      <RHImageCapture control={form.control} name="wiper_left_photo" label="Wiper—Left Photo" prefix={prefix} />

      <RHToggle control={form.control} name="wiper_right_ok" label="Wiper Right OK?" />
      <RHImageCapture control={form.control} name="wiper_right_photo" label="Wiper—Right Photo" prefix={prefix} />
    </div>
  );
}

function Step4Fields({ form }: { form: UseFormReturn<Record<string, unknown>> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <RHSelect control={form.control} name="dashboard" label="Dashboard"
        options={goodFairPoor.map((v) => ({ label: v, value: v }))} />
      <RHNumber control={form.control} name="number_of_seats" label="Number of Seats" />
      <RHSelect control={form.control} name="driver_seat" label="Driver Seat"
        options={goodFairPoor.map((v) => ({ label: v, value: v }))} />
      <RHSelect control={form.control} name="co_driver_seat" label="Co-driver Seat"
        options={[...goodFairPoor, "Not Applicable"].map((v) => ({ label: String(v), value: String(v) }))} />
      <RHSelect control={form.control} name="sleeper_seat" label="Sleeper Seat"
        options={[...goodFairPoor, "Not Applicable"].map((v) => ({ label: String(v), value: String(v) }))} />
      <RHToggle control={form.control} name="ac" label="AC" />
      <RHToggle control={form.control} name="abs" label="ABS" />
    </div>
  );
}

function Step5Fields({ form }: { form: UseFormReturn<Record<string, unknown>> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <RHSelect control={form.control} name="engine_condition" label="Engine Condition"
        options={["Excellent", "Good", "Fair", "Poor"].map((v) => ({ label: v, value: v }))} />
      <RHSelect control={form.control} name="engine_start_sound" label="Engine Start Sound"
        options={["Smooth", "Rough", "Irregular"].map((v) => ({ label: v, value: v }))} />
      <RHSelect control={form.control} name="engine_oil_leaks" label="Engine Oil Leaks"
        options={["None", "Minor", "Moderate", "Severe"].map((v) => ({ label: v, value: v }))} />
      <RHSelect control={form.control} name="radiator_condenser" label="Radiator/Condenser"
        options={goodFairPoor.map((v) => ({ label: v, value: v }))} />
      <RHSelect control={form.control} name="fluid_leaks" label="Fluid Leaks"
        options={["None", "Minor", "Moderate", "Severe"].map((v) => ({ label: v, value: v }))} />
      <RHSelect control={form.control} name="diesel_pump" label="Diesel Pump"
        options={goodFairPoor.map((v) => ({ label: v, value: v }))} />
      <RHSelect control={form.control} name="ignition_system" label="Ignition System"
        options={goodFairPoor.map((v) => ({ label: v, value: v }))} />

      <div className="md:col-span-3 mt-2 border-t pt-3 dark:border-zinc-800">
        <div className="font-medium mb-2">Engine Performance</div>
        <RHNumber control={form.control} name="performance.idle_rpm" label="Idle RPM" />
        <RHSelect control={form.control} name="performance.temperature" label="Temperature"
          options={["Normal", "High", "Overheating"].map((v) => ({ label: v, value: v }))} />
        <RHSelect control={form.control} name="performance.exhaust_smoke" label="Exhaust Smoke"
          options={["Clear", "White", "Black", "Blue"].map((v) => ({ label: v, value: v }))} />
        <RHSelect control={form.control} name="performance.turbo_supercharger" label="Turbo/Supercharger"
          options={[...goodFairPoor, "Not Applicable"].map((v) => ({ label: String(v), value: String(v) }))} />
        <RHSelect control={form.control} name="performance.vibration" label="Vibration"
          options={["Minimal", "Moderate", "Excessive"].map((v) => ({ label: v, value: v }))} />
        <RHNumber control={form.control} name="performance.efficiency_kmpl" label="Fuel Efficiency (km/l)" />
      </div>
    </div>
  );
}

function Step6Fields({ form }: { form: UseFormReturn<Record<string, unknown>> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <RHSelect control={form.control} name="transmission" label="Transmission"
        options={["Good", "Fair", "Poor"].map((v) => ({ label: v, value: v }))} />
      <RHSelect control={form.control} name="gearshift" label="Gearshift"
        options={gearQuality.map((v) => ({ label: v, value: v }))} />
      <RHSelect control={form.control} name="clutch_engagement" label="Clutch Engagement"
        options={clutchQuality.map((v) => ({ label: v, value: v }))} />
      <RHText control={form.control} name="axle_configuration" label="Axle Configuration" />
      <RHSelect control={form.control} name="differential" label="Differential"
        options={["Good", "Fair", "Poor"].map((v) => ({ label: v, value: v }))} />
      <RHSelect control={form.control} name="vehicle_cranks" label="Vehicle Cranks"
        options={["Easy", "Difficult", "Won't Crank"].map((v) => ({ label: v, value: v }))} />
    </div>
  );
}

function Step7Fields({ form }: { form: UseFormReturn<Record<string, unknown>> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <RHSelect control={form.control} name="steering_power" label="Steering (Power)"
        options={["Good", "Fair", "Poor", "Manual"].map((v) => ({ label: v, value: v }))} />
      <RHSelect control={form.control} name="suspension" label="Suspension"
        options={["Good", "Fair", "Poor"].map((v) => ({ label: v, value: v }))} />
    </div>
  );
}

function Step8Fields({ form }: { form: UseFormReturn<Record<string, unknown>> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <RHSelect control={form.control} name="hydraulic_operation" label="Hydraulic Operation"
        options={[...goodFairPoor, "Not Applicable"].map((v) => ({ label: String(v), value: String(v) }))} />
      {/* optional: hydraulic video later if you decide */}
      {/* <RHVideoCapture control={form.control} name="hydraulic_video" label="Hydraulics (video)" prefix="inspections/videos" /> */}

      <div className="md:col-span-3 mt-2 border-t pt-3 dark:border-zinc-800">
        <div className="font-medium mb-2">Safety & Compliance</div>
        <RHSelect control={form.control} name="safety.seat_belts" label="Seat Belts"
          options={["All Working", "Some Faulty", "Missing"].map((v) => ({ label: v, value: v }))} />
        <RHToggle control={form.control} name="safety.fire_extinguisher" label="Fire Extinguisher" />
        <RHToggle control={form.control} name="safety.first_aid_kit" label="First Aid Kit" />
        <RHToggle control={form.control} name="safety.emergency_triangle" label="Emergency Triangle" />
        <RHToggle control={form.control} name="safety.vltd" label="VLTD (GPS)" />
        <RHToggle control={form.control} name="safety.speed_governor" label="Speed Governor" />
        <RHToggle control={form.control} name="safety.jack_present" label="Jack" />
        <RHToggle control={form.control} name="safety.jack_rod_present" label="Jack Rod" />
        <RHToggle control={form.control} name="safety.toolkit_present" label="Toolkit" />
      </div>
    </div>
  );
}

function Step9Fields({
  form,
  inspectionId,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  inspectionId?: string;
}) {
  const prefix = inspectionId ? `inspections/${inspectionId}/controls` : "inspections/draft/controls";
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <RHSelect control={form.control} name="brake_pedal_functions" label="Brake Pedal Functions"
        options={goodFairPoor.map((v) => ({ label: v, value: v }))} />
      <RHImageCapture control={form.control} name="accelerator_photo" label="Accelerator Pedal Photo"
        prefix={prefix} required />
    </div>
  );
}

function Step10Fields({ form }: { form: UseFormReturn<Record<string, unknown>> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <RHText control={form.control} name="battery_brand" label="Battery Brand" />
      <RHText control={form.control} name="battery_serial" label="Battery Serial Number" />
      <RHNumber control={form.control} name="battery_ampere" label="Battery Ampere" />
    </div>
  );
}

function Step11Fields({ form }: { form: UseFormReturn<Record<string, unknown>> }) {
  type TyreItem = { condition?: string; brand?: string; tread_depth?: string; photo_uploaded?: boolean };
  const tyreCount = Number(form.watch("tyre_count") ?? 4);

  React.useEffect(() => {
    const arr = (form.getValues("tyres") as TyreItem[] | undefined) ?? [];
    if (arr.length !== tyreCount) {
      const next: TyreItem[] = Array.from({ length: tyreCount }, (_, i) => ({
        ...(arr[i] ?? {}),
        condition: arr[i]?.condition ?? "Good",
        tread_depth: arr[i]?.tread_depth ?? "Good",
        brand: arr[i]?.brand ?? "",
        photo_uploaded: !!arr[i]?.photo_uploaded,
      }));
      form.setValue("tyres", next, { shouldDirty: true });
    }
  }, [tyreCount, form]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RHNumber control={form.control} name="tyre_count" label="No. of Tyres" />
        <RHSelect control={form.control} name="details.brand_consistency" label="Tyre Brand"
          options={[{ label: "All Same", value: "All Same" }, { label: "Mixed Brands", value: "Mixed Brands" }]} />
        <RHSelect control={form.control} name="details.avg_tread_depth" label="Avg Tread Depth"
          options={["Good", "Moderate", "Worn"].map((v) => ({ label: v, value: v }))} />
        <RHSelect control={form.control} name="details.spare_tyre_condition" label="Spare Tyre Condition"
          options={["Good", "Fair", "Poor", "Missing"].map((v) => ({ label: v, value: v }))} />
        <RHSelect control={form.control} name="details.rim_condition" label="Wheel Rim Condition"
          options={["Good", "Minor Damage", "Major Damage"].map((v) => ({ label: v, value: v }))} />
      </div>

      <div className="space-y-3">
        {Array.from({ length: tyreCount }).map((_, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-lg border p-3 dark:border-zinc-800">
            <div className="font-medium">Tyre {idx + 1}</div>
            <RHSelect control={form.control} name={`tyres.${idx}.condition`} label="Condition"
              options={["Good", "Fair", "Poor", "Needs Replacement"].map((v) => ({ label: v, value: v }))} />
            <RHText control={form.control} name={`tyres.${idx}.brand`} label="Brand (optional)" />
            <RHSelect control={form.control} name={`tyres.${idx}.tread_depth`} label="Tread Depth"
              options={["Good", "Moderate", "Worn"].map((v) => ({ label: v, value: v }))} />
            {/* Optional per-tyre photo control can be added here if required */}
          </div>
        ))}
      </div>
    </div>
  );
}

function Step12Fields({
  form,
  inspectionId,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  inspectionId?: string;
}) {
  const vprefix = inspectionId ? `inspections/${inspectionId}/videos` : "inspections/draft/videos";
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <RHVideoCapture control={form.control} name="drive_forward_video" label="Drive Forward (video)"
        prefix={vprefix} required />
      <RHVideoCapture control={form.control} name="drive_reverse_video" label="Drive Reverse (video)"
        prefix={vprefix} required />

      <div className="md:col-span-3 mt-2 border-t pt-3 dark:border-zinc-800">
        <div className="font-medium mb-2">Market & Final Review</div>
        <RHSelect control={form.control} name="market.modifications" label="Modifications"
          options={["None", "Minor", "Major"].map((v) => ({ label: v, value: v }))} />
        <RHNumber control={form.control} name="final.overall_vehicle_rating10" label="Overall Rating (1-10)" />
        <RHText control={form.control} name="final.immediate_repairs" label="Immediate Repairs (comma separated)" />
        <RHSelect control={form.control} name="final.purchase_recommendation" label="Purchase Recommendation"
          options={purchaseRecommendation.map((v) => ({ label: v, value: v }))} />
        <RHText control={form.control} name="final.inspector_comments" label="Inspector Comments" />
        <RHText control={form.control} name="final.inspection_date" label="Inspection Date (YYYY-MM-DD)" />
        <RHText control={form.control} name="final.inspector_name" label="Inspector Name" />
        <RHToggle control={form.control} name="final.inspector_signature_captured" label="Signature captured?" />
      </div>
    </div>
  );
}

/** ---------- Page ---------- */
export default function InspectionsNew() {
  const navigate = useNavigate();
  const draft = loadDraft();
  const [inspectionId, setInspectionId] = React.useState<string | undefined>(undefined);

  const steps: StepConfig[] = [
    { id: "step_1",  title: "Vehicle Identification & GPS",    schema: Step1  as SchemaLike, render: (f) => <Step1Fields form={f} inspectionId={inspectionId} /> },
    { id: "step_2",  title: "Specs & Registration",            schema: Step2  as SchemaLike, render: (f) => <Step2Fields form={f} /> },
    { id: "step_3",  title: "Body & Exterior (with media)",    schema: Step3  as SchemaLike, render: (f) => <Step3Fields form={f} inspectionId={inspectionId} /> },
    { id: "step_4",  title: "Interior & Cabin",                schema: Step4  as SchemaLike, render: (f) => <Step4Fields form={f} /> },
    { id: "step_5",  title: "Engine & Performance",            schema: Step5  as SchemaLike, render: (f) => <Step5Fields form={f} /> },
    { id: "step_6",  title: "Drivetrain & Transmission",       schema: Step6  as SchemaLike, render: (f) => <Step6Fields form={f} /> },
    { id: "step_7",  title: "Steering & Suspension",           schema: Step7  as SchemaLike, render: (f) => <Step7Fields form={f} /> },
    { id: "step_8",  title: "Hydraulics + Safety",             schema: Step8  as SchemaLike, render: (f) => <Step8Fields form={f} /> },
    { id: "step_9",  title: "Brakes & Controls (with media)",  schema: Step9  as SchemaLike, render: (f) => <Step9Fields form={f} inspectionId={inspectionId} /> },
    { id: "step_10", title: "Electrical & Battery",            schema: Step10 as SchemaLike, render: (f) => <Step10Fields form={f} /> },
    { id: "step_11", title: "Tyres (dynamic) + Details",       schema: Step11 as SchemaLike, render: (f) => <Step11Fields form={f} /> },
    { id: "step_12", title: "Operational + Final (with media)",schema: Step12 as SchemaLike, render: (f) => <Step12Fields form={f} inspectionId={inspectionId} /> },
  ];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">New Inspection</h1>

        <StepWizard
          steps={steps}
          draftKey={DRAFT_KEY}
          initialData={draft}
          onStepSubmit={async (step, data, all) => {
            const stepNo = /^step_(\d+)$/.test(step.id) ? Number(step.id.split("_")[1]) : undefined;

            if (!inspectionId) {
              if (step.id === "step_1") {
                try {
                  const res = await createInspectionDraft(all["step_1"] as Record<string, unknown>);
                  setInspectionId(res.id);
                  toast.success("Draft created");
                  return; // step_1 already sent in the create call
                } catch (e) {
                  const msg = e instanceof Error ? e.message : "Failed to create draft";
                  toast.error(msg);
                  throw e;
                }
              } else {
                toast.error("Complete Step 1 to create the draft first.");
                throw new Error("No draft yet");
              }
            }

            if (stepNo && stepNo !== 1) {
              await saveInspectionStep(inspectionId!, stepNo, data);
            }
          }}
          onComplete={async () => {
            if (!inspectionId) {
              toast.error("Draft not created yet");
              return;
            }
            localStorage.removeItem(DRAFT_KEY);
            toast.success("Inspection saved • Proceed to review");
            navigate(`/app/inspection/${inspectionId}/capture`);
          }}
        />
      </div>
    </AppShell>
  );
}
