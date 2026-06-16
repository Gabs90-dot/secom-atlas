import type {
  CreateActivityPayload,
  CreateInternalNotePayload,
  CreateMaterialPayload,
  CreateWorkOrderPayload,
  UpdateWorkOrderPayload,
} from "@/types/work-orders";
import {
  mockWorkOrderRepository,
  type WorkOrderRepository,
} from "@/lib/work-orders/repository";

export type WorkOrderService = {
  getWorkOrderById(id: string): ReturnType<WorkOrderRepository["getWorkOrderById"]>;
  getWorkOrderByTicketId(ticketId: number | string): ReturnType<WorkOrderRepository["getWorkOrderByTicketId"]>;
  createWorkOrder(payload: CreateWorkOrderPayload): ReturnType<WorkOrderRepository["createWorkOrder"]>;
  updateWorkOrder(id: string, payload: UpdateWorkOrderPayload): ReturnType<WorkOrderRepository["updateWorkOrder"]>;
  deleteWorkOrder(id: string): ReturnType<WorkOrderRepository["deleteWorkOrder"]>;
  listActivities(workOrderId: string): ReturnType<WorkOrderRepository["listActivities"]>;
  createActivity(payload: CreateActivityPayload): ReturnType<WorkOrderRepository["createActivity"]>;
  listMaterials(workOrderId: string): ReturnType<WorkOrderRepository["listMaterials"]>;
  createMaterial(payload: CreateMaterialPayload): ReturnType<WorkOrderRepository["createMaterial"]>;
  listInternalNotes(workOrderId: string): ReturnType<WorkOrderRepository["listInternalNotes"]>;
  createInternalNote(payload: CreateInternalNotePayload): ReturnType<WorkOrderRepository["createInternalNote"]>;
};

export function createWorkOrderService(
  repository: WorkOrderRepository = mockWorkOrderRepository,
): WorkOrderService {
  return {
    getWorkOrderById(id) {
      return repository.getWorkOrderById(id);
    },

    getWorkOrderByTicketId(ticketId) {
      return repository.getWorkOrderByTicketId(ticketId);
    },

    createWorkOrder(payload) {
      return repository.createWorkOrder(payload);
    },

    updateWorkOrder(id, payload) {
      return repository.updateWorkOrder(id, payload);
    },

    deleteWorkOrder(id) {
      return repository.deleteWorkOrder(id);
    },

    listActivities(workOrderId) {
      return repository.listActivities(workOrderId);
    },

    createActivity(payload) {
      return repository.createActivity(payload);
    },

    listMaterials(workOrderId) {
      return repository.listMaterials(workOrderId);
    },

    createMaterial(payload) {
      return repository.createMaterial(payload);
    },

    listInternalNotes(workOrderId) {
      return repository.listInternalNotes(workOrderId);
    },

    createInternalNote(payload) {
      return repository.createInternalNote(payload);
    },
  };
}

export const workOrderService = createWorkOrderService();
