export function normalizeTags(tags) {
    // a list: trim each tag and drop empty ones
    if (Array.isArray(tags)) return tags.map((tag) => tag.trim()).filter(Boolean);

    // a comma-separated text: split it, then clean it the same way
    return typeof tags === "string"
        ? tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];
}