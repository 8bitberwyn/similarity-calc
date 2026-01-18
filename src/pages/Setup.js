import { useState, useEffect, useCallback } from 'react'
import { Container, Form, Button, Alert } from 'react-bootstrap'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

const MBTI_TYPES = [
  'INTJ-A Architect', 'INTJ-T Architect',
  'INTP-A Logician', 'INTP-T Logician',
  'ENTJ-A Commander', 'ENTJ-T Commander',
  'ENTP-A Debater', 'ENTP-T Debater',
  'INFJ-A Advocate', 'INFJ-T Advocate',
  'INFP-A Mediator', 'INFP-T Mediator',
  'ENFJ-A Protagonist', 'ENFJ-T Protagonist',
  'ENFP-A Campaigner', 'ENFP-T Campaigner',
  'ISTJ-A Logistician', 'ISTJ-T Logistician',
  'ISFJ-A Defender', 'ISFJ-T Defender',
  'ESTJ-A Executive', 'ESTJ-T Executive',
  'ESFJ-A Consul', 'ESFJ-T Consul',
  'ISTP-A Virtuoso', 'ISTP-T Virtuoso',
  'ISFP-A Adventurer', 'ISFP-T Adventurer',
  'ESTP-A Entrepreneur', 'ESTP-T Entrepreneur',
  'ESFP-A Entertainer', 'ESFP-T Entertainer'
]

const BIG_FIVE_TRAITS = {
  neuroticism: ['anxiety', 'anger', 'depression', 'self_consciousness', 'immoderation', 'vulnerability'],
  extraversion: ['friendliness', 'gregariousness', 'assertiveness', 'activity_level', 'excitement_seeking', 'cheerfulness'],
  openness: ['imagination', 'artistic_interests', 'emotionality', 'adventurousness', 'intellect', 'liberalism'],
  agreeableness: ['trust', 'morality', 'altruism', 'cooperation', 'modesty', 'sympathy'],
  conscientiousness: ['self_efficacy', 'orderliness', 'dutifulness', 'achievement_striving', 'self_discipline', 'cautiousness']
}

export default function Setup() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Form state
  const [mbti, setMbti] = useState('')
  const [bigFive, setBigFive] = useState({})
  const [sleepHours, setSleepHours] = useState('')
  const [pets, setPets] = useState([])
  const [sports, setSports] = useState([])
  const [hobbies, setHobbies] = useState([])

    // Load existing setup on mount
  useEffect(() => {
    loadSetup()
  }, [])

  // Wrap loadSetup in useCallback
  const loadSetup = useCallback(async () => {
    const { data } = await supabase // Removed unused error
      .from('setup_responses')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (data) {
      setMbti(data.mbti_type || '')
      setBigFive(data.big_five || {})
      setSleepHours(data.sleep_hours || '')
      setPets(data.pets || [])
      setSports(data.sports || [])
      setHobbies(data.hobbies || [])
    }
  }, [user.id])

  // Update Big Five trait value
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

    // Validate all Big Five filled
    const allFilled = Object.keys(BIG_FIVE_TRAITS).every(category =>
      BIG_FIVE_TRAITS[category].every(trait => 
        bigFive[category]?.[trait] !== undefined
      )
    )

    if (!allFilled) {
      setMessage({ type: 'danger', text: 'Please fill in all Big Five traits' })
      setLoading(false)
      return
    }

    // Upsert (insert or update)
    const { error } = await supabase
      .from('setup_responses')
      .upsert({
        user_id: user.id,
        mbti_type: mbti,
        big_five: bigFive,
        sleep_hours: parseFloat(sleepHours),
        pets,
        sports,
        hobbies,
        is_complete: true,
        completed_at: new Date().toISOString()
      })

    if (error) {
      setMessage({ type: 'danger', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Setup saved successfully!' })
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

        {message.text && <Alert variant={message.type}>{message.text}</Alert>}

        <Form onSubmit={handleSubmit}>
          {/* PERSONALITY SECTION */}
          <h4 className="mt-4">Personality</h4>
          
          <Form.Group className="mb-3">
            <Form.Label>
              MBTI Type <a href="https://www.16personalities.com/" target="_blank" rel="noopener noreferrer">(Take test)</a>
            </Form.Label>
            <Form.Select value={mbti} onChange={(e) => setMbti(e.target.value)} required>
              <option value="">Select your type...</option>
              {MBTI_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <h5>Big Five <a href="https://bigfive-test.com/" target="_blank" rel="noopener noreferrer">(Take test)</a></h5>
          
          {Object.entries(BIG_FIVE_TRAITS).map(([category, traits]) => (
            <div key={category} className="mb-3">
              <h6 className="text-capitalize">{category}</h6>
              {traits.map(trait => (
                <Form.Group key={trait} className="mb-2">
                  <Form.Label className="text-capitalize">{trait.replace(/_/g, ' ')}</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="20"
                    value={bigFive[category]?.[trait] || ''}
                    onChange={(e) => updateBigFive(category, trait, e.target.value)}
                    required
                  />
                </Form.Group>
              ))}
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

          {/* For simplicity, using comma-separated. Better: Use react-select for multi-select */}
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

          <Button variant="primary" type="submit" disabled={loading} className="mb-4">
            {loading ? 'Saving...' : 'Save Setup'}
          </Button>
        </Form>
      </Container>
    </>
  )
}