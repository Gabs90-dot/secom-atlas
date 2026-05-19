export type Customer = {
  id: string;
  name: string;
  contract_type: string | null;
  sla_hours: number | null;
  referent: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
};