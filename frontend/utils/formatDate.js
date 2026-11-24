export function formatDueDate(dueDate) {
    if (!dueDate) return "";

    // turn a Firestore timestamp into a normal date
    const date = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);

    // build the text as month/day/year | hour:minute
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yr = String(date.getFullYear());
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");

    return `${mm}/${dd}/${yr}   |   ${hh}:${min}`;
}

export function formatDateTime(value) {
    if (!value) return "Not available";

    // turn a Firestore timestamp into a normal date, and check it is valid
    const date = value.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString();
}