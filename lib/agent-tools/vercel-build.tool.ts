import { tool } from '@openai/agents'
import { z } from 'zod'
import { VercelService } from '../services/vercel.service'

/**
 * Vercel Build Tool - Triggers secure production deployments
 * Uses Vercel SDK with proper authentication and validation
 */
export const createTriggerVercelBuildTool = () => {
  return tool({
    name: 'trigger_vercel_build',
    description: 'Trigger a secure production build and deployment of the Music Central app via Vercel SDK',
    parameters: z.object({
      reason: z.string().nullable().optional().describe('Optional reason for triggering this build')
    }),
    execute: async (input) => {
      try {
        const vercelService = VercelService.getInstance()
        const result = await vercelService.triggerDeployment(input.reason)
        
        return result.message
      } catch (error) {
        console.error('Vercel build trigger tool error:', error)
        return `❌ ${error instanceof Error ? error.message : 'Failed to trigger build'}`
      }
    }
  })
}

// Export the tool instance
export const triggerVercelBuildTool = createTriggerVercelBuildTool()