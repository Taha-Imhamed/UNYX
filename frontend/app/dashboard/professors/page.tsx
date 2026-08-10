"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { DataTable } from "@/components/data-table"
import type { Professor } from "@shared/types"
import { fetchProfessors, createProfessor, updateProfessor, deleteProfessor } from "@/lib/professor-api"
import { createUser } from "@/lib/users-api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, DollarSign } from "lucide-react"
import { useFocusVisibilityRefresh } from "@/hooks/use-focus-visibility-refresh"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function ProfessorsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { version: refreshVersion } = useFocusVisibilityRefresh({ minIntervalMs: 45000 })
  const [professors, setProfessors] = useState<Professor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Professor | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pendingRefresh, setPendingRefresh] = useState(false)
  const hasOpenModal = isAddOpen || isViewOpen || isEditOpen || Boolean(deleteTarget)
  const role = user?.role
  const canManage = role === "admin" || role === "super-admin" || role === "supervisor"
  const canAccess = canManage || role === "professor" || role === "dean"
  const canSeeFinance = role === "admin" || role === "super-admin"
  const totalSalaries = professors.reduce((sum, p) => sum + p.salary, 0)

  useEffect(() => {
    if (authLoading) return
    if (!canAccess) {
      router.push("/dashboard")
    }
  }, [authLoading, canAccess, router])

  useEffect(() => {
    if (hasOpenModal) {
      setPendingRefresh(true)
      return
    }
    const controller = new AbortController()

    const loadProfessors = async () => {
      try {
        const data = await fetchProfessors(controller.signal)
        setProfessors(data)
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Failed to load professors", error)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProfessors()

    return () => {
      controller.abort()
    }
  }, [hasOpenModal, refreshVersion])

  useEffect(() => {
    if (!pendingRefresh || hasOpenModal) return
    const controller = new AbortController()
    const reload = async () => {
      try {
        const data = await fetchProfessors(controller.signal)
        if (!controller.signal.aborted) {
          setProfessors(data)
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Failed to load professors", error)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
          setPendingRefresh(false)
        }
      }
    }
    reload()
    return () => controller.abort()
  }, [hasOpenModal, pendingRefresh])


  const handleAddProfessor = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!canManage) return
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const photoData = (formData.get("photoData") as string) || ""
    const emailValue = ((formData.get("email") as string) || "").trim().toLowerCase()

    const emailTaken = professors.some((p) => p.email.trim().toLowerCase() === emailValue)
    if (emailTaken) {
      toast({ variant: "destructive", title: "Email already in use", description: "Another professor already has this email address." })
      return
    }

    try {
      const username = (formData.get("username") as string) || undefined
      const password = (formData.get("password") as string) || undefined

      // Create a user with an embedded professor profile so backend links them
      await createUser({
        username: username ?? (formData.get("email") as string),
        password: password ?? "",
        email: formData.get("email") as string,
        role: "professor",
        professor: {
          firstName: formData.get("firstName") as string,
          lastName: formData.get("lastName") as string,
          email: formData.get("email") as string,
          phone: formData.get("phone") as string,
          photo: photoData || "/placeholder-user.jpg",
          department: formData.get("department") as string,
          salary: Number(formData.get("salary")) || 0,
          hireDate: formData.get("hireDate") as string,
          specialization: formData.get("specialization") as string,
          status: formData.get("status") as Professor["status"],
        },
      })

      // Refresh the professors list to include the newly created profile
      const refreshed = await fetchProfessors()
      setProfessors(refreshed)
      setIsAddOpen(false)
    } catch (error) {
      console.error("Failed to add professor (create user)", error)
      toast({
        variant: "destructive",
        title: "Failed to add professor",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    }
  }

  const handleEditProfessor = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!canManage) return
    e.preventDefault()
    if (!selectedProfessor) return
    const formData = new FormData(e.currentTarget)
    const photoData = (formData.get("photoData") as string) || selectedProfessor.photo
    const emailValue = ((formData.get("email") as string) || "").trim().toLowerCase()

    const emailTaken = professors.some(
      (p) => p.id !== selectedProfessor.id && p.email.trim().toLowerCase() === emailValue,
    )
    if (emailTaken) {
      toast({ variant: "destructive", title: "Email already in use", description: "Another professor already has this email address." })
      return
    }

    try {
      const updated = await updateProfessor(selectedProfessor.id, {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        photo: photoData || "/placeholder-user.jpg",
        department: formData.get("department") as string,
        salary: Number(formData.get("salary")),
        specialization: formData.get("specialization") as string,
        status: formData.get("status") as Professor["status"],
      })
      setProfessors((prev) => prev.map((p) => (p.id === selectedProfessor.id ? updated : p)))
      setIsEditOpen(false)
      setSelectedProfessor(null)
    } catch (error) {
      console.error("Failed to update professor", error)
      toast({
        variant: "destructive",
        title: "Failed to update professor",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    }
  }

  const handleDeleteProfessor = async () => {
    if (!canManage || !deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteProfessor(deleteTarget.id)
      setProfessors((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast({ title: "Professor deleted", description: `${deleteTarget.firstName} ${deleteTarget.lastName} has been removed.` })
      setDeleteTarget(null)
    } catch (error) {
      console.error("Failed to delete professor", error)
      toast({
        variant: "destructive",
        title: "Failed to delete professor",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const baseColumns = [
    {
      key: "photo",
      header: "Professor",
      render: (professor: Professor) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage
              src={professor.photo || "/placeholder.svg"}
              alt={`${professor.firstName} ${professor.lastName}`}
            />
            <AvatarFallback>
              {professor.firstName[0]}
              {professor.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">
              {professor.firstName} {professor.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{professor.id}</p>
          </div>
        </div>
      ),
    },
    { key: "department", header: "Department" },
    { key: "specialization", header: "Specialization" },
    ...(canSeeFinance
      ? [
          {
            key: "salary",
            header: "Salary",
            render: (professor: Professor) => (
              <span className="font-medium text-foreground">${professor.salary.toLocaleString()}</span>
            ),
          },
        ]
      : []),
    {
      key: "hireDate",
      header: "Hire Date",
      render: (professor: Professor) => (
        <span className="text-foreground">{new Date(professor.hireDate).toLocaleDateString()}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (professor: Professor) => (
        <Badge
          variant={
            professor.status === "active" ? "default" : professor.status === "on-leave" ? "secondary" : "outline"
          }
        >
          {professor.status}
        </Badge>
      ),
    },
  ]
  const columns = baseColumns

  const ProfessorForm: React.FC<{
    professor?: Professor | null
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    submitLabel: string
  }> = ({ professor, onSubmit, submitLabel }) => {
    const [preview, setPreview] = useState<string>(professor?.photo ?? "")
    const [fileName, setFileName] = useState<string>("")
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
      setPreview(professor?.photo ?? "")
      setFileName("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }, [professor])

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) {
        setPreview(professor?.photo ?? "")
        setFileName("")
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPreview(reader.result)
        }
      }
      reader.readAsDataURL(file)
      setFileName(file.name)
    }

    const handleRemovePhoto = () => {
      setPreview("")
      setFileName("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }

    const initials = professor ? `${professor.firstName[0]}${professor.lastName[0]}` : "NA"

    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Profile Photo</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={preview || "/placeholder-user.jpg"} alt="Professor avatar preview" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Input
                ref={fileInputRef}
                name="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="bg-secondary border-border"
              />
              <Input type="hidden" name="photoData" value={preview} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{fileName || "Upload JPG or PNG under 2MB."}</span>
                {preview && (
                  <button type="button" onClick={handleRemovePhoto} className="text-primary hover:underline">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              defaultValue={professor?.firstName}
              className="bg-secondary border-border"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              defaultValue={professor?.lastName}
              className="bg-secondary border-border"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={professor?.email}
              className="bg-secondary border-border"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={professor?.phone}
              className="bg-secondary border-border"
              required
            />
          </div>
        </div>
        {!professor && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" placeholder="e.g. dr.mira" className="bg-secondary border-border" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Temporary password" className="bg-secondary border-border" required />
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select name="department" defaultValue={professor?.department || "Computer Science"}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Business Administration">Business Administration</SelectItem>
                <SelectItem value="Data Science">Data Science</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Psychology">Psychology</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              name="specialization"
              defaultValue={professor?.specialization}
              className="bg-secondary border-border"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {canSeeFinance && (
            <div className="space-y-2">
              <Label htmlFor="salary">Annual Salary ($)</Label>
              <Input
                id="salary"
                name="salary"
                type="number"
                min={0}
                max={10000000}
                step="0.01"
                defaultValue={professor?.salary}
                className="bg-secondary border-border"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={professor?.status || "active"}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-leave">On Leave</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {!professor && (
          <div className="space-y-2">
            <Label htmlFor="hireDate">Hire Date</Label>
            <Input id="hireDate" name="hireDate" type="date" className="bg-secondary border-border" required />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Professors" description="Faculty directory, assignments, and lifecycle management." />

      <div className="flex-1 p-4 space-y-4">
        <div className={`flex items-center ${canManage ? "justify-between" : "justify-start"} gap-4`}>
          <div className="flex items-center gap-4">
            <Card className="bg-card border-border px-4 py-2">
              <p className="text-sm text-muted-foreground">Total Faculty</p>
              <p className="text-2xl font-bold text-foreground">{professors.length}</p>
            </Card>
            <Card className="bg-card border-border px-4 py-2">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-primary">
                {professors.filter((p) => p.status === "active").length}
              </p>
            </Card>
            {canSeeFinance && (
              <Card className="bg-card border-border px-4 py-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Total Salaries</p>
                </div>
                <p className="text-2xl font-bold text-foreground">${totalSalaries.toLocaleString()}</p>
              </Card>
            )}
          </div>
          {canManage && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Professor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Professor</DialogTitle>
                  <DialogDescription>Enter the faculty member details below to create a new record.</DialogDescription>
                </DialogHeader>
                <ProfessorForm onSubmit={handleAddProfessor} submitLabel="Add Professor" />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>All Professors</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={professors}
              columns={columns}
              searchPlaceholder="Search professors..."
              searchKeys={["firstName", "lastName", "email", "department", "specialization", "status", "id", "phone"]}
              filterKey="status"
              filterOptions={[
                { value: "active", label: "Active" },
                { value: "on-leave", label: "On Leave" },
                { value: "retired", label: "Retired" },
              ]}
              filterPlaceholder="Status"
              actions={(professor) =>
                canManage ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_8px_24px_rgba(228,196,92,0.28)]"
                        style={{ ["--btn-glow-color" as string]: "var(--accent)" }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedProfessor(professor)
                          setIsViewOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedProfessor(professor)
                          setIsEditOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(professor)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProfessor(professor)
                      setIsViewOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Professor Details</DialogTitle>
          </DialogHeader>
          {selectedProfessor && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={selectedProfessor.photo || "/placeholder.svg"}
                    alt={`${selectedProfessor.firstName} ${selectedProfessor.lastName}`}
                  />
                  <AvatarFallback className="text-lg">
                    {selectedProfessor.firstName[0]}
                    {selectedProfessor.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedProfessor.firstName} {selectedProfessor.lastName}
                  </h3>
                  <p className="text-muted-foreground">{selectedProfessor.id}</p>
                  <Badge
                    variant={
                      selectedProfessor.status === "active"
                        ? "default"
                        : selectedProfessor.status === "on-leave"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {selectedProfessor.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="text-foreground">{selectedProfessor.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="text-foreground">{selectedProfessor.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="text-foreground">{selectedProfessor.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Specialization</p>
                  <p className="text-foreground">{selectedProfessor.specialization}</p>
                </div>
                {canSeeFinance && (
                  <div>
                    <p className="text-muted-foreground">Annual Salary</p>
                    <p className="text-foreground font-semibold">${selectedProfessor.salary.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Hire Date</p>
                  <p className="text-foreground">{new Date(selectedProfessor.hireDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Professor</DialogTitle>
            <DialogDescription>Update the faculty member information below.</DialogDescription>
          </DialogHeader>
          <ProfessorForm professor={selectedProfessor} onSubmit={handleEditProfessor} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Professor</DialogTitle>
            <DialogDescription>
              This will permanently remove {deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}` : "this professor"} from
              the faculty directory. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProfessor} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Professor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
