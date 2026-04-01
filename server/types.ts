export interface ServiceOrder {
  id: number;
  zoho_id: string;
  subject: string;
  account_name: string | null;
  customer_name: string | null;
  address: string | null;
  description: string | null;
  phone: string | null;
  status: 'unassigned' | 'assigned' | 'completed';
  created_at: string;
  updated_at: string;
  position?: number;
}

export interface Technician {
  id: number;
  zoho_user_id: string;
  name: string;
  email: string | null;
  color: string;
  is_active: number;
  created_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface AssignmentWithOrder extends DispatchAssignment {
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
  assignments: AssignmentWithOrder[];
}

export interface BoardState {
  date: string;
  unassigned: ServiceOrder[];
  technicians: TechWithAssignments[];
}

export interface ZohoUpdateParams {
  zohoId: string;
  techName?: string | null;
  priority?: number | null;
  scheduledTime?: string | null;
  status?: string;
}
