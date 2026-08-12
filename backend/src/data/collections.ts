import type { CollectionLike } from '../db/postgres.js'
import { getCollection, runDbQuery } from '../db/postgres.js'
import type {
  Student,
  Professor,
  Income,
  Expense,
  Feedback,
  NewsItem,
  Enrollment,
  PaymentTransaction,
  Course,
  Coupon,
  Question,
  SiteContent,
  VisitorLog,
  IncidentReport,
  IdCardAccess,
  MaintenanceRequest,
  EquipmentRequest,
  RoomBooking,
  ResearchGrant,
  Publication,
  ResearchRequest,
  SsoConfig,
  Integration,
  MaintenanceState,
  ModuleToggleState,
  DeviceLog,
  EnrollmentOverride,
  TransferCredit,
  TranscriptRequest,
  GraduationApproval,
  ScholarshipAward,
  InterviewSchedule,
  OfferLetter,
  AiConversation,
  AiMessage,
  AiPendingAction,
} from '../../../shared/types/index.js'

export async function studentsCollection(): Promise<CollectionLike<Student>> {
  return getCollection<Student>('students')
}

export async function professorsCollection(): Promise<CollectionLike<Professor>> {
  return getCollection<Professor>('professors')
}

export async function incomeCollection(): Promise<CollectionLike<Income>> {
  return getCollection<Income>('income')
}

export async function expensesCollection(): Promise<CollectionLike<Expense>> {
  return getCollection<Expense>('expenses')
}

export async function feedbackCollection(): Promise<CollectionLike<Feedback>> {
  return getCollection<Feedback>('feedback')
}

export async function newsCollection(): Promise<CollectionLike<NewsItem>> {
  return getCollection<NewsItem>('news')
}

export async function enrollmentsCollection(): Promise<CollectionLike<Enrollment>> {
  return getCollection<Enrollment>('enrollments')
}

export async function paymentsCollection(): Promise<CollectionLike<PaymentTransaction>> {
  return getCollection<PaymentTransaction>('payments')
}

export async function coursesCollection(): Promise<CollectionLike<Course>> {
  return getCollection<Course>('courses')
}

export async function couponsCollection(): Promise<CollectionLike<Coupon>> {
  return getCollection<Coupon>('coupons')
}

export async function questionsCollection(): Promise<CollectionLike<Question>> {
  return getCollection<Question>('questions')
}

export async function siteContentCollection(): Promise<CollectionLike<SiteContent>> {
  return getCollection<SiteContent>('site_content')
}

export async function visitorLogsCollection(): Promise<CollectionLike<VisitorLog>> {
  return getCollection<VisitorLog>('visitor_logs')
}

export async function incidentReportsCollection(): Promise<CollectionLike<IncidentReport>> {
  return getCollection<IncidentReport>('incident_reports')
}

export async function idCardAccessCollection(): Promise<CollectionLike<IdCardAccess>> {
  return getCollection<IdCardAccess>('id_card_access')
}

export async function maintenanceRequestsCollection(): Promise<CollectionLike<MaintenanceRequest>> {
  return getCollection<MaintenanceRequest>('maintenance_requests')
}

export async function equipmentRequestsCollection(): Promise<CollectionLike<EquipmentRequest>> {
  return getCollection<EquipmentRequest>('equipment_requests')
}

export async function roomBookingsCollection(): Promise<CollectionLike<RoomBooking>> {
  return getCollection<RoomBooking>('room_bookings')
}

export async function researchGrantsCollection(): Promise<CollectionLike<ResearchGrant>> {
  return getCollection<ResearchGrant>('research_grants')
}

export async function publicationsCollection(): Promise<CollectionLike<Publication>> {
  return getCollection<Publication>('publications')
}

export async function researchRequestsCollection(): Promise<CollectionLike<ResearchRequest>> {
  return getCollection<ResearchRequest>('research_requests')
}

