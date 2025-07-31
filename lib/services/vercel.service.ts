import { Vercel } from '@vercel/sdk'
import { EnvironmentService } from './environment.service'
import { VercelDeploymentResult, VercelStatusResult } from '../agent-tools/types'

/**
 * Vercel service layer - encapsulates all Vercel SDK operations
 * Provides type-safe, sanitized interface for deployment operations
 */
export class VercelService {
  private static instance: VercelService
  private vercel: Vercel | null = null
  private environmentService: EnvironmentService

  private constructor() {
    this.environmentService = EnvironmentService.getInstance()
  }

  static getInstance(): VercelService {
    if (!VercelService.instance) {
      VercelService.instance = new VercelService()
    }
    return VercelService.instance
  }

  /**
   * Initialize Vercel SDK client with validated configuration
   */
  private getVercelClient(): Vercel {
    if (this.vercel) {
      return this.vercel
    }

    const config = this.environmentService.getVercelConfig()
    this.vercel = new Vercel({
      bearerToken: config.token
    })

    return this.vercel
  }

  /**
   * Trigger a new deployment
   */
  async triggerDeployment(reason?: string | null): Promise<VercelDeploymentResult> {
    try {
      const vercel = this.getVercelClient()
      const config = this.environmentService.getVercelConfig()

      const deployment = await vercel.deployments.createDeployment({
        requestBody: {
          name: config.projectName,
          target: 'production',
          gitSource: {
            type: 'github',
            org: config.githubOrg,
            repo: config.repoName,
            ref: 'main'
          }
        }
      })

      const reasonText = reason ? ` (Reason: ${reason})` : ''
      const message = `✅ Build triggered successfully!${reasonText}

Deployment ID: ${deployment.id}
Initial Status: ${deployment.readyState || 'QUEUED'}
Build URL: https://vercel.com/dashboard/deployments/${deployment.id}

You can ask me to check the build status anytime using the deployment ID above.`

      return {
        deploymentId: deployment.id,
        status: deployment.readyState || 'QUEUED',
        message
      }

    } catch (error) {
      console.error('Vercel deployment trigger error:', error)
      
      // Sanitize error message to avoid exposing sensitive information
      const sanitizedMessage = this.sanitizeErrorMessage(error instanceof Error ? error.message : 'Unknown error')
      throw new Error(`Failed to trigger deployment: ${sanitizedMessage}`)
    }
  }

  /**
   * Check deployment status by ID
   */
  async checkDeploymentStatus(deploymentId: string): Promise<VercelStatusResult> {
    try {
      // Validate deployment ID format (basic UUID check)
      if (!this.isValidDeploymentId(deploymentId)) {
        throw new Error('Invalid deployment ID format')
      }

      const vercel = this.getVercelClient()
      
      const deployment = await vercel.deployments.getDeployment({
        idOrUrl: deploymentId,
        withGitRepoInfo: 'true'
      })

      const status = deployment.readyState || 'UNKNOWN'
      const isReady = status === 'READY'
      const isFailed = status === 'ERROR'
      const isBuilding = status === 'BUILDING' || status === 'QUEUED'

      let message = ''
      
      if (isReady) {
        message = `🎉 Build completed successfully!
            
✅ Status: ${status}
🌐 Live URL: https://${deployment.url}
📊 Build Dashboard: https://vercel.com/dashboard/deployments/${deployment.id}

Your updated content is now live on the production site!`
      } else if (isFailed) {
        message = `❌ Build failed with status: ${status}

🔍 Check the build logs at: https://vercel.com/dashboard/deployments/${deployment.id}
📋 You may need to fix any build errors and try again.`
      } else if (isBuilding) {
        message = `⏳ Build still in progress...

Status: ${status}
🔄 The build is currently running. This typically takes 2-5 minutes.
📊 Monitor progress: https://vercel.com/dashboard/deployments/${deployment.id}

I can check again in a few minutes if needed.`
      } else {
        message = `📋 Build Status: ${status}

Deployment ID: ${deployment.id}
Dashboard: https://vercel.com/dashboard/deployments/${deployment.id}`
      }

      return {
        status,
        isReady,
        isFailed,
        isBuilding,
        url: deployment.url || undefined,
        message
      }

    } catch (error) {
      console.error('Vercel status check error:', error)
      
      const sanitizedMessage = this.sanitizeErrorMessage(error instanceof Error ? error.message : 'Unknown error')
      throw new Error(`Failed to check deployment status: ${sanitizedMessage}`)
    }
  }

  /**
   * Validate deployment ID format (basic check for UUID-like string)
   */
  private isValidDeploymentId(id: string): boolean {
    // Vercel deployment IDs are typically 27-character base64-like strings
    return /^[a-zA-Z0-9_-]{20,30}$/.test(id)
  }

  /**
   * Sanitize error messages to avoid exposing sensitive information
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove potential sensitive information from error messages
    return message
      .replace(/Bearer\s+[a-zA-Z0-9_-]+/gi, 'Bearer [REDACTED]')
      .replace(/token[:\s=]+[a-zA-Z0-9_-]+/gi, 'token: [REDACTED]')
      .replace(/api[_-]?key[:\s=]+[a-zA-Z0-9_-]+/gi, 'api_key: [REDACTED]')
      .replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '/[DEPLOYMENT_ID]')
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{ healthy: boolean; config: Record<string, unknown>; errors: string[] }> {
    try {
      const validation = this.environmentService.validateVercelEnvironment()
      const config = this.environmentService.getSanitizedConfig()
      
      return {
        healthy: validation.isValid,
        config,
        errors: validation.errors
      }
    } catch (error) {
      return {
        healthy: false,
        config: {},
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
}