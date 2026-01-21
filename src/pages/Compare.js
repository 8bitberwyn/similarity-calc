import { useState, useEffect, useCallback } from 'react'
import { Container, Form, Button, Alert, Card, Row, Col } from 'react-bootstrap'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { calculateSimilarity } from '../utils/ComparisonLogic'
import Navbar from '../components/Navbar'
import ComparisonCard from '../components/ComparisonCard'
import ComparisonModal from '../components/ComparisonModal'
import '../styles/Compare.css'

export default function Compare() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // User's setup completeness
  const [userSetup, setUserSetup] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
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

  // Check if current user has completed setup
  const checkUserSetup = useCallback(async () => {
    const { data: setupData } = await supabase
      .from('setup_responses')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    
    if (setupData && setupData.is_complete) {
      setUserSetup(setupData)
      setUserProfile(profileData)
      setIsSetupComplete(true)
    } else {
      setIsSetupComplete(false)
    }
  }, [user.id])

  useEffect(() => {
    checkUserSetup()
  }, [checkUserSetup])

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
        .maybeSingle()

      if (setupError) {
        console.error('Setup error:', setupError)
        setError('Error fetching user data')
        setLoading(false)
        return
      }

      if (!targetSetup) {
        setError('User not found or has not completed setup')
        setLoading(false)
        return
      }

      // Fetch target user's profile
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', searchUserId.trim())
        .maybeSingle()

      // Calculate similarity
      const scores = calculateSimilarity(userSetup, targetSetup)

      setDirectComparison({
        userId: searchUserId.trim(),
        profile: targetProfile,
        setup: targetSetup,
        scores
      })

    } catch (err) {
      console.error('Search error:', err)
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

      if (setupError) {
        console.error('Setup error:', setupError)
        throw setupError
      }

      if (!allSetups || allSetups.length === 0) {
        setError('No other users have completed their setup yet')
        setLoading(false)
        return
      }

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
      let filteredResults = results.map(r => {
        let sortScore
        if (filterType === 'personality') {
          sortScore = r.scores.personalityScore
        } else if (filterType === 'lifestyle') {
          sortScore = r.scores.lifestyleScore
        } else {
          sortScore = r.scores.totalScore
        }
        return { ...r, sortScore }
      })

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
        const profile = profiles?.find(p => p.id === result.userId)
        return {
          ...result,
          profile
        }
      })

      setComparisonResults(finalResults)

    } catch (err) {
      console.error('Filter error:', err)
      setError(err.message)
    }

    setLoading(false)
  }

  // Open detailed comparison modal
  const openComparisonModal = (targetUserId, targetSetup, targetProfile, scores) => {
    setModalData({
      targetUserId,
      targetSetup,
      targetProfile,
      scores,
      userSetup,
      userProfile
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
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleDirectSearch()
                  }
                }}
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
            <h5>Find Matches</h5>
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Sort Order</Form.Label>
                  <Form.Select 
                    value={sortOrder} 
                    onChange={(e) => setSortOrder(e.target.value)}
                    disabled={!isSetupComplete}
                  >
                    <option value="descending">Most Similar First</option>
                    <option value="ascending">Least Similar First</option>
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
                    <option value="both">Total Score</option>
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
              {loading ? 'Loading...' : 'Find Matches'}
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