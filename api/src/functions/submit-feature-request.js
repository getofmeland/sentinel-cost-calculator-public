const { app } = require('@azure/functions')

// Simple in-memory rate limiter: IP → { count, windowStart }
const rateLimitMap = new Map()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

const LABEL_MAP = {
  'Enhancement': 'enhancement',
  'Bug report': 'bug',
  'New log source': 'log-source',
  'Pricing update': 'pricing',
  'Data accuracy': 'data-update',
  'UI / usability': 'ui',
  'Calculation logic': 'calculation',
  'Other': 'enhancement',
}

const PRIORITY_MAP = {
  'Nice to have': 'nice-to-have',
  'Important': 'important',
  'Critical': 'critical',
}

app.http('submit-feature-request', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'submit-feature-request',
  handler: async (request, context) => {
    const headers = {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
    }

    let body
    try {
      body = await request.json()
    } catch {
      return { status: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid JSON' }) }
    }

    const { name, email, category, summary, description, priority, website } = body

    // Honeypot check — silent success
    if (website) {
      return { status: 200, headers, body: JSON.stringify({ success: true }) }
    }

    // Validate required fields
    if (!name || !email || !summary || !description) {
      return { status: 400, headers, body: JSON.stringify({ success: false, error: 'Missing required fields.' }) }
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { status: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid email address.' }) }
    }

    // Anti-spam: reject if description is too short or identical to summary
    if (description.length < 20) {
      return { status: 400, headers, body: JSON.stringify({ success: false, error: 'Description must be at least 20 characters.' }) }
    }
    if (description.trim() === summary.trim()) {
      return { status: 400, headers, body: JSON.stringify({ success: false, error: 'Description must differ from the summary.' }) }
    }

    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const now = Date.now()
    const record = rateLimitMap.get(ip) ?? { count: 0, windowStart: now }
    if (now - record.windowStart > RATE_WINDOW_MS) {
      record.count = 0
      record.windowStart = now
    }
    record.count++
    rateLimitMap.set(ip, record)
    if (record.count > RATE_LIMIT) {
      return { status: 429, headers, body: JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }) }
    }

    // GitHub API credentials
    const token = process.env.GITHUB_TOKEN
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    if (!token || !owner || !repo) {
      context.log('Missing GitHub environment variables')
      return { status: 500, headers, body: JSON.stringify({ success: false, error: 'Service not configured.' }) }
    }

    // Build issue
    const categoryLabel = LABEL_MAP[category] ?? 'enhancement'
    const priorityLabel = PRIORITY_MAP[priority] ?? 'nice-to-have'
    const issueTitle = summary.slice(0, 100)
    const issueBody = [
      `**Submitted by:** ${name} (${email})`,
      `**Category:** ${category}`,
      `**Priority:** ${priority}`,
      '',
      '### Description',
      description,
      '',
      `---`,
      `*Submitted via Sentinel Cost Calculator on ${new Date().toISOString()}*`,
    ].join('\n')

    let response
    try {
      response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: [categoryLabel, priorityLabel, 'user-submitted'],
        }),
      })
    } catch (err) {
      context.log('GitHub API network error:', err)
      return { status: 502, headers, body: JSON.stringify({ success: false, error: 'Could not reach GitHub. Please try again.' }) }
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      context.log(`GitHub API error ${response.status}:`, errText)
      return { status: 502, headers, body: JSON.stringify({ success: false, error: 'Failed to create issue. Please try again.' }) }
    }

    const issue = await response.json()
    return {
      status: 200,
      headers,
      body: JSON.stringify({
        success: true,
        issueUrl: issue.html_url,
        issueNumber: issue.number,
      }),
    }
  },
})
