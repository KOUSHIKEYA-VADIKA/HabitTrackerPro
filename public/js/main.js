// Global State Variables
let currentHabitId = null;
let currentBtn = null;

// --- 1. Sidebar & Theme Logic ---

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    if (localStorage.getItem('theme') === 'dark') html.classList.add('dark');

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            html.classList.toggle('dark');
            localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
        });
    }
});


// --- 2. History Modal Logic (Viewing Journals) ---

/**
 * Opens the History Modal.
 * Accepts either an Array (if passed directly) or a JSON string (if from data-attribute).
 */
window.viewHistory = function(title, historyData) {
    const modal = document.getElementById('historyModal') || document.getElementById('history-modal');
    const list = document.getElementById('historyList') || document.getElementById('history-list');
    const titleEl = document.getElementById('history-title');

    if (!modal || !list) return;

    // Set Title
    if (titleEl) titleEl.textContent = `${title} History`;

    // Clear previous items
    list.innerHTML = "";

    // Parse Data if it's a string (from dataset)
    let entries = [];
    if (typeof historyData === 'string') {
        try {
            entries = JSON.parse(historyData);
        } catch (e) {
            console.error("Failed to parse history JSON", e);
            entries = [];
        }
    } else if (Array.isArray(historyData)) {
        entries = historyData;
    }

    // Handle empty history
    if (!entries || entries.length === 0) {
        list.innerHTML = `<li class="text-center text-gray-400 py-4 italic">No journal entries yet.</li>`;
    } else {
        // Reverse to show newest first
        [...entries].reverse().forEach(entry => {
            const dateStr = entry.date ? new Date(entry.date).toLocaleDateString() : 'Unknown Date';
            const noteText = entry.note || entry; 

            const li = document.createElement("div");
            li.className = "bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-600";
            li.innerHTML = `
                <div class="text-xs text-brand-500 font-bold mb-1">${dateStr}</div>
                <div class="text-sm text-gray-700 dark:text-gray-200">${noteText}</div>
            `;
            list.appendChild(li);
        });
    }

    // Show Modal
    modal.classList.remove('hidden');
};

function closeHistoryModal() {
    const modal = document.getElementById('historyModal') || document.getElementById('history-modal');
    if (modal) modal.classList.add('hidden');
}


// --- 3. Habit Completion Logic (Marking Done) ---

function prepMarkDone(id, btn, isDone) {
    if (isDone) return; 
    
    currentHabitId = id;
    currentBtn = btn;
    
    // Show Note Modal
    const modal = document.getElementById('note-modal');
    const input = document.getElementById('note-input');
    const counter = document.getElementById('char-count');
    
    if (modal && input) {
        modal.classList.remove('hidden');
        input.value = ''; // Clear previous text
        
        // Reset Char Counter
        if (counter) counter.innerText = '0'; 
        
        input.focus();
    }
}

async function closeModalAndSubmit(saveNote) {
    document.getElementById('note-modal').classList.add('hidden');
    
    let note = null;
    if (saveNote) {
        const input = document.getElementById('note-input');
        if (input) note = input.value;
    }

    if (currentHabitId) {
        await executeMarkDone(currentHabitId, currentBtn, note);
    }
}

async function executeMarkDone(id, btn, note) {
    try {
        const res = await fetch(`/habits/${id}/toggle`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note: note }) 
        });
        
        const data = await res.json();
        
        if (data.success) {
            // UI Update
            btn.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'hover:bg-brand-500', 'hover:text-white');
            btn.classList.add('bg-green-500', 'text-white', 'scale-95', 'cursor-default');
            btn.innerHTML = '<i class="fa-solid fa-check-double"></i> Done Today!';
            btn.disabled = true;

            // Badge Alert
            if (data.newBadges && data.newBadges.length > 0) {
                data.newBadges.forEach(badge => {
                    alert(`🏆 BADGE UNLOCKED: ${badge.name} ${badge.icon}`);
                });
            }
            
            // Confetti
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#6366f1', '#10b981', '#f59e0b']
                });
            }

            setTimeout(() => location.reload(), 800);
        }
    } catch (error) {
        console.error("Error marking habit done:", error);
    }
}


// --- 4. Deletion Logic ---

async function deleteHabit(id) {
    if (confirm("Are you sure you want to delete this habit? All progress will be lost.")) {
        try {
            const res = await fetch(`/habits/${id}`, { method: 'DELETE' });
            const data = await res.json();
            
            if (data.success) {
                location.reload();
            } else {
                alert("Error deleting habit");
            }
        } catch (error) {
            console.error("Error deleting habit:", error);
        }
    }
}

// Global Click Listener
window.onclick = function(event) {
    const historyModal = document.getElementById('history-modal');
    const noteModal = document.getElementById('note-modal');
    
    if (event.target === historyModal) closeHistoryModal();
    if (event.target === noteModal) noteModal.classList.add('hidden');
};