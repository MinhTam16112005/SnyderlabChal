import React from 'react'
import './Navigation.css'

const Navigation = ({ currentPage, onPageChange }) => {
  // Navigation pages configuration with descriptions
  const pages = [
    { id: 'enrollment', label: 'User Enrollment', description: 'Enroll users with start dates' },
    { id: 'ingestion', label: 'Data Ingestion', description: 'Generate synthetic data' },
    { id: 'analysis', label: 'Data Analysis', description: 'View charts and analytics' }
  ]

  return (
    <nav className="navigation">
      {/* Horizontal navigation buttons with active state */}
      <div className="nav-buttons">
        {pages.map((page) => (
          <button
            key={page.id}
            className={`nav-button ${currentPage === page.id ? 'active' : ''}`}
            onClick={() => onPageChange(page.id)}
          >
            <span className="nav-label">{page.label}</span>
            <span className="nav-description">{page.description}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export default Navigation