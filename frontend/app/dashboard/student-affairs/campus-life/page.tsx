"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResourceManager, type ResourceField } from "@/components/ops/ResourceManager"
import { campusEventsApi, housingApi, mealPlansApi } from "@/lib/ops-api"

const eventFields: ResourceField[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "description", label: "Description", type: "text" },
  {
    key: "category",
    label: "Category",
    type: "select",
    options: [
      { value: "academic", label: "Academic" },
      { value: "social", label: "Social" },
      { value: "sports", label: "Sports" },
      { value: "career", label: "Career" },
      { value: "other", label: "Other" },
    ],
  },
  { key: "location", label: "Location", type: "text", required: true },
  { key: "startAt", label: "Start", type: "datetime-local", required: true },
  { key: "endAt", label: "End", type: "datetime-local" },
  { key: "capacity", label: "Capacity", type: "number" },
]

const housingFields: ResourceField[] = [
  { key: "studentId", label: "Student ID", type: "text", required: true },
  { key: "studentName", label: "Student name", type: "text", required: true },
  { key: "buildingName", label: "Building", type: "text", required: true },
  { key: "roomNumber", label: "Room number", type: "text", required: true },
  { key: "bedNumber", label: "Bed number", type: "text" },
  { key: "startDate", label: "Start date", type: "datetime-local", required: true },
  { key: "endDate", label: "End date", type: "datetime-local" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "pending", label: "Pending" },
      { value: "ended", label: "Ended" },
    ],
  },
  { key: "notes", label: "Notes", type: "text" },
]

const mealPlanFields: ResourceField[] = [
  { key: "studentId", label: "Student ID", type: "text", required: true },
  { key: "studentName", label: "Student name", type: "text", required: true },
  { key: "planName", label: "Plan name", type: "text", required: true },
  { key: "balance", label: "Balance", type: "number" },
  { key: "startDate", label: "Start date", type: "datetime-local", required: true },
  { key: "endDate", label: "End date", type: "datetime-local" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
]

export default function CampusLifePage() {
  return (
    <div className="space-y-6">
      <DashboardHeader title="Campus Life" description="Events, housing, and meal plan administration" />

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="housing">Housing</TabsTrigger>
          <TabsTrigger value="meal-plans">Meal Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <ResourceManager
            title="Campus events"
            description="Events students can browse and RSVP to"
            api={campusEventsApi}
            fields={eventFields}
            titleKey="title"
            statusKey="category"
            metaKeys={["location", "startAt", "rsvpCount"]}
            emptyLabel="No events scheduled yet."
          />
        </TabsContent>

        <TabsContent value="housing">
          <ResourceManager
            title="Housing assignments"
            description="Dorm/room assignments per student"
            api={housingApi}
            fields={housingFields}
            titleKey="studentName"
            statusKey="status"
            metaKeys={["buildingName", "roomNumber", "startDate"]}
            emptyLabel="No housing assignments yet."
          />
        </TabsContent>

        <TabsContent value="meal-plans">
          <ResourceManager
            title="Meal plans"
            description="Meal plan enrollment and balances"
            api={mealPlansApi}
            fields={mealPlanFields}
            titleKey="studentName"
            statusKey="status"
            metaKeys={["planName", "balance"]}
            emptyLabel="No meal plans yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
