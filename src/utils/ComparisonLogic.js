// src/utils/comparisonLogic.js

/**
 * Calculate similarity score between two users
 * Personality: 100 points
 * Lifestyle: 100 points
 * TOTAL: 200 points
 */
export function calculateSimilarity(userA, userB) {
  const personalityTests = []
  
  // MBTI Score
  if (userA.mbti && userB.mbti) {
    personalityTests.push(calculateMBTIScore(userA.mbti, userB.mbti))
  }
  
  // Big Five Score
  if (userA.big_five && userB.big_five) {
    personalityTests.push(calculateBigFiveScore(userA.big_five, userB.big_five))
  }
  
  // Calculate personality score (100 points total)
  const personalityScore = personalityTests.length > 0
    ? (personalityTests.reduce((sum, score) => sum + score, 0) / personalityTests.length) * 2
    : 0
  
  // LIFESTYLE (100 points total)
  const lifestyleScore = calculateLifestyleScore(userA, userB)
  
  return {
    personalityScore: Math.round(personalityScore),
    lifestyleScore: Math.round(lifestyleScore),
    totalScore: Math.round(personalityScore + lifestyleScore),
    breakdown: {
      mbti: personalityTests[0] || 0,
      bigFive: personalityTests[1] || 0,
      personalSocial: lifestyleScore * 0.4, // 40 points
      interests: lifestyleScore * 0.4, // 40 points
      funQuestions: lifestyleScore * 0.2 // 20 points
    }
  }
}

/**
 * Calculate MBTI similarity (0-50 points)
 */
function calculateMBTIScore(mbtiA, mbtiB) {
  const dimensions = ['energy', 'mind', 'nature', 'tactics', 'identity']
  let totalScore = 0
  const pointsPerDimension = 50 / dimensions.length
  
  dimensions.forEach(dimension => {
    const a = mbtiA[dimension]
    const b = mbtiB[dimension]
    
    if (!a || !b) return
    
    if (a.type !== b.type) {
      totalScore += 0
      return
    }
    
    const percentDiff = Math.abs(a.percentage - b.percentage)
    const k = 0.05
    const dimensionScore = pointsPerDimension * Math.exp(-k * percentDiff)
    totalScore += dimensionScore
  })
  
  return totalScore
}

/**
 * Calculate Big Five similarity (0-50 points)
 */
function calculateBigFiveScore(bigFiveA, bigFiveB) {
  const dimensions = ['neuroticism', 'extraversion', 'openness', 'agreeableness', 'conscientiousness']
  let totalScore = 0
  const pointsPerDimension = 50 / dimensions.length
  
  dimensions.forEach(dimension => {
    const traitsA = bigFiveA[dimension]
    const traitsB = bigFiveB[dimension]
    
    if (!traitsA || !traitsB) return
    
    const allTraits = new Set([...Object.keys(traitsA), ...Object.keys(traitsB)])
    
    let dimensionScore = 0
    const pointsPerTrait = pointsPerDimension / allTraits.size
    
    allTraits.forEach(trait => {
      const valueA = traitsA[trait] || 0
      const valueB = traitsB[trait] || 0
      const diff = Math.abs(valueA - valueB)
      const k = 2.5
      const normalizedDiff = diff / 20
      const traitScore = pointsPerTrait * Math.exp(-k * normalizedDiff)
      dimensionScore += traitScore
    })
    
    totalScore += dimensionScore
  })
  
  return totalScore
}

/**
 * Calculate Lifestyle similarity (0-100 points)
 * Personal & Social: 40 points
 * Interests & Recreation: 40 points
 * Fun Questions: 20 points
 */
function calculateLifestyleScore(userA, userB) {
  let score = 0
  
  // Personal & Social (40 points)
  score += calculatePersonalSocialScore(
    userA.lifestyle_personal_social,
    userB.lifestyle_personal_social
  )
  
  // Interests & Recreation (40 points)
  score += calculateInterestsScore(
    userA.lifestyle_interests,
    userB.lifestyle_interests
  )
  
  // Fun Questions (20 points)
  score += calculateFunQuestionsScore(
    userA.lifestyle_fun_questions,
    userB.lifestyle_fun_questions
  )
  
  return score
}

/**
 * Personal & Social Score (40 points total)
 */
