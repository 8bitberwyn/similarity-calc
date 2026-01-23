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
// import { useState } from 'react'
// import { useNavigate, Link } from 'react-router-dom'
// import { Container, Form, Button, Alert, Card } from 'react-bootstrap'
// import { useAuth } from '../contexts/AuthContext'
// import '../styles/Auth.css'

// export default function Login() {
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [error, setError] = useState('')
//   const [loading, setLoading] = useState(false)
  
//   const { signIn, signInWithGoogle } = useAuth()
//   const navigate = useNavigate()

//   // Handle email/password login
//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setError('')
//     setLoading(true)
    
//     const { error } = await signIn(email, password)
    
//     if (error) {
//       // Check for specific error messages
//       if (error.message.includes('Email not confirmed')) {
//         setError('Please verify your email before logging in. Check your inbox for the verification link.')
//       } else if (error.message.includes('Invalid login credentials')) {
//         setError('Invalid email or password')
//       } else {
//         setError(error.message)
//       }
//       setLoading(false)
//     } else {
//       navigate('/')
//     }
//   }

//   // Handle Google OAuth login
//   const handleGoogleSignIn = async () => {
//     setError('')
//     const { error } = await signInWithGoogle()
//     if (error) setError(error.message)
//     // Google redirects automatically
//   }

//   return (
//     <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
//       <Card className="auth-card">
//         <Card.Body className="p-4">
//           <h2 className="text-center mb-4">Welcome Back</h2>
          
//           {error && <Alert variant="danger">{error}</Alert>}
          
//           <Form onSubmit={handleSubmit}>
//             <Form.Group className="mb-3">
//               <Form.Label>Email</Form.Label>
//               <Form.Control 
//                 type="email" 
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="your.email@example.com"
//                 required 
//                 autoFocus
//               />
//             </Form.Group>
            
//             <Form.Group className="mb-4">
//               <Form.Label>Password</Form.Label>
//               <Form.Control 
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Enter your password"
//                 required 
//               />
//             </Form.Group>
            
//             <Button 
//               variant="primary" 
//               type="submit" 
//               className="w-100 mb-2" 
//               disabled={loading}
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
//                   Logging In...
//                 </>
//               ) : (
//                 'Log In'
//               )}
//             </Button>
//           </Form>
          
//           <div className="divider my-3">
//             <span>OR</span>
//           </div>
          
//           <Button 
//             variant="outline-dark" 
//             onClick={handleGoogleSignIn} 
//             className="w-100 mb-3 google-btn"
//           >
//             <svg 
//               xmlns="http://www.w3.org/2000/svg" 
//               width="18" 
//               height="18" 
//               viewBox="0 0 48 48"
//               className="me-2"
//             >
//               <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
//               <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
//               <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
//               <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
//             </svg>
//             Continue with Google
//           </Button>
          
//           <div className="text-center text-muted">
//             Don't have an account?{' '}
//             <Link to="/signup" className="text-decoration-none">
//               Sign Up
//             </Link>
//           </div>
//         </Card.Body>
//       </Card>
//     </Container>
//   )
// }