export type AtlasTicketCategory = "ordinaria" | "straordinaria" | "garanzia" | "materiale";

export type AtlasTicketStatus =
  | "nuova"
  | "pianificata"
  | "in lavorazione"
  | "chiusa"
  | "in sospeso";

export type AtlasMaterial = {
  id: string;
  name: string;
  cost: number;
};

export type AtlasInventoryItem = {
  id: string;
  name: string;
  value: number;
  quantity: number;
};

export type AtlasContract = {
  name: string;
  match: string[];
  clientType: string;
  status: string;
  period: string;
  startDate: string;
  endDate: string;
  renewalAlertDays: number;
  pdf: string;
  warranty: string;
  shipping: string;
  spareParts: string;
  sla: string;
  notes: string;
};
