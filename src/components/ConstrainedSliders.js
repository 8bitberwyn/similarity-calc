import { useState, useEffect } from 'react'
import { Form, Row, Col, ProgressBar } from 'react-bootstrap'

/**
 * Constrained sliders that sum to 100%
 */
export default function ConstrainedSliders({ labels, values, onChange, title }) {
  const [localValues, setLocalValues] = useState(values || {})

  useEffect(() => {
    setLocalValues(values || {})
  }, [values])

  const handleChange = (key, newValue) => {
    const numValue = parseInt(newValue) || 0
    const currentTotal = Object.entries(localValues)
      .filter(([k]) => k !== key)
      .reduce((sum, [, v]) => sum + v, 0)
    
    // Don't allow if it would exceed 100
    const maxAllowed = 100 - currentTotal
    const constrainedValue = Math.min(numValue, maxAllowed)
    
    const updated = { ...localValues, [key]: constrainedValue }
    setLocalValues(updated)
    onChange(updated)
  }

  const total = Object.values(localValues).reduce((sum, v) => sum + v, 0)
  const remaining = 100 - total

  return (
    <div className="constrained-sliders mb-4 p-3 border rounded">
      {title && <h6 className="mb-3">{title}</h6>}
      
      {/* Progress indicator */}
      <div className="mb-3">
        <div className="d-flex justify-content-between mb-1">
          <small className="text-muted">Total Allocated</small>
          <small className={remaining === 0 ? 'text-success' : 'text-primary'}>
            {total}% / 100%
          </small>
        </div>
        <ProgressBar 
          now={total} 
          variant={remaining === 0 ? 'success' : 'primary'}
          style={{ height: '8px' }}
        />
        {remaining > 0 && (
          <small className="text-muted">{remaining}% remaining</small>
        )}
      </div>

      {/* Sliders */}
      {labels.map(({ key, label }) => (
        <Row key={key} className="mb-3 align-items-center">
          <Col xs={4}>
            <Form.Label className="mb-0">{label}</Form.Label>
          </Col>
          <Col xs={6}>
            <Form.Range
              min="0"
              max="100"
              value={localValues[key] || 0}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </Col>
          <Col xs={2} className="text-end">
            <strong>{localValues[key] || 0}%</strong>
          </Col>
        </Row>
      ))}
    </div>
  )
}