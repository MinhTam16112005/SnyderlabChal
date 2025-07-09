import { CHART_COLORS } from './constants'

// Chart.js configuration for health data visualization
export const getChartOptions = (metric) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        color: CHART_COLORS.dark,
        font: {
          size: 14,
          weight: "bold",
        },
      },
    },
    title: {
      display: true,
      text: `${metric} Over Time`,
      color: CHART_COLORS.dark,
      font: {
        size: 18,
        weight: "bold",
      },
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: CHART_COLORS.white,
      bodyColor: CHART_COLORS.white,
      borderColor: CHART_COLORS.primary,
      borderWidth: 1,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: {
        color: "rgba(0, 0, 0, 0.1)",
      },
      ticks: {
        color: CHART_COLORS.gray,
      },
    },
    y: {
      grid: {
        color: "rgba(0, 0, 0, 0.1)",
      },
      ticks: {
        color: CHART_COLORS.gray,
      },
    },
  },
})

// Chart data configuration
export const getChartData = (dataPoints, metric) => ({
  labels: dataPoints.map((d) => new Date(d.timestamp).toLocaleDateString()),
  datasets: [
    {
      label: metric,
      data: dataPoints.map((d) => d.value),
      borderColor: CHART_COLORS.primary,
      backgroundColor: CHART_COLORS.primaryLight,
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: CHART_COLORS.primary,
      pointBorderColor: CHART_COLORS.white,
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
    },
  ],
})