import { useState, useEffect, useCallback } from 'react'
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

const BIG_FIVE_TRAITS = {
  neuroticism: ['anxiety', 'anger', 'depression', 'self_consciousness', 'immoderation', 'vulnerability'],
  extraversion: ['friendliness', 'gregariousness', 'assertiveness', 'activity_level', 'excitement_seeking', 'cheerfulness'],
  openness: ['imagination', 'artistic_interests', 'emotionality', 'adventurousness', 'intellect', 'liberalism'],
  agreeableness: ['trust', 'morality', 'altruism', 'cooperation', 'modesty', 'sympathy'],
  conscientiousness: ['self_efficacy', 'orderliness', 'dutifulness', 'achievement_striving', 'self_discipline', 'cautiousness']
}

const MBTI_DIMENSIONS = [
  { 
    key: 'energy', 
    label: 'Energy', 
    options: ['I', 'E'],
    optionLabels: ['Introverted', 'Extraverted']
  },
  { 
    key: 'mind', 
    label: 'Mind', 
    options: ['N', 'S'],
    optionLabels: ['Intuitive', 'Observant']
  },
  { 
    key: 'nature', 
    label: 'Nature', 
    options: ['F', 'T'],
    optionLabels: ['Feeling', 'Thinking']
  },
  { 
    key: 'tactics', 
    label: 'Tactics', 
    options: ['P', 'J'],
    optionLabels: ['Prospecting', 'Judging']
  },
  { 
    key: 'identity', 
    label: 'Identity', 
    options: ['A', 'T'],
    optionLabels: ['Assertive', 'Turbulent']
  }
]

