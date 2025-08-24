export function getChartOptions() {
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(31, 41, 55, 0.7)',
        titleColor: '#e5e7eb',
        bodyColor: '#d1d5db',
        padding: 10,
        cornerRadius: 8,
        backdropFilter: 'blur(5px)'
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(55, 65, 81, 0.5)' },
        ticks: { color: '#9ca3af' }
      },
      y: {
        grid: { color: 'rgba(55, 65, 81, 0.5)' },
        ticks: {
          color: '#9ca3af',
          callback: (value) => `रु ${new Intl.NumberFormat('en-NP', { notation: 'compact' }).format(value)}`
        }
      }
    }
  };

  const percentageChartOptions = {
    ...commonChartOptions,
    animation: false,
    scales: {
      ...commonChartOptions.scales,
      y: {
        ...commonChartOptions.scales.y,
        ticks: {
          ...commonChartOptions.scales.y.ticks,
          callback: (value) => `${value}%`
        }
      }
    }
  };

  const ratioChartOptions = {
    ...commonChartOptions,
    animation: false,
    scales: {
      ...commonChartOptions.scales,
      y: {
        ...commonChartOptions.scales.y,
        ticks: {
          ...commonChartOptions.scales.y.ticks,
          callback: (value) => `${value}`
        }
      }
    }
  };

  const commonBarChartOptions = { 
    ...commonChartOptions,
    animation: false
  };

  const stackedBarChartOptions = {
    ...commonChartOptions,
    animation: false,
    scales: {
      ...commonChartOptions.scales,
      x: { ...commonChartOptions.scales.x, stacked: true },
      y: { ...commonChartOptions.scales.y, stacked: true }
    }
  };

  return {
    commonChartOptions,
    percentageChartOptions,
    ratioChartOptions,
    commonBarChartOptions,
    stackedBarChartOptions
  };
}

