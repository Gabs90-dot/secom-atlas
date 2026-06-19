export type PublicCustomerEntityOption = {
  id: string;
  customerId: string;
  name: string;
  completeName?: string | null;
  glpiEntityId?: number | string | null;
};

export type PublicCustomerOption = {
  id: string;
  name: string;
};

export type TicketFormSourceCustomer = {
  id?: string | number | null;
  name?: string | null;
};

export type TicketFormSourceSite = {
  id?: string | number | null;
  name?: string | null;
  region?: string | null;
  entity?: string | null;
  city?: string | null;
  customer_id?: string | null;
  customerId?: string | null;
  customer_entity_id?: string | null;
  customerEntityId?: string | null;
  glpi_entity_id?: string | number | null;
  glpiEntityId?: string | number | null;
  glpi_entity_path?: string | null;
  complete_name?: string | null;
};

export type CustomerRegistrationPayload = {
  email: string;
  password: string;
  displayName: string;
  fiscalCode: string;
  customerId: string;
  customerEntityId: string;
  registrationCode: string;
};
