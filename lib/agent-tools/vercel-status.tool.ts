import { tool } from '@openai/agents'
import { z } from 'zod'
import { VercelService } from '../services/vercel.service'

/**
 * Vercel Status Tool - Checks deployment status securely
 * Validates deployment IDs and sanitizes responses
 */
export const createCheckBuildStatusTool = () => {
  return tool({
    name: 'check_build_status',
    description: 'Check the current status of a Vercel deployment by its ID',
    parameters: z.object({
      deploymentId: z.string().describe('The deployment ID to check (from trigger_vercel_build)')
    }),
    execute: async (input) => {
      try {
        const vercelService = VercelService.getInstance()
        const result = await vercelService.checkDeploymentStatus(input.deploymentId)
        
        return result.message
      } catch (error) {
        console.error('Vercel status check tool error:', error)
        return `❌ ${error instanceof Error ? error.message : 'Failed to check build status'}`
      }
    }
  })
}

// Export the tool instance
export const checkBuildStatusTool = createCheckBuildStatusTool()