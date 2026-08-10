"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResourceManager, type ResourceField } from "@/components/ops/ResourceManager"
import { idCardAccessApi, incidentReportsApi, visitorLogsApi } from "@/lib/ops-api"

const visitorLogFields: ResourceField[] = [
  { key: "visitorName", label: "Visitor name", type: "text", required: true },
  { key: "purpose", label: "Purpose", type: "text", required: true },
  { key: "contactNumber", label: "Contact number", type: "text" },
  { key: "hostName", label: "Host name", type: "text" },
  { key: "checkInAt", label: "Check-in", type: "datetime-local" },
  { key: "checkOutAt", label: "Check-out", type: "datetime-local" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "checked-in", label: "Checked in" },
      { value: "checked-out", label: "Checked out" },
      { value: "flagged", label: "Flagged" },
    ],
  },
  { key: "notes", label: "Notes", type: "textarea" },
]

const incidentReportFields: ResourceField[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "description", label: "Description", type: "textarea", required: true },
  {
    key: "severity",
    label: "Severity",
    type: "select",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "critical", label: "Critical" },
    ],
  },
  { key: "location", label: "Location", type: "text", required: true },
  { key: "reportedBy", label: "Reported by", type: "text", required: true },
  { key: "reportedAt", label: "Reported at", type: "datetime-local" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "open", label: "Open" },
      { value: "investigating", label: "Investigating" },
      { value: "resolved", label: "Resolved" },
      { value: "closed", label: "Closed" },
    ],
  },
  { key: "resolvedAt", label: "Resolved at", type: "datetime-local" },
]

const idCardFields: ResourceField[] = [
  { key: "holderName", label: "Holder name", type: "text", required: true },
  {
    key: "holderType",
    label: "Holder type",
    type: "select",
    options: [
      { value: "student", label: "Student" },
      { value: "staff", label: "Staff" },
      { value: "visitor", label: "Visitor" },
    ],
  },
  { key: "cardNumber", label: "Card number", type: "text", required: true },
  { key: "issuedAt", label: "Issued at", type: "datetime-local" },
  { key: "expiresAt", label: "Expires at", type: "datetime-local" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "revoked", label: "Revoked" },
      { value: "expired", label: "Expired" },
    ],
  },
  { key: "notes", label: "Notes", type: "textarea" },
]

export default function SecurityRecordsPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader title="Security Records" description="Visitor logs, incident reports, and ID card access control" />

      <Tabs defaultValue="visitor-logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visitor-logs">Visitor Logs</TabsTrigger>
          <TabsTrigger value="incident-reports">Incident Reports</TabsTrigger>
          <TabsTrigger value="id-card-access">ID Card Access</TabsTrigger>
        </TabsList>

        <TabsContent value="visitor-logs">
          <ResourceManager
            title="Visitor logs"
            description="Front-desk visitor check-in/out records"
            api={visitorLogsApi}
            fields={visitorLogFields}
            titleKey="visitorName"
            statusKey="status"
            metaKeys={["purpose", "hostName", "checkInAt"]}
            emptyLabel="No visitor logs yet."
          />
        </TabsContent>

        <TabsContent value="incident-reports">
          <ResourceManager
            title="Incident reports"
            description="Security incidents and escalations"
            api={incidentReportsApi}
            fields={incidentReportFields}
            titleKey="title"
            statusKey="status"
            metaKeys={["severity", "location", "reportedBy"]}
            emptyLabel="No incident reports yet."
          />
        </TabsContent>

        <TabsContent value="id-card-access">
          <ResourceManager
            title="ID card access"
            description="Identity access control records"
            api={idCardAccessApi}
            fields={idCardFields}
            titleKey="holderName"
            statusKey="status"
            metaKeys={["holderType", "cardNumber", "expiresAt"]}
            emptyLabel="No ID card records yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
