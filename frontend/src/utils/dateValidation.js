import { MAX_DATE_RANGE_DAYS, LA_TIMEZONE_OFFSET_HOURS, BUFFER_HOURS } from './constants'

// Get maximum allowed end date (current time - 2 hours) in LA timezone
export const getMaxEndDate = () => {
  const now = new Date()
  const laOffset = LA_TIMEZONE_OFFSET_HOURS * 60 // Convert to minutes
  const laTime = new Date(now.getTime() - laOffset * 60 * 1000)
  const maxDate = new Date(laTime.getTime() - BUFFER_HOURS * 60 * 60 * 1000)
  return maxDate.toISOString().slice(0, 16)
}

// Get minimum allowed start date based on end date (60 days before end) - ✅ This should limit start date
export const getMinStartDate = (endDate) => {
  if (!endDate) return ""
  const end = new Date(endDate)
  const minStart = new Date(end.getTime() - MAX_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000)
  return minStart.toISOString().slice(0, 16)
}

// Get maximum allowed start date - ✅ Start date can be any time in the past, no restriction needed
export const getMaxStartDate = () => {
  return "" // No max restriction on start date
}

// Get minimum allowed end date based on start date (1 minute after start)
export const getMinEndDate = (startDate) => {
  if (!startDate) return ""
  const start = new Date(startDate)
  const minEnd = new Date(start.getTime() + 60 * 1000)
  return minEnd.toISOString().slice(0, 16)
}

// Get max allowed end date based on start date (60 days after start, but not exceeding max allowed)
export const getMaxEndDateFromStart = (startDate) => {
  if (!startDate) return getMaxEndDate()
  const start = new Date(startDate)
  const maxFromStart = new Date(start.getTime() + MAX_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000)
  const absoluteMax = new Date(getMaxEndDate())
  return maxFromStart < absoluteMax 
    ? maxFromStart.toISOString().slice(0, 16) 
    : absoluteMax.toISOString().slice(0, 16)
}

// Validate date range according to business rules
export const validateDateRange = (start, end) => {
  if (!start || !end) return null
  
  const startDate = new Date(start)
  const endDate = new Date(end)
  const now = new Date()
  
  // LA timezone adjustment
  const laOffset = LA_TIMEZONE_OFFSET_HOURS * 60
  const laTime = new Date(now.getTime() - laOffset * 60 * 1000)
  const maxEndTime = new Date(laTime.getTime() - BUFFER_HOURS * 60 * 60 * 1000)
  
  // ✅ Only validate END date against current time restriction
  if (endDate > maxEndTime) {
    return "End date cannot be later than 2 hours ago (LA time)"
  }
  
  if (startDate >= endDate) {
    return "Start date must be before end date"
  }
  
  const diffMs = endDate - startDate
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  
  if (diffDays > MAX_DATE_RANGE_DAYS) {
    return `Date range cannot exceed 2 months (${MAX_DATE_RANGE_DAYS} days)`
  }
  
  return null
}