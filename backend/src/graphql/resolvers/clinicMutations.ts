import { PrismaClient } from "@prisma/client";
import { ClinicService } from "../../services/ClinicService";

const prisma = new PrismaClient();
const clinicService = new ClinicService(prisma);

export const clinicMutations = {
  createVisit: async (
    _: any,
    { input }: { input: any },
    context: any
  ) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    if (!["doctor", "admin", "staff"].includes(context.user.role)) {
      throw new Error("Access denied. Required roles: doctor, admin, staff");
    }

    try {
      return await clinicService.createVisit(input);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  updateVisit: async (
    _: any,
    { id, input }: { id: string; input: any },
    context: any
  ) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    if (!["doctor", "admin", "staff"].includes(context.user.role)) {
      throw new Error("Access denied. Required roles: doctor, admin, staff");
    }

    try {
      return await clinicService.updateVisit(id, input);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  deleteVisit: async (
    _: any,
    { id }: { id: string },
    context: any
  ) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    if (!["doctor", "admin", "staff"].includes(context.user.role)) {
      throw new Error("Access denied. Required roles: doctor, admin, staff");
    }

    try {
      return await clinicService.deleteVisit(id);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  upsertVitals: async (
    _: any,
    { input }: { input: any },
    context: any
  ) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    if (!["doctor", "admin", "staff"].includes(context.user.role)) {
      throw new Error("Access denied. Required roles: doctor, admin, staff");
    }

    try {
      return await clinicService.upsertVitals(input);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  createQueueTicket: async (
    _: any,
    { input }: { input: any },
    context: any
  ) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    if (!["doctor", "admin", "staff", "cashier"].includes(context.user.role)) {
      throw new Error("Access denied. Required roles: doctor, admin, staff, cashier");
    }

    try {
      return await clinicService.createQueueTicket(input);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  updateQueueStatus: async (
    _: any,
    { id, status, note }: { id: string; status: string; note?: string },
    context: any
  ) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    if (!["doctor", "admin", "staff", "cashier"].includes(context.user.role)) {
      throw new Error("Access denied. Required roles: doctor, admin, staff, cashier");
    }

    try {
      return await clinicService.updateQueueStatus(id, status as any, context.user.id, note);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  linkOrderToVisit: async (
    _: any,
    { input }: { input: any },
    context: any
  ) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    if (!["doctor", "admin", "staff", "cashier"].includes(context.user.role)) {
      throw new Error("Access denied. Required roles: doctor, admin, staff, cashier");
    }

    try {
      return await clinicService.linkOrderToVisit(input);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
};
