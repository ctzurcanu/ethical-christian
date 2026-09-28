// Compare UTC calendar dates so "after" excludes the selected day itself.
export function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function filterDocuments(documents, after) {
  return documents.filter((doc) => new Date(doc.updatedAt).toISOString().slice(0, 10) > after);
}