export function getMockData() {
  const {
    commonChartOptions,
    percentageChartOptions,
    ratioChartOptions,
    commonBarChartOptions,
    stackedBarChartOptions
  } = getChartOptions();

  const financialLabels = ['2021', '2022', '2023', '2024', '2025'];

  const priceChartData = {
    labels: ['Jul 22', 'Jul 25', 'Jul 28', 'Aug 1', 'Aug 4', 'Aug 7', 'Aug 10', 'Aug 13', 'Aug 16', 'Aug 19', 'Aug 22'],
    datasets: [{
      label: 'Price (NPR)',
      data: [520, 525, 523, 528, 535, 532, 538, 540, 545, 542, 545.5],
      borderColor: '#2dd4bf',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.4,
      fill: true,
      backgroundColor: 'rgba(45, 212, 191, 0.1)',
    }]
  };

  const peerChart = {
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
      datasets: [
        {
          label: 'NABIL',
          data: [100, 105, 110, 108, 115, 120],
          borderColor: '#2dd4bf',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: 'NEPSE Index',
          data: [100, 102, 105, 103, 108, 110],
          borderColor: '#60a5fa',
          borderWidth: 1,
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: 'Bank Sector Avg.',
          data: [100, 103, 106, 104, 110, 112],
          borderColor: '#a78bfa',
          borderWidth: 1,
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 0
        }
      ]
    },
    options: {
      ...commonChartOptions,
      animation: false,
      plugins: {
        legend: { display: true, labels: { color: '#9ca3af' } }
      }
    }
  };

  const allChartData = {
    income: {
      revenue: {
        title: 'Revenue',
        type: 'bar',
        data: {
          labels: financialLabels,
          datasets: [{
            data: [25e9, 28e9, 32e9, 35e9, 39e9],
            backgroundColor: '#2dd4bf'
          }]
        },
        options: commonBarChartOptions
      },
      profitMargin: {
        title: 'Profit Margin',
        type: 'line',
        data: {
          labels: financialLabels,
          datasets: [{
            data: [18, 18.2, 18.1, 17.7, 18.2],
            borderColor: '#a78bfa'
          }]
        },
        options: percentageChartOptions
      },
      netProfit: {
        title: 'Net Profit',
        type: 'bar',
        data: {
          labels: financialLabels,
          datasets: [{
            data: [4.5e9, 5.1e9, 5.8e9, 6.2e9, 7.1e9],
            backgroundColor: '#a78bfa'
          }]
        },
        options: commonBarChartOptions
      },
      eps: {
        title: 'EPS',
        type: 'line',
        data: {
          labels: financialLabels,
          datasets: [{
            data: [20.1, 22.5, 25.6, 27.1, 30.3],
            borderColor: '#facc15'
          }]
        },
        options: {
          ...commonChartOptions,
          animation: false,
          scales: {
            ...commonChartOptions.scales,
            y: {
              ...commonChartOptions.scales.y,
              ticks: {
                ...commonChartOptions.scales.y.ticks,
                callback: (value) => `रु ${value}`
              }
            }
          }
        }
      }
    },
    balance: {
      assetsLiabilities: {
        title: 'Assets & Liabilities',
        type: 'bar',
        data: {
          labels: financialLabels,
          datasets: [
            {
              label: 'Liabilities',
              data: [300e9, 320e9, 350e9, 370e9, 400e9],
              backgroundColor: '#fb923c'
            },
            {
              label: 'Equity',
              data: [50e9, 60e9, 70e9, 80e9, 90e9],
              backgroundColor: '#60a5fa'
            }
          ]
        },
        options: stackedBarChartOptions
      },
      currentRatio: {
        title: 'Current Ratio',
        type: 'line',
        data: {
          labels: financialLabels,
          datasets: [{
            data: [1.1, 1.2, 1.15, 1.22, 1.25],
            borderColor: '#4ade80'
          }]
        },
        options: ratioChartOptions
      },
      debtToEquity: {
        title: 'Debt to Equity',
        type: 'line',
        data: {
          labels: financialLabels,
          datasets: [{
            data: [6.0, 5.3, 5.0, 4.6, 4.4],
            borderColor: '#f87171'
          }]
        },
        options: ratioChartOptions
      }
    },
    cashflow: {
      operating: {
        title: 'Operating',
        type: 'bar',
        data: {
          labels: financialLabels,
          datasets: [{
            data: [5e9, 5.5e9, 6.2e9, 6.8e9, 7.5e9],
            backgroundColor: '#f87171'
          }]
        },
        options: commonBarChartOptions
      },
      investing: {
        title: 'Investing',
        type: 'bar',
        data: {
          labels: financialLabels,
          datasets: [{
            data: [-1.5e9, -1.8e9, -2.0e9, -2.2e9, -2.5e9],
            backgroundColor: '#60a5fa'
          }]
        },
        options: commonBarChartOptions
      },
      financing: {
        title: 'Financing',
        type: 'bar',
        data: {
          labels: financialLabels,
          datasets: [{
            data: [0.5e9, 0.8e9, 1.0e9, 1.1e9, 1.2e9],
            backgroundColor: '#facc15'
          }]
        },
        options: commonBarChartOptions
      },
      fcf: {
        title: 'Free Cash Flow',
        type: 'bar',
        data: {
          labels: financialLabels,
          datasets: [{
            data: [3.1e9, 3.5e9, 2.9e9, 4.1e9, 4.5e9],
            backgroundColor: '#4ade80'
          }]
        },
        options: commonBarChartOptions
      }
    }
  };

  const ownershipData = {
    pieData: {
      labels: ['Promoter', 'Public', 'Institutional'],
      datasets: [{
        data: [51, 39, 10],
        backgroundColor: ['#2dd4bf', '#60a5fa', '#a78bfa'],
        borderColor: '#0a0a0a',
        borderWidth: 4
      }]
    },
    pieOptions: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#9ca3af', padding: 20 }
        }
      }
    },
    historyData: [
      { year: 2024, details: '10% Bonus Shares, 5% Cash Dividend', exDate: '2024-11-15' },
      { year: 2023, details: '12% Bonus Shares, 6% Cash Dividend', exDate: '2023-11-12' },
      { year: 2022, details: '8% Bonus Shares, 4% Cash Dividend', exDate: '2022-11-20' },
    ]
  };

  return {
    chartOptions: {
      priceChart: { 
        data: priceChartData, 
        options: {
          ...commonChartOptions,
          animation: false
        }
      }
    },
    allChartData,
    peerChart,
    ownershipData
  };
}
