"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResourceManager, type ResourceField } from "@/components/ops/ResourceManager"
import { publicationsApi, researchGrantsApi, researchRequestsApi } from "@/lib/ops-api"

const grantFields: ResourceField[] = [
  { key: "projectTitle", label: "Project title", type: "text", required: true },
  { key: "principalInvestigator", label: "Principal investigator", type: "text", required: true },
  { key: "amount", label: "Amount", type: "number" },
  { key: "sponsor", label: "Sponsor", type: "text", required: true },
  { key: "submittedAt", label: "Submitted at", type: "datetime-local" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "draft", label: "Draft" },
      { value: "submitted", label: "Submitted" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
      { value: "funded", label: "Funded" },
    ],
  },
  { key: "summary", label: "Summary", type: "textarea" },
]

const publicationFields: ResourceField[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "authors", label: "Authors (comma separated)", type: "string-array", required: true },
  { key: "journal", label: "Journal", type: "text" },
  { key: "publishedAt", label: "Published at", type: "datetime-local" },
  { key: "doi", label: "DOI", type: "text" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "draft", label: "Draft" },
      { value: "submitted", label: "Submitted" },
      { value: "published", label: "Published" },
    ],
  },
  { key: "abstract", label: "Abstract", type: "textarea" },
]

const researchRequestFields: ResourceField[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "requester", label: "Requester", type: "text", required: true },
  { key: "requestedAt", label: "Requested at", type: "datetime-local" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "open", label: "Open" },
      { value: "in-review", label: "In review" },
      { value: "approved", label: "Approved" },
      { value: "closed", label: "Closed" },
    ],
  },
  { key: "department", label: "Department", type: "text" },
  { key: "notes", label: "Notes", type: "textarea" },
]

export default function ResearchOfficeRecordsPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader title="Research Office Records" description="Grants, publications, and research request tracking" />

      <Tabs defaultValue="grants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grants">Research Grants</TabsTrigger>
          <TabsTrigger value="publications">Publications</TabsTrigger>
          <TabsTrigger value="requests">Research Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="grants">
          <ResourceManager
            title="Research grants"
            description="Grant-related workflows"
            api={researchGrantsApi}
            fields={grantFields}
            titleKey="projectTitle"
            statusKey="status"
            metaKeys={["principalInvestigator", "sponsor", "amount"]}
            emptyLabel="No research grants yet."
          />
        </TabsContent>

        <TabsContent value="publications">
          <ResourceManager
            title="Publications"
            description="Publication and research output tracking"
            api={publicationsApi}
            fields={publicationFields}
            titleKey="title"
            statusKey="status"
            metaKeys={["authors", "journal", "publishedAt"]}
            emptyLabel="No publications yet."
          />
        </TabsContent>

        <TabsContent value="requests">
          <ResourceManager
            title="Research requests"
            description="Research request approval queue"
            api={researchRequestsApi}
            fields={researchRequestFields}
            titleKey="title"
            statusKey="status"
            metaKeys={["requester", "department", "requestedAt"]}
            emptyLabel="No research requests yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
