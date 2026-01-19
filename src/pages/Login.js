import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Container, Form, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  // Handle email/password login
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  // Handle Google OAuth login
  const handleGoogleSignIn = async () => {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) setError(error.message)
    // Google redirects automatically
  }

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4">Log In</h2>
        
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
            Log In
          </Button>
        </Form>
        
        <hr />
        
        <Button variant="outline-dark" onClick={handleGoogleSignIn} className="w-100 mb-3">
          Sign in with Google
        </Button>
        
        <div className="text-center text-muted small">
          Need an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </Container>
  )
}