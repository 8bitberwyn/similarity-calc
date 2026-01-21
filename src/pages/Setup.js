import { useState, useEffect, useCallback } from 'react'
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import ConstrainedSliders from '../components/ConstrainedSliders'
import Navbar from '../components/Navbar'

import '../styles/Setup.css'

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
  const [lifestylePersonalSocial, setLifestylePersonalSocial] = useState({
    sleep_hours: '',
    sleep_schedule: 1,
    screen_hours_weekly: 30,
    new_people_weekly: 1,
    close_friends: 1,
    friends_met: { school: 0, college: 0, work: 0, online: 0, social: 0 },
    interaction_method: { message: 0, call: 0, in_person: 0, other: 0 },
    social_time: { alone: 0, one_on_one: 0, small_group: 0, large_group: 0 }
  })

  const [lifestyleInterests, setLifestyleInterests] = useState({
    hobbies_categories: { fitness: 0, art: 0, entertainment: 0, agriculture: 0, other: 0 },
    hobbies_list: '',
    music_genres: { rock: 0, pop: 0, hiphop: 0, electronic: 0, jazz: 0, classical: 0, country: 0, rnb: 0, folk: 0, others: 0 },
    music_subgenres: ''
  })

  const [lifestyleFunQuestions, setLifestyleFunQuestions] = useState({
    time_or_money: null,
    travel_or_friends: null,
    know_future: null,
    reborn_gender: null,
    fictional_world: null,
    lose_sense: null,
    afterlife: null,
    lifespan: null,
    lucky_number: '',
    favorite_color: '#000000'
  })

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
      setLifestylePersonalSocial(data.lifestyle_personal_social || {
        sleep_hours: 7,
        sleep_schedule: 1,
        screen_hours_weekly: 30,
        new_people_weekly: 1,
        close_friends: 1,
        friends_met: { school: 0, college: 0, work: 0, online: 0, social: 0 },
        interaction_method: { message: 0, call: 0, in_person: 0, other: 0 },
        social_time: { alone: 0, one_on_one: 0, small_group: 0, large_group: 0 }
      })

      setLifestyleInterests(data.lifestyle_interests || {
        hobbies_categories: { fitness: 0, art: 0, entertainment: 0, agriculture: 0, other: 0 },
        hobbies_list: '',
        music_genres: { rock: 0, pop: 0, hiphop: 0, electronic: 0, jazz: 0, classical: 0, country: 0, rnb: 0, folk: 0, others: 0 },
        music_subgenres: ''
      })

      setLifestyleFunQuestions(data.lifestyle_fun_questions || {
        time_or_money: null,
        travel_or_friends: null,
        know_future: null,
        reborn_gender: null,
        fictional_world: null,
        lose_sense: null,
        afterlife: null,
        lifespan: null,
        lucky_number: '',
        favorite_color: '#000000'
      })
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
      const { error } = await supabase
        .from('setup_responses')
        .upsert(
          {
            user_id: user.id,
            mbti: mbti,
            big_five: bigFive,
            lifestyle_personal_social: lifestylePersonalSocial,
            lifestyle_interests: lifestyleInterests,
            lifestyle_fun_questions: lifestyleFunQuestions,
            is_complete: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        )

      if (error) throw error

      setMessage({ type: 'success', text: '✓ Setup saved successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)

    } catch (error) {
      console.error('Save error:', error)
      setMessage({ type: 'danger', text: `Error saving setup: ${error.message}` })
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
          answer as the "you" of today, or as close to recent times as possible.
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
          <h4 className="mt-5">Lifestyle</h4>
          <p className="text-muted">
            This section is about you outside of work, school, or responsibilities.
            Think about how you spend your weekends and free days; your habits, interests, and everyday life.
          </p>

          {/* PERSONAL & SOCIAL */}
          <h5 className="mt-4">Personal & Social</h5>

          <Form.Group className="mb-3">
            <Form.Label>Hours of sleep per night (on average)</Form.Label>
            <Form.Control
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={lifestylePersonalSocial.sleep_hours}
              onChange={(e) => setLifestylePersonalSocial({
                ...lifestylePersonalSocial,
                sleep_hours: parseFloat(e.target.value) || 0
              })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Sleep Schedule</Form.Label>
            <Form.Select
              value={lifestylePersonalSocial.sleep_schedule}
              onChange={(e) => setLifestylePersonalSocial({
                ...lifestylePersonalSocial,
                sleep_schedule: parseInt(e.target.value)
              })}
              required
            >
              <option value={0}>Early Bird (before 9pm)</option>
              <option value={1}>Normal (9pm-12am)</option>
              <option value={2}>Night Owl (past 12am)</option>
              <option value={3}>No consistent sleep schedule</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Hours spent in front of a screen per week (on average)</Form.Label>
            <Form.Control
              type="number"
              min="0"
              max="168"
              value={lifestylePersonalSocial.screen_hours_weekly}
              onChange={(e) => setLifestylePersonalSocial({
                ...lifestylePersonalSocial,
                screen_hours_weekly: parseInt(e.target.value) || 0
              })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>How many new people do you interact with weekly?</Form.Label>
            <Form.Text className="d-block text-muted mb-2">
              Not counting hospitality workers, just everyday interactions (online or in-person)
            </Form.Text>
            <Form.Select
              value={lifestylePersonalSocial.new_people_weekly}
              onChange={(e) => setLifestylePersonalSocial({
                ...lifestylePersonalSocial,
                new_people_weekly: parseInt(e.target.value)
              })}
              required
            >
              <option value={0}>0</option>
              <option value={1}>1-10</option>
              <option value={2}>10-50</option>
              <option value={3}>More than 50</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>How many people do you consider close friends?</Form.Label>
            <Form.Text className="d-block text-muted mb-2">
              People you can be your real self around
            </Form.Text>
            <Form.Select
              value={lifestylePersonalSocial.close_friends}
              onChange={(e) => setLifestylePersonalSocial({
                ...lifestylePersonalSocial,
                close_friends: parseInt(e.target.value)
              })}
              required
            >
              <option value={0}>0-5</option>
              <option value={1}>6-15</option>
              <option value={2}>16-30</option>
              <option value={3}>More than 30</option>
            </Form.Select>
          </Form.Group>

          <ConstrainedSliders
            title="Where did you meet your close friends?"
            labels={[
              { key: 'school', label: 'School' },
              { key: 'college', label: 'University/College' },
              { key: 'work', label: 'Work' },
              { key: 'online', label: 'Online' },
              { key: 'social', label: 'Social Events' }
            ]}
            values={lifestylePersonalSocial.friends_met}
            onChange={(updated) => setLifestylePersonalSocial({
              ...lifestylePersonalSocial,
              friends_met: updated
            })}
          />

          <ConstrainedSliders
            title="How do you interact with your friends?"
            labels={[
              { key: 'message', label: 'Message/Text' },
              { key: 'call', label: 'Call/Video Call' },
              { key: 'in_person', label: 'In-person outings' },
              { key: 'other', label: 'Other' }
            ]}
            values={lifestylePersonalSocial.interaction_method}
            onChange={(updated) => setLifestylePersonalSocial({
              ...lifestylePersonalSocial,
              interaction_method: updated
            })}
          />

          <ConstrainedSliders
            title="How much time do you spend in these social situations weekly?"
            labels={[
              { key: 'alone', label: 'Alone' },
              { key: 'one_on_one', label: 'One-on-one' },
              { key: 'small_group', label: 'Small groups (3-10)' },
              { key: 'large_group', label: 'Large groups (>10)' }
            ]}
            values={lifestylePersonalSocial.social_time}
            onChange={(updated) => setLifestylePersonalSocial({
              ...lifestylePersonalSocial,
              social_time: updated
            })}
          />

          {/* INTERESTS & RECREATION */}
          <h5 className="mt-5">Interests & Recreation</h5>

          <ConstrainedSliders
            title="What are your hobbies? (by category)"
            labels={[
              { key: 'fitness', label: 'Fitness' },
              { key: 'art', label: 'Art' },
              { key: 'entertainment', label: 'Entertainment' },
              { key: 'agriculture', label: 'Agriculture' },
              { key: 'other', label: 'Other' }
            ]}
            values={lifestyleInterests.hobbies_categories}
            onChange={(updated) => setLifestyleInterests({
              ...lifestyleInterests,
              hobbies_categories: updated
            })}
          />

          <Form.Group className="mb-4">
            <Form.Label>List your specific hobbies</Form.Label>
            <Form.Text className="d-block text-muted mb-2">
              For comparison only (not scored)
            </Form.Text>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="e.g., Guitar, Running, Photography, Gaming"
              value={lifestyleInterests.hobbies_list}
              onChange={(e) => setLifestyleInterests({
                ...lifestyleInterests,
                hobbies_list: e.target.value
              })}
            />
          </Form.Group>

          <ConstrainedSliders
            title="What music do you listen to? (by genre)"
            labels={[
              { key: 'rock', label: 'Rock' },
              { key: 'pop', label: 'Pop' },
              { key: 'hiphop', label: 'Hip-Hop' },
              { key: 'electronic', label: 'Electronic (EDM)' },
              { key: 'jazz', label: 'Jazz' },
              { key: 'classical', label: 'Classical' },
              { key: 'country', label: 'Country' },
              { key: 'rnb', label: 'R&B' },
              { key: 'folk', label: 'Folk' },
              { key: 'others', label: 'Others' }
            ]}
            values={lifestyleInterests.music_genres}
            onChange={(updated) => setLifestyleInterests({
              ...lifestyleInterests,
              music_genres: updated
            })}
          />
          <Form.Group className="mb-4">
            <Form.Label>List specific subgenres you enjoy</Form.Label>
            <Form.Text className="d-block text-muted mb-2">
              For comparison only (not scored)
            </Form.Text>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="e.g., Post-rock, Indie pop, Lo-fi hip hop"
              value={lifestyleInterests.music_subgenres}
              onChange={(e) => setLifestyleInterests({
                ...lifestyleInterests,
                music_subgenres: e.target.value
              })}
            />
          </Form.Group>
          {/* FUN QUESTIONS */}
          <h5 className="mt-5">Philosophical Questions</h5>
          <p className="text-muted small">
            Answer these thought-provoking questions honestly
          </p>

          <div className="fun-question-card">
            <Form.Label className="fun-question-label">Would you rather:</Form.Label>
            <div className="radio-group">
              <Form.Check
                type="radio"
                id="time-money-0"
                name="time_or_money"
                label="Go back in time and be reborn with all current memories"
                value={0}
                checked={lifestyleFunQuestions.time_or_money === 0}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  time_or_money: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="time-money-1"
                name="time_or_money"
                label="Age 5 years instantly but gain $1 million USD"
                value={1}
                checked={lifestyleFunQuestions.time_or_money === 1}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  time_or_money: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="time-money-2"
                name="time_or_money"
                label="Stay as you are now"
                value={2}
                checked={lifestyleFunQuestions.time_or_money === 2}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  time_or_money: parseInt(e.target.value)
                })}
                required
              />
            </div>
          </div>

          <div className="fun-question-card">
            <Form.Label className="fun-question-label">Would you rather:</Form.Label>
            <div className="radio-group">
              <Form.Check
                type="radio"
                id="travel-friends-0"
                name="travel_or_friends"
                label="Travel the world alone for a year"
                value={0}
                checked={lifestyleFunQuestions.travel_or_friends === 0}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  travel_or_friends: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="travel-friends-1"
                name="travel_or_friends"
                label="Stay home with closest friends for a year"
                value={1}
                checked={lifestyleFunQuestions.travel_or_friends === 1}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  travel_or_friends: parseInt(e.target.value)
                })}
                required
              />
            </div>
          </div>

          <div className="fun-question-card">
            <Form.Label className="fun-question-label">
              If given the choice to know your future exactly, would you take it?
            </Form.Label>
            <div className="radio-group">
              <Form.Check
                type="radio"
                id="know-future-0"
                name="know_future"
                label="Yes"
                value={0}
                checked={lifestyleFunQuestions.know_future === 0}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  know_future: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="know-future-1"
                name="know_future"
                label="No"
                value={1}
                checked={lifestyleFunQuestions.know_future === 1}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  know_future: parseInt(e.target.value)
                })}
                required
              />
            </div>
          </div>

          <div className="fun-question-card">
            <Form.Label className="fun-question-label">
              If given a chance to be reborn as another gender, would you take it?
            </Form.Label>
            <div className="radio-group">
              <Form.Check
                type="radio"
                id="reborn-gender-0"
                name="reborn_gender"
                label="Yes"
                value={0}
                checked={lifestyleFunQuestions.reborn_gender === 0}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  reborn_gender: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="reborn-gender-1"
                name="reborn_gender"
                label="No"
                value={1}
                checked={lifestyleFunQuestions.reborn_gender === 1}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  reborn_gender: parseInt(e.target.value)
                })}
                required
              />
            </div>
          </div>

          <div className="fun-question-card">
            <Form.Label className="fun-question-label">
              If given a chance to be transported to a fictional world of your choosing, would you take it?
            </Form.Label>
            <div className="radio-group">
              <Form.Check
                type="radio"
                id="fictional-world-0"
                name="fictional_world"
                label="Yes"
                value={0}
                checked={lifestyleFunQuestions.fictional_world === 0}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  fictional_world: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="fictional-world-1"
                name="fictional_world"
                label="No"
                value={1}
                checked={lifestyleFunQuestions.fictional_world === 1}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  fictional_world: parseInt(e.target.value)
                })}
                required
              />
            </div>
          </div>

          <div className="fun-question-card">
            <Form.Label className="fun-question-label">
              If you had to lose one of the 5 senses forever, which would you pick?
            </Form.Label>
            <div className="radio-group">
              <Form.Check
                type="radio"
                id="lose-sense-0"
                name="lose_sense"
                label="Touch"
                value={0}
                checked={lifestyleFunQuestions.lose_sense === 0}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  lose_sense: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="lose-sense-1"
                name="lose_sense"
                label="Smell"
                value={1}
                checked={lifestyleFunQuestions.lose_sense === 1}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  lose_sense: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="lose-sense-2"
                name="lose_sense"
                label="Sound"
                value={2}
                checked={lifestyleFunQuestions.lose_sense === 2}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  lose_sense: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="lose-sense-3"
                name="lose_sense"
                label="Sight"
                value={3}
                checked={lifestyleFunQuestions.lose_sense === 3}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  lose_sense: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="lose-sense-4"
                name="lose_sense"
                label="Taste"
                value={4}
                checked={lifestyleFunQuestions.lose_sense === 4}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  lose_sense: parseInt(e.target.value)
                })}
                required
              />
            </div>
          </div>

          <div className="fun-question-card">
            <Form.Label className="fun-question-label">
              Which of the following is most appealing if you were to pass away?
            </Form.Label>
            <div className="radio-group">
              <Form.Check
                type="radio"
                id="afterlife-0"
                name="afterlife"
                label="Everything goes blank, consciousness disappears"
                value={0}
                checked={lifestyleFunQuestions.afterlife === 0}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  afterlife: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="afterlife-1"
                name="afterlife"
                label="Spectate the world as a ghost (limited by human travel)"
                value={1}
                checked={lifestyleFunQuestions.afterlife === 1}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  afterlife: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="afterlife-2"
                name="afterlife"
                label="Be reborn as any living being (not human)"
                value={2}
                checked={lifestyleFunQuestions.afterlife === 2}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  afterlife: parseInt(e.target.value)
                })}
                required
              />
            </div>
          </div>

          <div className="fun-question-card">
            <Form.Label className="fun-question-label">
              If you were to be reborn, what age would you want to live to?
            </Form.Label>
            <div className="radio-group">
              <Form.Check
                type="radio"
                id="lifespan-0"
                name="lifespan"
                label="50-100 years"
                value={0}
                checked={lifestyleFunQuestions.lifespan === 0}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  lifespan: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="lifespan-1"
                name="lifespan"
                label="100-500 years"
                value={1}
                checked={lifestyleFunQuestions.lifespan === 1}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  lifespan: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="lifespan-2"
                name="lifespan"
                label="500+ years"
                value={2}
                checked={lifestyleFunQuestions.lifespan === 2}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  lifespan: parseInt(e.target.value)
                })}
                required
              />
              <Form.Check
                type="radio"
                id="lifespan-3"
                name="lifespan"
                label="Forever"
                value={3}
                checked={lifestyleFunQuestions.lifespan === 3}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  lifespan: parseInt(e.target.value)
                })}
                required
              />
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Pick your lucky number (0-9999)</Form.Label>
            <Form.Control
              type="number"
              min="0"
              max="9999"
              value={lifestyleFunQuestions.lucky_number}
              onChange={(e) => setLifestyleFunQuestions({
                ...lifestyleFunQuestions,
                lucky_number: parseInt(e.target.value) || ''
              })}
              placeholder="Enter a number..."
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Pick your favorite color</Form.Label>
            <div className="d-flex align-items-center gap-3">
              <Form.Control
                type="color"
                value={lifestyleFunQuestions.favorite_color}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  favorite_color: e.target.value
                })}
                style={{ width: '60px', height: '40px' }}
              />
              <Form.Control
                type="text"
                value={lifestyleFunQuestions.favorite_color}
                onChange={(e) => setLifestyleFunQuestions({
                  ...lifestyleFunQuestions,
                  favorite_color: e.target.value
                })}
                placeholder="#000000"
              />
            </div>
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