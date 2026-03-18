export type AppRole = "beheerder" | "sr_uitvoerder" | "uitvoerder" | "voorman";
export type DagstaatStatus = "draft" | "submitted" | "approved";
export type UnitType = "uur" | "dag" | "halve_dag" | "stuks" | "km" | "m3" | "ton" | "liter";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  client: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subproject {
  id: string;
  project_id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  profile_id: string;
  role: AppRole;
  created_at: string;
  // Joined fields
  profile?: Profile;
}

export interface Employee {
  id: string;
  name: string;
  function: string | null;
  employer: string;
  is_subcontractor: boolean;
  hourly_rate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  default_unit: UnitType;
  day_rate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialCategory {
  id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Material {
  id: string;
  category_id: string;
  code: string | null;
  name: string;
  default_unit: UnitType;
  unit_price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityCategory {
  id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  category_id: string;
  code: string | null;
  name: string;
  description: string | null;
  default_unit: UnitType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dagstaat {
  id: string;
  project_id: string;
  date: string;
  status: DagstaatStatus;
  weather: string | null;
  created_by: string;
  submitted_at: string | null;
  submitted_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  copied_from: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  project?: Project;
  creator?: Profile;
  approver?: Profile;
}

export interface ProjectTemplate {
  id: string;
  project_id: string;
  name: string;
  created_by: string | null;
  created_at: string;
}
