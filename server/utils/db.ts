import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const DB_PATH = path.resolve(process.cwd(), 'data/vtm-vue.sqlite')

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    initializeDb(_db)
  }
  return _db
}

function initializeDb(db: Database.Database) {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      is_staff INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      first_name TEXT DEFAULT '',
      last_name TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      dob TEXT DEFAULT '',
      ssn TEXT DEFAULT '',
      reset_token TEXT DEFAULT '',
      reset_token_expires TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_groups (
      user_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      text TEXT DEFAULT '',
      priority INTEGER DEFAULT 2,
      due_date TEXT DEFAULT '',
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_users (
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member'
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      text TEXT DEFAULT '',
      status TEXT DEFAULT 'open',
      completed INTEGER DEFAULT 0,
      priority INTEGER DEFAULT 2,
      due_date TEXT DEFAULT '',
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS task_users (
      user_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT DEFAULT '',
      text TEXT DEFAULT '',
      image TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uploaded_by INTEGER NOT NULL,
      project_id INTEGER,
      task_id INTEGER,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      source_url TEXT DEFAULT '',
      content_type TEXT DEFAULT '',
      size INTEGER DEFAULT 0,
      uploaded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT DEFAULT 'New Chat',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT DEFAULT '',
      tool_name TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)

  // Seed if empty
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
  if (userCount === 0) {
    seedDb(db)
  }
}

function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex')
}

function seedDb(db: Database.Database) {
  // Groups
  db.prepare('INSERT INTO groups (id, name) VALUES (1, ?)').run('admin')
  db.prepare('INSERT INTO groups (id, name) VALUES (2, ?)').run('project_managers')
  db.prepare('INSERT INTO groups (id, name) VALUES (3, ?)').run('team_members')

  // Users
  const adminHash = md5('test123')
  const passwordHash = md5('password')

  db.prepare('INSERT INTO users (id, username, email, password_hash, is_staff) VALUES (1, ?, ?, ?, 1)')
    .run('admin', 'admin@vtm.local', adminHash)
  db.prepare('INSERT INTO users (id, username, email, password_hash, is_staff) VALUES (2, ?, ?, ?, 0)')
    .run('chris', 'chris@vtm.local', adminHash)
  db.prepare('INSERT INTO users (id, username, email, password_hash, is_staff) VALUES (3, ?, ?, ?, 0)')
    .run('pm', 'pm@vtm.local', adminHash)
  db.prepare('INSERT INTO users (id, username, email, password_hash, is_staff) VALUES (4, ?, ?, ?, 0)')
    .run('alex', 'alex@vtm.local', passwordHash)

  // Profiles
  db.prepare('INSERT INTO profiles (user_id, first_name, last_name, dob, ssn) VALUES (1, ?, ?, ?, ?)')
    .run('Admin', 'User', '1984-01-12', '111-22-3333')
  db.prepare('INSERT INTO profiles (user_id, first_name, last_name, dob, ssn) VALUES (2, ?, ?, ?, ?)')
    .run('Chris', 'Smith', '1991-04-09', '222-33-4444')
  db.prepare('INSERT INTO profiles (user_id, first_name, last_name, dob, ssn) VALUES (3, ?, ?, ?, ?)')
    .run('Project', 'Manager', '1988-10-30', '333-44-5555')
  db.prepare('INSERT INTO profiles (user_id, first_name, last_name, dob, ssn) VALUES (4, ?, ?, ?, ?)')
    .run('Alex', 'Jones', '1995-06-18', '444-55-6666')

  // User groups
  db.prepare('INSERT INTO user_groups (user_id, group_id) VALUES (1, 1)').run()
  db.prepare('INSERT INTO user_groups (user_id, group_id) VALUES (3, 2)').run()
  db.prepare('INSERT INTO user_groups (user_id, group_id) VALUES (2, 3)').run()
  db.prepare('INSERT INTO user_groups (user_id, group_id) VALUES (4, 3)').run()

  // Projects
  db.prepare('INSERT INTO projects (id, title, text, priority, created_by) VALUES (1, ?, ?, 1, 1)')
    .run('Marketing Campaign', '<p>Q4 marketing campaign focusing on social media and email outreach. Target audience: enterprise clients.</p>')
  db.prepare('INSERT INTO projects (id, title, text, priority, created_by) VALUES (2, ?, ?, 2, 3)')
    .run('iOS App Development', '<p>New iOS app for task management. Must support iOS 16+.</p>')
  db.prepare('INSERT INTO projects (id, title, text, priority, created_by) VALUES (3, ?, ?, 1, 1)')
    .run('API Gateway Redesign', '<p>Redesign the API gateway to support microservices architecture.</p>')

  // Project users
  db.prepare('INSERT INTO project_users (user_id, project_id, role) VALUES (1, 1, ?)').run('manager')
  db.prepare('INSERT INTO project_users (user_id, project_id, role) VALUES (2, 1, ?)').run('member')
  db.prepare('INSERT INTO project_users (user_id, project_id, role) VALUES (3, 1, ?)').run('manager')
  db.prepare('INSERT INTO project_users (user_id, project_id, role) VALUES (2, 2, ?)').run('member')
  db.prepare('INSERT INTO project_users (user_id, project_id, role) VALUES (3, 2, ?)').run('manager')
  db.prepare('INSERT INTO project_users (user_id, project_id, role) VALUES (4, 2, ?)').run('member')
  db.prepare('INSERT INTO project_users (user_id, project_id, role) VALUES (1, 3, ?)').run('manager')
  db.prepare('INSERT INTO project_users (user_id, project_id, role) VALUES (3, 3, ?)').run('manager')

  // Tasks
  db.prepare('INSERT INTO tasks (id, project_id, title, text, priority, created_by) VALUES (1, 1, ?, ?, 1, 1)')
    .run('Define Campaign Goals', 'Outline KPIs and success metrics for the Q4 campaign.')
  db.prepare('INSERT INTO tasks (id, project_id, title, text, priority, created_by) VALUES (2, 1, ?, ?, 2, 1)')
    .run('Create Social Media Assets', 'Design banners, posts, and stories for all social platforms.')
  db.prepare('INSERT INTO tasks (id, project_id, title, text, priority, created_by) VALUES (3, 2, ?, ?, 1, 3)')
    .run('Set up CI/CD pipeline', 'Configure GitHub Actions for automated build and deployment.')
  db.prepare('INSERT INTO tasks (id, project_id, title, text, priority, created_by) VALUES (4, 2, ?, ?, 2, 3)')
    .run('Design onboarding flow', 'Create wireframes and mockups for the user onboarding experience.')
  db.prepare('INSERT INTO tasks (id, project_id, title, text, priority, created_by) VALUES (5, 3, ?, ?, 2, 1)')
    .run('Document current API endpoints', 'Write OpenAPI spec for all existing API endpoints.')
  db.prepare('INSERT INTO tasks (id, project_id, title, text, priority, created_by) VALUES (6, 3, ?, ?, 1, 1)')
    .run('Performance benchmarking', 'Run load tests to establish baseline performance metrics.')

  // Task users
  db.prepare('INSERT INTO task_users (user_id, task_id) VALUES (2, 1)').run()
  db.prepare('INSERT INTO task_users (user_id, task_id) VALUES (4, 2)').run()
  db.prepare('INSERT INTO task_users (user_id, task_id) VALUES (2, 3)').run()
  db.prepare('INSERT INTO task_users (user_id, task_id) VALUES (3, 4)').run()
  db.prepare('INSERT INTO task_users (user_id, task_id) VALUES (3, 5)').run()
  db.prepare('INSERT INTO task_users (user_id, task_id) VALUES (1, 6)').run()

  // Notes
  db.prepare('INSERT INTO notes (task_id, user_id, title, text) VALUES (1, 2, ?, ?)').run(
    'Initial research done',
    'Reviewed competitor campaigns. Key findings: <strong>video content</strong> drives 3x engagement.'
  )
  db.prepare('INSERT INTO notes (task_id, user_id, title, text) VALUES (2, 4, ?, ?)').run(
    'Design brief ready',
    '<p>Assets needed: <em>5 banner sizes</em>, 3 story formats, 10 post templates.</p>'
  )
  db.prepare('INSERT INTO notes (task_id, user_id, title, text) VALUES (3, 2, ?, ?)').run(
    'Pipeline draft',
    'Using GitHub Actions. Stages: lint → test → build → deploy to TestFlight.'
  )
  db.prepare('INSERT INTO notes (task_id, user_id, title, text) VALUES (4, 3, ?, ?)').run(
    'Wireframes v1',
    '<ul><li>Welcome screen</li><li>Permissions prompt</li><li>Profile setup</li></ul>'
  )
  db.prepare('INSERT INTO notes (task_id, user_id, title, text) VALUES (5, 3, ?, ?)').run(
    'Endpoint inventory',
    'Found 47 undocumented endpoints. Starting with auth and user management APIs.'
  )
  db.prepare('INSERT INTO notes (task_id, user_id, title, text) VALUES (6, 1, ?, ?)').run(
    'Baseline results',
    '<pre>p95 latency: 450ms\np99 latency: 1200ms\nError rate: 0.3%</pre>'
  )
}
