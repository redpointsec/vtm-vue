import { getDb } from './db'

// VULN: Chatbot tools expose sensitive data (DOB, SSN, reset_token) and have no per-object authorization

export const chatbotTools = [
  {
    type: 'function' as const,
    function: {
      name: 'overview',
      description: 'Get an overview of the task manager: counts of users, projects, tasks, notes',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_users',
      description: 'Get all users with their profiles including DOB, SSN, and reset tokens',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_database',
      description: 'Search for tasks and projects by query string',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_project',
      description: 'Create a new project',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Project title' },
          text: { type: 'string', description: 'Project description' },
          priority: { type: 'number', description: 'Priority: 1=high, 2=medium, 3=low' },
          due_date: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_project',
      description: 'Update an existing project',
      parameters: {
        type: 'object',
        properties: {
          project_id: { type: 'number', description: 'Project ID' },
          title: { type: 'string', description: 'New title' },
          text: { type: 'string', description: 'New description' },
          priority: { type: 'number', description: 'Priority: 1=high, 2=medium, 3=low' },
          due_date: { type: 'string', description: 'New due date' },
        },
        required: ['project_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_task',
      description: 'Create a new task in a project',
      parameters: {
        type: 'object',
        properties: {
          project_id: { type: 'number', description: 'Project ID' },
          title: { type: 'string', description: 'Task title' },
          text: { type: 'string', description: 'Task description' },
          priority: { type: 'number', description: 'Priority: 1=high, 2=medium, 3=low' },
          due_date: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
        },
        required: ['project_id', 'title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_task',
      description: 'Update an existing task',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'number', description: 'Task ID' },
          title: { type: 'string', description: 'New title' },
          text: { type: 'string', description: 'New description' },
          status: { type: 'string', description: 'Status: open, in_progress, done' },
          priority: { type: 'number', description: 'Priority: 1=high, 2=medium, 3=low' },
        },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_note',
      description: 'Add a note to a task',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'number', description: 'Task ID' },
          title: { type: 'string', description: 'Note title' },
          text: { type: 'string', description: 'Note content' },
          image: { type: 'string', description: 'Image URL or path' },
        },
        required: ['task_id', 'title', 'text'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_note',
      description: 'Update an existing note',
      parameters: {
        type: 'object',
        properties: {
          note_id: { type: 'number', description: 'Note ID' },
          title: { type: 'string', description: 'New title' },
          text: { type: 'string', description: 'New content' },
        },
        required: ['note_id'],
      },
    },
  },
]

export function executeTool(name: string, args: any, userId: number): any {
  const db = getDb()

  switch (name) {
    case 'overview': {
      const users = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
      const projects = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as any).count
      const tasks = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any).count
      const notes = (db.prepare('SELECT COUNT(*) as count FROM notes').get() as any).count
      return { users, projects, tasks, notes }
    }

    case 'get_users': {
      // VULN: Exposes SSN, DOB, reset_token — no authorization check
      const users = db.prepare(`
        SELECT u.id, u.username, u.email, u.is_staff, u.created_at,
               p.first_name, p.last_name, p.dob, p.ssn, p.reset_token, p.reset_token_expires, p.avatar
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
      `).all()
      return { users }
    }

    case 'search_database': {
      const q = args.query || ''
      // VULN: SQL Injection — same raw interpolation as /api/search
      const tasks = db.prepare(`SELECT * FROM tasks WHERE title LIKE '%${q}%' OR text LIKE '%${q}%'`).all()
      const projects = db.prepare(`SELECT * FROM projects WHERE title LIKE '%${q}%' OR text LIKE '%${q}%'`).all()
      return { tasks, projects }
    }

    case 'add_project': {
      const { title, text = '', priority = 2, due_date = '' } = args
      const result = db.prepare(
        'INSERT INTO projects (title, text, priority, due_date, created_by) VALUES (?, ?, ?, ?, ?)'
      ).run(title, text, priority, due_date, userId)
      db.prepare('INSERT INTO project_users (user_id, project_id, role) VALUES (?, ?, ?)').run(userId, result.lastInsertRowid, 'manager')
      return { project_id: result.lastInsertRowid, title }
    }

    case 'update_project': {
      // VULN: No authorization check — any user can update any project
      const { project_id, title, text, priority, due_date } = args
      const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id) as any
      if (!project) return { error: 'Project not found' }
      const updates = {
        title: title ?? project.title,
        text: text ?? project.text,
        priority: priority ?? project.priority,
        due_date: due_date ?? project.due_date,
      }
      db.prepare('UPDATE projects SET title=?, text=?, priority=?, due_date=?, updated_at=datetime(\'now\') WHERE id=?')
        .run(updates.title, updates.text, updates.priority, updates.due_date, project_id)
      return { success: true, project_id }
    }

    case 'add_task': {
      const { project_id, title, text = '', priority = 2, due_date = '' } = args
      const result = db.prepare(
        'INSERT INTO tasks (project_id, title, text, priority, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(project_id, title, text, priority, due_date, userId)
      return { task_id: result.lastInsertRowid, title }
    }

    case 'update_task': {
      // VULN: No authorization check — any user can update any task
      const { task_id, title, text, status, priority } = args
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task_id) as any
      if (!task) return { error: 'Task not found' }
      const updates = {
        title: title ?? task.title,
        text: text ?? task.text,
        status: status ?? task.status,
        priority: priority ?? task.priority,
      }
      db.prepare('UPDATE tasks SET title=?, text=?, status=?, priority=?, updated_at=datetime(\'now\') WHERE id=?')
        .run(updates.title, updates.text, updates.status, updates.priority, task_id)
      return { success: true, task_id }
    }

    case 'add_note': {
      const { task_id, title, text, image = '' } = args
      const result = db.prepare(
        'INSERT INTO notes (task_id, user_id, title, text, image) VALUES (?, ?, ?, ?, ?)'
      ).run(task_id, userId, title, text, image)
      return { note_id: result.lastInsertRowid, title }
    }

    case 'update_note': {
      // VULN: No authorization check — any user can update any note
      const { note_id, title, text } = args
      const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(note_id) as any
      if (!note) return { error: 'Note not found' }
      const updates = {
        title: title ?? note.title,
        text: text ?? note.text,
      }
      db.prepare('UPDATE notes SET title=?, text=?, updated_at=datetime(\'now\') WHERE id=?')
        .run(updates.title, updates.text, note_id)
      return { success: true, note_id }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}
