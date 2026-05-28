import { getRequestHeaders } from 'h3'

// VULN: Sensitive Data Exposure — exposes all environment variables and request headers
// No authentication required (intentional for training)

export default defineEventHandler(async (event) => {
  const headers = getRequestHeaders(event)

  return {
    environment: process.env,
    headers,
    nodeVersion: process.version,
    platform: process.platform,
    cwd: process.cwd(),
    uptime: process.uptime(),
  }
})
