export interface InspectionOption {
  id: string;
  option_text: string;
  option_value: string;
}

export interface InspectionValidationRules {
  [key: string]: unknown;
  min?: number;
  max?: number;
  min_length?: number;
  max_length?: number;
  pattern?: string;
  pattern_message?: string;
  max_files?: number;
  max_size?: string;
  allowed_types?: string[];
  max_duration?: number;
  max_tyres?: number;
  min_tread_depth?: number;
  min_pressure?: number;
  custom_validator?: (value: unknown) => string | null;
}

export interface InspectionConditionalLogic {
  depends_on: string | string[];
  condition: string | string[];
  value: unknown | unknown[];
  operator?: 'AND' | 'OR';
}

export interface InspectionQuestion {
  id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  is_critical: boolean;
  validation_rules?: InspectionValidationRules;
  conditional_logic?: InspectionConditionalLogic;
  options?: InspectionOption[];
  help_text?: string;
}

export interface InspectionSection {
  id: string;
  name: string;
  questions: InspectionQuestion[];
}

export interface InspectionTemplate {
  id: string;
  name: string;
  description?: string;
  version?: string;
  updated_at?: string;
  sections: InspectionSection[];
}