function calculatePersonalSocialScore(dataA, dataB) {
  if (!dataA || !dataB) return 0
  
  let score = 0
  
  // Sleep hours (5 points) - exponential decay
  const sleepDiff = Math.abs((dataA.sleep_hours || 0) - (dataB.sleep_hours || 0))
  score += 5 * Math.exp(-0.3 * sleepDiff)
  
  // Sleep schedule (3 points) - exact match
  if (dataA.sleep_schedule === dataB.sleep_schedule) {
    score += 3
  }
  
  // Screen hours (4 points) - exponential decay
  const screenDiff = Math.abs((dataA.screen_hours_weekly || 0) - (dataB.screen_hours_weekly || 0))
  score += 4 * Math.exp(-0.02 * screenDiff)
  
  // New people weekly (3 points) - exact match
  if (dataA.new_people_weekly === dataB.new_people_weekly) {
    score += 3
  }
  
  // Close friends (3 points) - exact match
  if (dataA.close_friends === dataB.close_friends) {
    score += 3
  }
  
  // Friends met distribution (8 points)
  score += comparePercentageDistribution(dataA.friends_met, dataB.friends_met, 8)
  
  // Interaction method (7 points)
  score += comparePercentageDistribution(dataA.interaction_method, dataB.interaction_method, 7)
  
  // Social time (7 points)
  score += comparePercentageDistribution(dataA.social_time, dataB.social_time, 7)
  
  return score
}

/**
 * Interests & Recreation Score (40 points total)
 */
function calculateInterestsScore(dataA, dataB) {
  if (!dataA || !dataB) return 0
  
  let score = 0
  
  // Hobbies categories (20 points)
  score += comparePercentageDistribution(dataA.hobbies_categories, dataB.hobbies_categories, 20)
  
  // Music genres (20 points)
  score += comparePercentageDistribution(dataA.music_genres, dataB.music_genres, 20)
  
  return score
}

/**
 * Fun Questions Score (20 points total)
 */
function calculateFunQuestionsScore(dataA, dataB) {
  if (!dataA || !dataB) return 0
  
  let score = 0
  const pointsPerQuestion = 20 / 10 // 10 questions
  
  // Exact match questions (2 points each)
  const exactMatchFields = [
    'time_or_money',
    'travel_or_friends',
    'know_future',
    'reborn_gender',
    'fictional_world',
    'lose_sense',
    'afterlife',
    'lifespan'
  ]
  
  exactMatchFields.forEach(field => {
    if (dataA[field] === dataB[field]) {
      score += pointsPerQuestion
    }
  })
  
  // Lucky number (exponential decay, 2 points)
  const numberDiff = Math.abs((dataA.lucky_number || 0) - (dataB.lucky_number || 0))
  score += pointsPerQuestion * Math.exp(-0.0005 * numberDiff)
  
  // Color similarity (2 points)
  score += compareColors(dataA.favorite_color, dataB.favorite_color, pointsPerQuestion)
  
  return score
}

/**
 * Compare percentage distributions (slider values)
 * Uses exponential decay for each category
 */
function comparePercentageDistribution(distA = {}, distB = {}, maxPoints) {
  const allKeys = new Set([...Object.keys(distA), ...Object.keys(distB)])
  if (allKeys.size === 0) return 0
  
  let totalScore = 0
  const pointsPerKey = maxPoints / allKeys.size
  
  allKeys.forEach(key => {
    const valueA = distA[key] || 0
    const valueB = distB[key] || 0
    const diff = Math.abs(valueA - valueB)
    
    // Exponential decay: k = 0.03 means 50% difference = ~22% similarity
    const k = 0.03
    const similarity = Math.exp(-k * diff)
    totalScore += pointsPerKey * similarity
  })
  
  return totalScore
}

/**
 * Compare colors using HSL color space
 */
function compareColors(colorA, colorB, maxPoints) {
  if (!colorA || !colorB) return 0
  
  // Convert hex to HSL for better perceptual comparison
  const hslA = hexToHSL(colorA)
  const hslB = hexToHSL(colorB)
  
  if (!hslA || !hslB) return 0
  
  // Compare hue (circular: 0° and 360° are the same)
  const hueDiff = Math.min(
    Math.abs(hslA.h - hslB.h),
    360 - Math.abs(hslA.h - hslB.h)
  )
  const satDiff = Math.abs(hslA.s - hslB.s)
  const lightDiff = Math.abs(hslA.l - hslB.l)
  
  // Weighted color difference (hue matters most)
  const colorDiff = (hueDiff / 180) * 0.6 + (satDiff / 100) * 0.2 + (lightDiff / 100) * 0.2
  
  return maxPoints * (1 - colorDiff)
}

/**
 * Convert hex color to HSL
 */
function hexToHSL(hex) {
  if (!hex || !hex.startsWith('#')) return null
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
      default: h = 0
    }
  }
  
  return {
    h: h * 360,
    s: s * 100,
    l: l * 100
  }
}

/**
 * Helper: Get MBTI type string
 */
export function getMBTITypeString(mbti) {
  if (!mbti) return 'Not set'
  const dimensions = ['energy', 'mind', 'nature', 'tactics', 'identity']
  return dimensions.map(dim => mbti[dim]?.type || '?').join('')
}