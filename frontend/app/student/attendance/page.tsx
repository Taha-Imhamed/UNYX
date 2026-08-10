"use client"

import { useMemo } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useStudentEnrollments } from "@/hooks/use-student-portal"
import { StudentFeatureGate } from "@/components/student-feature-gate"

export default function StudentMyCoursesPage() {
	return (
		<StudentFeatureGate featureKey="attendance">
			<StudentMyCoursesPageInner />
		</StudentFeatureGate>
	)
}

function StudentMyCoursesPageInner() {
	const { enrollments, isLoading, error } = useStudentEnrollments()

	const activeCourses = useMemo(
		() => enrollments.filter((enrollment) => enrollment.status === "active"),
		[enrollments],
	)

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between flex-wrap gap-3">
				<div>
					<p className="text-sm text-muted-foreground">My Courses</p>
					<h1 className="text-2xl font-bold text-foreground">Active courses</h1>
					<p className="text-sm text-muted-foreground">These are the courses currently active for your student account.</p>
				</div>
				<Badge variant="outline" className="border-border text-foreground">{activeCourses.length} active</Badge>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertTitle>Unable to load courses</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{isLoading && activeCourses.length === 0 ? (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Spinner className="h-4 w-4" /> Loading active courses
				</div>
			) : activeCourses.length === 0 ? (
				<Card className="border border-border bg-card">
					<CardContent className="py-5 text-sm text-muted-foreground">You do not have any active courses right now.</CardContent>
				</Card>
			) : (
				<Card className="border border-border bg-card">
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead className="bg-muted/60 text-muted-foreground text-xs uppercase tracking-[0.08em]">
									<tr>
										<th className="px-4 py-3 text-left font-semibold text-foreground">Course</th>
										<th className="px-4 py-3 text-left font-semibold text-foreground">Course Code</th>
										<th className="px-4 py-3 text-left font-semibold text-foreground">Professor</th>
										<th className="px-4 py-3 text-left font-semibold text-foreground">Dates</th>
									</tr>
								</thead>
								<tbody>
									{activeCourses.map((enrollment) => (
										<tr key={enrollment.id} className="border-t border-border/60 hover:bg-secondary/30">
											<td className="px-4 py-3 text-foreground font-medium">{enrollment.courseTitle}</td>
											<td className="px-4 py-3 text-foreground">
												{enrollment.courseCode ?? enrollment.displayId ?? enrollment.courseId}
											</td>
											<td className="px-4 py-3 text-foreground">{enrollment.professorName || "-"}</td>
											<td className="px-4 py-3 text-foreground">
												{new Date(enrollment.startDate).toLocaleDateString()} - {new Date(enrollment.endDate).toLocaleDateString()}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
