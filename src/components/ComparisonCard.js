import { Card, Badge } from 'react-bootstrap'
import '../styles/ComparisonCard.css'

export default function ComparisonCard({ userId, profile, scores, onViewDetails }) {
  const isPublic = profile?.is_public

  // Determine score color
  const getScoreColor = (score) => {
    if (score >= 125) return 'success'
    if (score >= 100) return 'primary'
    if (score >= 75) return 'warning'
    return 'danger'
  }

  return (
    <Card className="comparison-card h-100" onClick={onViewDetails} style={{ cursor: 'pointer' }}>
      <Card.Body>
        {/* User Info */}
        <div className="d-flex align-items-center mb-3">
          {isPublic && profile.profile_picture_url ? (
            <img
              src={profile.profile_picture_url}
              alt="Profile"
              className="rounded-circle me-3"
              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
            />
          ) : (
            <div
              className="rounded-circle me-3 bg-secondary d-flex align-items-center justify-content-center text-white"
              style={{ width: '50px', height: '50px' }}
            >
              <i className="bi bi-person-fill"></i>
            </div>
          )}
          
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2">
              <strong>{isPublic && profile.name ? profile.name : userId}</strong>
              {!isPublic && <Badge bg="secondary">Private</Badge>}
            </div>
            <small className="text-muted">ID: {userId}</small>
          </div>
        </div>

        {/* Scores */}
        <div className="mb-2">
          <div className="d-flex justify-content-between mb-1">
            <span>Total Score</span>
            <Badge bg={getScoreColor(scores.totalScore)}>{scores.totalScore}/150</Badge>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <small>Personality</small>
            <small>{scores.personalityScore}/100</small>
          </div>
          <div className="d-flex justify-content-between">
            <small>Lifestyle</small>
            <small>{scores.lifestyleScore}/50</small>
          </div>
        </div>

        {/* Public profile details */}
        {isPublic && (
          <div className="mt-3 pt-3 border-top">
            {profile.location && (
              <div><small><strong>Location:</strong> {profile.location}</small></div>
            )}
            {profile.description && (
              <div><small><strong>Bio:</strong> {profile.description}</small></div>
            )}
          </div>
        )}

        <div className="mt-3 text-center">
          <small className="text-primary">Click to view detailed comparison</small>
        </div>
      </Card.Body>
    </Card>
  )
}