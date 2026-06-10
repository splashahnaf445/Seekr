const axios = require('axios');
const Filter = require('bad-words');

// Initialize bad-words filter
const filter = new Filter();

// Configuration
const PERSPECTIVE_API_KEY = process.env.PERSPECTIVE_API_KEY || null;
const TOXICITY_THRESHOLD = 0.7; // 70% confidence threshold
const USE_PERSPECTIVE_API = !!PERSPECTIVE_API_KEY;

/**
 * Check if text contains profanity using bad-words (offline)
 * @param {string} text - Text to check
 * @returns {object} - { isProfane: boolean, cleaned: string }
 */
const checkLocalProfanity = (text) => {
  const isProfane = filter.isProfane(text);
  const cleaned = filter.clean(text);
  return { isProfane, cleaned };
};

/**
 * Check text toxicity using Google's Perspective API
 * @param {string} text - Text to check
 * @returns {object} - { isToxic: boolean, toxicityScore: number, error?: string }
 */
const checkPerspectiveAPI = async (text) => {
  if (!USE_PERSPECTIVE_API) {
    return { isToxic: false, toxicityScore: 0, skipped: true };
  }

  try {
    const response = await axios.post(
      'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=' + PERSPECTIVE_API_KEY,
      {
        comment: { text },
        requestedAttributes: {
          TOXICITY: {},
          PROFANITY: {},
          IDENTITY_ATTACK: {},
          INSULT: {},
          THREAT: {}
        }
      },
      { timeout: 5000 }
    );

    const scores = response.data.attributeScores;
    
    // Get max score across all toxicity types
    const toxicityScore = Math.max(
      scores.TOXICITY?.summaryScore?.value || 0,
      scores.PROFANITY?.summaryScore?.value || 0,
      scores.IDENTITY_ATTACK?.summaryScore?.value || 0,
      scores.INSULT?.summaryScore?.value || 0,
      scores.THREAT?.summaryScore?.value || 0
    );

    return {
      isToxic: toxicityScore >= TOXICITY_THRESHOLD,
      toxicityScore: parseFloat(toxicityScore.toFixed(3)),
      skipped: false
    };
  } catch (error) {
    console.error('Perspective API error:', error.message);
    return {
      isToxic: false,
      toxicityScore: 0,
      skipped: true,
      error: error.message
    };
  }
};

/**
 * Main moderation function - combines both methods
 * @param {string} text - Text to moderate
 * @returns {object} - Moderation result with detailed flags
 */
const moderateContent = async (text) => {
  if (!text || typeof text !== 'string') {
    return { flagged: false, reason: 'invalid_input' };
  }

  try {
    // Step 1: Quick local profanity check
    const localCheck = checkLocalProfanity(text);

    if (localCheck.isProfane) {
      return {
        flagged: true,
        reason: 'profanity_detected',
        cleaned: localCheck.cleaned,
        confidence: 0.95,
        method: 'local'
      };
    }

    // Step 2: Use Perspective API for deeper analysis (if available)
    if (USE_PERSPECTIVE_API) {
      const apiCheck = await checkPerspectiveAPI(text);

      if (apiCheck.isToxic) {
        return {
          flagged: true,
          reason: 'toxicity_detected',
          toxicityScore: apiCheck.toxicityScore,
          method: 'api',
          message: `Content contains toxic language (${(apiCheck.toxicityScore * 100).toFixed(0)}% confidence)`
        };
      }
    }

    // Content passed both checks
    return {
      flagged: false,
      reason: 'clean',
      cleaned: text,
      confidence: 0.95,
      method: USE_PERSPECTIVE_API ? 'hybrid' : 'local'
    };
  } catch (error) {
    console.error('Moderation error:', error);
    // Fail gracefully - allow content on error
    return {
      flagged: false,
      reason: 'moderation_unavailable',
      cleaned: text,
      error: error.message
    };
  }
};

/**
 * Add custom profanity words (optional)
 * @param {string|array} words - Words to add to profanity list
 */
const addProfanityWords = (words) => {
  filter.addWords(...(Array.isArray(words) ? words : [words]));
};

/**
 * Get moderation stats - useful for monitoring
 * @returns {object} - Current moderation configuration
 */
const getModerationStats = () => ({
  perspectiveAPIEnabled: USE_PERSPECTIVE_API,
  localFilterEnabled: true,
  toxicityThreshold: TOXICITY_THRESHOLD,
  version: '1.0.0'
});

module.exports = {
  moderateContent,
  checkLocalProfanity,
  checkPerspectiveAPI,
  addProfanityWords,
  getModerationStats
};
