import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Container, Form, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signUp, signUpWithGoogle } = useAuth()
  const navigate = useNavigate()

  // Handle email/password Signup
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const { error } = await signUp(email, password)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  // Handle Google OAuth Signup
  const handleGooglesignUp = async () => {
    setError('')
    const { error } = await signUpWithGoogle()
    if (error) setError(error.message)
    // Google redirects automatically
  }

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4">Sign Up</h2>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </Form.Group>
          
          <Button variant="primary" type="submit" className="w-100 mb-2" disabled={loading}>
            Create Account
          </Button>
        </Form>
        
        <hr />
        
        <Button variant="outline-dark" onClick={handleGooglesignUp} className="w-100 mb-3">
          Sign in with Google
        </Button>
        
        <div className="text-center text-muted small">
          Already have an account? <Link to="/login">Log In</Link>
        </div>
      </div>
    </Container>
  )
}