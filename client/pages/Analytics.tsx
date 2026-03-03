import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Invoice, Settings } from "../types";
import { formatCurrency, formatDate } from "../utils";
import { api } from "../api";

type YearOption = number | "all";

/** Parse YYYY-MM-DD without timezone shift */
function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year: year!, month: month!, day: day! };
}

export default function Analytics() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<YearOption>("all");

  useEffect(() => {
    (async () => {
      try {
        const [data, settingsData] = await Promise.all([
          api.getAllInvoices(),
          api.getSettings(),
        ]);
        setInvoices(data);
        setSettings(settingsData);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set(
      invoices.map((inv) => parseDateParts(inv.invoice_date).year),
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [invoices]);

  const filtered = useMemo(() => {
    if (selectedYear === "all") return invoices;
    return invoices.filter(
      (inv) => parseDateParts(inv.invoice_date).year === selectedYear,
    );
  }, [invoices, selectedYear]);

  const paid = useMemo(
    () => filtered.filter((inv) => inv.status === "paid"),
    [filtered],
  );
  const sent = useMemo(
    () => filtered.filter((inv) => inv.status === "sent"),
    [filtered],
  );
  const draft = useMemo(
    () => filtered.filter((inv) => inv.status === "draft"),
    [filtered],
  );

  const totalEarned = paid.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalOutstanding = sent.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalInvoiced = filtered.reduce(
    (sum, inv) => sum + (inv.total || 0),
    0,
  );
  const collectionRate =
    totalInvoiced > 0 ? (totalEarned / totalInvoiced) * 100 : 0;
  const avgInvoice = paid.length > 0 ? totalEarned / paid.length : 0;

  const federalRate = settings?.federal_tax_rate ?? 25;
  const stateRate = settings?.state_tax_rate ?? 3.99;
  const totalTaxRate = federalRate + stateRate;
  const federalOwed = (totalEarned * federalRate) / 100;
  const stateOwed = (totalEarned * stateRate) / 100;
  const totalTaxOwed = federalOwed + stateOwed;
  const takeHome = totalEarned - totalTaxOwed;
  const quarterlyEstimate = totalTaxOwed / 4;

  // Monthly breakdown for bar chart
  const monthlyData = useMemo(() => {
    const MONTH_NAMES = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    if (selectedYear !== "all") {
      return MONTH_NAMES.map((name, i) => {
        const monthPaid = paid
          .filter((inv) => parseDateParts(inv.invoice_date).month - 1 === i)
          .reduce((sum, inv) => sum + (inv.total || 0), 0);
        const monthSent = sent
          .filter((inv) => parseDateParts(inv.invoice_date).month - 1 === i)
          .reduce((sum, inv) => sum + (inv.total || 0), 0);
        return { name, paid: monthPaid, outstanding: monthSent };
      });
    }

    // All years: group by year
    const byYear: Record<number, { paid: number; outstanding: number }> = {};
    filtered.forEach((inv) => {
      const y = parseDateParts(inv.invoice_date).year;
      if (!byYear[y]) byYear[y] = { paid: 0, outstanding: 0 };
      if (inv.status === "paid") byYear[y]!.paid += inv.total || 0;
      if (inv.status === "sent") byYear[y]!.outstanding += inv.total || 0;
    });
    return Object.entries(byYear)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, vals]) => ({ name: year, ...vals }));
  }, [filtered, paid, sent, selectedYear]);

  // Top clients by paid revenue
  const topClients = useMemo(() => {
    const byClient: Record<string, { paid: number; invoices: number }> = {};
    paid.forEach((inv) => {
      if (!byClient[inv.client_name])
        byClient[inv.client_name] = { paid: 0, invoices: 0 };
      byClient[inv.client_name]!.paid += inv.total || 0;
      byClient[inv.client_name]!.invoices += 1;
    });
    return Object.entries(byClient)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.paid - a.paid)
      .slice(0, 8);
  }, [paid]);

  // Recent paid invoices
  const recentPaid = useMemo(
    () =>
      [...paid]
        .sort(
          (a, b) =>
            new Date(b.invoice_date).getTime() -
            new Date(a.invoice_date).getTime(),
        )
        .slice(0, 5),
    [paid],
  );

  const chartColors = {
    paid: "#2563eb",
    outstanding: "#f59e0b",
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name === "paid" ? "Earned" : "Outstanding"}:{" "}
            {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 text-lg">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex flex-col xs:flex-row justify-between xs:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 mt-1">Income overview & insights</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(
                  e.target.value === "all" ? "all" : Number(e.target.value),
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Time</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              onClick={() => navigate("/")}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Invoices
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Earned</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalEarned)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {paid.length} paid invoice{paid.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-amber-500">
            {formatCurrency(totalOutstanding)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {sent.length} unpaid invoice{sent.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">
            Collection Rate
          </p>
          <p className="text-2xl font-bold text-blue-600">
            {collectionRate.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">of total invoiced</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Avg Invoice</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(avgInvoice)}
          </p>
          <p className="text-xs text-gray-400 mt-1">paid invoices only</p>
        </div>
      </div>

      {/* Tax Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Tax Estimate
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Based on {federalRate}% federal + {stateRate}%{" "}
              {settings?.state ?? "state"} — adjust in{" "}
              <button
                onClick={() => navigate("/settings")}
                className="text-blue-600 hover:underline"
              >
                Settings
              </button>
            </p>
          </div>
          {totalEarned > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Effective rate</p>
              <p className="text-lg font-bold text-gray-900">
                {totalTaxRate.toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        {totalEarned === 0 ? (
          <p className="text-gray-400 text-sm">
            No paid income to calculate taxes on.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-xs font-medium text-red-600 mb-1">
                Federal Tax
              </p>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(federalOwed)}
              </p>
              <p className="text-xs text-red-400 mt-0.5">
                {federalRate}% of earned
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-xs font-medium text-orange-600 mb-1">
                {settings?.state ?? "State"} Tax
              </p>
              <p className="text-xl font-bold text-orange-700">
                {formatCurrency(stateOwed)}
              </p>
              <p className="text-xs text-orange-400 mt-0.5">
                {stateRate}% of earned
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-600 mb-1">
                Total Set Aside
              </p>
              <p className="text-xl font-bold text-gray-800">
                {formatCurrency(totalTaxOwed)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {totalTaxRate.toFixed(1)}% combined
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs font-medium text-green-600 mb-1">
                Take-Home
              </p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(takeHome)}
              </p>
              <p className="text-xs text-green-400 mt-0.5">after taxes</p>
            </div>
          </div>
        )}

        {totalEarned > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-amber-500 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-gray-500">
                Quarterly estimated payment (÷4):{" "}
                <span className="font-semibold text-gray-800">
                  {formatCurrency(quarterlyEstimate)}
                </span>
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Not tax advice — consult a CPA
            </p>
          </div>
        )}
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          {selectedYear === "all"
            ? "Income by Year"
            : `${selectedYear} — Monthly Breakdown`}
        </h2>
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-12">
            No invoices for this period
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={monthlyData}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                barCategoryGap="30%"
                barGap={4}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) =>
                    v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                  }
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#f9fafb" }}
                />
                <Bar
                  dataKey="paid"
                  name="paid"
                  fill={chartColors.paid}
                  radius={[4, 4, 0, 0]}
                >
                  {monthlyData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.paid > 0 ? chartColors.paid : "#e5e7eb"}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="outstanding"
                  name="outstanding"
                  fill={chartColors.outstanding}
                  radius={[4, 4, 0, 0]}
                >
                  {monthlyData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.outstanding > 0
                          ? chartColors.outstanding
                          : "#e5e7eb"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-6 mt-4 justify-center text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ background: chartColors.paid }}
                />
                Earned
              </span>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ background: chartColors.outstanding }}
                />
                Outstanding
              </span>
            </div>
          </>
        )}
      </div>

      {/* Status Breakdown + Top Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Invoice Status
          </h2>
          <div className="space-y-4">
            {[
              {
                label: "Paid",
                count: paid.length,
                amount: totalEarned,
                color: "bg-green-500",
                textColor: "text-green-700",
                bgColor: "bg-green-50",
              },
              {
                label: "Sent / Unpaid",
                count: sent.length,
                amount: totalOutstanding,
                color: "bg-amber-400",
                textColor: "text-amber-700",
                bgColor: "bg-amber-50",
              },
              {
                label: "Draft",
                count: draft.length,
                amount: draft.reduce((s, i) => s + (i.total || 0), 0),
                color: "bg-gray-300",
                textColor: "text-gray-600",
                bgColor: "bg-gray-50",
              },
            ].map(({ label, count, amount, color, textColor, bgColor }) => (
              <div
                key={label}
                className={`flex items-center justify-between rounded-lg px-4 py-3 ${bgColor}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {label}
                  </span>
                  <span className="text-xs text-gray-400">({count})</span>
                </div>
                <span className={`text-sm font-semibold ${textColor}`}>
                  {formatCurrency(amount)}
                </span>
              </div>
            ))}
          </div>

          {/* Summary row */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">
              Total invoiced ({filtered.length})
            </span>
            <span className="font-bold text-gray-900">
              {formatCurrency(totalInvoiced)}
            </span>
          </div>
        </div>

        {/* Top clients */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Top Clients
          </h2>
          {topClients.length === 0 ? (
            <p className="text-gray-400 text-sm">No paid invoices yet</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((client, i) => {
                const pct =
                  totalEarned > 0 ? (client.paid / totalEarned) * 100 : 0;
                return (
                  <div key={client.name}>
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-4">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-800 truncate max-w-36">
                          {client.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          ×{client.invoices}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 ml-2 shrink-0">
                        {formatCurrency(client.paid)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Paid Invoices */}
      {recentPaid.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Recent Payments
          </h2>
          <div className="space-y-2">
            {recentPaid.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {inv.client_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {inv.invoice_number} ·{" "}
                    {formatDate(inv.invoice_date, "short")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(inv.total || 0)}
                  </span>
                  <button
                    onClick={() => navigate(`/edit/${inv.id}`)}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
