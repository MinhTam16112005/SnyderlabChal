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

// Date Limits
export const DATE_LIMITS = {
  MIN_DATE: '2020-01-01',
  MAX_DATE: '2030-12-31',
  DEFAULT_RANGE_DAYS: 7
}
export const MAX_DATE_RANGE_DAYS = 30

// Date Validation
export const BUFFER_HOURS = 2
export const LA_TIMEZONE_OFFSET_HOURS = -8

// Pagination
export const DEFAULT_PAGE_SIZE = 1000

// Health Metrics
export const HEALTH_METRICS = [
  'intraday_heart_rate',
  'intraday_steps',
  'sleep_efficiency',
  'sleep_duration',
  'active_zone_minutes',
  'resting_heart_rate'
]

// Timezones
export const TIMEZONES = [
  'America/Los_Angeles',
  'America/New_York', 
  'America/Chicago',
  'America/Denver',
  'UTC'
]