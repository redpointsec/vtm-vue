import { readBody } from 'h3'
import OpenAI from 'openai'
import { getDb } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { chatbotTools, executeTool } from '~/server/utils/chatbot-tools'

// VULN: No CSRF token validation
// VULN: Chatbot tools expose sensitive data (SSN, DOB, reset_token) — see chatbot-tools.ts

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const { message, session_id } = body

  if (!message) {
    throw createError({ statusCode: 400, message: 'message is required' })
  }

  const config = useRuntimeConfig()
  const db = getDb()

  const openai = new OpenAI({
    baseURL: config.openrouterBaseUrl || 'https://openrouter.ai/api/v1',
    apiKey: config.openrouterApiKey || '',
  })
  const model = config.vtmModel || 'openai/gpt-4o-mini'

  // Get or create session
  let sessionId = session_id
  if (!sessionId) {
    const result = db.prepare(
      'INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)'
    ).run(user.userId, message.slice(0, 50))
    sessionId = result.lastInsertRowid as number
  } else {
    db.prepare("UPDATE chat_sessions SET updated_at=datetime('now') WHERE id=?").run(sessionId)
  }

  // Store user message
  db.prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(sessionId, 'user', message)

  // Load message history
  const history = db.prepare(
    "SELECT role, content FROM chat_messages WHERE session_id = ? AND role IN ('user','assistant') ORDER BY created_at ASC"
  ).all(sessionId) as Array<{ role: string; content: string }>

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'You are a helpful task management assistant. Use the tools available to help users manage their projects, tasks, and notes. You can also search the database and look up user information.',
    },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]

  // Agentic loop — handle tool calls
  let finalResponse = ''
  const toolCallsLog: any[] = []

  let response = await openai.chat.completions.create({
    model,
    messages,
    tools: chatbotTools,
    tool_choice: 'auto',
  })

  let loopCount = 0
  while (response.choices[0]?.finish_reason === 'tool_calls' && loopCount < 5) {
    loopCount++
    const assistantMessage = response.choices[0].message
    messages.push(assistantMessage)

    const toolResults: OpenAI.Chat.ChatCompletionToolMessageParam[] = []

    for (const toolCall of assistantMessage.tool_calls || []) {
      const args = JSON.parse(toolCall.function.arguments || '{}')
      const result = executeTool(toolCall.function.name, args, user.userId)
      toolCallsLog.push({ name: toolCall.function.name, args, result })

      toolResults.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      })
    }

    messages.push(...toolResults)

    response = await openai.chat.completions.create({
      model,
      messages,
      tools: chatbotTools,
      tool_choice: 'auto',
    })
  }

  finalResponse = response.choices[0]?.message?.content || ''

  // Store assistant response
  const msgResult = db.prepare(
    'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)'
  ).run(sessionId, 'assistant', finalResponse)

  return {
    session_id: sessionId,
    message_id: msgResult.lastInsertRowid,
    response: finalResponse,
    tool_calls: toolCallsLog.length > 0 ? toolCallsLog : undefined,
  }
})
