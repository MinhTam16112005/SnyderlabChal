// API Configuration
export const API_BASE_URL = 'http://localhost:5001'
export const API_URL = 'http://localhost:5001'
export const DEFAULT_USER_ID = 'user_1' 

// Chart Colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4'
}

// Date Configuration
export const MAX_DATE_RANGE_DAYS = 60
export const BUFFER_HOURS = 0

// Timezone Configuration
export const DEFAULT_TIMEZONE = 'America/Los_Angeles'

export const TIMEZONE_CONFIG = {
  'America/Los_Angeles': {
    label: 'Pacific Time (PT)',
    standardOffset: -8, // PST
    daylightOffset: -7  // PDT
  },
  'America/New_York': {
    label: 'Eastern Time (ET)',
    standardOffset: -5, // EST
    daylightOffset: -4  // EDT
  },
  'America/Chicago': {
    label: 'Central Time (CT)',
    standardOffset: -6, // CST
    daylightOffset: -5  // CDT
  },
  'America/Denver': {
    label: 'Mountain Time (MT)',
    standardOffset: -7, // MST
    daylightOffset: -6  // MDT
  },
  'UTC': {
    label: 'Coordinated Universal Time (UTC)',
    standardOffset: 0,
    daylightOffset: 0
  }
}

// Available timezones for dropdown
export const TIMEZONES = [
  'America/Los_Angeles',
  'America/New_York', 
  'America/Chicago',
  'America/Denver',
  'UTC'
]

// Pagination
export const DEFAULT_PAGE_SIZE = 1000