import { useState, useEffect } from 'react'
import { Navbar as BSNavbar, Container, Nav } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import '../styles/Navbar.css'

export default function Navbar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)

  // Fetch user profile on mount
  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('profile_picture_url, name')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
    }
  }

  // Generate avatar URL
  const getAvatarUrl = () => {
    if (profile?.profile_picture_url) {
      return profile.profile_picture_url
    }
    const displayName = profile?.name || user?.email || 'User'
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
  }

  return (
    <BSNavbar bg="light" expand="lg">
      <Container>
        <BSNavbar.Brand onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          Similarity Calculator
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link onClick={() => navigate('/')}>Home</Nav.Link>
            <Nav.Link onClick={() => navigate('/setup')}>Setup</Nav.Link>
            <Nav.Link onClick={() => navigate('/compare')}>Compare</Nav.Link>
            <Nav.Link
              onClick={() => navigate('/profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 0.5rem'
              }}
            >
              <img
                src={getAvatarUrl()}
                alt="Profile"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #dee2e6',
                  display: 'block'
                }}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || 'U')}&background=random`
                }}
              />
            </Nav.Link>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  )
}