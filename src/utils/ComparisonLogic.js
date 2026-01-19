// src/utils/comparisonLogic.js

/**
 * Calculate similarity score between two users
 * Personality: 100 points total (50 MBTI + 50 Big Five)
 * Lifestyle: 50 points total
 * TOTAL: 150 points
 */
export function calculateSimilarity(userA, userB) {
  const personalityTests = []
  
  // MBTI Score (will be scaled to 50 points)
  if (userA.mbti && userB.mbti) {
    personalityTests.push(calculateMBTIScore(userA.mbti, userB.mbti))
  }
  
  // Big Five Score (will be scaled to 50 points)
  if (userA.big_five && userB.big_five) {
    personalityTests.push(calculateBigFiveScore(userA.big_five, userB.big_five))
  }
  
  // Calculate average and scale to 100 points total for personality
  const personalityScore = personalityTests.length > 0
    ? (personalityTests.reduce((sum, score) => sum + score, 0) / personalityTests.length) * 2
    : 0
  
  // LIFESTYLE (50 points total)
  const lifestyleScore = calculateLifestyleScore(userA, userB)
  
  return {
    personalityScore: Math.round(personalityScore),
    lifestyleScore: Math.round(lifestyleScore),
    totalScore: Math.round(personalityScore + lifestyleScore),
    breakdown: {
      mbti: personalityTests[0] || 0,
      bigFive: personalityTests[1] || 0
    }
  }
}

/**
 * Calculate MBTI similarity score (0-50 points)
 * Uses exponential decay for percentage differences
 */
function calculateMBTIScore(mbtiA, mbtiB) {
  const dimensions = ['energy', 'mind', 'nature', 'tactics', 'identity']
  let totalScore = 0
  const pointsPerDimension = 50 / dimensions.length // 10 points each
  
  dimensions.forEach(dimension => {
    const a = mbtiA[dimension]
    const b = mbtiB[dimension]
    
    if (!a || !b) return
    
    // If different letters (e.g., I vs E), score is 0 for this dimension
    if (a.type !== b.type) {
      totalScore += 0
      return
    }
    
    // Same letter - compare percentages with exponential decay
    const percentDiff = Math.abs(a.percentage - b.percentage)
    
    // Exponential decay formula: score = max * e^(-k * diff)
    // k controls decay rate (higher = faster decay)
    const k = 0.05 // Tunable parameter
    const dimensionScore = pointsPerDimension * Math.exp(-k * percentDiff)
    
    totalScore += dimensionScore
  })
  
  return totalScore
}

/**
 * Calculate Big Five similarity score (0-50 points)
 * Compares each trait individually with exponential decay
 */
function calculateBigFiveScore(bigFiveA, bigFiveB) {
  const dimensions = ['neuroticism', 'extraversion', 'openness', 'agreeableness', 'conscientiousness']
  let totalScore = 0
  const pointsPerDimension = 50 / dimensions.length // 10 points each
  
  dimensions.forEach(dimension => {
    const traitsA = bigFiveA[dimension]
    const traitsB = bigFiveB[dimension]
    
    if (!traitsA || !traitsB) return
    
    // Get all trait keys for this dimension
    const allTraits = new Set([
      ...Object.keys(traitsA),
      ...Object.keys(traitsB)
    ])
    
    let dimensionScore = 0
    const pointsPerTrait = pointsPerDimension / allTraits.size
    
    allTraits.forEach(trait => {
      const valueA = traitsA[trait] || 0
      const valueB = traitsB[trait] || 0
      
      const diff = Math.abs(valueA - valueB)
      
      // Exponential decay: max difference is 20, so normalize
      // Formula: score = max * e^(-k * (diff/maxDiff))
      const k = 2.5 // Steeper decay than MBTI
      const normalizedDiff = diff / 20 // Max trait value is 20
      const traitScore = pointsPerTrait * Math.exp(-k * normalizedDiff)
      
      dimensionScore += traitScore
    })
    
    totalScore += dimensionScore
  })
  
  return totalScore
}

/**
 * Calculate Lifestyle similarity score (0-50 points)
 */
function calculateLifestyleScore(userA, userB) {
  let lifestyleScore = 0
  
  // Sleep similarity (10 points) - using exponential decay
  const sleepDiff = Math.abs((userA.sleep_hours || 0) - (userB.sleep_hours || 0))
  lifestyleScore += 10 * Math.exp(-0.3 * sleepDiff)
  
  // Pets overlap (15 points)
  lifestyleScore += calculateArrayOverlap(userA.pets, userB.pets, 15)
  
  // Sports overlap (12 points)
  lifestyleScore += calculateArrayOverlap(userA.sports, userB.sports, 12)
  
  // Hobbies overlap (13 points)
  lifestyleScore += calculateArrayOverlap(userA.hobbies, userB.hobbies, 13)
  
  return lifestyleScore
}

/**
 * Calculate overlap between two arrays using Jaccard similarity
 */
function calculateArrayOverlap(arr1 = [], arr2 = [], maxPoints) {
  if (arr1.length === 0 && arr2.length === 0) return 0
  
  const set1 = new Set(arr1.map(item => item.toLowerCase()))
  const set2 = new Set(arr2.map(item => item.toLowerCase()))
  
  const intersection = [...set1].filter(item => set2.has(item)).length
  const union = new Set([...set1, ...set2]).size
  
  if (union === 0) return 0
  
  return (intersection / union) * maxPoints
}

/**
 * Helper: Get MBTI type string from MBTI object (for display)
 */
export function getMBTITypeString(mbti) {
  if (!mbti) return 'Not set'
  
  const dimensions = ['energy', 'mind', 'nature', 'tactics', 'identity']
  return dimensions
    .map(dim => mbti[dim]?.type || '?')
    .join('')
}