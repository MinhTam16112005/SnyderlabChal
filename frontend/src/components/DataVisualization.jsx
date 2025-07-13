import { useEffect, useRef, useState } from 'react'
import './DataVisualization.css'

const DataVisualization = ({ 
  metric, 
  dataPoints, 
  timezone, 
  gapsDetected = [], 
  dataSummary = {}, 
  imputationApplied = false,
  connectGaps = false
}) => {
  // Chart canvas and container refs
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  
  // Interactive tooltip and crosshair state
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '', timestamp: '', value: 0 })
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 })
  const [crosshair, setCrosshair] = useState({ visible: false, x: 0 })

  // Metric configuration with zones and display settings
  const metricConfig = {
    'intraday_heart_rate': {
      zones: [
        { min: 0, max: 60, color: '#007bff', label: 'Bradycardia (Below Normal)' },
        { min: 60, max: 100, color: '#28a745', label: 'Normal Resting Rate' },
        { min: 100, max: 120, color: '#ffc107', label: 'Elevated' },
        { min: 120, max: 200, color: '#dc3545', label: 'Tachycardia (High Risk)' }
      ],
      unit: 'bpm',
      title: 'Heart Rate',
      yAxisIntervals: [0, 40, 60, 80, 100, 120, 140, 160],
      yAxisMin: 0,
      yAxisMax: 160,
      yAxisFixed: true
    },

    'intraday_spo2': {
      zones: [
        { min: 0, max: 90, color: '#dc3545', label: 'Severe Hypoxemia (Critical)' },
        { min: 90, max: 95, color: '#ffc107', label: 'Mild Hypoxemia (Caution)' },
        { min: 95, max: 99, color: '#28a745', label: 'Normal Range' },
        { min: 99, max: 100, color: '#007bff', label: 'Optimal' }
      ],
      unit: '%',
      title: 'SpO2',
      yAxisIntervals: [0, 50, 90, 95, 99],
      yAxisMin: 0,
      yAxisMax: 100,
      yAxisFixed: true
    },

    'intraday_active_zone_minutes': {
      zones: [
        { min: 0, max: 85, color: '#dc3545', label: 'Out of Range' },
        { min: 85, max: 124, color: '#ffc107', label: 'Fat Burn' },
        { min: 124, max: 151, color: '#28a745', label: 'Cardio' },
        { min: 151, max: 180, color: '#007bff', label: 'Peak' }
      ],
      unit: 'MHR',
      title: 'Active Zone Minutes',
      yAxisIntervals: [0, 85, 124, 151, 180],
      yAxisMin: 0,
      yAxisMax: 180,
      yAxisFixed: true
    },

    'intraday_breath_rate': {
      zones: [
        { min: 0, max: 12, color: '#dc3545', label: 'Bradypnea (Low)' },
        { min: 12, max: 16, color: '#28a745', label: 'Normal Rest' },
        { min: 16, max: 20, color: '#ffc107', label: 'Upper Normal' },
        { min: 20, max: 100, color: '#dc3545', label: 'Tachypnea (High)' }
      ],
      unit: 'brpm',
      title: 'Breath Rate',
      yAxisIntervals: [0, 12, 16, 20, 100],
      yAxisMin: 0,
      yAxisMax: 100,
      yAxisFixed: true
    },

    'intraday_hrv': {
      zones: [
        { min: 0, max: 20, color: '#dc3545', label: 'Low HRV' },
        { min: 20, max: 40, color: '#ffc107', label: 'Fair HRV' },
        { min: 40, max: 60, color: '#28a745', label: 'Good HRV' },
        { min: 60, max: 100, color: '#007bff', label: 'Excellent HRV' }
      ],
      unit: 'ms',
      title: 'HRV',
      yAxisIntervals: [0, 20, 40, 60, 100],
      yAxisMin: 0,
      yAxisMax: 100,
      yAxisFixed: true
    },

    'intraday_activity': {
      zones: [
        { min: 0, max: 30, color: '#dc3545', label: 'Inactive' },
        { min: 30, max: 60, color: '#ffc107', label: 'Lightly Active' },
        { min: 60, max: 150, color: '#28a745', label: 'Moderately Active' },
        { min: 150, max: 200, color: '#007bff', label: 'Very Active' }
      ],
      unit: 'min',
      title: 'Activity Minutes',
      yAxisIntervals: [0, 30, 60, 150, 200],
      yAxisMin: 0,
      yAxisMax: 200,
      yAxisFixed: true
    }
  }

  // Find appropriate config for the given metric with fallback logic
  const getConfigForMetric = (inputMetric) => {
    if (metricConfig[inputMetric]) {
      return metricConfig[inputMetric]
    }
    
    const lowerMetric = inputMetric.toLowerCase()
    if (metricConfig[lowerMetric]) {
      return metricConfig[lowerMetric]
    }
    
    const underscoreMetric = inputMetric.replace(/\s+/g, '_').toLowerCase()
    if (metricConfig[underscoreMetric]) {
      return metricConfig[underscoreMetric]
    }
    
    // Keyword matching for partial matches
    const keywords = {
      'heart': 'intraday_heart_rate',
      'spo2': 'intraday_spo2',
      'oxygen': 'intraday_spo2',
      'active_zone': 'intraday_active_zone_minutes',
      'breath': 'intraday_breath_rate',
      'respir': 'intraday_breath_rate',
      'hrv': 'intraday_hrv',
      'activity': 'intraday_activity',
      'active': 'intraday_activity'
    }
    
    for (const [keyword, configKey] of Object.entries(keywords)) {
      if (inputMetric.toLowerCase().includes(keyword)) {
        return metricConfig[configKey]
      }
    }
    
    // Default fallback to heart rate
    return metricConfig['intraday_heart_rate']
  }

  const config = getConfigForMetric(metric)

  // Calculate statistical summary from data points
  const calculateStats = () => {
    if (!dataPoints.length) return null

    const values = dataPoints.map(d => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const sum = values.reduce((acc, val) => acc + val, 0)
    const average = sum / values.length

    const sortedValues = [...values].sort((a, b) => a - b)
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)]

    return {
      count: dataPoints.length,
      min: min,
      max: max,
      average: average,
      median: median
    }
  }

  const stats = calculateStats()

  // Handle canvas resizing on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setChartDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Format timestamp for display in tooltip
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Interpolate value at mouse position for smooth crosshair interaction
  const interpolateValue = (mouseX, margin, chartWidth) => {
    if (!dataPoints.length) return null

    const timestamps = dataPoints.map(d => new Date(d.timestamp).getTime())
    const minTime = Math.min(...timestamps)
    const maxTime = Math.max(...timestamps)

    const relativeX = (mouseX - margin.left) / chartWidth
    const targetTime = minTime + (maxTime - minTime) * relativeX

    let leftPoint = null
    let rightPoint = null

    for (let i = 0; i < dataPoints.length - 1; i++) {
      const currentTime = new Date(dataPoints[i].timestamp).getTime()
      const nextTime = new Date(dataPoints[i + 1].timestamp).getTime()

      if (targetTime >= currentTime && targetTime <= nextTime) {
        leftPoint = dataPoints[i]
        rightPoint = dataPoints[i + 1]
        break
      }
    }

    if (!leftPoint && !rightPoint) {
      const distances = dataPoints.map(point => 
        Math.abs(new Date(point.timestamp).getTime() - targetTime)
      )
      const closestIndex = distances.indexOf(Math.min(...distances))
      return {
        value: dataPoints[closestIndex].value,
        timestamp: dataPoints[closestIndex].timestamp,
        isImputed: dataPoints[closestIndex].is_imputed || false
      }
    }

    const leftTime = new Date(leftPoint.timestamp).getTime()
    const rightTime = new Date(rightPoint.timestamp).getTime()
    const ratio = (targetTime - leftTime) / (rightTime - leftTime)
    const interpolatedValue = leftPoint.value + (rightPoint.value - leftPoint.value) * ratio

    return {
      value: interpolatedValue,
      timestamp: new Date(targetTime).toISOString(),
      isImputed: false
    }
  }

  // Detect time gaps between data points for visualization
  const detectGapsForVisualization = (points) => {
    if (points.length < 2) return []
    
    const gaps = []
    for (let i = 0; i < points.length - 1; i++) {
      const current = new Date(points[i].timestamp).getTime()
      const next = new Date(points[i + 1].timestamp).getTime()
      const diffHours = (next - current) / (1000 * 60 * 60)
      
      if (diffHours > 1.5) {
        gaps.push({
          start: current,
          end: next,
          duration: diffHours,
          type: diffHours <= 3 ? 'short' : diffHours <= 10 ? 'medium' : 'long'
        })
      }
    }
    return gaps
  }

  // Main chart drawing effect - handles all canvas rendering
  useEffect(() => {
    if (!dataPoints.length || !chartDimensions.width || !chartDimensions.height) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const { width, height } = chartDimensions

    // Set up high DPI canvas
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    ctx.clearRect(0, 0, width, height)

    // Chart layout margins
    const margin = { top: 30, right: 30, bottom: 60, left: 80 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    // Time and value scales
    const timestamps = dataPoints.map(d => new Date(d.timestamp).getTime())
    const minTime = Math.min(...timestamps)
    const maxTime = Math.max(...timestamps)
    const minValue = config.yAxisMin
    const maxValue = config.yAxisMax
    const yAxisIntervals = config.yAxisIntervals

    const xScale = (timestamp) => margin.left + ((timestamp - minTime) / (maxTime - minTime)) * chartWidth
    const yScale = (value) => margin.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight

    // Draw background metric zones
    ctx.globalAlpha = 0.2
    config.zones.forEach(zone => {
      const yStart = yScale(Math.min(zone.max, maxValue))
      const yEnd = yScale(Math.max(zone.min, minValue))
      
      if (yEnd > yStart) {
        ctx.fillStyle = zone.color
        ctx.fillRect(margin.left, yStart, chartWidth, yEnd - yStart)
      }
    })
    ctx.globalAlpha = 1

    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1

    yAxisIntervals.forEach(value => {
      if (value >= minValue && value <= maxValue) {
        const y = yScale(value)
        ctx.beginPath()
        ctx.moveTo(margin.left, y)
        ctx.lineTo(margin.left + chartWidth, y)
        ctx.stroke()
      }
    })

    const numVerticalLines = 6
    for (let i = 0; i <= numVerticalLines; i++) {
      const x = margin.left + (chartWidth / numVerticalLines) * i
      ctx.beginPath()
      ctx.moveTo(x, margin.top)
      ctx.lineTo(x, margin.top + chartHeight)
      ctx.stroke()
    }

    // Draw chart axes
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top)
    ctx.lineTo(margin.left, margin.top + chartHeight)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top + chartHeight)
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight)
    ctx.stroke()

    // Draw Y-axis labels
    ctx.fillStyle = '#333'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'right'

    yAxisIntervals.forEach(value => {
      if (value >= minValue && value <= maxValue) {
        const y = yScale(value)
        ctx.fillText(value.toString(), margin.left - 10, y + 4)
      }
    })

    // Draw X-axis labels
    ctx.textAlign = 'center'
    for (let i = 0; i <= numVerticalLines; i++) {
      const timestamp = minTime + ((maxTime - minTime) / numVerticalLines) * i
      const x = margin.left + (chartWidth / numVerticalLines) * i
      const date = new Date(timestamp)
      const label = date.toLocaleDateString('en-US', { 
        timeZone: timezone,
        month: 'short', 
        day: 'numeric' 
      })
      ctx.fillText(label, x, margin.top + chartHeight + 20)
    }

    const visualGaps = detectGapsForVisualization(dataPoints)

    // Draw data line with gap-aware styling and connectGaps support
    if (dataPoints.length > 1) {
      let currentPath = null
      let currentStyle = null
      
      for (let i = 0; i < dataPoints.length - 1; i++) {
        const current = dataPoints[i]
        const next = dataPoints[i + 1]
        
        const currentTime = new Date(current.timestamp).getTime()
        const nextTime = new Date(next.timestamp).getTime()
        const hoursDiff = (nextTime - currentTime) / (1000 * 60 * 60)
        
        // Determine if we should draw this segment
        const shouldDrawLine = connectGaps || hoursDiff <= 1.5
        
        if (shouldDrawLine) {
          const x1 = xScale(currentTime)
          const y1 = yScale(current.value)
          const x2 = xScale(nextTime)
          const y2 = yScale(next.value)
          
          // Determine segment style based on data type and gap connection
          let segmentStyle = 'normal'
          
          if (connectGaps && hoursDiff > 1.5) {
            segmentStyle = 'gap-connection'
          } else if (current.is_imputed === true || next.is_imputed === true) {
            segmentStyle = 'imputed'
          }
          
          // Start new path if style changes
          if (currentStyle !== segmentStyle) {
            if (currentPath) {
              ctx.stroke()
            }
            
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            
            if (segmentStyle === 'gap-connection') {
              ctx.strokeStyle = '#ff6b6b'
              ctx.lineWidth = 2
              ctx.setLineDash([10, 5])
            } else if (segmentStyle === 'imputed') {
              ctx.strokeStyle = current.imputation_method === 'linear' ? '#666' : '#007bff'
              ctx.lineWidth = 1
              ctx.setLineDash(current.imputation_method === 'linear' ? [3, 3] : [8, 4])
            } else {
              ctx.strokeStyle = '#000'
              ctx.lineWidth = 2
              ctx.setLineDash([])
            }
            
            currentStyle = segmentStyle
            currentPath = true
          }
          
          ctx.lineTo(x2, y2)
        } else {
          // Gap too large and connectGaps is false - finish current path
          if (currentPath) {
            ctx.stroke()
            currentPath = null
            currentStyle = null
          }
        }
      }
      
      // Finish final path
      if (currentPath) {
        ctx.stroke()
      }
      
      ctx.setLineDash([])
    }
      
    // Draw gap markers for large gaps when not connecting
    if (!connectGaps) {
      for (let i = 0; i < dataPoints.length - 1; i++) {
        const current = dataPoints[i]
        const next = dataPoints[i + 1]
        
        const currentTime = new Date(current.timestamp).getTime()
        const nextTime = new Date(next.timestamp).getTime()
        const hoursDiff = (nextTime - currentTime) / (1000 * 60 * 60)
        
        if (hoursDiff > 1.5) {
          const x1 = xScale(currentTime)
          const x2 = xScale(nextTime)
          const y = margin.top + chartHeight / 2
          
          let gapColor = '#ffcccb'
          let gapText = 'Gap'
          
          if (hoursDiff <= 6) {
            gapColor = '#fff2cc'
            gapText = `${Math.round(hoursDiff)}h`
          } else {
            gapColor = '#ffcccb'
            gapText = 'Device Off'
          }
          
          ctx.fillStyle = gapColor
          ctx.fillRect(x1, y - 4, x2 - x1, 8)
          
          ctx.fillStyle = '#000'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'center'
          const gapWidth = x2 - x1
          if (gapWidth > 40) {
            ctx.fillText(gapText, (x1 + x2) / 2, y + 2)
          }
        }
      }
    }

    // Draw interactive crosshair line
    if (crosshair.visible && crosshair.x >= margin.left && crosshair.x <= margin.left + chartWidth) {
      ctx.strokeStyle = '#ff6b6b'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      
      ctx.beginPath()
      ctx.moveTo(crosshair.x, margin.top)
      ctx.lineTo(crosshair.x, margin.top + chartHeight)
      ctx.stroke()
      
      ctx.setLineDash([])
    }

    // Draw axis titles
    ctx.fillStyle = '#333'
    ctx.font = 'bold 14px Arial'
    
    // Y-axis title (rotated)
    ctx.save()
    ctx.translate(25, margin.top + chartHeight / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText(`${config.title} (${config.unit})`, 0, 0)
    ctx.restore()
    
    // X-axis title
    ctx.textAlign = 'center'
    ctx.fillText('Time', margin.left + chartWidth / 2, height - 15)

  }, [dataPoints, chartDimensions, config, timezone, crosshair, gapsDetected, connectGaps])

  // Handle mouse movement for crosshair and tooltip
  const handleMouseMove = (event) => {
    if (!dataPoints.length || !chartDimensions.width) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    const margin = { top: 30, right: 30, bottom: 60, left: 80 }
    const chartWidth = chartDimensions.width - margin.left - margin.right
    const chartHeight = chartDimensions.height - margin.top - margin.bottom

    if (mouseX >= margin.left && mouseX <= margin.left + chartWidth &&
        mouseY >= margin.top && mouseY <= margin.top + chartHeight) {
      
      setCrosshair({ visible: true, x: mouseX })

      const interpolatedData = interpolateValue(mouseX, margin, chartWidth)
      
      if (interpolatedData) {
        const tooltipContent = interpolatedData.isImputed 
          ? `${Math.round(interpolatedData.value)} ${config.unit} (Imputed)`
          : `${Math.round(interpolatedData.value)} ${config.unit}`
        
        setTooltip({
          visible: true,
          x: mouseX,
          y: mouseY,
          content: tooltipContent,
          timestamp: formatTimestamp(interpolatedData.timestamp),
          value: interpolatedData.value
        })
      }
    } else {
      setCrosshair({ visible: false, x: 0 })
      setTooltip({ visible: false, x: 0, y: 0, content: '', timestamp: '', value: 0 })
    }
  }

  // Hide crosshair and tooltip when mouse leaves chart
  const handleMouseLeave = () => {
    setCrosshair({ visible: false, x: 0 })
    setTooltip({ visible: false, x: 0, y: 0, content: '', timestamp: '', value: 0 })
  }

  // Render empty state when no data available
  if (!dataPoints.length) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">No Data Available</h3>
            <p className="chart-subtitle">Select a user and metric to view data</p>
          </div>
        </div>
        <div className="chart-content">
          <div className="chart-empty">
            <div className="chart-empty-icon">📊</div>
            <p>No data points to display</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      {/* Chart header with title and status indicators */}
      <div className="chart-header">
        <div>
          <h3 className="chart-title">{config.title} Analysis</h3>
          <p className="chart-subtitle">
            {dataPoints.length} data points over time
            {imputationApplied && (
              <span className="imputation-badge"> • Imputation Applied</span>
            )}
            {connectGaps && (
              <span className="connect-gaps-badge"> • Gaps Connected</span>
            )}
          </p>
        </div>
      </div>

      <div className="chart-content">
        {/* Interactive chart canvas with tooltip */}
        <div 
          className="chart-canvas-container" 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
          {tooltip.visible && (
            <div 
              className="chart-crosshair-tooltip"
              style={{ 
                left: tooltip.x, 
                top: tooltip.y - 10,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="tooltip-value">{tooltip.content}</div>
              <div className="tooltip-timestamp">{tooltip.timestamp}</div>
            </div>
          )}
        </div>
        
        {/* Gap detection summary */}
        {gapsDetected && gapsDetected.length > 0 && (
          <div className="gap-summary">
            <h4 className="summary-title">Gap Detection Summary</h4>
            <div className="gap-stats">
              <div className="stat-item">
                <span className="stat-label">Total Gaps:</span>
                <span className="stat-value">{gapsDetected.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Short Gaps:</span>
                <span className="stat-value">{gapsDetected.filter(g => g.gap_type === 'short').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Medium Gaps:</span>
                <span className="stat-value">{gapsDetected.filter(g => g.gap_type === 'medium').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Long Gaps:</span>
                <span className="stat-value">{gapsDetected.filter(g => g.gap_type === 'long').length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Data statistics summary */}
        {(stats || Object.keys(dataSummary).length > 0) && (
          <div className="data-summary">
            <h4 className="summary-title">Data Summary</h4>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Total Points:</span>
                <span className="stat-value">{dataSummary.total_points || stats.count}</span>
              </div>
              {dataSummary.real_points !== undefined && (
                <div className="stat-item">
                  <span className="stat-label">Real Points:</span>
                  <span className="stat-value">{dataSummary.real_points}</span>
                </div>
              )}
              {dataSummary.imputed_points !== undefined && (
                <div className="stat-item">
                  <span className="stat-label">Imputed Points:</span>
                  <span className="stat-value">{dataSummary.imputed_points}</span>
                </div>
              )}
              {dataSummary.imputation_percentage !== undefined && (
                <div className="stat-item">
                  <span className="stat-label">Imputation %:</span>
                  <span className="stat-value">{dataSummary.imputation_percentage}%</span>
                </div>
              )}
              {stats && (
                <>
                  <div className="stat-item">
                    <span className="stat-label">Minimum:</span>
                    <span className="stat-value">{Math.round(stats.min)} {config.unit}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Maximum:</span>
                    <span className="stat-value">{Math.round(stats.max)} {config.unit}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Average:</span>
                    <span className="stat-value">{Math.round(stats.average)} {config.unit}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Median:</span>
                    <span className="stat-value">{Math.round(stats.median)} {config.unit}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Visualization legend for line types */}
        <div className="gap-legend">
          <h4 className="legend-title">Data Visualization Legend</h4>
          <div className="gap-legend-items">
            <div className="legend-item">
              <div className="legend-line solid"></div>
              <span>Real Data</span>
            </div>
            <div className="legend-item">
              <div className="legend-line dotted"></div>
              <span>Short Gap (Linear Interpolation)</span>
            </div>
            <div className="legend-item">
              <div className="legend-line dashed"></div>
              <span>Medium Gap (Pattern-based)</span>
            </div>
            {connectGaps && (
              <div className="legend-item">
                <div className="legend-line" style={{ 
                  background: '#ff6b6b',
                  backgroundImage: 'repeating-linear-gradient(to right, #ff6b6b 0px, #ff6b6b 10px, transparent 10px, transparent 15px)'
                }}></div>
                <span>Gap Connection Line</span>
              </div>
            )}
            <div className="legend-item">
              <div className="legend-gap"></div>
              <span>Long Gap (Device Off)</span>
            </div>
          </div>
        </div>
        
        {/* Metric zone indicators */}
        <div className="zone-legend-centered">
          <h4 className="legend-title">{config.title} Zones</h4>
          <div className="zone-legend">
            {config.zones.map((zone, index) => (
              <div key={index} className="zone-item">
                <div 
                  className="zone-color" 
                  style={{ backgroundColor: zone.color }}
                ></div>
                <span>{zone.label} ({zone.min}-{zone.max} {config.unit})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataVisualization