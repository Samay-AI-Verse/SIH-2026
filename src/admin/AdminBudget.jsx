import { useEffect, useState } from "react";
import { IndianRupee, Wallet, Plus, Trash2, ArrowUpRight, ArrowDownRight, User, Tag, Calendar, AlertCircle } from "lucide-react";
import { adminFetchBudget, adminCreateExpense, adminDeleteExpense } from "../services/apiService";
import { Skeleton } from "../components/ui/Skeleton";
import { formatINR } from "../utils/cn";

export function AdminBudget() {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [amount, setAmount] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [notes, setNotes] = useState("");

  async function loadBudget() {
    setLoading(true);
    try {
      const data = await adminFetchBudget();
      setBudget(data);
    } catch (err) {
      console.error("Failed to load budget ledger:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBudget();
  }, []);

  async function handleAddExpense(e) {
    e.preventDefault();
    if (!title.trim() || !amount || parseFloat(amount) <= 0) {
      setError("Please provide a valid Expense Title and Amount.");
      return;
    }
    setFormBusy(true);
    setError("");
    try {
      await adminCreateExpense({
        title: title.trim(),
        category: category.trim(),
        amount: parseFloat(amount),
        paid_to: paidTo.trim(),
        notes: notes.trim()
      });
      setTitle("");
      setAmount("");
      setPaidTo("");
      setNotes("");
      setShowAddForm(false);
      await loadBudget();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record expense");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleDeleteExpense(id) {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await adminDeleteExpense(id);
      await loadBudget();
    } catch (err) {
      alert("Failed to delete expense");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-web flex items-center gap-2">
            <IndianRupee className="text-emerald-600" size={36} /> Event Budget & Financial Ledger
          </h1>
          <p className="text-xs sm:text-sm font-bold text-ink/70">
            Track total team registration fees collected (Online UPI & Offline Cash) vs event operational expenses.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border-3 border-web bg-spidey px-5 py-2.5 font-ui text-sm font-black uppercase text-white shadow-[4px_4px_0_#071433] hover:bg-[#b51221] transition"
        >
          <Plus size={18} /> Record New Expense
        </button>
      </div>

      {/* Main Financial Overview Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Collected Revenue */}
          <div className="rounded-2xl border-3 border-web bg-emerald-500 p-5 text-white shadow-[6px_6px_0_#071433]">
            <div className="flex items-center justify-between text-emerald-100">
              <span className="text-xs font-black uppercase tracking-wider">Total Fees Collected</span>
              <ArrowUpRight size={20} />
            </div>
            <p className="mt-2 font-display text-4xl">{formatINR(budget?.total_revenue || 0)}</p>
            <div className="mt-2 text-[11px] font-bold text-emerald-100 flex items-center justify-between border-t border-emerald-400/40 pt-2">
              <span>UPI: {formatINR(budget?.online_revenue || 0)}</span>
              <span>Cash: {formatINR(budget?.offline_revenue || 0)}</span>
            </div>
          </div>

          {/* Online UPI Payments */}
          <div className="rounded-2xl border-3 border-web bg-white p-5 shadow-[6px_6px_0_#071433]">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-black uppercase tracking-wider">Online UPI Collections</span>
              <Wallet className="text-blue-600" size={20} />
            </div>
            <p className="mt-2 font-display text-4xl text-web">{formatINR(budget?.online_revenue || 0)}</p>
            <p className="mt-2 text-[11px] font-bold text-slate-500 border-t border-slate-100 pt-2">
              Directly verified via UTR screenshot
            </p>
          </div>

          {/* Total Event Expenses */}
          <div className="rounded-2xl border-3 border-web bg-rose-500 p-5 text-white shadow-[6px_6px_0_#071433]">
            <div className="flex items-center justify-between text-rose-100">
              <span className="text-xs font-black uppercase tracking-wider">Event Expenses</span>
              <ArrowDownRight size={20} />
            </div>
            <p className="mt-2 font-display text-4xl">{formatINR(budget?.total_expenses || 0)}</p>
            <p className="mt-2 text-[11px] font-bold text-rose-100 border-t border-rose-400/40 pt-2">
              {budget?.expenses?.length || 0} Recorded expense entries
            </p>
          </div>

          {/* Net Fund Balance */}
          <div className="rounded-2xl border-3 border-web bg-gold p-5 text-web shadow-[6px_6px_0_#071433]">
            <div className="flex items-center justify-between text-web/80">
              <span className="text-xs font-black uppercase tracking-wider">Net Available Fund</span>
              <IndianRupee size={20} />
            </div>
            <p className="mt-2 font-display text-4xl">{formatINR(budget?.net_balance || 0)}</p>
            <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-web/70 border-t border-web/20 pt-2">
              Total Revenue - Total Expenses
            </p>
          </div>
        </div>
      )}

      {/* Offline Cash Collector Breakdown */}
      {!loading && budget?.collector_breakdown && Object.keys(budget.collector_breakdown).length > 0 && (
        <div className="rounded-2xl border-3 border-web bg-white p-5 shadow-[4px_4px_0_#071433]">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h3 className="font-display text-2xl text-web flex items-center gap-2">
              <User className="text-emerald-600" size={24} /> Offline Cash Collectors Summary
            </h3>
            <span className="text-xs font-bold text-slate-500">
              Total Offline Cash: <strong className="text-emerald-700 font-display text-base">{formatINR(budget?.offline_revenue || 0)}</strong>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(
              Object.entries(budget.collector_breakdown).reduce((acc, [col, sum]) => {
                const nl = (col || "").trim().toLowerCase();
                let cleanName = col;
                if (nl.includes("mrunal") || nl === "mru") cleanName = "Mrunal";
                else if (nl.includes("sadik")) cleanName = "Sadik Gonarkar";
                else if (nl.includes("prathmesh") || nl.includes("prathamesh")) cleanName = "Prathmesh";
                else if (nl.includes("abhay")) cleanName = "Abhay Tak";
                else if (nl.includes("samay")) cleanName = "Samay";
                else if (nl.includes("jadu")) cleanName = "Jadu";
                acc[cleanName] = (acc[cleanName] || 0) + sum;
                return acc;
              }, {})
            ).map(([collector, sum]) => (
              <div key={collector} className="rounded-xl border-2 border-web/20 bg-slate-50 hover:bg-amber-50/60 transition p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-web text-white font-bold text-xs flex items-center justify-center">
                    {collector.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-ink block">{collector}</span>
                    <span className="text-[10.5px] font-bold text-slate-400">Cash Verified</span>
                  </div>
                </div>
                <span className="font-display text-2xl text-emerald-700">{formatINR(sum)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Expense Form Drawer */}
      {showAddForm && (
        <div className="rounded-2xl border-4 border-web bg-white p-6 shadow-[6px_6px_0_#071433] animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b-2 border-web/10 pb-3 mb-4">
            <h3 className="font-display text-2xl text-web flex items-center gap-2">
              <Plus size={20} className="text-spidey" /> Record Event Expense
            </h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-700">
              ✕
            </button>
          </div>

          <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Expense Title / Description *</label>
              <input
                type="text"
                placeholder="e.g. Winner Trophies & Printing Certificates"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-sm font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Expense Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-sm font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
              >
                <option value="Certificates & Badges">Certificates & Badges</option>
                <option value="Refreshments & Snacks">Refreshments & Snacks</option>
                <option value="Banners & Posters">Banners & Posters</option>
                <option value="Trophies & Prizes">Trophies & Prizes</option>
                <option value="Stage & Sound System">Stage & Sound System</option>
                <option value="Mementoes for Guests">Mementoes for Guests</option>
                <option value="General / Misc">General / Misc</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-sm font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Paid To / Vendor Name</label>
              <input
                type="text"
                placeholder="e.g. Nanded Digital Press"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-sm font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-black uppercase text-slate-700 mb-1">Additional Notes</label>
              <input
                type="text"
                placeholder="Optional notes or receipt references..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-sm font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
              />
            </div>

            {error && (
              <div className="sm:col-span-2 rounded-xl border-2 border-rose-500 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                {error}
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-xl border-2 border-web/20 px-4 py-2 text-xs font-bold uppercase text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formBusy}
                className="rounded-xl border-2 border-web bg-web px-6 py-2 text-xs font-black uppercase text-white hover:bg-spidey transition shadow-xs"
              >
                {formBusy ? "Saving..." : "Save Expense Record"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses Ledger Table */}
      <div className="overflow-hidden rounded-2xl border-3 border-web bg-white shadow-[6px_6px_0_#071433]">
        <div className="p-4 bg-web text-white flex items-center justify-between">
          <p className="font-display text-2xl tracking-wide">
            Expense Receipts & Voucher Ledger ({budget?.expenses?.length || 0})
          </p>
          <span className="text-xs font-bold uppercase tracking-wider bg-gold text-ink px-2.5 py-0.5 rounded-full">
            GTMC Organizers Ledger
          </span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !budget?.expenses || budget.expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-bold">
            No expenses recorded yet. Click "Record New Expense" to track your first event expenditure!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 font-ui text-xs font-black uppercase tracking-wider text-slate-700 border-b-2 border-web/20">
                <tr>
                  <th className="px-4 py-3">Title & Details</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Paid To</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {budget.expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-amber-50/50 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-ink">{e.title}</div>
                      {e.notes && <div className="text-xs text-slate-500 mt-0.5">{e.notes}</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-bold text-slate-700">
                      {e.paid_to || "—"}
                    </td>
                    <td className="px-4 py-3.5 font-display text-2xl text-rose-600 font-bold">
                      {formatINR(e.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-rose-600 hover:bg-rose-600 hover:text-white transition"
                        title="Delete expense entry"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
