"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResourceManager, type ResourceField } from "@/components/ops/ResourceManager"
import { libraryBooksApi, libraryLoansApi } from "@/lib/ops-api"

const bookFields: ResourceField[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "author", label: "Author", type: "text", required: true },
  { key: "isbn", label: "ISBN", type: "text" },
  { key: "category", label: "Category", type: "text" },
  { key: "totalCopies", label: "Total copies", type: "number" },
]

const loanFields: ResourceField[] = [
  { key: "bookId", label: "Book ID", type: "text", required: true },
  { key: "borrowerName", label: "Borrower name", type: "text", required: true },
  {
    key: "borrowerType",
    label: "Borrower type",
    type: "select",
    options: [
      { value: "student", label: "Student" },
      { value: "staff", label: "Staff" },
    ],
  },
  { key: "dueAt", label: "Due date", type: "datetime-local", required: true },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "borrowed", label: "Borrowed" },
      { value: "returned", label: "Returned" },
      { value: "overdue", label: "Overdue" },
    ],
  },
]

export default function LibraryRecordsPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader title="Library Records" description="Book catalog and loan tracking" />

      <Tabs defaultValue="books" className="space-y-4">
        <TabsList>
          <TabsTrigger value="books">Book Catalog</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
        </TabsList>

        <TabsContent value="books">
          <ResourceManager
            title="Book catalog"
            description="Library inventory"
            api={libraryBooksApi}
            fields={bookFields}
            titleKey="title"
            metaKeys={["author", "category", "availableCopies"]}
            emptyLabel="No books in the catalog yet."
          />
        </TabsContent>

        <TabsContent value="loans">
          <ResourceManager
            title="Loans"
            description="Borrow/return tracking. Creating a loan decrements the book's available copies; marking it Returned restores it."
            api={libraryLoansApi}
            fields={loanFields}
            titleKey="bookTitle"
            statusKey="status"
            metaKeys={["borrowerName", "borrowerType", "dueAt"]}
            emptyLabel="No loans yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
