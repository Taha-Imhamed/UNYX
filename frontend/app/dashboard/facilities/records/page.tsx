"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResourceManager, type ResourceField } from "@/components/ops/ResourceManager"
import { equipmentRequestsApi, maintenanceRequestsApi, roomBookingsApi } from "@/lib/ops-api"

const maintenanceFields: ResourceField[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "description", label: "Description", type: "textarea", required: true },
  { key: "category", label: "Category", type: "text", required: true },
  { key: "location", label: "Location", type: "text", required: true },
  { key: "requestedBy", label: "Requested by", type: "text", required: true },
  { key: "requestedAt", label: "Requested at", type: "datetime-local" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "open", label: "Open" },
      { value: "in-progress", label: "In progress" },
      { value: "on-hold", label: "On hold" },
      { value: "completed", label: "Completed" },
    ],
  },
  {
    key: "priority",
    label: "Priority",
    type: "select",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "critical", label: "Critical" },
    ],
  },
  { key: "assignedTo", label: "Assigned to", type: "text" },
  { key: "completedAt", label: "Completed at", type: "datetime-local" },
]

const equipmentFields: ResourceField[] = [
  { key: "itemName", label: "Item name", type: "text", required: true },
  { key: "quantity", label: "Quantity", type: "number" },
  { key: "requestedBy", label: "Requested by", type: "text", required: true },
  { key: "requestedAt", label: "Requested at", type: "datetime-local" },
  { key: "location", label: "Location", type: "text", required: true },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "pending", label: "Pending" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
      { value: "fulfilled", label: "Fulfilled" },
    ],
  },
  { key: "notes", label: "Notes", type: "textarea" },
]

const roomBookingFields: ResourceField[] = [
  { key: "roomName", label: "Room name", type: "text", required: true },
  { key: "bookedBy", label: "Booked by", type: "text", required: true },
  { key: "purpose", label: "Purpose", type: "text", required: true },
  { key: "startAt", label: "Start", type: "datetime-local", required: true },
  { key: "endAt", label: "End", type: "datetime-local", required: true },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "requested", label: "Requested" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  { key: "notes", label: "Notes", type: "textarea" },
]

export default function FacilitiesRecordsPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader title="Facilities Records" description="Maintenance requests, equipment requests, and room bookings" />

      <Tabs defaultValue="maintenance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="room-bookings">Room Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance">
          <ResourceManager
            title="Maintenance requests"
            description="Classroom and facility maintenance workload"
            api={maintenanceRequestsApi}
            fields={maintenanceFields}
            titleKey="title"
            statusKey="status"
            metaKeys={["category", "location", "priority"]}
            emptyLabel="No maintenance requests yet."
          />
        </TabsContent>

        <TabsContent value="equipment">
          <ResourceManager
            title="Equipment requests"
            description="Equipment provisioning requests"
            api={equipmentRequestsApi}
            fields={equipmentFields}
            titleKey="itemName"
            statusKey="status"
            metaKeys={["quantity", "location", "requestedBy"]}
            emptyLabel="No equipment requests yet."
          />
        </TabsContent>

        <TabsContent value="room-bookings">
          <ResourceManager
            title="Room bookings"
            description="Room reservation demand across campus"
            api={roomBookingsApi}
            fields={roomBookingFields}
            titleKey="roomName"
            statusKey="status"
            metaKeys={["purpose", "bookedBy", "startAt"]}
            emptyLabel="No room bookings yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
