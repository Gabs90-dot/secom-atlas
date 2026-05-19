import type { AtlasTicketCategory } from "@/lib/atlasTypes";
import { getContractInfo, materialCost } from "@/lib/atlasUtils";

export function getTicketTypeFromMap(
  ticket: any,
  ticketTypesById: Record<string, AtlasTicketCategory>
): AtlasTicketCategory {
  return (
    ticket?.ticketType ||
    ticketTypesById[String(ticket?.id)] ||
    ticket?.ticket_type ||
    "ordinaria"
  );
}

export function getTicketContract(ticket: any, editableContracts: any[]) {
  return getContractInfo(ticket?.site || "", ticket?.entity || "", editableContracts);
}

export function getBudgetSpent(args: {
  tickets: any[];
  ticketTypesById: Record<string, AtlasTicketCategory>;
  editableContracts: any[];
  contractName?: string;
}) {
  const { tickets, ticketTypesById, editableContracts, contractName } = args;

  return tickets
    .filter((ticket) => getTicketTypeFromMap(ticket, ticketTypesById) === "straordinaria")
    .filter((ticket) => {
      if (!contractName) return true;
      return getTicketContract(ticket, editableContracts)?.name === contractName;
    })
    .reduce((sum, ticket) => sum + materialCost(ticket.materialIds || []), 0);
}

export function getBudgetTotal(args: {
  budgets: any[];
  totalBudget: number;
  contractName?: string;
}) {
  const { budgets, totalBudget, contractName } = args;

  if (!contractName) return totalBudget;
  const found = budgets.find((item) => item.contractName === contractName);
  return Number(found?.value || 0);
}

export function getBudgetRemaining(args: {
  tickets: any[];
  ticketTypesById: Record<string, AtlasTicketCategory>;
  editableContracts: any[];
  budgets: any[];
  totalBudget: number;
  contractName?: string;
}) {
  const { tickets, ticketTypesById, editableContracts, budgets, totalBudget, contractName } = args;

  return (
    getBudgetTotal({ budgets, totalBudget, contractName }) -
    getBudgetSpent({ tickets, ticketTypesById, editableContracts, contractName })
  );
}
