// src/components/forms/RHFields.tsx
import * as React from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

/** Base props shared by all RH* fields */
type BaseProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  /** Supports dot paths like "vehicle_history.last_service_date" */
  name: FieldPath<TFieldValues>;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

function idFromName(name: string): string {
  return `f_${name.replace(/\./g, "__")}`;
}

/* ---------------- TEXT ---------------- */

type RHTextProps<TFieldValues extends FieldValues> = BaseProps<TFieldValues> & {
  placeholder?: string;
};

export function RHText<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
  placeholder,
}: RHTextProps<TFieldValues>) {
  const id = idFromName(name as string);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={className}>
          {label ? <Label htmlFor={id}>{label}</Label> : null}
          <Input
            id={id}
            value={(field.value as string | undefined) ?? ""}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            ref={field.ref}
            placeholder={placeholder}
            disabled={disabled}
          />
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
          {fieldState.error ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

/* ---------------- TEXTAREA ---------------- */

type RHTextareaProps<TFieldValues extends FieldValues> = BaseProps<TFieldValues> & {
  placeholder?: string;
  rows?: number;
};

export function RHTextarea<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
  placeholder,
  rows = 4,
}: RHTextareaProps<TFieldValues>) {
  const id = idFromName(name as string);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={className}>
          {label ? <Label htmlFor={id}>{label}</Label> : null}
          <Textarea
            id={id}
            rows={rows}
            value={(field.value as string | undefined) ?? ""}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            ref={field.ref}
            placeholder={placeholder}
            disabled={disabled}
          />
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
          {fieldState.error ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

/* ---------------- NUMBER ---------------- */

type RHNumberProps<TFieldValues extends FieldValues> = BaseProps<TFieldValues> & {
  placeholder?: string;
  step?: number | "any";
  min?: number;
  max?: number;
};

export function RHNumber<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
  placeholder,
  step,
  min,
  max,
}: RHNumberProps<TFieldValues>) {
  const id = idFromName(name as string);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={className}>
          {label ? <Label htmlFor={id}>{label}</Label> : null}
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            step={step}
            min={min}
            max={max}
            value={
              field.value === null ||
              field.value === undefined ||
              Number.isNaN(field.value as number)
                ? ""
                : String(field.value)
            }
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                field.onChange(undefined);
                return;
              }
              const num = Number(raw);
              field.onChange(Number.isNaN(num) ? undefined : num);
            }}
            onBlur={field.onBlur}
            ref={field.ref}
            placeholder={placeholder}
            disabled={disabled}
          />
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
          {fieldState.error ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

/* ---------------- SELECT ---------------- */

export type Option = { label: string; value: string };

type RHSelectProps<TFieldValues extends FieldValues> = BaseProps<TFieldValues> & {
  options: Option[];
  placeholder?: string;
};

export function RHSelect<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
  options,
  placeholder = "Select…",
}: RHSelectProps<TFieldValues>) {
  const id = idFromName(name as string);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const value = typeof field.value === "string" ? field.value : "";
        return (
          <div className={className}>
            {label ? <Label htmlFor={id}>{label}</Label> : null}
            <Select
              value={value}
              onValueChange={(v) => field.onChange(v)}
              disabled={disabled}
            >
              <SelectTrigger id={id}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {description ? (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            ) : null}
            {fieldState.error ? (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        );
      }}
    />
  );
}

/* ---------------- TOGGLE (SWITCH) ---------------- */

type RHToggleProps<TFieldValues extends FieldValues> = BaseProps<TFieldValues> & {
  /** When true, missing value is treated as `false` initially */
  defaultFalse?: boolean;
};

export function RHToggle<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
  defaultFalse = true,
}: RHToggleProps<TFieldValues>) {
  const id = idFromName(name as string);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const checked =
          typeof field.value === "boolean"
            ? field.value
            : defaultFalse
            ? false
            : Boolean(field.value);
        return (
          <div className={`flex items-center gap-2 ${className ?? ""}`}>
            <Switch
              id={id}
              checked={checked}
              onCheckedChange={(v: boolean) => field.onChange(v)}
              disabled={disabled}
            />
            {label ? <Label htmlFor={id}>{label}</Label> : null}
            {description ? (
              <p className="ml-2 text-xs text-muted-foreground">{description}</p>
            ) : null}
            {fieldState.error ? (
              <p className="ml-2 text-xs text-red-600 dark:text-red-400">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        );
      }}
    />
  );
}
