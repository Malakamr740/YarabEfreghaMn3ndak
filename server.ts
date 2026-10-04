import express from 'express'
import fs from 'fs'
import path from 'path'
import { createServer as createViteServer } from 'vite'

const app = express()
const PORT = 3000

app.use(express.json({ limit: '15mb' }))

// Ensure local persistence data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const ASSESSMENTS_FILE = path.join(DATA_DIR, 'assessments.json')
const ATTEMPTS_FILE = path.join(DATA_DIR, 'attempts.json')

function loadData<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8')
      return JSON.parse(content) as T
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err)
  }
  return fallback
}

function saveData<T>(file: string, data: T): void {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error(`Error writing ${file}:`, err)
  }
}

// -----------------------------------------------------------------------------
// API Endpoints for Full-Stack Assessment & Attempt Synchronization
// -----------------------------------------------------------------------------

// Assessments
app.get('/api/assessments', (_req, res) => {
  const assessments = loadData<any[]>(ASSESSMENTS_FILE, [])
  res.json(assessments)
})

app.get('/api/assessments/:id', (req, res) => {
  const { id } = req.params
  const assessments = loadData<any[]>(ASSESSMENTS_FILE, [])
  const found = assessments.find(
    (a) => a.id === id || a.id?.toLowerCase() === id?.toLowerCase()
  )
  if (!found) {
    return res.status(404).json({ error: 'Assessment not found' })
  }
  res.json(found)
})

app.post('/api/assessments', (req, res) => {
  const item = req.body
  if (!item || !item.id) {
    return res.status(400).json({ error: 'Invalid assessment payload' })
  }
  const assessments = loadData<any[]>(ASSESSMENTS_FILE, [])
  const idx = assessments.findIndex((a) => a.id === item.id)
  if (idx >= 0) {
    assessments[idx] = item
  } else {
    assessments.unshift(item)
  }
  saveData(ASSESSMENTS_FILE, assessments)
  res.json(item)
})

app.delete('/api/assessments/:id', (req, res) => {
  const { id } = req.params
  let assessments = loadData<any[]>(ASSESSMENTS_FILE, [])
  assessments = assessments.filter((a) => a.id !== id)
  saveData(ASSESSMENTS_FILE, assessments)
  res.json({ success: true, id })
})

// Attempts
app.get('/api/attempts', (_req, res) => {
  const attempts = loadData<any[]>(ATTEMPTS_FILE, [])
  res.json(attempts)
})

app.get('/api/attempts/:id', (req, res) => {
  const { id } = req.params
  const attempts = loadData<any[]>(ATTEMPTS_FILE, [])
  const found = attempts.find((a) => a.id === id)
  if (!found) {
    return res.status(404).json({ error: 'Attempt not found' })
  }
  res.json(found)
})

app.post('/api/attempts', (req, res) => {
  const attempt = req.body
  if (!attempt || !attempt.id) {
    return res.status(400).json({ error: 'Invalid attempt payload' })
  }
  const attempts = loadData<any[]>(ATTEMPTS_FILE, [])
  const idx = attempts.findIndex((a) => a.id === attempt.id)
  if (idx >= 0) {
    attempts[idx] = attempt
  } else {
    attempts.unshift(attempt)
  }
  saveData(ATTEMPTS_FILE, attempts)
  res.json(attempt)
})

// -----------------------------------------------------------------------------
// Vite Server Integration (Middleware in Dev, Static Files in Production)
// -----------------------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve('dist'))

  if (isProduction) {
    app.use(express.static(path.resolve('dist')))
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'))
    })
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Express] Assessment Studio server running on http://0.0.0.0:${PORT}`)
  })
}

startServer().catch((err) => {
  console.error('[Express] Server failed to start:', err)
  process.exit(1)
})
