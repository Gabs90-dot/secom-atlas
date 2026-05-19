import { getContractInfo } from "@/lib/atlasUtils";

export function buildEditableContracts(contracts: any[], contractOverrides: any) {
  return contracts.map((contract) => ({
    ...contract,
    ...(contractOverrides[contract.name] || {}),
  }));
}

export function getSelectedContract(args: {
  site: string;
  entity: string;
  editableContracts: any[];
  contractOverrides: any;
}) {
  const { site, entity, editableContracts, contractOverrides } = args;
  const selectedContractBase = getContractInfo(site, entity, editableContracts);

  return selectedContractBase
    ? {
        ...selectedContractBase,
        ...(contractOverrides[selectedContractBase.name] || {}),
      }
    : undefined;
}