export default function Setup() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // MBTI state - structured object
  const [mbti, setMbti] = useState({
    energy: { type: 'I', percentage: 50 },
    mind: { type: 'N', percentage: 50 },
    nature: { type: 'F', percentage: 50 },
    tactics: { type: 'P', percentage: 50 },
    identity: { type: 'A', percentage: 50 }
  })
  
  // Big Five state
  const [bigFive, setBigFive] = useState({})
  
  // Lifestyle state
  const [sleepHours, setSleepHours] = useState('')
  const [pets, setPets] = useState([])
  const [sports, setSports] = useState([])
  const [hobbies, setHobbies] = useState([])

  // Load existing setup
  const loadSetup = useCallback(async () => {
    const { data } = await supabase
      .from('setup_responses')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (data) {
      // Load MBTI with defaults if not set
      setMbti(data.mbti || {
        energy: { type: 'I', percentage: 50 },
        mind: { type: 'N', percentage: 50 },
        nature: { type: 'F', percentage: 50 },
        tactics: { type: 'P', percentage: 50 },
        identity: { type: 'A', percentage: 50 }
      })
      setBigFive(data.big_five || {})
      setSleepHours(data.sleep_hours || '')
      setPets(data.pets || [])
      setSports(data.sports || [])
      setHobbies(data.hobbies || [])
    }
  }, [user.id])

  useEffect(() => {
    loadSetup()
  }, [loadSetup])

  // Update MBTI dimension
  const updateMBTI = (dimension, field, value) => {
    setMbti(prev => ({
      ...prev,
      [dimension]: {
        ...prev[dimension],
        [field]: field === 'percentage' ? parseInt(value) || 50 : value
      }
    }))
  }

  // Update Big Five trait
  const updateBigFive = (category, trait, value) => {
    setBigFive(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [trait]: parseInt(value) || 0
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    // Validate Big Five
    const allBigFiveFilled = Object.keys(BIG_FIVE_TRAITS).every(category =>
      BIG_FIVE_TRAITS[category].every(trait => 
        bigFive[category]?.[trait] !== undefined && bigFive[category]?.[trait] !== ''
      )
    )

    if (!allBigFiveFilled) {
      setMessage({ type: 'danger', text: 'Please fill in all Big Five traits' })
      setLoading(false)
      return
    }

    try {
      // First, check if user already has a setup
      const { data: existingSetup } = await supabase
        .from('setup_responses')
        .select('id')
        .eq('user_id', user.id)
        .single()

      let result

      if (existingSetup) {
        // UPDATE existing setup
        result = await supabase
          .from('setup_responses')
          .update({
            mbti: mbti,
            big_five: bigFive,
            sleep_hours: parseFloat(sleepHours),
            pets,
            sports,
            hobbies,
            is_complete: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
      } else {
        // INSERT new setup
        result = await supabase
          .from('setup_responses')
          .insert({
            user_id: user.id,
            mbti: mbti,
            big_five: bigFive,
            sleep_hours: parseFloat(sleepHours),
            pets,
            sports,
            hobbies,
            is_complete: true,
            completed_at: new Date().toISOString()
          })
      }

      if (result.error) {
        setMessage({ type: 'danger', text: result.error.message })
      } else {
        setMessage({ type: 'success', text: '✓ Setup saved successfully!' })
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 3000)
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'An error occurred while saving' })
    }

    setLoading(false)
  }

  return (
    <>
      <Navbar />
      <Container className="mt-4" style={{ maxWidth: '800px' }}>
        <h2>Setup Your Profile</h2>
        <p className="text-muted">
          Please answer ALL questions to the best of your ability. If you're unsure on a particular question, 
          answer as "you" today, or as close to recent times as possible.
        </p>

        <Form onSubmit={handleSubmit}>
          {/* PERSONALITY SECTION */}
          <h4 className="mt-4">Personality</h4>
          
          {/* MBTI Section */}
          <h5>
            MBTI Type{' '}
            <a href="https://www.16personalities.com/" target="_blank" rel="noopener noreferrer">
              (Take test)
            </a>
          </h5>
          <p className="text-muted small">
            For each dimension, select your type and enter your percentage score from the test.
          </p>

          {MBTI_DIMENSIONS.map(dimension => (
            <div key={dimension.key} className="mb-4 p-3 border rounded">
              <h6 className="mb-3">{dimension.label}</h6>
              
              <Row className="align-items-center">
                {/* Type Selection */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <div className="d-flex gap-3">
                      {dimension.options.map((option, idx) => (
                        <Form.Check
                          key={option}
                          type="radio"
                          id={`${dimension.key}-${option}`}
                          name={dimension.key}
                          label={`${option} - ${dimension.optionLabels[idx]}`}
                          checked={mbti[dimension.key]?.type === option}
                          onChange={() => updateMBTI(dimension.key, 'type', option)}
                          required
                        />
                      ))}
                    </div>
                  </Form.Group>
                </Col>

                {/* Percentage Input */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      Percentage: {mbti[dimension.key]?.percentage}%
                    </Form.Label>
                    <Form.Range
                      min="50"
                      max="100"
                      value={mbti[dimension.key]?.percentage || 50}
                      onChange={(e) => updateMBTI(dimension.key, 'percentage', e.target.value)}
                    />
                    <div className="d-flex justify-content-between small text-muted">
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </div>
          ))}

          {/* Big Five Section */}
          <h5 className="mt-4">
            Big Five{' '}
            <a href="https://bigfive-test.com/" target="_blank" rel="noopener noreferrer">
              (Take test)
            </a>
          </h5>
          
          {Object.entries(BIG_FIVE_TRAITS).map(([category, traits]) => (
            <div key={category} className="mb-3">
              <h6 className="text-capitalize">{category}</h6>
              <Row>
                {traits.map(trait => (
                  <Col md={6} key={trait}>
                    <Form.Group className="mb-2">
                      <Form.Label className="text-capitalize small">
                        {trait.replace(/_/g, ' ')}
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="20"
                        value={bigFive[category]?.[trait] || ''}
                        onChange={(e) => updateBigFive(category, trait, e.target.value)}
                        required
                        size="sm"
                      />
                    </Form.Group>
                  </Col>
                ))}
              </Row>
            </div>
          ))}

          {/* LIFESTYLE SECTION */}
          <h4 className="mt-4">Lifestyle</h4>
          
          <Form.Group className="mb-3">
            <Form.Label>Average hours of sleep per night</Form.Label>
            <Form.Control
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Pets (comma-separated)</Form.Label>
            <Form.Control
              type="text"
              value={pets.join(', ')}
              onChange={(e) => setPets(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="e.g., Dog, Cat, Fish"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Sports (comma-separated)</Form.Label>
            <Form.Control
              type="text"
              value={sports.join(', ')}
              onChange={(e) => setSports(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="e.g., Soccer, Basketball"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Hobbies (comma-separated)</Form.Label>
            <Form.Control
              type="text"
              value={hobbies.join(', ')}
              onChange={(e) => setHobbies(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="e.g., Reading, Gaming, Cooking"
            />
          </Form.Group>

          <Button variant="primary" type="submit" disabled={loading} className="mb-4 w-100">
            {loading ? 'Saving...' : 'Save Setup'}
          </Button>
        </Form>
        {message.text && <Alert variant={message.type}>{message.text}</Alert>}
      </Container>
    </>
  )
}