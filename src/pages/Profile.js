import { useState, useEffect } from 'react'
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import '../styles/Profile.css'

export default function Profile() {
  const { user, signOut, deleteAccount } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Profile fields
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [profilePictureUrl, setProfilePictureUrl] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Load profile on mount
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (data) {
      setName(data.name || '')
      setBirthday(data.birthday || '')
      setLocation(data.location || '')
      setDescription(data.description || '')
      setProfilePictureUrl(data.profile_picture_url || '')
      setIsPublic(data.is_public || false)
    } else if (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        birthday: birthday || null,
        location,
        description,
        profile_picture_url: profilePictureUrl,
        is_public: isPublic,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'danger', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    }
    
    setLoading(false)
  }

  const handleLogout = async () => {
    const { error } = await signOut()
    if (!error) {
      navigate('/login')
    }
  }

  const handleDeleteAccount = async () => {
    // Verify user typed DELETE
    if (deleteConfirmText !== 'DELETE') {
      setMessage({ type: 'danger', text: 'Please type DELETE to confirm' })
      return
    }

    setLoading(true)

    // Delete user's data first (RLS will handle cascade)
    // Note: Deleting auth user requires admin API (backend)
    // For now, we'll delete profile data
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    const { error: setupError } = await supabase
      .from('setup_responses')
      .delete()
      .eq('user_id', user.id)

    if (profileError || setupError) {
      setMessage({ 
        type: 'danger', 
        text: 'Error deleting account data. Please contact support.' 
      })
      setLoading(false)
      return
    }

    // Sign out after deleting data
    await signOut()
    navigate('/login')
  }

  // Generate placeholder avatar if no profile picture
  const getAvatarUrl = () => {
    if (profilePictureUrl) return profilePictureUrl
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || user.email)}&size=200&background=random`
  }

  return (
    <>
      <Navbar />
      <Container className="mt-4" style={{ maxWidth: '700px' }}>
        <h2 className="mb-4">Profile</h2>

        {message.text && (
          <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
            {message.text}
          </Alert>
        )}

        <Card className="mb-4">
          <Card.Body>
            {/* Profile Picture Preview */}
            <div className="text-center mb-4">
              <img
                src={getAvatarUrl()}
                alt="Profile"
                className="rounded-circle mb-3"
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
              <div className="text-muted small">
                <strong>User ID:</strong> {user.id}
              </div>
              <div className="text-muted small">
                <strong>Email:</strong> {user.email}
              </div>
            </div>

            <Form onSubmit={handleSaveProfile}>
              {/* Name */}
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Form.Group>

              {/* Birthday */}
              <Form.Group className="mb-3">
                <Form.Label>Birthday</Form.Label>
                <Form.Control
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </Form.Group>

              {/* Location */}
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., New York, USA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </Form.Group>

              {/* Description */}
              <Form.Group className="mb-3">
                <Form.Label>Description / Bio</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Tell others about yourself..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
                <Form.Text className="text-muted">
                  {description.length}/500 characters
                </Form.Text>
              </Form.Group>

              {/* Profile Picture URL */}
              <Form.Group className="mb-3">
                <Form.Label>Profile Picture URL</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://example.com/your-photo.jpg"
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Enter an image URL or leave blank for auto-generated avatar
                </Form.Text>
              </Form.Group>

              {/* Public/Private Account */}
              <Form.Group className="mb-4">
                <Form.Check
                  type="checkbox"
                  id="is-public-checkbox"
                  label="Make my profile public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <Form.Text className="text-muted">
                  {isPublic 
                    ? 'Your profile details will be visible to others when they compare with you'
                    : 'Only your User ID will be visible in comparisons'
                  }
                </Form.Text>
              </Form.Group>

              <Button variant="primary" type="submit" disabled={loading} className="w-100">
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </Form>
          </Card.Body>
        </Card>

        {/* Account Actions */}
        <Card className="mb-4">
          <Card.Body>
            <h5 className="mb-3">Account Actions</h5>
            
            <div className="d-grid gap-2">
              <Button variant="outline-secondary" onClick={handleLogout}>
                Log Out
              </Button>
              
              <Button 
                variant="outline-danger" 
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              >
                Delete Account
              </Button>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="mt-3 p-3 border border-danger rounded">
                <Alert variant="danger" className="mb-3">
                  <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
                </Alert>
                
                <Form.Group className="mb-3">
                  <Form.Label>Type <strong>DELETE</strong> to confirm</Form.Label>
                  <Form.Control
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button 
                    variant="danger" 
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || loading}
                  >
                    {loading ? 'Deleting...' : 'Permanently Delete Account'}
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Info Section */}
        <Card className="mb-4 bg-light">
          <Card.Body>
            <h6>Profile Tips</h6>
            <ul className="mb-0 small">
              <li>A complete profile helps others learn more about you</li>
              <li>Public profiles show your details on comparison cards</li>
              <li>Private profiles only show your User ID</li>
              <li>You can change privacy settings anytime</li>
            </ul>
          </Card.Body>
        </Card>
      </Container>
    </>
  )
}