import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Form, Button, Alert, Card } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Auth.css'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  
  const { signUp, signInWithGoogle } = useAuth()

  // Handle email/password Signup
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    
    const { data, error } = await signUp(email, password)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Check if email confirmation is required
      if (data?.user?.identities?.length === 0) {
        // Email already exists
        setError('An account with this email already exists')
        setLoading(false)
      } else {
        // Success - show verification message
        setUserEmail(email)
        setNeedsVerification(true)
        setLoading(false)
      }
    }
  }

  // Handle Google OAuth Signup
  const handleGoogleSignUp = async () => {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) setError(error.message)
    // Google redirects automatically
  }

  // Show verification message after successful signup
  if (needsVerification) {
    return (
      <div className="auth-page-container">
        {/* Animated background elements */}
        <div className="auth-bg-circle"></div>
        <div className="auth-bg-circle"></div>
        <div className="auth-bg-circle"></div>
        
        <Card className="auth-card">
          <Card.Body className="text-center p-5">
            <div className="verification-icon mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="80" 
                height="80" 
                fill="#667eea" 
                viewBox="0 0 16 16"
              >
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
              </svg>
            </div>
            
            <h3 className="mb-3">Check Your Email!</h3>
            
            <p className="text-muted mb-4">
              We've sent a verification link to:<br/>
              <strong>{userEmail}</strong>
            </p>
            
            <Alert variant="info" className="text-start">
              <strong>Next Steps:</strong>
              <ol className="mb-0 mt-2 ps-3">
                <li>Check your inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Return here to log in</li>
              </ol>
            </Alert>

            <div className="mt-4">
              <p className="text-muted small mb-2">Already verified your email?</p>
              <Link to="/login">
                <Button variant="primary" className="w-100">
                  Go to Login
                </Button>
              </Link>
            </div>

            <hr className="my-4" />

            <div className="text-center">
              <p className="text-muted small mb-2">Didn't receive the email?</p>
              <Button 
                variant="link" 
                size="sm"
                onClick={() => {
                  setNeedsVerification(false)
                  setEmail('')
                  setPassword('')
                  setConfirmPassword('')
                }}
                style={{ color: '#667eea' }}
              >
                Try signing up again
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    )
  }

  // Regular signup form
  return (
    <div className="auth-page-container">
      {/* Animated background elements */}
      <div className="auth-bg-circle"></div>
      <div className="auth-bg-circle"></div>
      <div className="auth-bg-circle"></div>
      
      <Card className="auth-card">
        <Card.Body className="p-4">
          <h2 className="text-center mb-4">Create Account</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required 
                autoFocus
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required 
                minLength={6}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required 
              />
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mb-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </Form>
          
          <div className="divider my-3">
            <span>OR</span>
          </div>
          
          <Button 
            variant="outline-dark" 
            onClick={handleGoogleSignUp} 
            className="w-100 mb-3 google-btn"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 48 48"
              className="me-2"
            >
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Continue with Google
          </Button>
          
          <div className="text-center text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-decoration-none">
              Log In
            </Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}