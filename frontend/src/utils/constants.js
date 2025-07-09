// API configuration
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001"

// Business rules and constraints
export const MAX_DATE_RANGE_DAYS = 60
export const LA_TIMEZONE_OFFSET_HOURS = 8
export const BUFFER_HOURS = 2
export const DEFAULT_USER_ID = "user_1"
export const DEFAULT_PAGE_SIZE = 1000

// Chart colors and styling
export const CHART_COLORS = {
  primary: "#3b82f6",
  primaryLight: "rgba(59, 130, 246, 0.1)",
  white: "#ffffff",
  gray: "#6b7280",
  dark: "#1f2937"
}