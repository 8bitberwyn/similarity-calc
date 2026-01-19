import { useState, useEffect, useRef, useCallback } from 'react'
import { Container, Card, Form, Button, Alert, Modal } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import AvatarEditor from 'react-avatar-editor'
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/Profile.css'

export default function Profile() {
  const { user, signOut } = useAuth()
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

  // Edit Avatar hooks
  const [showEditor, setShowEditor] = useState(false)
  const [newProfileImage, setNewProfileImage] = useState(null)
  const [scale, setScale] = useState(1)
  const editorRef = useRef(null)

  // URL Input Modal
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [tempImageUrl, setTempImageUrl] = useState('')

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Load profile
  const loadProfile = useCallback(async () => {
    const { data } = await supabase
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
    }
  }, [user.id])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

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
      setMessage({ type: 'success', text: '✓ Profile updated successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
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
    if (deleteConfirmText !== 'DELETE') {
      setMessage({ type: 'danger', text: 'Please type DELETE to confirm' })
      return
    }

    setLoading(true)
    await supabase.from('profiles').delete().eq('id', user.id)
    await supabase.from('setup_responses').delete().eq('user_id', user.id)
    await signOut()
    navigate('/login')
  }

  // Handle file upload for cropping
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewProfileImage(e.target.files[0])
      setScale(1) // Reset scale
      setShowEditor(true)
    }
  }

  // Save cropped image
  const handleSaveCroppedImage = () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas()
      const dataUrl = canvas.toDataURL()
      setProfilePictureUrl(dataUrl)
      setShowEditor(false)
      setNewProfileImage(null)
      setMessage({ type: 'info', text: 'Image updated. Click "Save Profile" to save changes.' })
    }
  }

  const handleSaveUrl = () => {
    setProfilePictureUrl(tempImageUrl)
    setShowUrlModal(false)
    setMessage({ type: 'info', text: 'Image updated. Click "Save Profile" to save changes.' })
  }

  const handleRemoveImage = () => {
    setProfilePictureUrl('')
    setShowUrlModal(false)
    setMessage({ type: 'info', text: 'Image removed. Click "Save Profile" to save changes.' })
  }

  // Generate placeholder avatar
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
            {/* Profile Picture with Hover Effect */}
            <div className="text-center mb-4">
              <div className="profile-picture-container">
                <img
                  src={getAvatarUrl()}
                  alt="Profile"
                  className="profile-picture"
                  onClick={() => document.getElementById('profileImageInput').click()}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || user.email)}&size=200&background=random`
                  }}
                />
                <div
                  className="profile-picture-overlay"
                  onClick={() => document.getElementById('profileImageInput').click()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    fill="white"
                    viewBox="0 0 16 16"
                  >
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
                  </svg>
                  <div className="mt-2">Upload Photo</div>
                </div>
              </div>

              {/* Hidden file input */}
              <Form.Control
                type="file"
                accept="image/*"
                id="profileImageInput"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              <div
                className="text-muted small d-flex justify-content-center align-items-center user-id-container"
              >
                <strong>User ID:&nbsp;</strong> {user.id}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.id)
                    setMessage({ type: 'success', text: '✓ User ID copied to clipboard!' })
                    setTimeout(() => setMessage({ type: '', text: '' }), 2000)
                  }}
                  className="btn btn-sm p-1"
                  title="Copy to clipboard"
                  style={{ display: 'flex', alignItems: 'center', border: 'none' }}
                >
                  <i className="bi bi-clipboard"></i>
                </button>
              </div>

              <div className="text-muted small d-flex justify-content-center align-items-center">
                <strong>Email:&nbsp;</strong> {user.email}
              </div>
            </div>

            <Form onSubmit={handleSaveProfile}>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Birthday</Form.Label>
                <Form.Control
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., New York, USA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </Form.Group>

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
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
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

        <Card className="mb-4 bg-light">
          <Card.Body>
            <h6>Profile Tips</h6>
            <ul className="mb-0 small">
              <li>Click your profile picture to upload and crop an image</li>
              <li>A complete profile helps others learn more about you</li>
              <li>Public profiles show your details on comparison cards</li>
              <li>Private profiles only show your User ID</li>
            </ul>
          </Card.Body>
        </Card>
      </Container>

      {/* Image Crop Editor Modal */}
      <Modal
        show={showEditor}
        onHide={() => setShowEditor(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Crop Profile Picture</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          {newProfileImage && (
            <>
              <div className="avatar-editor-container mb-3">
                <AvatarEditor
                  ref={editorRef}
                  image={newProfileImage}
                  width={250}
                  height={250}
                  border={50}
                  borderRadius={125}
                  color={[0, 0, 0, 0.6]}
                  scale={scale}
                  rotate={0}
                />
              </div>

              <div className="px-4">
                <Form.Label className="d-block mb-2">
                  <strong>Zoom</strong>
                </Form.Label>
                <div className="d-flex align-items-center gap-3">
                  <span className="text-muted">−</span>
                  <Form.Range
                    min={1}
                    max={3}
                    step={0.01}
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="flex-grow-1"
                  />
                  <span className="text-muted">+</span>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditor(false)
              setNewProfileImage(null)
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveCroppedImage}
          >
            Save Photo
          </Button>
        </Modal.Footer>
      </Modal>

      {/* URL Input Modal */}
      <Modal
        show={showUrlModal}
        onHide={() => setShowUrlModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Image URL</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <img
              src={tempImageUrl || getAvatarUrl()}
              alt="Preview"
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #dee2e6'
              }}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || user.email)}&size=200&background=random`
              }}
            />
          </div>

          <Form.Group>
            <Form.Label>Image URL</Form.Label>
            <Form.Control
              type="url"
              placeholder="https://example.com/your-photo.jpg"
              value={tempImageUrl}
              onChange={(e) => setTempImageUrl(e.target.value)}
              autoFocus
            />
            <Form.Text className="text-muted">
              Upload your image and get a URL at{' '}
              <a href="https://www.image2url.com/" target="_blank" rel="noopener noreferrer">
                image2url.com
              </a>
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-danger" onClick={handleRemoveImage}>
            Remove Photo
          </Button>
          <Button variant="secondary" onClick={() => setShowUrlModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveUrl}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}