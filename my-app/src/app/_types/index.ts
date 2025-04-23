export interface PayrollCheck {
  check_id: number;
  employee_id: number;
  phone_number: string;
  check_number: string;
  check_amount: number;
  transaction_date: string;
  status: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface Store {
  store_id: number;
  user_id: number;
  store_name: string;
  address: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface User {
  user_id: number;
  full_name: string;
  username: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  store_id: number;
  full_name: string;
  employee_code: string;
  mobile_number: string;
  created_at: string;
  updated_at: string;
}
