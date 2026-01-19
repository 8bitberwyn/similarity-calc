import { useNavigate } from 'react-router-dom'
import { Container, Button } from 'react-bootstrap'
import Navbar from '../components/Navbar'

export default function Home() {
  const navigate = useNavigate()

  return (
    <>
      <Navbar />
      <Container className="text-center mt-5">
        <h1 style={{ fontSize: '3rem', fontWeight: '300', marginBottom: '2rem' }}>
          Join other people in finding how similar you are to others!
        </h1>
        
        <div className="d-flex gap-3 justify-content-center">
          <Button 
            variant="outline-primary" 
            size="lg"
            onClick={() => navigate('/setup')}
          >
            Setup
          </Button>
          <Button 
            variant="primary" 
            size="lg"
            onClick={() => navigate('/compare')}
          >
            Compare
          </Button>
        </div>
      </Container>
    </>
  )
}