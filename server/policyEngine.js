const Holiday = require('./models/Holiday');

/**
 * Get ISO week number for a given date.
 * ISO week: week containing the first Thursday of the year.
 */
function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // Make Sunday = 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Determine week type: odd ISO week → WEEK_1, even ISO week → WEEK_2
 */
function getWeekType(date) {
    const week = getISOWeek(date);
    return week % 2 !== 0 ? 'WEEK_1' : 'WEEK_2';
}

/**
 * Get the days of the week (0=Sun, 1=Mon...6=Sat) that a batch is DESIGNATED for.
 * Batch A: WEEK_1 → Mon–Wed (1,2,3), WEEK_2 → Thu–Fri (4,5)
 * Batch B: WEEK_1 → Thu–Fri (4,5), WEEK_2 → Mon–Wed (1,2,3)
 */
function getBatchDesignatedDays(batch, weekType) {
    if (batch === 'A') {
        return weekType === 'WEEK_1' ? [1, 2, 3] : [4, 5];
    } else {
        return weekType === 'WEEK_1' ? [4, 5] : [1, 2, 3];
    }
}

/**
 * Get the NEXT working day from now (after 3 PM cutoff check).
 * Returns a Date at midnight UTC, or null if time is before 3 PM IST.
 */
function getNextWorkingDay(now) {
    // IST is UTC+5:30. Check if it's past 15:00 IST.
    const istOffset = 5.5 * 60 * 60 * 1000; // ms
    const istNow = new Date(now.getTime() + istOffset);
    const istHour = istNow.getUTCHours();
    const istMinute = istNow.getUTCMinutes();

    if (istHour < 15) {
        return null; // Too early
    }

    // Find next calendar day that is Mon–Fri
    let candidate = new Date(now);
    candidate.setUTCHours(0, 0, 0, 0);
    candidate.setUTCDate(candidate.getUTCDate() + 1);

    // Skip weekends
    while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6) {
        candidate.setUTCDate(candidate.getUTCDate() + 1);
    }
    return candidate;
}

/**
 * Format a Date to YYYY-MM-DD (UTC)
 */
function toDateString(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Parse a YYYY-MM-DD string into a UTC Date at midnight
 */
function parseDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Main policy check.
 * @param {Object} params
 * @param {string} params.batch         - 'A' or 'B'
 * @param {string} params.seatType      - 'designated' or 'floater'
 * @param {string} params.dateStr       - YYYY-MM-DD of the booking date
 * @param {Date}   params.now           - current Date object (for 3 PM rule)
 * @returns {Promise<{allowed: boolean, reason: string}>}
 */
async function checkBookingPolicy({ batch, seatType, dateStr, now }) {
    const bookingDate = parseDate(dateStr);
    const dayOfWeek = bookingDate.getUTCDay(); // 0=Sun, 6=Sat

    // 1. Block weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { allowed: false, reason: 'Weekends cannot be booked.' };
    }

    // 2. Block holidays
    const holiday = await Holiday.findOne({ date: dateStr });
    if (holiday) {
        return { allowed: false, reason: `Holiday: ${holiday.reason}` };
    }

    // 3. Enforce 3 PM cutoff — booking must be for "next working day"
    const nextWorkingDay = getNextWorkingDay(now);
    if (!nextWorkingDay) {
        return { allowed: false, reason: 'Booking is only allowed after 3:00 PM IST.' };
    }
    const nextWorkingDayStr = toDateString(nextWorkingDay);
    if (dateStr !== nextWorkingDayStr) {
        return {
            allowed: false,
            reason: `You can only book for the next working day (${nextWorkingDayStr}).`,
        };
    }

    // 4. Determine week type and designated days for the batch
    const weekType = getWeekType(bookingDate);
    const designatedDays = getBatchDesignatedDays(batch, weekType);
    const isDesignatedDay = designatedDays.includes(dayOfWeek);

    // 5. Seat eligibility
    if (seatType === 'designated') {
        if (!isDesignatedDay) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const allowedNames = designatedDays.map((d) => dayNames[d]).join(', ');
            return {
                allowed: false,
                reason: `Designated seats for Batch ${batch} are only available on ${allowedNames} in ${weekType}.`,
            };
        }
    } else if (seatType === 'floater') {
        if (isDesignatedDay) {
            return {
                allowed: false,
                reason: `Floater seats are only available on your non-designated days.`,
            };
        }
    }

    return { allowed: true, reason: 'OK' };
}

module.exports = { checkBookingPolicy, getWeekType, getISOWeek, getBatchDesignatedDays, toDateString, parseDate, getNextWorkingDay };
