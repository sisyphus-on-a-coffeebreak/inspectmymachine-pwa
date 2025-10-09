import * as React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AppShell from "@/layouts/AppShell";
import { getInspection, submitInspection, type Inspection } from "@/lib/inspections";
import { Button } from "@/components/ui/button";

const DRAFT_KEY = "draft:inspection:new";

export default function InspectionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [insp, setInsp] = React.useState<Inspection | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await getInspection(id);
        setInsp(data);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function seedDraftAndGoToWizard() {
    if (!insp) return;
    // seed localStorage with step_1..step_12 so the wizard resumes
    const draft: Record<string, unknown> = {};
    for (let i = 1; i <= 12; i++) {
      const key = `step_${i}` as const;
      if (insp[key]) draft[key] = insp[key];
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    navigate("/app/inspections/new");
  }

  async function onSubmit() {
    if (!id) return;
    try {
      setSubmitting(true);
      await submitInspection(id);
      // refresh
      const data = await getInspection(id);
      setInsp(data);
      alert("Inspection submitted.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Inspection Details</h1>
          <div className="text-xs opacity-70">{id}</div>
        </div>

        {loading && <div>Loading…</div>}
        {err && <div className="text-red-600 dark:text-red-400">Error: {err}</div>}

        {insp && (
          <>
            <div className="rounded-xl border p-4 dark:border-zinc-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="opacity-60">Status</div>
                  <div className="font-medium">{insp.status}</div>
                </div>
                <div>
                  <div className="opacity-60">Current Step</div>
                  <div className="font-medium">
                    {insp.current_step} / {insp.total_steps}
                  </div>
                </div>
                <div>
                  <div className="opacity-60">Completion</div>
                  <div className="font-medium">
                    {typeof insp.completion_percentage === "number"
                      ? `${insp.completion_percentage.toFixed(0)}%`
                      : `${insp.completion_percentage}`}
                  </div>
                </div>
                <div>
                  <div className="opacity-60">Inspector</div>
                  <div className="font-medium">{insp.inspector_id}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={seedDraftAndGoToWizard}>
                Continue in Wizard
              </Button>

              <Link to={`/app/inspection/${insp.id}/capture`}>
                <Button type="button" variant="secondary">
                  Open Capture
                </Button>
              </Link>

              <Button
                type="button"
                variant="outline"
                onClick={onSubmit}
                disabled={submitting || insp.status === "submitted" || insp.status === "approved"}
              >
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            </div>

            {/* Quick peek at a couple steps (optional) */}
            <div className="rounded-xl border p-4 dark:border-zinc-800 text-sm space-y-2">
              <div className="font-medium">Step snapshots</div>
              <div className="opacity-70">
                step_1: {insp.step_1 ? "✓" : "—"} • step_2: {insp.step_2 ? "✓" : "—"} • step_11: {insp.step_11 ? "✓" : "—"}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
