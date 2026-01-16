let timer;
let timeLeft = 25 * 60; // 25 minutes
const display = document.getElementById('timer-display');
const startBtn = document.getElementById('start-timer');
const resetBtn = document.getElementById('reset-timer');

function updateDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    display.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
}

startBtn.addEventListener('click', () => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        updateDisplay();
        if (timeLeft <= 0) {
            clearInterval(timer);
            alert("Focus session complete!");
        }
    }, 1000);
});

resetBtn.addEventListener('click', () => {
    clearInterval(timer);
    timeLeft = 25 * 60;
    updateDisplay();
});