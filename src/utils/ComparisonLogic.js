// src/utils/comparisonLogic.js

// Calculate similarity score between two users
export function calculateSimilarity(userA, userB) {
  let personalityScore = 0
  let lifestyleScore = 0

  // PERSONALITY (50 points total)
  
  // MBTI Match (10 points)
  if (userA.mbti_type === userB.mbti_type) {
    personalityScore += 10
  } else if (userA.mbti_type?.slice(0, 4) === userB.mbti_type?.slice(0, 4)) {
    // Same base type, different assertion (-A vs -T)
    personalityScore += 7
  }

  // Big Five Similarity (40 points - 8 per dimension)
  const dimensions = ['neuroticism', 'extraversion', 'openness', 'agreeableness', 'conscientiousness']
  
  dimensions.forEach(dim => {
    const scoreA = calculateBigFiveDimensionScore(userA.big_five?.[dim])
    const scoreB = calculateBigFiveDimensionScore(userB.big_five?.[dim])
    
    // Max difference is 120 (6 traits * 20)
    // Convert to 0-8 scale
    const difference = Math.abs(scoreA - scoreB)
    const similarity = Math.max(0, 8 - (difference / 120) * 8)
    personalityScore += similarity
  })

  // LIFESTYLE (50 points total)
  
  // Sleep similarity (10 points)
  const sleepDiff = Math.abs((userA.sleep_hours || 0) - (userB.sleep_hours || 0))
  lifestyleScore += Math.max(0, 10 - sleepDiff * 2)

  // Pets overlap (15 points)
  lifestyleScore += calculateArrayOverlap(userA.pets, userB.pets, 15)

  // Sports overlap (12 points)
  lifestyleScore += calculateArrayOverlap(userA.sports, userB.sports, 12)

  // Hobbies overlap (13 points)
  lifestyleScore += calculateArrayOverlap(userA.hobbies, userB.hobbies, 13)

  return {
    personalityScore: Math.round(personalityScore),
    lifestyleScore: Math.round(lifestyleScore),
    totalScore: Math.round(personalityScore + lifestyleScore)
  }
}

// Sum all trait scores for a Big Five dimension
function calculateBigFiveDimensionScore(dimension) {
  if (!dimension) return 0
  return Object.values(dimension).reduce((sum, val) => sum + (val || 0), 0)
}

// Calculate overlap percentage between two arrays
function calculateArrayOverlap(arr1 = [], arr2 = [], maxPoints) {
  if (arr1.length === 0 && arr2.length === 0) return 0
  
  const set1 = new Set(arr1.map(item => item.toLowerCase()))
  const set2 = new Set(arr2.map(item => item.toLowerCase()))
  
  const intersection = [...set1].filter(item => set2.has(item)).length
  const union = new Set([...set1, ...set2]).size
  
  if (union === 0) return 0
  
  return (intersection / union) * maxPoints
}