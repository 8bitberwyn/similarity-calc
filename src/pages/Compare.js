import { useState, useEffect, useCallback } from 'react' // Add useCallback
import { Container, Form, Button, Alert, Card, Row, Col, Modal } from 'react-bootstrap'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { calculateSimilarity, getMBTITypeString } from '../utils/ComparisonLogic'
import Navbar from '../components/Navbar'
import ComparisonCard from '../components/ComparisonCard'
import '../styles/Compare.css'

export default function Compare() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // User's setup completeness
  const [userSetup, setUserSetup] = useState(null)
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  
  // Search inputs
  const [searchUserId, setSearchUserId] = useState('')
  const [filterType, setFilterType] = useState('both')
  const [sortOrder, setSortOrder] = useState('descending')
  const [limitResults, setLimitResults] = useState(10)
  
  // Results
  const [comparisonResults, setComparisonResults] = useState([])
  const [directComparison, setDirectComparison] = useState(null)
  
  // Modal for detailed comparison
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState(null)

  // Wrap checkUserSetup in useCallback to stabilize the reference
  const checkUserSetup = useCallback(async () => {
    const { data } = await supabase // Removed unused 'error'
      .from('setup_responses')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (data && data.is_complete) {
      setUserSetup(data)
      setIsSetupComplete(true)
    } else {
      setIsSetupComplete(false)
    }
  }, [user.id]) // Add user.id as dependency

  // Check if current user has completed setup
  useEffect(() => {
    checkUserSetup()
  }, [checkUserSetup]) // Now checkUserSetup is stable

  // Handle direct user ID search
  const handleDirectSearch = async () => {
    if (!isSetupComplete) {
      setError('Please complete your setup before comparing!')
      return
    }

    if (!searchUserId.trim()) {
      setError('Please enter a user ID')
      return
    }

    setLoading(true)
    setError('')
    setComparisonResults([])
    setDirectComparison(null)

    try {
      // Fetch the target user's setup
      const { data: targetSetup, error: setupError } = await supabase
        .from('setup_responses')
        .select('*')
        .eq('user_id', searchUserId.trim())
        .single()

      if (setupError || !targetSetup) {
        setError('User not found or has not completed setup')
        setLoading(false)
        return
      }

      // Fetch target user's profile
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', searchUserId.trim())
        .single()

      // Calculate similarity
      const scores = calculateSimilarity(userSetup, targetSetup)

      setDirectComparison({
        userId: searchUserId.trim(),
        profile: targetProfile,
        setup: targetSetup,
        scores
      })

    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }

  // Handle filtered search (find top/bottom matches)
  const handleFilteredSearch = async () => {
    if (!isSetupComplete) {
      setError('Please complete your setup before comparing!')
      return
    }

    setLoading(true)
    setError('')
    setDirectComparison(null)
    setComparisonResults([])

    try {
      // Fetch all completed setups except current user
      const { data: allSetups, error: setupError } = await supabase
        .from('setup_responses')
        .select('*')
        .eq('is_complete', true)
        .neq('user_id', user.id)

      if (setupError) throw setupError

      // Calculate similarities for all users
      const results = allSetups.map(setup => {
        const scores = calculateSimilarity(userSetup, setup)
        return {
          userId: setup.user_id,
          setup,
          scores
        }
      })

      // Filter by section if needed
      let filteredResults = results
      if (filterType === 'personality') {
        filteredResults = results.map(r => ({
          ...r,
          sortScore: r.scores.personalityScore
        }))
      } else if (filterType === 'lifestyle') {
        filteredResults = results.map(r => ({
          ...r,
          sortScore: r.scores.lifestyleScore
        }))
      } else {
        filteredResults = results.map(r => ({
          ...r,
          sortScore: r.scores.totalScore
        }))
      }

      // Sort
      filteredResults.sort((a, b) => {
        if (sortOrder === 'ascending') {
          return a.sortScore - b.sortScore
        } else {
          return b.sortScore - a.sortScore
        }
      })

      // Limit results
      const limitedResults = filteredResults.slice(0, limitResults)

      // Fetch profiles for these users
      const userIds = limitedResults.map(r => r.userId)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      // Combine profiles with results
      const finalResults = limitedResults.map(result => {
        const profile = profiles.find(p => p.id === result.userId)
        return {
          ...result,
          profile
        }
      })

      setComparisonResults(finalResults)

    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }

  // Open detailed comparison modal
  const openComparisonModal = async (targetUserId, targetSetup, targetProfile, scores) => {
    setModalData({
      targetUserId,
      targetSetup,
      targetProfile,
      scores,
      userSetup
    })
    setShowModal(true)
  }

  return (
    <>
      <Navbar />
      <Container className="mt-4" style={{ maxWidth: '900px' }}>
        <h2>Compare</h2>
        
        <Alert variant="info" className="mb-4">
          Please be aware this website is simply a fun little project made to find people who are 
          similar to yourself. It is not a compatibility test, nor do race, age, etc. have any sway 
          in the results.
        </Alert>

        {!isSetupComplete && (
          <Alert variant="warning">
            You must complete your setup before comparing with others.{' '}
            <Alert.Link href="/setup">Go to Setup</Alert.Link>
          </Alert>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        {/* SEARCH SECTION */}
        <Card className="mb-4">
          <Card.Body>
            <h5>Search by User ID</h5>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Enter user ID..."
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                disabled={!isSetupComplete}
              />
            </Form.Group>
            <Button 
              variant="primary" 
              onClick={handleDirectSearch}
              disabled={loading || !isSetupComplete}
            >
              {loading ? 'Searching...' : 'Search User'}
            </Button>
          </Card.Body>
        </Card>

        {/* FILTER SECTION */}
        <Card className="mb-4">
          <Card.Body>
            <h5>Filter Results</h5>
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Sort Order</Form.Label>
                  <Form.Select 
                    value={sortOrder} 
                    onChange={(e) => setSortOrder(e.target.value)}
                    disabled={!isSetupComplete}
                  >
                    <option value="descending">Descending (Most Similar)</option>
                    <option value="ascending">Ascending (Least Similar)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Compare By</Form.Label>
                  <Form.Select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    disabled={!isSetupComplete}
                  >
                    <option value="both">Both (Total Score)</option>
                    <option value="personality">Personality Only</option>
                    <option value="lifestyle">Lifestyle Only</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Show Top</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="50"
                    value={limitResults}
                    onChange={(e) => setLimitResults(parseInt(e.target.value) || 10)}
                    disabled={!isSetupComplete}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Button 
              variant="success" 
              onClick={handleFilteredSearch}
              disabled={loading || !isSetupComplete}
            >
              {loading ? 'Loading...' : 'Apply Filters & Search'}
            </Button>
          </Card.Body>
        </Card>

        {/* DIRECT SEARCH RESULT */}
        {directComparison && (
          <div className="mb-4">
            <h4>Search Result</h4>
            <ComparisonCard
              userId={directComparison.userId}
              profile={directComparison.profile}
              scores={directComparison.scores}
              onViewDetails={() => openComparisonModal(
                directComparison.userId,
                directComparison.setup,
                directComparison.profile,
                directComparison.scores
              )}
            />
          </div>
        )}

        {/* FILTERED RESULTS */}
        {comparisonResults.length > 0 && (
          <div>
            <h4>Results ({comparisonResults.length})</h4>
            <Row>
              {comparisonResults.map(result => (
                <Col md={6} key={result.userId} className="mb-3">
                  <ComparisonCard
                    userId={result.userId}
                    profile={result.profile}
                    scores={result.scores}
                    onViewDetails={() => openComparisonModal(
                      result.userId,
                      result.setup,
                      result.profile,
                      result.scores
                    )}
                  />
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Detailed Comparison Modal */}
        <ComparisonModal
          show={showModal}
          onHide={() => setShowModal(false)}
          data={modalData}
        />
      </Container>
    </>
  )
}

function ComparisonModal({ show, onHide, data }) {
  if (!data) return null

  const { targetUserId, targetSetup, targetProfile, scores, userSetup } = data

  // Determine display name based on privacy setting
  const getDisplayName = () => {
    if (targetProfile?.is_public && targetProfile?.name) {
      return targetProfile.name
    }
    return targetUserId
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Detailed Comparison with {getDisplayName()}
          {targetProfile?.is_public === false && (
            <small className="text-muted ms-2">(Private Account)</small>
          )}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Score Breakdown */}
        <div className="mb-4">
          <h5>Score Breakdown</h5>
          <div className="d-flex justify-content-around text-center mb-3">
            <div>
              <h6>Personality</h6>
              <h3>{scores.personalityScore}/100</h3>
              <small className="text-muted">
                MBTI: {Math.round(scores.breakdown?.mbti || 0)}/50<br/>
                Big 5: {Math.round(scores.breakdown?.bigFive || 0)}/50
              </small>
            </div>
            <div>
              <h6>Lifestyle</h6>
              <h3>{scores.lifestyleScore}/50</h3>
            </div>
            <div>
              <h6>Total</h6>
              <h3>{scores.totalScore}/150</h3>
            </div>
          </div>
        </div>

        <hr />

        {/* MBTI Comparison */}
        <h5>MBTI</h5>
        <div className="mb-3">
          <Row>
            <Col>
              <strong>You:</strong> {getMBTITypeString(userSetup.mbti)}
            </Col>
            <Col>
              <strong>Them:</strong> {getMBTITypeString(targetSetup.mbti)}
            </Col>
          </Row>
        </div>

        {/* Detailed MBTI Breakdown */}
        {userSetup.mbti && targetSetup.mbti && (
          <div className="mb-3">
            <h6>MBTI Breakdown</h6>
            {['energy', 'mind', 'nature', 'tactics', 'identity'].map(dim => {
              const yourMBTI = userSetup.mbti[dim]
              const theirMBTI = targetSetup.mbti[dim]
              const match = yourMBTI?.type === theirMBTI?.type

              return (
                <Row key={dim} className="mb-2 small">
                  <Col xs={3} className="text-capitalize">{dim}:</Col>
                  <Col xs={4}>
                    You: {yourMBTI?.type} ({yourMBTI?.percentage}%)
                  </Col>
                  <Col xs={4}>
                    Them: {theirMBTI?.type} ({theirMBTI?.percentage}%)
                  </Col>
                  <Col xs={1}>
                    {match ? '✓' : '✗'}
                  </Col>
                </Row>
              )
            })}
          </div>
        )}

        <hr />

        {/* Big Five Comparison */}
        <h5>Big Five</h5>
        {['neuroticism', 'extraversion', 'openness', 'agreeableness', 'conscientiousness'].map(dim => {
          const yourScore = userSetup.big_five?.[dim] 
            ? Object.values(userSetup.big_five[dim]).reduce((a, b) => a + b, 0) 
            : 0
          const theirScore = targetSetup.big_five?.[dim]
            ? Object.values(targetSetup.big_five[dim]).reduce((a, b) => a + b, 0)
            : 0

          return (
            <Row key={dim} className="mb-2">
              <Col>
                <strong className="text-capitalize">{dim}:</strong>
              </Col>
              <Col>You: {yourScore}</Col>
              <Col>Them: {theirScore}</Col>
              <Col>
                <small className="text-muted">
                  Diff: {Math.abs(yourScore - theirScore)}
                </small>
              </Col>
            </Row>
          )
        })}

        <hr />

        {/* Lifestyle Comparison */}
        <h5>Lifestyle</h5>
        
        <div className="mb-3">
          <strong>Sleep Hours:</strong>
          <div>You: {userSetup.sleep_hours || 'Not set'} hours</div>
          <div>Them: {targetSetup.sleep_hours || 'Not set'} hours</div>
        </div>

        <div className="mb-3">
          <strong>Pets:</strong>
          <div>You: {userSetup.pets?.join(', ') || 'None'}</div>
          <div>Them: {targetSetup.pets?.join(', ') || 'None'}</div>
        </div>

        <div className="mb-3">
          <strong>Sports:</strong>
          <div>You: {userSetup.sports?.join(', ') || 'None'}</div>
          <div>Them: {targetSetup.sports?.join(', ') || 'None'}</div>
        </div>

        <div className="mb-3">
          <strong>Hobbies:</strong>
          <div>You: {userSetup.hobbies?.join(', ') || 'None'}</div>
          <div>Them: {targetSetup.hobbies?.join(', ') || 'None'}</div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}