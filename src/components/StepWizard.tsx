// src/components/StepWizard.tsx
import * as React from "react";
import {
  useForm,
  type UseFormReturn,
  type Resolver,
  type FieldErrors,
} from "react-hook-form";
import { Button } from "@/components/ui/button";

/** Plain record type used across the wizard */
export type AnyRecord = Record<string, unknown>;

/**
 * Minimal "schema-like" contract: anything with safeParse(...) that returns
 * success + data or error + issues. Zod objects satisfy this.
 */
export type SchemaLike = {
  safeParse: (
    data: unknown
  ) =>
    | { success: true; data: AnyRecord }
    | {
        success: false;
        error: {
          issues: Array<{
            path: Array<string | number>;
            message: string;
            code: string;
          }>;
        };
      };
};

export type StepConfig = {
  id: string;
  title: string;
  schema: SchemaLike;
  render: (methods: UseFormReturn<AnyRecord>) => React.ReactNode;
  /** If true, this step doesn't write to localStorage */
  skipPersist?: boolean;
};

export type StepWizardProps = {
  steps: StepConfig[];
  initialData?: AnyRecord;
  draftKey?: string;
  /** Called after a valid submit of each step (including last). */
  onStepSubmit?: (
    step: StepConfig,
    data: AnyRecord,
    all: AnyRecord
  ) => Promise<void> | void;
  /** Called when the last step is finished. */
  onComplete: () => Promise<void> | void;
};

/** Lightweight resolver built on schema.safeParse (keeps RHF types happy). */
function makeResolver(schema: SchemaLike): Resolver<AnyRecord> {
  return async (values) => {
    const result = schema.safeParse(values);

    // ✅ Explicit success guard
    if (result && typeof result === "object" && "success" in result && result.success) {
      return { values: result.data, errors: {} as FieldErrors<AnyRecord> };
    }

    // ✅ Only read .error when it exists on the union
    const issues =
      result && typeof result === "object" && "error" in result && result.error
        ? result.error.issues ?? []
        : [];

    const errors = {} as FieldErrors<AnyRecord>;
    for (const issue of issues) {
      const name = issue.path.join(".");
      (errors as unknown as Record<string, unknown>)[name] = {
        type: issue.code,
        message: issue.message,
      };
    }

    return { values: {}, errors };
  };
}

export default function StepWizard({
  steps,
  initialData,
  draftKey,
  onStepSubmit,
  onComplete,
}: StepWizardProps) {
  const [current, setCurrent] = React.useState(0);
  const [allData, setAllData] = React.useState<AnyRecord>(initialData ?? {});
  const step = steps[current];

  const resolver = React.useMemo(() => makeResolver(step.schema), [step.schema]);

  const form = useForm<AnyRecord>({
    resolver,
    defaultValues: (allData[step.id] as AnyRecord) ?? {},
    mode: "onSubmit",
  });

  // ensure each step loads its own values
React.useEffect(() => {
  form.reset((allData[step.id] as AnyRecord) ?? {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [step.id]);


  const saveDraft = React.useCallback(
    (data: AnyRecord) => {
      const merged = { ...allData, [step.id]: data };
      setAllData(merged);
      if (draftKey && !step.skipPersist) {
        try {
          localStorage.setItem(draftKey, JSON.stringify(merged));
        } catch {
          /* ignore quota or private mode errors */
        }
      }
    },
    [allData, draftKey, step.id, step.skipPersist]
  );

  async function handleNext() {
    const valid = await form.trigger();
    if (!valid) return;

    const data = form.getValues() as AnyRecord;
    const merged = { ...allData, [step.id]: data };
    saveDraft(data);

    if (onStepSubmit) {
      await onStepSubmit(step, data, merged);
    }

    if (current < steps.length - 1) {
      setCurrent((i) => i + 1);
    } else {
      await onComplete();
    }
  }

  function handleBack() {
    if (current === 0) return;
    const data = form.getValues() as AnyRecord;
    saveDraft(data);
    setCurrent((i) => i - 1);
  }

  function handleClearDraft() {
    if (draftKey) {
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* ignore */
      }
    }
    setAllData({});
    form.reset({});
    setCurrent(0);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs opacity-60">
            Step {current + 1} of {steps.length}
          </div>
          <h2 className="text-lg font-semibold">{step.title}</h2>
        </div>
        {draftKey ? (
          <Button variant="secondary" type="button" onClick={handleClearDraft}>
            Clear draft
          </Button>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleNext();
        }}
        className="space-y-4"
      >
        {step.render(form)}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={current === 0}
          >
            ← Back
          </Button>
          <Button type="submit">
            {current < steps.length - 1 ? "Next →" : "Finish"}
          </Button>
        </div>
      </form>
    </div>
  );
}
