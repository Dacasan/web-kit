export interface SelectOption {
  value: string;
  label: string;
}

export interface LeadExtraField {
  type: "date" | "select" | "number" | "text";
  name: string;
  label: string;
  required?: boolean;
  options?: SelectOption[];
}
