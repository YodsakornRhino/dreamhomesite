import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise'

/**
 * Verify a reCAPTCHA Enterprise token and return its risk score.
 * Environment variables:
 *  - RECAPTCHA_PROJECT_ID: Google Cloud project ID.
 *  - RECAPTCHA_SITE_KEY: reCAPTCHA site key.
 */
export async function verifyRecaptchaToken(token: string, action: string) {
  const projectId = process.env.RECAPTCHA_PROJECT_ID
  const siteKey = process.env.RECAPTCHA_SITE_KEY
  if (!projectId || !siteKey) {
    throw new Error('Missing reCAPTCHA environment configuration')
  }

  const client = new RecaptchaEnterpriseServiceClient()
  const projectPath = client.projectPath(projectId)

  const [response] = await client.createAssessment({
    parent: projectPath,
    assessment: {
      event: { token, siteKey },
    },
  })

  if (!response.tokenProperties?.valid) {
    throw new Error(`Invalid token: ${response.tokenProperties?.invalidReason}`)
  }
  if (response.tokenProperties?.action !== action) {
    throw new Error('Action mismatch')
  }

  return response.riskAnalysis?.score ?? 0
}
