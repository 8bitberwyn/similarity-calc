import { Modal, Button } from 'react-bootstrap'
import { getMBTITypeString } from '../utils/ComparisonLogic'
import '../styles/ComparisonModal.css'

export default function ComparisonModal({ show, onHide, data }) {
  if (!data) return null

  const { targetUserId, targetSetup, targetProfile, scores, userSetup } = data

  // Get display name based on privacy
  const getDisplayName = () => {
    if (targetProfile?.is_public && targetProfile?.name) {
      return targetProfile.name
    }
    return targetUserId
  }

  // Get color based on similarity (0-1 scale)
  const getSimilarityColor = (similarity) => {
    if (similarity >= 0.9) return '#c8e6c9' // Light green
    if (similarity >= 0.7) return '#b3e5fc' // Light blue
    if (similarity >= 0.4) return '#fff9c4' // Light yellow
    return '#ffccbc' // Light red
  }

  // Compare two values and return similarity (0-1)
  const calculateValueSimilarity = (valueA, valueB, maxDiff = 20) => {
    const diff = Math.abs(valueA - valueB)
    return Math.exp(-2.5 * (diff / maxDiff))
  }

  // Render comparison row with color
  const ComparisonRow = ({ label, valueA, valueB, maxDiff = 20 }) => {
    const similarity = calculateValueSimilarity(valueA, valueB, maxDiff)
    const bgColor = getSimilarityColor(similarity)

    return (
      <div 
        className="comparison-row p-2 mb-2 rounded"
        style={{ backgroundColor: bgColor }}
      >
        <div className="row">
          <div className="col-4">
            <strong>{label}</strong>
          </div>
          <div className="col-4 text-center">
            You: {valueA}
          </div>
          <div className="col-4 text-center">
            Them: {valueB}
          </div>
        </div>
      </div>
    )
  }

  // Render MBTI dimension comparison
  const MBTIDimensionRow = ({ dimension, label }) => {
    const yourMBTI = userSetup.mbti?.[dimension]
    const theirMBTI = targetSetup.mbti?.[dimension]
    
    if (!yourMBTI || !theirMBTI) return null

    const match = yourMBTI.type === theirMBTI.type
    const similarity = match 
      ? calculateValueSimilarity(yourMBTI.percentage, theirMBTI.percentage, 100)
      : 0
    const bgColor = getSimilarityColor(similarity)

    return (
      <div 
        className="comparison-row p-2 mb-2 rounded"
        style={{ backgroundColor: bgColor }}
      >
        <div className="row">
          <div className="col-4">
            <strong>{label}</strong>
          </div>
          <div className="col-4 text-center">
            {yourMBTI.type} ({yourMBTI.percentage}%)
          </div>
          <div className="col-4 text-center">
            {theirMBTI.type} ({theirMBTI.percentage}%)
          </div>
        </div>
      </div>
    )
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          Detailed Comparison with {getDisplayName()}
          {targetProfile?.is_public === false && (
            <small className="text-muted ms-2">(Private Account)</small>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Score Breakdown */}
        <div className="mb-4 text-center">
          <h5>Overall Similarity</h5>
          <div className="d-flex justify-content-around mb-3">
            <div>
              <h6>Personality</h6>
              <h3 className="text-primary">{scores.personalityScore}/100</h3>
              <small className="text-muted">
                MBTI: {Math.round(scores.breakdown?.mbti || 0)}/50<br/>
                Big 5: {Math.round(scores.breakdown?.bigFive || 0)}/50
              </small>
            </div>
            <div>
              <h6>Lifestyle</h6>
              <h3 className="text-success">{scores.lifestyleScore}/100</h3>
              <small className="text-muted">
                Personal: {Math.round(scores.breakdown?.personalSocial || 0)}/40<br/>
                Interests: {Math.round(scores.breakdown?.interests || 0)}/40<br/>
                Fun: {Math.round(scores.breakdown?.funQuestions || 0)}/20
              </small>
            </div>
            <div>
              <h6>Total</h6>
              <h2 className="text-info">{scores.totalScore}/200</h2>
            </div>
          </div>
        </div>

        <hr />

        {/* MBTI Comparison */}
        <h5 className="mb-3">MBTI Type</h5>
        <div className="text-center mb-3">
          <strong>You: </strong>{getMBTITypeString(userSetup.mbti)}
          <span className="mx-3">vs</span>
          <strong>Them: </strong>{getMBTITypeString(targetSetup.mbti)}
        </div>

        {userSetup.mbti && targetSetup.mbti && (
          <div className="mb-4">
            <MBTIDimensionRow dimension="energy" label="Energy (I/E)" />
            <MBTIDimensionRow dimension="mind" label="Mind (N/S)" />
            <MBTIDimensionRow dimension="nature" label="Nature (F/T)" />
            <MBTIDimensionRow dimension="tactics" label="Tactics (P/J)" />
            <MBTIDimensionRow dimension="identity" label="Identity (A/T)" />
          </div>
        )}

        <hr />

        {/* Big Five Comparison */}
        <h5 className="mb-3">Big Five Personality Traits</h5>
        {['neuroticism', 'extraversion', 'openness', 'agreeableness', 'conscientiousness'].map(dim => {
          const yourTraits = userSetup.big_five?.[dim] || {}
          const theirTraits = targetSetup.big_five?.[dim] || {}
          
          const yourTotal = Object.values(yourTraits).reduce((a, b) => a + b, 0)
          const theirTotal = Object.values(theirTraits).reduce((a, b) => a + b, 0)

          return (
            <div key={dim} className="mb-3">
              <h6 className="text-capitalize mb-2">{dim}</h6>
              <ComparisonRow 
                label="Total" 
                valueA={yourTotal} 
                valueB={theirTotal}
                maxDiff={120}
              />
            </div>
          )
        })}

        <hr />

        {/* Lifestyle - Personal & Social */}
        <h5 className="mb-3">Personal & Social</h5>
        {userSetup.lifestyle_personal_social && targetSetup.lifestyle_personal_social && (
          <>
            <ComparisonRow
              label="Sleep Hours"
              valueA={`${userSetup.lifestyle_personal_social.sleep_hours || 0} hrs`}
              valueB={`${targetSetup.lifestyle_personal_social.sleep_hours || 0} hrs`}
              maxDiff={12}
            />
            <ComparisonRow
              label="Sleep Schedule"
              valueA={['Early Bird', 'Normal', 'Night Owl', 'No Schedule'][userSetup.lifestyle_personal_social.sleep_schedule]}
              valueB={['Early Bird', 'Normal', 'Night Owl', 'No Schedule'][targetSetup.lifestyle_personal_social.sleep_schedule]}
              maxDiff={3}
            />
            <ComparisonRow
              label="Screen Time/Week"
              valueA={`${userSetup.lifestyle_personal_social.screen_hours_weekly || 0} hrs`}
              valueB={`${targetSetup.lifestyle_personal_social.screen_hours_weekly || 0} hrs`}
              maxDiff={100}
            />
            <ComparisonRow
              label="New People Weekly"
              valueA={['0', '1-10', '10-50', '>50'][userSetup.lifestyle_personal_social.new_people_weekly]}
              valueB={['0', '1-10', '10-50', '>50'][targetSetup.lifestyle_personal_social.new_people_weekly]}
              maxDiff={3}
            />
            <ComparisonRow
              label="Close Friends"
              valueA={['0-5', '6-15', '16-30', '>30'][userSetup.lifestyle_personal_social.close_friends]}
              valueB={['0-5', '6-15', '16-30', '>30'][targetSetup.lifestyle_personal_social.close_friends]}
              maxDiff={3}
            />
          </>
        )}

        <hr />

        {/* Lifestyle - Interests */}
        <h5 className="mb-3">Interests & Recreation</h5>
        {userSetup.lifestyle_interests && targetSetup.lifestyle_interests && (
          <>
            <h6 className="mt-3">Hobbies</h6>
            <div className="mb-3 p-2 bg-light rounded">
              <div><strong>You:</strong> {userSetup.lifestyle_interests.hobbies_list || 'Not specified'}</div>
              <div><strong>Them:</strong> {targetSetup.lifestyle_interests.hobbies_list || 'Not specified'}</div>
            </div>

            <h6 className="mt-3">Music</h6>
            <div className="mb-3 p-2 bg-light rounded">
              <div><strong>You:</strong> {userSetup.lifestyle_interests.music_subgenres || 'Not specified'}</div>
              <div><strong>Them:</strong> {targetSetup.lifestyle_interests.music_subgenres || 'Not specified'}</div>
            </div>
          </>
        )}

        <hr />

        {/* Fun Questions */}
        <h5 className="mb-3">Philosophical Questions</h5>
        {userSetup.lifestyle_fun_questions && targetSetup.lifestyle_fun_questions && (
          <>
            <ComparisonRow
              label="Lucky Number"
              valueA={userSetup.lifestyle_fun_questions.lucky_number}
              valueB={targetSetup.lifestyle_fun_questions.lucky_number}
              maxDiff={9999}
            />
            <div className="comparison-row p-2 mb-2 rounded" style={{ 
              backgroundColor: getSimilarityColor(
                userSetup.lifestyle_fun_questions.favorite_color === targetSetup.lifestyle_fun_questions.favorite_color ? 1 : 0.3
              )
            }}>
              <div className="row align-items-center">
                <div className="col-4">
                  <strong>Favorite Color</strong>
                </div>
                <div className="col-4 text-center">
                  <div className="d-inline-block" style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: userSetup.lifestyle_fun_questions.favorite_color,
                    border: '2px solid #333',
                    borderRadius: '4px'
                  }}></div>
                </div>
                <div className="col-4 text-center">
                  <div className="d-inline-block" style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: targetSetup.lifestyle_fun_questions.favorite_color,
                    border: '2px solid #333',
                    borderRadius: '4px'
                  }}></div>
                </div>
              </div>
            </div>
          </>
        )}

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}