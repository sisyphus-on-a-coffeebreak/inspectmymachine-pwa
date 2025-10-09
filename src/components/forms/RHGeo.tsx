// src/components/forms/RHGeo.tsx
import * as React from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type ControllerRenderProps,
} from "react-hook-form";
import { Button } from "@/components/ui/button";

type RHGeoProps<T extends FieldValues> = {
  control: Control<T>;
  latName: FieldPath<T>;
  lonName: FieldPath<T>;
  /** Optional: write accuracy (meters) to this field if provided */
  accuracyName?: FieldPath<T>;
  /** Optional: write ISO timestamp to this field if provided */
  timeName?: FieldPath<T>;
  label?: string;
  disabled?: boolean;
};

type FieldApi<T extends FieldValues> = ControllerRenderProps<T, FieldPath<T>>;

function GeoCore<T extends FieldValues>({
  label,
  disabled,
  latField,
  lonField,
  accField,
  tsField,
}: {
  label: string;
  disabled?: boolean;
  latField: FieldApi<T>;
  lonField: FieldApi<T>;
  accField?: FieldApi<T>;
  tsField?: FieldApi<T>;
}) {
  const [err, setErr] = React.useState<string>();

  function capture() {
    setErr(undefined);
    if (!("geolocation" in navigator)) {
      setErr("Geolocation not available on this device/browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        latField.onChange(pos.coords.latitude);
        lonField.onChange(pos.coords.longitude);
        if (accField) accField.onChange(pos.coords.accuracy);
        if (tsField) tsField.onChange(new Date(pos.timestamp).toISOString());
      },
      (e) => setErr(e.message || "Failed to get location"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  const lat = latField.value as number | string | undefined;
  const lon = lonField.value as number | string | undefined;
  const acc = accField?.value as number | string | undefined;
  const ts = tsField?.value as string | undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Button type="button" onClick={capture} disabled={disabled}>
          {label}
        </Button>
        <div className="text-xs opacity-70">
          {lat != null && lon != null ? (
            <>
              lat: {String(lat)}, lon: {String(lon)}
              {acc != null ? <> • ±{String(acc)} m</> : null}
              {ts ? <> • {ts.replace("T", " ").replace("Z", "")}</> : null}
            </>
          ) : (
            <>Not captured</>
          )}
        </div>
      </div>
      {err ? <div className="text-xs text-red-600">{err}</div> : null}
    </div>
  );
}

export default function RHGeo<T extends FieldValues>({
  control,
  latName,
  lonName,
  accuracyName,
  timeName,
  label = "Capture GPS",
  disabled,
}: RHGeoProps<T>) {
  return (
    <Controller
      control={control}
      name={latName}
      render={({ field: latField }) => (
        <Controller
          control={control}
          name={lonName}
          render={({ field: lonField }) =>
            accuracyName ? (
              <Controller
                control={control}
                name={accuracyName}
                render={({ field: accField }) =>
                  timeName ? (
                    <Controller
                      control={control}
                      name={timeName}
                      render={({ field: tsField }) => (
                        <GeoCore<T>
                          label={label}
                          disabled={disabled}
                          latField={latField}
                          lonField={lonField}
                          accField={accField}
                          tsField={tsField}
                        />
                      )}
                    />
                  ) : (
                    <GeoCore<T>
                      label={label}
                      disabled={disabled}
                      latField={latField}
                      lonField={lonField}
                      accField={accField}
                    />
                  )
                }
              />
            ) : (
              <GeoCore<T>
                label={label}
                disabled={disabled}
                latField={latField}
                lonField={lonField}
              />
            )
          }
        />
      )}
    />
  );
}
