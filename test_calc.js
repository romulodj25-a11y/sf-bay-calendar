
// Test PHT to Local (PST) conversion
const now = new Date('2026-01-15T23:27:04-08:00'); // Simulated current time (Thu)

function calculateNextOccurrence(targetDayPht, targetTimePht) {
    // 1. Get Next Occurrence of Target Day relative to *Local* time? 
    // Actually we should align with the PHT target. 
    // If today is Thursday (PST), it is Friday (PHT) already (approx).

    // Strategy: 
    // 1. Take 'now' (Local).
    // 2. Advance to the next occurrence of 'targetDayPht' in LOCAL time first? 
    // No, PHT day might be different. 

    // Better Strategy: 
    // 1. Find the next occurrence of the target day relative to NOW, but treat NOW as PHT? 
    // Or just iterate days until we find the match?

    // Let's rely on the fact that we know the offsets. 
    // PHT is UTC+8.
    // Local (PST) is UTC-8. 

    // Let's create a UTC date for the target PHT time.
    // PHT time T = UTC time (T - 8 hours).

    const [h, m] = targetTimePht.split(':').map(Number);

    // Start with today (Local)
    let candidate = new Date(now);
    candidate.setHours(0, 0, 0, 0);

    // We want to find a date D such that "D at T (PHT)" is in the future (or today).

    for (let i = 0; i < 14; i++) { // Check next 2 weeks
        // Construct the PHT moment for this candidate day
        // ISO string format with offset: YYYY-MM-DDTHH:mm:00+08:00
        const y = candidate.getFullYear();
        const mo = String(candidate.getMonth() + 1).padStart(2, '0');
        const d = String(candidate.getDate()).padStart(2, '0');

        const phtIso = `${y}-${mo}-${d}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+08:00`;
        const phtDate = new Date(phtIso);

        // Use phtDate.getDay() ? No, asking "Day 6 (Sat)" usually refers to the PHT day.
        // The ISO string forces it to be that PHT time. 
        // We just need to ensure the candidate day Matches the target day? 

        // Wait, "Saturday 5pm PHT". That means the date string Y-M-D MUST be a Saturday.
        const checkDay = new Date(phtIso).getUTCDay();
        // Wait! getUTCDay() returns UTC day. 
        // We want PHT day. 
        // If offset is +08:00, and we explicitly constructed Y-M-D... then Y-M-D IS the PHT date.
        // So we just need to check if Y-M-D corresponds to 'targetDayPht'.

        const testForDay = new Date(y, candidate.getMonth(), candidate.getDate());
        if (testForDay.getDay() === targetDayPht) {
            // Found the correct day of week.
            // Now check if this time is in the future? Or just return next one.
            if (phtDate > now) {
                return phtDate;
            }
        }
        candidate.setDate(candidate.getDate() + 1);
    }
}

// Test Thanksgiving: Sat (6), 17:00 PHT
const tg = calculateNextOccurrence(6, '17:00');
console.log('Thanksgiving Local:', tg.toString());
console.log('Thanksgiving ISO:', tg.toISOString());
console.log('Expected: ~ 1AM PST Saturday');

