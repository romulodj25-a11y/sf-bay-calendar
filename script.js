const date = new Date();

// Global Data Storage
let events = {};

// Configuration Data
const servicesConfig = [
    { name: 'Prayer Meeting', options: ['Live', 'Viewing'] },
    { name: 'Worship Service', options: ['Live', 'Viewing'] },
    { name: 'Thanksgiving', options: ['Live', 'Viewing'] }
];

const teamData = {
    'Tagalog': [
        { value: 'Bro. Eli', label: 'Bro. Eli Soriano' },
        { value: 'Bro. Daniel', label: 'Bro. Daniel Razon' }
    ],
    'English': [
        { value: 'Sis.  Luz', label: 'Sis. Luz Cruz' }
    ],
    'Others': []
};
let currentMonth = date.getMonth();
let currentYear = date.getFullYear();

const monthDisplay = document.getElementById('monthDisplay');
const calendarGrid = document.getElementById('calendarGrid');
const prevBtn = document.getElementById('prevMonth');
const nextBtn = document.getElementById('nextMonth');
const toggleBtn = document.getElementById('calendarToggle');
const toggleLabels = document.querySelectorAll('.toggle-label');

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

let isHebrew = false;

function renderCalendar(direction = '') {
    date.setDate(1);
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const nextDays = 7 - new Date(currentYear, currentMonth + 1, 0).getDay() - 1;

    // Animation Class Reset
    calendarGrid.classList.remove('slide-up', 'slide-down');
    void calendarGrid.offsetWidth; // Trigger reflow
    if (direction) {
        calendarGrid.classList.add(direction);
    }

    let days = "";

    // Previous Month Days
    for (let x = firstDayIndex; x > 0; x--) {
        days += `<div class="day-cell inactive"><span class="day-number">${prevLastDay - x + 1}</span></div>`;
    }

    // Current Month Days
    for (let i = 1; i <= lastDay; i++) {
        const isToday = i === new Date().getDate() &&
            currentMonth === new Date().getMonth() &&
            currentYear === new Date().getFullYear();

        const monthStr = String(currentMonth + 1).padStart(2, '0');
        const dayStr = String(i).padStart(2, '0');
        const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

        days += `<div class="day-cell ${isToday ? 'today' : ''}" onclick="addEventToDate('${dateStr}')">
                    <span class="day-number">${i}</span>
                    <div class="day-content">
                        ${events[dateStr] ? events[dateStr].map(e => `<div class="calendar-event ${e.category.toLowerCase()}">${e.time} ${e.title}</div>`).join('') : ''}
                    </div>
                 </div>`;
    }

    // Next Month Days
    for (let j = 1; j <= nextDays + 1; j++) { // Adjusting for grid filler
        days += `<div class="day-cell inactive"><span class="day-number">${j}</span></div>`;
    }

    calendarGrid.innerHTML = days;

    // Update Header
    if (isHebrew) {
        monthDisplay.innerText = "Hebrew Date (Simulated)"; // Placeholder logic for now
    } else {
        monthDisplay.innerText = `${months[currentMonth]} ${currentYear}`;
    }
}

prevBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar('slide-down');
});

nextBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar('slide-up');
});

toggleBtn.addEventListener('click', () => {
    isHebrew = !isHebrew;
    toggleLabels.forEach(label => label.classList.toggle('active'));
    renderCalendar();
});

renderCalendar();
