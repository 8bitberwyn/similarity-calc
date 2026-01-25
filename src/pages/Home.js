import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import '../styles/Home.css'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <Navbar />
      <div className="home-container">
        {/* Animated background elements */}
        <div className="home-bg-circle"></div>
        <div className="home-bg-circle"></div>
        <div className="home-bg-circle"></div>
        
        <div className="home-content">
          <h1 className="home-title">
            Discover Your Tribe
          </h1>
          
          <p className="home-tagline">
            Find out who you <span className="home-highlight">truly connect with</span>.
            <br />
            Compare personalities, discover similarities, understand what makes you unique.
          </p>
          
          <div className="home-buttons">
            <button 
              className="home-btn home-btn-outline"
              onClick={() => navigate('/setup')}
            >
              Get Started
            </button>
            <button 
              className="home-btn home-btn-filled"
              onClick={() => navigate('/compare')}
            >
              Compare Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}