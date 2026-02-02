export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace(".00", "");
};

export const formatDate = (
  dateString: string,
  format: "long" | "short" = "long",
): string => {
  if (!dateString) return "";
  // Parse date string manually to avoid timezone issues
  // Input format: "YYYY-MM-DD"
  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3 || parts.some((p) => isNaN(p))) return "";
  const year = parts[0]!;
  const month = parts[1]!;
  const day = parts[2]!;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: format,
    day: "numeric",
  });
};
