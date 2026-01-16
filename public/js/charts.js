let chartInstance = null;
let globalHabits = [];

document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/api/stats');
    globalHabits = await response.json();

    generateMonthHeatmap();
    renderChart('streaks'); // Default view

    // Listener for Chart Dropdown
    document.getElementById('chart-selector').addEventListener('change', (e) => {
        renderChart(e.target.value);
    });
});

// --- 1. Month-Based Heatmap Logic ---
function generateMonthHeatmap() {
    const heatmapContainer = document.getElementById('year-heatmap');
    const today = new Date();
    const allLogs = globalHabits.flatMap(h => h.logs.map(l => new Date(l).toDateString()));
    
    // We want to show the last 12 months (or current year)
    // Let's go back 11 months from today
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const year = d.getFullYear();
        const daysInMonth = new Date(year, d.getMonth() + 1, 0).getDate();

        // Create Container for Month
        const monthDiv = document.createElement('div');
        monthDiv.className = "flex flex-col gap-1 min-w-[60px]";
        
        // Month Label
        const label = document.createElement('div');
        label.className = "text-xs font-bold text-gray-400 mb-1";
        label.innerText = monthName;
        monthDiv.appendChild(label);

        // Grid for Days
        const grid = document.createElement('div');
        grid.className = "grid grid-cols-4 gap-1"; // 4 columns per month block

        for(let day = 1; day <= daysInMonth; day++) {
            const currentDayDate = new Date(year, d.getMonth(), day);
            const dateStr = currentDayDate.toDateString();
            
            // Don't render future dates
            if (currentDayDate > today) break;

            const count = allLogs.filter(l => l === dateStr).length;

            const square = document.createElement('div');
            square.className = `w-2.5 h-2.5 rounded-sm ${getColor(count)}`;
            square.title = `${dateStr}: ${count} habits`;
            grid.appendChild(square);
        }
        
        monthDiv.appendChild(grid);
        heatmapContainer.appendChild(monthDiv);
    }
}

function getColor(count) {
    if (count === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (count === 1) return 'bg-indigo-200';
    if (count === 2) return 'bg-indigo-400';
    return 'bg-indigo-600';
}

// --- 2. Dynamic Chart Logic ---
function renderChart(type) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    // Destroy previous chart if exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    let config;

    if (type === 'streaks') {
        // --- VIEW 1: Overall Streaks Bar Chart ---
        config = {
            type: 'bar',
            data: {
                labels: globalHabits.map(h => h.title),
                datasets: [{
                    label: 'Current Streak (Days)',
                    data: globalHabits.map(h => h.streak),
                    backgroundColor: '#6366f1',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#374151' } },
                    x: { grid: { display: false } }
                }
            }
        };
    } else if (type === 'weekly') {
        // --- VIEW 2: Weekly Performance (By Day of Week) ---
        // Calculate completions per day of week (0=Sun, 1=Mon...)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayCounts = [0,0,0,0,0,0,0];

        globalHabits.forEach(habit => {
            habit.logs.forEach(log => {
                const date = new Date(log);
                // Only count logs from last 7 days for relevant stats? 
                // Or all time distribution? Let's do All Time Distribution to show productive days.
                dayCounts[date.getDay()]++; 
            });
        });

        config = {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Total Habits Completed',
                    data: dayCounts,
                    borderColor: '#10b981', // Emerald Green
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#374151' } },
                    x: { grid: { display: false } }
                }
            }
        };
    }

    chartInstance = new Chart(ctx, config);
}