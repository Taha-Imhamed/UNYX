import { apiFetch } from "./api-client"
import type {
  CampusEvent,
  DeviceLog,
  EquipmentRequest,
  HousingAssignment,
  IdCardAccess,
  IncidentReport,
  LibraryBook,
  LibraryLoan,
  MaintenanceRequest,
  MealPlan,
  PayrollEntry,
  Publication,
  ResearchGrant,
  ResearchRequest,
  RoomBooking,
  StaffRecord,
  VisitorLog,
} from "@shared/types"

function createResourceApi<T extends { id: string }>(basePath: string) {
  return {
    list: (signal?: AbortSignal) => apiFetch<T[]>(basePath, { signal }),
    create: (payload: Record<string, unknown>) => apiFetch<T>(basePath, { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: Record<string, unknown>) =>
      apiFetch<T>(`${basePath}/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (id: string) => apiFetch<void>(`${basePath}/${id}`, { method: "DELETE" }),
  }
}

export const visitorLogsApi = createResourceApi<VisitorLog>("/security/visitor-logs")
export const incidentReportsApi = createResourceApi<IncidentReport>("/security/incident-reports")
export const idCardAccessApi = createResourceApi<IdCardAccess>("/security/id-card-access")

export const maintenanceRequestsApi = createResourceApi<MaintenanceRequest>("/facilities/maintenance-requests")
export const equipmentRequestsApi = createResourceApi<EquipmentRequest>("/facilities/equipment-requests")
export const roomBookingsApi = createResourceApi<RoomBooking>("/facilities/room-bookings")

export const researchGrantsApi = createResourceApi<ResearchGrant>("/research-office/research-grants")
export const publicationsApi = createResourceApi<Publication>("/research-office/publications")
export const researchRequestsApi = createResourceApi<ResearchRequest>("/research-office/research-requests")

// Device logs are an append-only audit trail: no create form in the UI (backend still
// accepts POST for system-generated entries) and no edit, only list + delete.
export const deviceLogsApi = {
  list: (signal?: AbortSignal) => apiFetch<DeviceLog[]>("/it-admin/device-logs", { signal }),
  remove: (id: string) => apiFetch<void>(`/it-admin/device-logs/${id}`, { method: "DELETE" }),
}

export const staffApi = createResourceApi<StaffRecord>("/hr/staff")
export const payrollApi = createResourceApi<PayrollEntry>("/hr/payroll")

export const libraryBooksApi = createResourceApi<LibraryBook>("/library/books")
export const libraryLoansApi = createResourceApi<LibraryLoan>("/library/loans")

export const campusEventsApi = createResourceApi<CampusEvent>("/campus/events")
export const housingApi = createResourceApi<HousingAssignment>("/campus/housing")
export const mealPlansApi = createResourceApi<MealPlan>("/campus/meal-plans")
