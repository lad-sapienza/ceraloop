/**
 * Directus Collection Names Configuration
 * 
 * This file centralizes all collection (table) names used in the application.
 * Collection names can be customized via environment variables, allowing the
 * app to be adapted for different projects, datasets, or Directus instances.
 * 
 * Use cases:
 * - Multiple studies with different datasets
 * - Different artifact types (pottery, coins, tools, etc.)
 * - Development/staging environments
 * - A/B testing with different model outputs
 */

export const COLLECTIONS = {
  /**
   * Main data collection containing reference items and matched images
   * Default: 'model_output'
   */
  MODEL_OUTPUT: import.meta.env.VITE_COLLECTION_MODEL_OUTPUT || 'model_output',
  
  /**
   * Collection storing user evaluations/feedback
   * Default: 'user_feedbacks'
   */
  USER_FEEDBACKS: import.meta.env.VITE_COLLECTION_USER_FEEDBACKS || 'user_feedbacks',
  
  /**
   * Collection storing user background information (experience, education, etc.)
   * Default: 'user_information'
   */
  USER_INFORMATION: import.meta.env.VITE_COLLECTION_USER_INFORMATION || 'user_information',
  
  /**
   * Directus system collection for user accounts
   * Default: 'directus_users'
   */
  USERS: import.meta.env.VITE_COLLECTION_USERS || 'directus_users',
  
  /**
   * Directus system collection for file/image storage
   * Default: 'directus_files'
   */
  FILES: import.meta.env.VITE_COLLECTION_FILES || 'directus_files'
}

/**
 * Field name prefixes (could be made configurable in the future)
 */
export const FIELD_PREFIXES = {
  MATCH: 'match_',
  SCORE: 'score_'
}
