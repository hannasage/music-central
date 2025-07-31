import { VercelConfig, EnvironmentValidationResult } from '../agent-tools/types'

/**
 * Centralized environment variable validation service
 * Ensures all required configuration is present and valid
 */
export class EnvironmentService {
  private static instance: EnvironmentService
  private _vercelConfig: VercelConfig | null = null

  private constructor() {}

  static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService()
    }
    return EnvironmentService.instance
  }

  /**
   * Validate and get Vercel configuration
   * Throws error if any required environment variables are missing
   */
  getVercelConfig(): VercelConfig {
    if (this._vercelConfig) {
      return this._vercelConfig
    }

    const validation = this.validateVercelEnvironment()
    if (!validation.isValid) {
      throw new Error(`Vercel configuration invalid: ${validation.errors.join(', ')}`)
    }

    this._vercelConfig = {
      token: process.env.VERCEL_TOKEN!,
      githubOrg: process.env.VERCEL_GITHUB_ORG!,
      repoName: process.env.VERCEL_REPO_NAME!,
      projectName: process.env.VERCEL_PROJECT_NAME || process.env.VERCEL_REPO_NAME!
    }

    return this._vercelConfig
  }

  /**
   * Validate Vercel environment variables without throwing
   * Returns detailed validation result
   */
  validateVercelEnvironment(): EnvironmentValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Required environment variables
    const requiredVars = [
      'VERCEL_TOKEN',
      'VERCEL_GITHUB_ORG', 
      'VERCEL_REPO_NAME'
    ]

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        errors.push(`${varName} environment variable is required but not configured`)
      }
    }

    // Optional but recommended
    if (!process.env.VERCEL_PROJECT_NAME) {
      warnings.push('VERCEL_PROJECT_NAME not set, will use VERCEL_REPO_NAME as project name')
    }

    // Validate token format (basic check)
    if (process.env.VERCEL_TOKEN && !this.isValidVercelToken(process.env.VERCEL_TOKEN)) {
      errors.push('VERCEL_TOKEN appears to be invalid format')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Basic validation for Vercel token format
   */
  private isValidVercelToken(token: string): boolean {
    // Vercel tokens are typically 24+ characters and alphanumeric
    return token.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(token)
  }

  /**
   * Get sanitized configuration for logging (without sensitive data)
   */
  getSanitizedConfig(): Partial<VercelConfig> {
    try {
      const config = this.getVercelConfig()
      return {
        githubOrg: config.githubOrg,
        repoName: config.repoName,
        projectName: config.projectName,
        token: config.token ? `${config.token.substring(0, 4)}...` : 'not set'
      }
    } catch {
      return {}
    }
  }

  /**
   * Reset cached configuration (useful for testing)
   */
  reset(): void {
    this._vercelConfig = null
  }
}