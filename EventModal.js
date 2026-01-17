
(function () {
    // Defines live schedules rules
    // Day Indices: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    // Defines live schedules rules (PHT Source)
    // Day Indices: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    const LIVE_SCHEDULES = {
        'Prayer Meeting': {
            phtDay: 2, // Tuesday
            phtTime: '04:30', // 4:30 AM PHT
            label: '04:30 AM PHT (Tue)'
        },
        'Worship Service': {
            phtDay: 6, // Saturday
            phtTime: '04:30', // 4:30 AM PHT
            label: '04:30 AM PHT (Sat)'
        },
        'Thanksgiving': {
            phtDay: 6, // Saturday
            phtTime: '17:00', // 5:00 PM PHT
            label: '05:00 PM PHT (Sat)'
        }
    };

    // Calculate next occurrence of PHT target in Local Time
    function calculateNextOccurrence(targetPhtDay, targetPhtTime) {
        // targetPhtTime format "HH:mm"
        const [h, m] = targetPhtTime.split(':').map(Number);

        // Start from today (Local)
        const now = new Date();
        const candidate = new Date(now);
        candidate.setHours(0, 0, 0, 0); // Clear time part for iteration

        // Find the next calendar date that matches the PHT Day
        // We construct a specific ISO string for that candidate date + PHT Time + PHT Offset
        // and check if it yields the correct Local Date/Time.

        // Actually, "Saturday 5pm PHT" means the date In Philippines must be Saturday.
        // We iterate generic days, format them as PHT iso string, and check if that ISO string's date corresponds to targetPhtDay.

        for (let i = 0; i < 14; i++) {
            const y = candidate.getFullYear();
            const mo = String(candidate.getMonth() + 1).padStart(2, '0');
            const d = String(candidate.getDate()).padStart(2, '0');

            // Construct PHT Time ISO String: YYYY-MM-DDTHH:mm:00+08:00
            // This asserts: "On Candidate Date (interpreted as PHT date), at Time T"
            const phtIso = `${y}-${mo}-${d}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+08:00`;

            // Check if this date indeed matches our target weekday?
            // Since we constructed it using y,mo,d... `new Date(y,mo-1,d).getDay()` tells us the day of week of that date.
            const testDay = new Date(y, candidate.getMonth(), candidate.getDate()).getDay();

            if (testDay === targetPhtDay) {
                // We found the matching day. 
                // Create the Date object, which converts to Local Time automatically.
                const localDateObj = new Date(phtIso);

                // Only return if it's in the future (or very recent past, e.g. today)
                // We'll allow "today" even if slightly passed, or strictly future? 
                // Let's assume finding the *next* or *current* valid slot.
                // If it's more than 24h in past, skip? Let's just return the first match found starting from "Today".

                return localDateObj;
            }
            candidate.setDate(candidate.getDate() + 1);
        }
        return now; // Fallback
    }

    window.enforceLiveScheduleRules = function () {
        const serviceName = document.getElementById('eventTitle').value;
        const category = document.getElementById('eventCategory').value;
        const dateInput = document.getElementById('eventDate');

        const timeInput = document.getElementById('eventTime');

        const schedule = LIVE_SCHEDULES[serviceName];

        if (category === 'Live' && schedule) {
            // AUTOMATED MODE: Calculate and Suggest (but allow edit)

            const nextOccurrence = calculateNextOccurrence(schedule.phtDay, schedule.phtTime);

            // formatting for inputs
            // Date: YYYY-MM-DD
            const y = nextOccurrence.getFullYear();
            const mo = String(nextOccurrence.getMonth() + 1).padStart(2, '0');
            const d = String(nextOccurrence.getDate()).padStart(2, '0');
            const localDateStr = `${y}-${mo}-${d}`;

            // Time: HH:mm (24h)
            const h = String(nextOccurrence.getHours()).padStart(2, '0');
            const m = String(nextOccurrence.getMinutes()).padStart(2, '0');
            const timeStr = `${h}:${m}`;

            // Set Values (Suggestion)
            dateInput.value = localDateStr;
            timeInput.value = timeStr;

            // Revert Locks (just in case they were set previously)
            dateInput.disabled = false;
            timeInput.disabled = false;

            // Remove Visual Feedback
            dateInput.style.backgroundColor = '';
            timeInput.style.backgroundColor = '';

        } else {
            // Standard Mode
            if (dateInput.disabled) dateInput.disabled = false;
            if (timeInput.disabled) timeInput.disabled = false;
            dateInput.style.backgroundColor = '';
            timeInput.style.backgroundColor = '';
        }
    };

    window.editEvent = function (date, idx) {
        if (typeof closeView === 'function') closeView();
        if (typeof events === 'undefined') return console.error('events data not found');

        const e = events[date][idx];
        window.editingId = { date, idx };

        document.getElementById('modalTitle').textContent = 'Edit Event';
        document.getElementById('eventTitle').value = e.title;
        updateCategoryOptions();

        document.getElementById('eventCategory').value = e.category || '';
        document.getElementById('eventDate').value = date;

        // Parse time string "HH:MM AM/PM" to populate dropdowns
        // Parse time string "HH:MM AM/PM" to populate 24h input
        if (e.time) {
            const match = e.time.match(/(\d+):(\d+)\s?(AM|PM)/i);
            if (match) {
                let h = parseInt(match[1]);
                const m = match[2];
                const ap = match[3].toUpperCase();

                if (ap === 'PM' && h < 12) h += 12;
                if (ap === 'AM' && h === 12) h = 0;

                document.getElementById('eventTime').value = `${String(h).padStart(2, '0')}:${m}`;
            }
        }

        document.getElementById('eventType').value = e.type;
        document.getElementById('eventNotes').value = e.notes || '';

        filterOperators();

        // Strict Rules check
        enforceLiveScheduleRules();

        // Restore checkboxes (async to wait for filterOperators DOM update)
        setTimeout(() => {
            document.querySelectorAll('#addEventTagalogCheckboxes input, #addEventEnglishCheckboxes input, #addEventOthersCheckboxes input').forEach(cb => cb.checked = false);

            if (e.team) {
                if (e.team.includes('Tagalog:') || e.team.includes('English:') || e.team.includes('Others:')) {
                    const sections = e.team.split(' | ');
                    sections.forEach(section => {
                        const parts = section.split(': ');
                        if (parts.length === 2) {
                            const [type, names] = parts;
                            const nameList = names.split(', ');
                            let containerId = '';
                            if (type === 'Tagalog') containerId = 'addEventTagalogCheckboxes';
                            else if (type === 'English') containerId = 'addEventEnglishCheckboxes';
                            else if (type === 'Others') containerId = 'addEventOthersCheckboxes';

                            if (containerId) {
                                nameList.forEach(name => {
                                    const cb = document.querySelector(`#${containerId} input[value="${name}"]`);
                                    if (cb) cb.checked = true;
                                });
                            }
                        }
                    });
                } else {
                    const teamMembers = e.team.split(', ');
                    teamMembers.forEach(member => {
                        const cb = document.querySelector(`#personnelSection input[value="${member}"]`);
                        if (cb) cb.checked = true;
                    });
                }
            }
        }, 100);

        const today = new Date().toISOString().split('T')[0];
        document.getElementById('eventDate').min = today;

        document.getElementById('eventModal').classList.add('active');
    };

    window.saveEvent = function () {
        const serviceTitle = document.getElementById('eventTitle').value;
        const category = document.getElementById('eventCategory').value;
        const date = document.getElementById('eventDate').value;
        const locale = document.getElementById('eventType').value;
        const notes = document.getElementById('eventNotes').value;

        const timeStr = document.getElementById('eventTime').value;

        if (!serviceTitle) { alert('Please select a Service'); return; }
        if (!category) { alert('Please select a Category/Option'); return; }
        if (!date) { alert('Please select a Date'); return; }

        if (!timeStr) { alert('Please complete the time selection'); return; }

        // Convert 24h timeStr to 12h format for storage
        const [h24, m] = timeStr.split(':');
        let h = parseInt(h24);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        const time12hr = `${h}:${m} ${ampm}`;

        const now = new Date();
        const year = now.getFullYear();
        const monthStr = String(now.getMonth() + 1).padStart(2, '0');
        const dayStr = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${monthStr}-${dayStr}`;

        if (date < todayStr) {
            alert('You cannot schedule an event for a past date.');
            return;
        }

        if (!locale) { alert('Please select a Locale'); return; }

        const tagalogSelected = Array.from(document.querySelectorAll('.add-event-tagalog:checked')).map(cb => cb.value);
        const englishSelected = Array.from(document.querySelectorAll('.add-event-english:checked')).map(cb => cb.value);
        const othersSelected = Array.from(document.querySelectorAll('.add-event-others:checked')).map(cb => cb.value);

        let teamMembers = [];
        if (tagalogSelected.length > 0) teamMembers.push(`Tagalog: ${tagalogSelected.join(', ')}`);
        if (englishSelected.length > 0) teamMembers.push(`English: ${englishSelected.join(', ')}`);
        if (othersSelected.length > 0) teamMembers.push(`Others: ${othersSelected.join(', ')}`);

        const data = {
            title: serviceTitle,
            category: category,
            time: time12hr,
            type: locale,
            team: teamMembers.join(' | '),
            notes: notes
        };

        if (window.editingId) {
            // Remove old event
            if (events[window.editingId.date]) {
                events[window.editingId.date].splice(window.editingId.idx, 1);
                if (events[window.editingId.date].length === 0) delete events[window.editingId.date];
            }
            window.editingId = null;
        }

        if (!events[date]) events[date] = [];
        events[date].push(data);
        events[date].sort((a, b) => {
            // Convert to 24h for sorting
            const to24 = (tStr) => {
                const [t, ap] = tStr.split(' ');
                let [h, m] = t.split(':').map(Number);
                if (ap === 'PM' && h < 12) h += 12;
                if (ap === 'AM' && h === 12) h = 0;
                return h * 60 + m;
            };
            return to24(a.time) - to24(b.time);
        });

        if (typeof saveEvents === 'function') saveEvents();
        closeEvent();
        if (typeof renderCalendar === 'function') renderCalendar();

        alert('Event saved successfully!');
    };

    window.updateCategoryOptions = function () {
        const serviceName = document.getElementById('eventTitle').value;
        const categorySelect = document.getElementById('eventCategory');
        categorySelect.innerHTML = '<option value="">Select option...</option>';

        if (!serviceName || typeof servicesConfig === 'undefined') return;

        const service = servicesConfig.find(s => s.name === serviceName);
        if (service) {
            service.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                categorySelect.appendChild(option);
            });
        }

        enforceLiveScheduleRules();

        categorySelect.onchange = enforceLiveScheduleRules;
        const dateInput = document.getElementById('eventDate');
        if (dateInput) dateInput.onchange = enforceLiveScheduleRules;
    };

    window.filterOperators = function () {
        const locale = document.getElementById('eventType').value;
        const personnelSection = document.getElementById('personnelSection');

        if (!locale) {
            personnelSection.style.display = 'none';
            return;
        }

        personnelSection.style.display = 'block';

        if (typeof teamData === 'undefined') return;
        const operators = teamData[locale] || [];

        const tagalogContainer = document.getElementById('addEventTagalogCheckboxes');
        const englishContainer = document.getElementById('addEventEnglishCheckboxes');
        const othersContainer = document.getElementById('addEventOthersCheckboxes');

        if (tagalogContainer) tagalogContainer.innerHTML = '';
        if (englishContainer) englishContainer.innerHTML = '';
        if (othersContainer) othersContainer.innerHTML = '';

        if (operators.length === 0) {
            const noOps = '<p style="color: #999; font-style: italic; padding: 5px;">No operators found</p>';
            if (tagalogContainer) tagalogContainer.innerHTML = noOps;
            if (englishContainer) englishContainer.innerHTML = noOps;
            if (othersContainer) othersContainer.innerHTML = noOps;
            return;
        }

        operators.forEach(op => {
            const createCb = (cls) => {
                const label = document.createElement('label');
                label.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 6px; cursor: pointer; border-radius: 4px; transition: background 0.2s;';
                label.onmouseover = function () { this.style.background = '#f3f4f6'; };
                label.onmouseout = function () { this.style.background = 'transparent'; };
                label.innerHTML = `
                    <input type="checkbox" class="${cls}" value="${op.value}" style="width: 16px; height: 16px; cursor: pointer;">
                    <span style="font-size: 0.9em;">${op.label}</span>
                `;
                return label;
            };

            if (tagalogContainer) tagalogContainer.appendChild(createCb('add-event-tagalog'));
            if (englishContainer) englishContainer.appendChild(createCb('add-event-english'));
            if (othersContainer) othersContainer.appendChild(createCb('add-event-others'));
        });
    };

    window.toggleCheckboxList = function (label) {
        const checkboxContainer = label.nextElementSibling;
        const toggleIcon = label.querySelector('.toggle-icon');

        if (checkboxContainer.style.display === 'none') {
            checkboxContainer.style.display = 'block';
            toggleIcon.style.transform = 'rotate(0deg)';
        } else {
            checkboxContainer.style.display = 'none';
            toggleIcon.style.transform = 'rotate(-90deg)';
        }
    };

    window.openAddEvent = function () {
        if (typeof closeView === 'function') closeView();
        window.editingId = null;

        document.getElementById('modalTitle').textContent = 'Add New Event';
        document.getElementById('eventTitle').value = '';

        // Reset category options if needed, but important to clear value
        if (typeof updateCategoryOptions === 'function') updateCategoryOptions();
        document.getElementById('eventCategory').value = '';

        document.getElementById('eventDate').value = '';
        document.getElementById('eventTime').value = '';

        document.getElementById('eventType').value = '';
        document.getElementById('eventNotes').value = '';

        // Reset Strict Rules (Unlock defaults)
        const dateInput = document.getElementById('eventDate');
        const timeInput = document.getElementById('eventTime');

        // Unlock logic
        dateInput.disabled = false;
        timeInput.disabled = false;
        dateInput.style.backgroundColor = '';
        timeInput.style.backgroundColor = '';

        // Reset checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        if (typeof filterOperators === 'function') filterOperators();

        const today = new Date().toISOString().split('T')[0];
        document.getElementById('eventDate').min = today;

        document.getElementById('eventModal').classList.add('active');
    };

    window.addEventToDate = function (date) {
        openAddEvent();
        const dateInput = document.getElementById('eventDate');
        if (dateInput) {
            dateInput.value = date;
            // Trigger strict rules just in case category was already set (unlikely for new event), 
            // but mostly to ensure UI state is correct
            if (typeof enforceLiveScheduleRules === 'function') enforceLiveScheduleRules();
        }
    };

    window.closeEvent = function () {
        document.getElementById('eventModal').classList.remove('active');
    };

    function initEventModal() {
        // Any specific event listeners for the modal can go here
        // e.g. closing when clicking outside
        const modal = document.getElementById('eventModal');
        if (modal) {
            modal.addEventListener('click', function (event) {
                if (event.target === modal) {
                    window.closeEvent();
                }
            });
        }
    }

    // Auto-run init
    initEventModal();

})();
