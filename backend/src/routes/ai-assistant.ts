import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { aiConversationsCollection, aiMessagesCollection, aiPendingActionsCollection } from '../data/collections.js'
import { writeAuditLog } from '../lib/academic-compliance.js'
import { AI_TOOL_DEFINITIONS, canUseAiTools, executeAiTool, AiToolValidationError, AiToolPermissionError } from '../lib/ai-tools.js'
import { createRateLimiter } from '../middleware/rate-limit.js'
import { logger } from '../lib/logger.js'
import type { AiMessage, AiPendingAction, AiToolCallSummary } from '../../../shared/types/index.js'

export const aiAssistantRoutes: ReturnType<typeof Router> = Router()

const MODEL = process.env.AI_ASSISTANT_MODEL || 'gemini-2.5-flash'
const GEMINI_API_URL = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
const MAX_TOKENS = 2048
const DAILY_MESSAGE_LIMIT = 100

const chatRequestSchema = z.object({
  conversationId: z.string().trim().optional(),
  message: z.string().trim().min(1).max(4000),
})

// Simple per-user daily cap, checked against ai_messages row counts rather than an
// in-memory limiter, since it needs to survive process restarts. Coarse (v1) — see
// plan's "deferred" section for real cost dashboards.
const rateLimitChat = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: DAILY_MESSAGE_LIMIT,
  message: 'Daily assistant message limit reached. Please try again tomorrow.',
  label: 'ai-assistant-chat',
  keyGenerator: (req) => req.auth?.userId || req.ip || req.socket.remoteAddress || 'unknown',
})

// Normalized shape both the rest of this route and confirm/cancel work off — provider-
// agnostic so swapping the model vendor only touches callGemini() and this mapping.
interface NormalizedContentBlock {
  type: 'text' | 'tool_use'
  text?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
}

interface NormalizedModelResponse {
  content: NormalizedContentBlock[]
}

interface GeminiPart {
  text?: string
  functionCall?: { name: string; args?: Record<string, unknown> }
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>
  promptFeedback?: { blockReason?: string }
}

function buildSystemPrompt(isAdminTier: boolean): string {
  const base = `You are Kino, the in-app AI assistant for the UNYT school management system. UNYT has roles including admin, super-admin, dean, hod, registrar, admissions, finance, professor, advisor, and student, each with their own dashboard covering students, courses, enrollment, finance, and reporting. Answer questions about how the system works and how to accomplish tasks in it. If asked your name, say you're Kino.

The full conversation so far — every message the user and you have exchanged in this chat — is included below as your conversation history. Actually read and use it: if the user told you something earlier in this conversation (a name, a preference, a detail about their task), remember it and use it naturally, the same way a person would in an ongoing conversation. This is a private, already-authenticated in-app chat with a logged-in staff member, not a public data-collection form — do not deflect with generic "I don't store personal information" disclaimers when the answer to a question is plainly visible earlier in this same conversation. Only say you don't know something if it genuinely was never mentioned in this conversation.`

  if (isAdminTier) {
    return `${base}

You have access to tools that can perform real actions on the system (creating users, students, professors, and courses). When asked to do something like "create a user", gather the required fields — ask follow-up questions if any are missing or ambiguous — then call the appropriate tool. Calling a tool does NOT execute it immediately: the admin will see a confirmation card with the details you extracted and must explicitly approve it before anything is created. Never claim an action has been completed in your reply text — only a confirmed, executed tool result (which will appear in the conversation history as a tool_result message) means something actually happened.`
  }

  return `${base}

You do NOT have the ability to perform any actions in this system — you cannot create, edit, or delete anything. If asked to do something, explain clearly how the user can do it themselves (which page, which button/section), or tell them which role/person to ask. Never claim to have performed an action.`
}

function toolDefinitionsForAuth(isAdminTier: boolean) {
  return isAdminTier ? AI_TOOL_DEFINITIONS : []
}

function toGeminiFunctionDeclarations(tools: typeof AI_TOOL_DEFINITIONS) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.input_schema,
  }))
}

