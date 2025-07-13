import React, { useState } from 'react'
import { UserProvider } from './contexts/UserContext'
import EnrollmentPage from './components/EnrollmentPage'
import IngestionPage from './components/IngestionPage'
import AnalysisPage from './components/AnalysisPage'
import TimezoneSelector from './components/TimezoneSelector'
import logoImage from './assets/logo.png'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('enrollment')

  const pages = [
    { id: 'enrollment', label: 'User Enrollment', description: 'Enroll users with start dates', icon: '👥' },
    { id: 'ingestion', label: 'Data Ingestion', description: 'Generate synthetic data', icon: '📊' },
    { id: 'analysis', label: 'Data Analysis', description: 'View charts and analytics', icon: '📈' }
  ]

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'enrollment':
        return <EnrollmentPage />
      case 'ingestion':
        return <IngestionPage />
      case 'analysis':
        return <AnalysisPage />
      default:
        return <EnrollmentPage />
    }
  }

  const handleLogoClick = () => {
    window.location.reload()
  }

  return (
    <UserProvider>
      <div className="app-container">
        <div className="dashboard">
          {/* Header Section */}
          <header className="header">
            <div className="header-content">
              <div className="header-main">
                {/* Left side - Logo, Title, and Timezone */}
                <div className="header-left">
                  <img 
                    src={logoImage}
                    alt="Metric Momentum Logo"
                    onClick={handleLogoClick}
                    className="logo"
                  />
                  <h1 className="app-title">Metric Momentum</h1>
                  <TimezoneSelector />
                </div>

                {/* Right side - Navigation Tabs */}
                <div className="header-right">
                  <nav className="top-navigation">
                    {pages.map((page) => (
                      <button
                        key={page.id}
                        className={`nav-tab ${currentPage === page.id ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page.id)}
                      >
                        {page.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          </header>
          
          {/* Page Content */}
          <div className="page-content">
            {renderCurrentPage()}
          </div>
        </div>
      </div>
    </UserProvider>
  )
}

export default App