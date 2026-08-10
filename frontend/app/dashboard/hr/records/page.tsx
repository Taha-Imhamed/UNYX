"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResourceManager, type ResourceField } from "@/components/ops/ResourceManager"
import { payrollApi, staffApi } from "@/lib/ops-api"

const staffFields: ResourceField[] = [
  { key: "firstName", label: "First name", type: "text", required: true },
  { key: "lastName", label: "Last name", type: "text", required: true },
  { key: "email", label: "Email", type: "text", required: true },
  { key: "department", label: "Department", type: "text" },
  { key: "position", label: "Position", type: "text" },
  {
    key: "employmentStatus",
    label: "Employment status",
    type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "on-leave", label: "On leave" },
      { value: "terminated", label: "Terminated" },
    ],
  },
  { key: "hireDate", label: "Hire date", type: "datetime-local" },
  { key: "salary", label: "Salary", type: "number" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "notes", label: "Notes", type: "textarea" },
]

const payrollFields: ResourceField[] = [
  { key: "staffId", label: "Staff ID", type: "text", required: true },
  { key: "staffName", label: "Staff name", type: "text", required: true },
  { key: "payPeriod", label: "Pay period (e.g. 2026-08)", type: "text", required: true },
  { key: "amount", label: "Amount", type: "number", required: true },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "pending", label: "Pending" },
      { value: "paid", label: "Paid" },
    ],
  },
  { key: "notes", label: "Notes", type: "textarea" },
]

export default function HrRecordsPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader title="HR Records" description="Staff records and payroll" />

      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList>
          <TabsTrigger value="staff">Staff Records</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <ResourceManager
            title="Staff records"
            description="Employee records"
            api={staffApi}
            fields={staffFields}
            titleKey="lastName"
            statusKey="employmentStatus"
            metaKeys={["firstName", "department", "position"]}
            emptyLabel="No staff records yet."
          />
        </TabsContent>

        <TabsContent value="payroll">
          <ResourceManager
            title="Payroll"
            description="Pay period entries"
            api={payrollApi}
            fields={payrollFields}
            titleKey="staffName"
            statusKey="status"
            metaKeys={["payPeriod", "amount"]}
            emptyLabel="No payroll entries yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
