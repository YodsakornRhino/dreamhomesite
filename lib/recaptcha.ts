/**
 * Verify a reCAPTCHA Enterprise token via HTTP request and return the risk score.
 * Expects the following environment variables:
 * - RECAPTCHA_PROJECT_ID: Google Cloud project ID.
 * - RECAPTCHA_SITE_KEY: reCAPTCHA site key associated with the client.
 * - RECAPTCHA_API_KEY: reCAPTCHA Enterprise API key.
 */
export async function verifyRecaptchaToken(token: string, action: string) {
  const projectId = process.env.RECAPTCHA_PROJECT_ID
  const siteKey = process.env.RECAPTCHA_SITE_KEY
  const apiKey = process.env.RECAPTCHA_API_KEY

  if (!projectId || !siteKey || !apiKey) {
    throw new Error('Missing reCAPTCHA environment configuration')
  }

  const res = await fetch(
    `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: { token, siteKey },
      }),
    }
  )

  const data = await res.json()

  if (!data.tokenProperties?.valid) {
    throw new Error(`Invalid token: ${data.tokenProperties?.invalidReason}`)
  }
  if (data.tokenProperties?.action !== action) {
    throw new Error('Action mismatch')
  }

  return data.riskAnalysis?.score ?? 0
}
