import { Navbar as BSNavbar, Container, Nav } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Navbar.css'

export default function Navbar() {  // ← MUST be "export default"
  const navigate = useNavigate()
  const { user } = useAuth()

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
            <Nav.Link onClick={() => navigate('/profile')}>
              <img 
                src={`https://ui-avatars.com/api/?name=${user?.email}&background=random`}
                alt="Profile"
                style={{ width: '30px', height: '30px', borderRadius: '50%' }}
              />
            </Nav.Link>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  )
}