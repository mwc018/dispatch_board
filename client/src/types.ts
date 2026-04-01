export interface ServiceOrder {
  id: number;
  zoho_id: string;
  subject: string;
  account_name: string | null;
  customer_name: string | null;
  address: string | null;
  description: string | null;
  phone: string | null;
  status: string;
  position?: number;
  created_at: string;
  updated_at: string;
}

export interface Technician {
  id: number;
  zoho_user_id: string;
  name: string;
  email: string | null;
  color: string;
  is_active: number;
  created_at?: string;
}

export interface DispatchAssignment {
  id: number;
  service_order_id: number;
  technician_id: number;
  priority: number;
  scheduled_time: string | null;
  dispatch_date: string;
  notes: string | null;
  time_worked: number | null;
  zoho_id: string;
  subject: string;
  account_name: string | null;
  customer_name: string | null;
  address: string | null;
  description: string | null;
  phone: string | null;
  status: string;
}

export interface TechWithAssignments extends Technician {
  assignments: DispatchAssignment[];
}

export interface BoardState {
  date: string;
  unassigned: ServiceOrder[];
  technicians: TechWithAssignments[];
}

export interface TechBoardState {
  tech: Technician;
  date: string;
  assignments: DispatchAssignment[];
}

export interface DndCardItem {
  dndId: string;
  id: number;
  assignmentId?: number;
  subject: string;
  account_name: string | null;
  customer_name: string | null;
  address: string | null;
  phone: string | null;
  description: string | null;
  priority?: number;
  scheduled_time?: string | null;
  notes?: string | null;
  coAssignees?: string[];
}

export interface AddTechData {
  name: string;
  email: string | null;
  color: string;
}

export interface AddOrderData {
  subject: string;
  customer_name: string;
  address: string;
  phone: string;
  description: string;
}