export async function ssoConfigCollection(): Promise<CollectionLike<SsoConfig>> {
  return getCollection<SsoConfig>('sso_config')
}

export async function integrationsCollection(): Promise<CollectionLike<Integration>> {
  return getCollection<Integration>('integrations')
}

export async function maintenanceStateCollection(): Promise<CollectionLike<MaintenanceState>> {
  return getCollection<MaintenanceState>('maintenance_state')
}

export async function moduleTogglesCollection(): Promise<CollectionLike<ModuleToggleState>> {
  return getCollection<ModuleToggleState>('module_toggles')
}

export async function deviceLogsCollection(): Promise<CollectionLike<DeviceLog>> {
  return getCollection<DeviceLog>('device_logs')
}

export async function enrollmentOverridesCollection(): Promise<CollectionLike<EnrollmentOverride>> {
  return getCollection<EnrollmentOverride>('enrollment_overrides')
}

export async function transferCreditsCollection(): Promise<CollectionLike<TransferCredit>> {
  return getCollection<TransferCredit>('transfer_credits')
}

export async function transcriptRequestsCollection(): Promise<CollectionLike<TranscriptRequest>> {
  return getCollection<TranscriptRequest>('transcript_requests')
}

export async function graduationApprovalsCollection(): Promise<CollectionLike<GraduationApproval>> {
  return getCollection<GraduationApproval>('graduation_approvals')
}

export async function scholarshipAwardsCollection(): Promise<CollectionLike<ScholarshipAward>> {
  return getCollection<ScholarshipAward>('scholarship_awards')
}

export async function interviewSchedulesCollection(): Promise<CollectionLike<InterviewSchedule>> {
  return getCollection<InterviewSchedule>('interview_schedules')
}

export async function offerLettersCollection(): Promise<CollectionLike<OfferLetter>> {
  return getCollection<OfferLetter>('offer_letters')
}

let aiAssistantStorageReady = false

// Lazily creates the AI assistant's tables on first use, same pattern as
// ensureAcademicComplianceStorage in lib/academic-compliance.ts.
async function ensureAiAssistantStorage() {
  if (aiAssistantStorageReady) return

  await runDbQuery(`
    create table if not exists public.ai_conversations (
      id text primary key,
      user_id text not null,
      user_role text not null,
      title text null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)

  await runDbQuery(`
    create table if not exists public.ai_messages (
      id text primary key,
      conversation_id text not null,
      role text not null,
      content text not null,
      tool_calls jsonb null,
      created_at timestamptz not null default now()
    )
  `)

  await runDbQuery(`
    create table if not exists public.ai_pending_actions (
      id text primary key,
      conversation_id text not null,
      tool_name text not null,
      input jsonb not null default '{}'::jsonb,
      status text not null default 'pending',
      created_by text not null,
      created_at timestamptz not null default now(),
      executed_at timestamptz null,
      result_summary text null,
      result_entity_id text null
    )
  `)

  await runDbQuery(`create index if not exists idx_ai_conversations_user_id on public.ai_conversations (user_id, updated_at desc)`)
  await runDbQuery(`create index if not exists idx_ai_messages_conversation_id on public.ai_messages (conversation_id, created_at asc)`)
  await runDbQuery(`create index if not exists idx_ai_pending_actions_conversation_id on public.ai_pending_actions (conversation_id, created_at desc)`)

  aiAssistantStorageReady = true
}

export async function aiConversationsCollection(): Promise<CollectionLike<AiConversation>> {
  await ensureAiAssistantStorage()
  return getCollection<AiConversation>('ai_conversations')
}

export async function aiMessagesCollection(): Promise<CollectionLike<AiMessage>> {
  await ensureAiAssistantStorage()
  return getCollection<AiMessage>('ai_messages')
}

export async function aiPendingActionsCollection(): Promise<CollectionLike<AiPendingAction>> {
  await ensureAiAssistantStorage()
  return getCollection<AiPendingAction>('ai_pending_actions')
}