async function callGemini(params: {
  systemPrompt: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  tools: typeof AI_TOOL_DEFINITIONS
}): Promise<NormalizedModelResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('AI_ASSISTANT_NOT_CONFIGURED')
  }

  const body: Record<string, unknown> = {
    system_instruction: { parts: [{ text: params.systemPrompt }] },
    contents: params.history.map((entry) => ({
      role: entry.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: entry.content }],
    })),
    generationConfig: { maxOutputTokens: MAX_TOKENS },
  }
  if (params.tools.length > 0) {
    body.tools = [{ function_declarations: toGeminiFunctionDeclarations(params.tools) }]
  }

  const response = await fetch(`${GEMINI_API_URL(MODEL)}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    logger.error({ status: response.status, errText }, '[ai-assistant] Gemini API call failed')
    throw new Error('AI_UPSTREAM_ERROR')
  }

  const json = (await response.json()) as GeminiResponse
  const parts = json.candidates?.[0]?.content?.parts ?? []
  const content: NormalizedContentBlock[] = parts.map((part) => {
    if (part.functionCall) {
      return { type: 'tool_use', id: `call-${randomUUID().slice(0, 8)}`, name: part.functionCall.name, input: part.functionCall.args ?? {} }
    }
    return { type: 'text', text: part.text ?? '' }
  })

  if (content.length === 0 && json.promptFeedback?.blockReason) {
    logger.warn({ blockReason: json.promptFeedback.blockReason }, '[ai-assistant] Gemini blocked the response')
  }

  return { content }
}

function toHistoryMessage(message: AiMessage): { role: 'user' | 'assistant'; content: string } | null {
  // tool_result rows are surfaced to the model as an assistant-authored note (Gemini
  // has no notion of our custom 'tool_result' role) so the next turn has accurate
  // context about what was actually executed, without re-triggering a real function call.
  if (message.role === 'user') return { role: 'user', content: message.content }
  if (message.role === 'assistant') return { role: 'assistant', content: message.content }
  if (message.role === 'tool_result') return { role: 'assistant', content: `[System: ${message.content}]` }
  return null
}

aiAssistantRoutes.post('/chat', rateLimitChat, async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, error: 'AI assistant is not configured' })
    }

    const parsed = chatRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' })
    }
    if (!req.auth) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }

    const isAdminTier = canUseAiTools(req.auth)
    const conversationsCol = await aiConversationsCollection()
    const messagesCol = await aiMessagesCollection()

    let conversationId = parsed.data.conversationId
    if (conversationId) {
      const existing = await conversationsCol.findOne({ id: conversationId })
      if (!existing || existing.userId !== req.auth.userId) {
        return res.status(404).json({ success: false, error: 'Conversation not found' })
      }
    } else {
      conversationId = `AIC-${randomUUID().slice(0, 8).toUpperCase()}`
      const now = new Date().toISOString()
      await conversationsCol.insertOne({
        id: conversationId,
        userId: req.auth.userId,
        userRole: req.auth.role,
        title: parsed.data.message.slice(0, 60),
        createdAt: now,
        updatedAt: now,
      })
    }

    const priorMessages = await messagesCol.find({ conversationId }).sort({ createdAt: 1 }).toArray()

    const userMessageRow: AiMessage = {
      id: `AIM-${randomUUID().slice(0, 8).toUpperCase()}`,
      conversationId,
      role: 'user',
      content: parsed.data.message,
      createdAt: new Date().toISOString(),
    }
    await messagesCol.insertOne(userMessageRow)

    const history = [...priorMessages, userMessageRow]
      .map(toHistoryMessage)
      .filter((entry): entry is { role: 'user' | 'assistant'; content: string } => entry !== null)

    let modelResponse: NormalizedModelResponse
    try {
      modelResponse = await callGemini({
        systemPrompt: buildSystemPrompt(isAdminTier),
        history,
        tools: toolDefinitionsForAuth(isAdminTier),
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'AI_ASSISTANT_NOT_CONFIGURED') {
        return res.status(503).json({ success: false, error: 'AI assistant is not configured' })
      }
      logger.error({ err: error }, '[ai-assistant] chat call failed')
      return res.status(502).json({ success: false, error: 'The assistant is temporarily unavailable' })
    }

    const textBlocks = modelResponse.content.filter((block) => block.type === 'text' && block.text)
    const replyText = textBlocks.map((block) => block.text).join('\n').trim()
    const toolUseBlocks = modelResponse.content.filter((block) => block.type === 'tool_use')

    const pendingActionsCol = await aiPendingActionsCollection()
    const toolCallSummaries: AiToolCallSummary[] = []
    const pendingActionsForResponse: Array<{ id: string; toolName: string; label: string; parsedInput: Record<string, unknown> }> = []

    for (const block of toolUseBlocks) {
      if (!block.name || !block.id) continue
      const pendingId = `AIP-${randomUUID().slice(0, 8).toUpperCase()}`
      const input = block.input ?? {}
      const pendingAction: AiPendingAction = {
        id: pendingId,
        conversationId,
        toolName: block.name,
        input,
        status: 'pending',
        createdBy: req.auth.userId,
        createdAt: new Date().toISOString(),
      }
      await pendingActionsCol.insertOne(pendingAction)

      toolCallSummaries.push({ id: pendingId, toolName: block.name, input, status: 'pending' })
      pendingActionsForResponse.push({
        id: pendingId,
        toolName: block.name,
        label: `${block.name.replace(/_/g, ' ')}`,
        parsedInput: input,
      })
    }

    const assistantMessageRow: AiMessage = {
      id: `AIM-${randomUUID().slice(0, 8).toUpperCase()}`,
      conversationId,
      role: 'assistant',
      content: replyText || (toolCallSummaries.length > 0 ? 'Proposed an action for your review.' : ''),
      toolCalls: toolCallSummaries.length > 0 ? toolCallSummaries : null,
      createdAt: new Date().toISOString(),
    }
    await messagesCol.insertOne(assistantMessageRow)
    await conversationsCol.updateOne({ id: conversationId }, { $set: { updatedAt: new Date().toISOString() } })

    res.json({
      success: true,
      data: {
        conversationId,
        reply: assistantMessageRow.content,
        pendingActions: pendingActionsForResponse,
      },
    })
  } catch (error) {
    logger.error({ err: error }, '[ai-assistant] /chat failed')
    res.status(500).json({ success: false, error: 'Failed to process assistant message' })
  }
})

aiAssistantRoutes.get('/conversations/:id/messages', async (req, res) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }
    const conversationsCol = await aiConversationsCollection()
    const conversation = await conversationsCol.findOne({ id: req.params.id })
    if (!conversation || conversation.userId !== req.auth.userId) {
      return res.status(404).json({ success: false, error: 'Conversation not found' })
    }
    const messagesCol = await aiMessagesCollection()
    const messages = await messagesCol.find({ conversationId: req.params.id }).sort({ createdAt: 1 }).toArray()
    res.json({ success: true, data: messages })
  } catch (error) {
    logger.error({ err: error }, '[ai-assistant] fetch conversation messages failed')
    res.status(500).json({ success: false, error: 'Failed to fetch conversation history' })
  }
})

aiAssistantRoutes.post('/tool-confirmations/:pendingActionId/confirm', async (req, res) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }
    if (!canUseAiTools(req.auth)) {
      return res.status(403).json({ success: false, error: 'Admin privileges required' })
    }

    const pendingActionsCol = await aiPendingActionsCollection()
    const pendingAction = await pendingActionsCol.findOne({ id: req.params.pendingActionId })
    if (!pendingAction) {
      return res.status(404).json({ success: false, error: 'Pending action not found' })
    }
    if (pendingAction.status !== 'pending') {
      return res.status(409).json({ success: false, error: `This action was already ${pendingAction.status}` })
    }
    // An admin may only confirm actions proposed in their own conversation — prevents
    // one admin confirming another admin's stale in-flight proposal.
    if (pendingAction.createdBy !== req.auth.userId) {
      return res.status(403).json({ success: false, error: 'You can only confirm actions from your own conversation' })
    }

    let result: { resultSummary: string; resultEntityId: string }
    try {
      result = await executeAiTool(pendingAction.toolName, pendingAction.input, req.auth)
    } catch (error) {
      if (error instanceof AiToolValidationError) {
        return res.status(400).json({ success: false, error: error.message })
      }
      if (error instanceof AiToolPermissionError) {
        return res.status(403).json({ success: false, error: error.message })
      }
      logger.error({ err: error, toolName: pendingAction.toolName }, '[ai-assistant] tool execution failed')
      return res.status(500).json({ success: false, error: 'Failed to execute the action' })
    }

    await writeAuditLog({
      action: `ai_assistant_${pendingAction.toolName}`,
      entityType: pendingAction.toolName.replace('create_', ''),
      entityId: result.resultEntityId,
      details: { toolName: pendingAction.toolName, input: pendingAction.input, conversationId: pendingAction.conversationId, pendingActionId: pendingAction.id },
      auth: req.auth,
    })

    const executedAt = new Date().toISOString()
    await pendingActionsCol.updateOne(
      { id: pendingAction.id },
      { $set: { status: 'executed', executedAt, resultSummary: result.resultSummary, resultEntityId: result.resultEntityId } },
    )

    const messagesCol = await aiMessagesCollection()
    await messagesCol.insertOne({
      id: `AIM-${randomUUID().slice(0, 8).toUpperCase()}`,
      conversationId: pendingAction.conversationId,
      role: 'tool_result',
      content: `✓ ${result.resultSummary}`,
      createdAt: executedAt,
    })

    res.json({ success: true, data: { resultSummary: result.resultSummary, entityId: result.resultEntityId } })
  } catch (error) {
    logger.error({ err: error }, '[ai-assistant] confirm failed')
    res.status(500).json({ success: false, error: 'Failed to confirm action' })
  }
})

aiAssistantRoutes.post('/tool-confirmations/:pendingActionId/cancel', async (req, res) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }
    const pendingActionsCol = await aiPendingActionsCollection()
    const pendingAction = await pendingActionsCol.findOne({ id: req.params.pendingActionId })
    if (!pendingAction) {
      return res.status(404).json({ success: false, error: 'Pending action not found' })
    }
    if (pendingAction.createdBy !== req.auth.userId) {
      return res.status(403).json({ success: false, error: 'You can only cancel actions from your own conversation' })
    }
    if (pendingAction.status !== 'pending') {
      return res.status(409).json({ success: false, error: `This action was already ${pendingAction.status}` })
    }

    await pendingActionsCol.updateOne({ id: pendingAction.id }, { $set: { status: 'cancelled' } })

    const messagesCol = await aiMessagesCollection()
    await messagesCol.insertOne({
      id: `AIM-${randomUUID().slice(0, 8).toUpperCase()}`,
      conversationId: pendingAction.conversationId,
      role: 'tool_result',
      content: `Action cancelled: ${pendingAction.toolName.replace(/_/g, ' ')}`,
      createdAt: new Date().toISOString(),
    })

    res.json({ success: true, message: 'Action cancelled' })
  } catch (error) {
    logger.error({ err: error }, '[ai-assistant] cancel failed')
    res.status(500).json({ success: false, error: 'Failed to cancel action' })
  }
})
