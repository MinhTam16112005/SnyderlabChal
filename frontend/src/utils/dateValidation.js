import { MAX_DATE_RANGE_DAYS, BUFFER_HOURS } from './constants.js'

// Get current time in specified timezone
export const getCurrentTimeInTimezone = (timezone = 'America/Los_Angeles') => {
  try {
    return new Date().toLocaleString("en-US", {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.warn(`Could not get current time for timezone ${timezone}`);
    return new Date().toISOString();
  }
}

// Get maximum allowed end date for datetime-local input format
export const getMaxEndDate = (timezone = 'America/Los_Angeles') => {
  try {
    const now = new Date();
    return now.toISOString().slice(0, 16) // Format for datetime-local input
  } catch (error) {
    return new Date().toISOString().slice(0, 16);
  }
}

// Calculate minimum start date based on maximum range from end date
export const getMinStartDate = (endDate, timezone = 'America/Los_Angeles') => {
  if (!endDate) return null;
  
  try {
    const end = new Date(endDate);
    const minStart = new Date(end.getTime() - (MAX_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000));
    return minStart.toISOString().slice(0, 16);
  } catch (error) {
    return null;
  }
}

// Get minimum allowed end date with buffer time after start date
export const getMinEndDate = (startDate, timezone = 'America/Los_Angeles') => {
  if (!startDate) return null;
  
  try {
    const start = new Date(startDate);
    const minEnd = new Date(start.getTime() + (BUFFER_HOURS * 60 * 60 * 1000));
    return minEnd.toISOString().slice(0, 16);
  } catch (error) {
    return null;
  }
}

// Calculate maximum end date considering range limit and current time
export const getMaxEndDateFromStart = (startDate, timezone = 'America/Los_Angeles') => {
  if (!startDate) return getMaxEndDate(timezone);
  
  try {
    const start = new Date(startDate);
    const maxFromStart = new Date(start.getTime() + (MAX_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000));
    const currentTime = new Date();
    
    // Return the earlier of the two: max range from start OR current time
    const maxAllowed = maxFromStart <= currentTime ? maxFromStart : currentTime;
    return maxAllowed.toISOString().slice(0, 16);
  } catch (error) {
    return getMaxEndDate(timezone);
  }
}

// Validate date range with comprehensive constraint checking
export const validateDateRange = (startDate, endDate, timezone = 'America/Los_Angeles') => {
  if (!startDate || !endDate) {
    return null;
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "Invalid date format";
    }
    
    // Check if end is after start
    if (end <= start) {
      return "End date must be after start date";
    }
    
    // Check maximum range constraint
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > MAX_DATE_RANGE_DAYS) {
      return `Date range cannot exceed 2 months (${MAX_DATE_RANGE_DAYS} days)`;
    }
    
    // Check if end date is in the future
    const now = new Date();
    if (end > now) {
      return "End date cannot be in the future";
    }
    
    return null; // No validation errors
  } catch (error) {
    return "Invalid date format";
  }
}

// Check if a date is in the future relative to current time
export const isFutureDate = (date, timezone = 'America/Los_Angeles') => {
  try {
    const inputDate = new Date(date);
    const now = new Date();
    return inputDate > now;
  } catch (error) {
    return false;
  }
}

// Format date for user display in specified timezone
export const formatDateInTimezone = (date, timezone = 'America/Los_Angeles') => {
  try {
    return new Date(date).toLocaleString("en-US", {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return new Date(date).toLocaleString();
  }
}