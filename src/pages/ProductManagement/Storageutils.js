export const uid = (prefix = "") => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const formatCurrency = (v) => (typeof v === "number" ? `$${v.toLocaleString()}` : v);

export const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString();
};

export function toCSV(rows) {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(",")];
  for (const row of rows) {
    const values = keys.map(key => {
      const value = row[key];
      if (typeof value === "string") {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    lines.push(values.join(","));
  }
  return lines.join("\n");
}