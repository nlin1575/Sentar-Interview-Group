"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.step03_fetchRecent = step03_fetchRecent;
const db_1 = require("../db");
/**
 * Step 03: FETCH_RECENT
 * Load last 5 entries from storage
 * Input: → Output: recent[]
 */
function step03_fetchRecent(context, userId = 'default') {
    // Fetch recent entries from database
    const recent_entries = db_1.db.getRecentEntries(userId, 5);
    // Update context
    const updatedContext = {
        ...context,
        recent_entries
    };
    // Create log entry
    const log = {
        tag: 'FETCH_RECENT',
        input: `userId="${userId}", limit=5`,
        output: `recent[${recent_entries.length}] entries`,
        note: recent_entries.length > 0
            ? `Found ${recent_entries.length} recent entries, latest: ${recent_entries[0]?.timestamp.toISOString()}`
            : 'No recent entries found (first-time user)'
    };
    return { context: updatedContext, log };
}
//# sourceMappingURL=step03_fetchRecent.js.map