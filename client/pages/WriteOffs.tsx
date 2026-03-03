import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { formatCurrency, formatDate } from "../utils";
import type { WriteOff } from "../types";
import Navigation from "../components/Navigation";

const CATEGORIES = [
  "Home Office",
  "Equipment",
  "Software/Subscriptions",
  "Travel",
  "Meals",
  "Professional Services",
  "Other",
];

export default function WriteOffs() {
  const navigate = useNavigate();
  const [writeOffs, setWriteOffs] = useState<WriteOff[]>([]);
  const [editingWriteOff, setEditingWriteOff] = useState<number | null>(null);
  const [editWriteOffData, setEditWriteOffData] = useState({
    description: "",
    amount: "",
    date: "",
    category: "",
  });
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingWriteOffId, setSavingWriteOffId] = useState<number | null>(null);
  const [showNewWriteOffForm, setShowNewWriteOffForm] = useState(false);
  const [newWriteOffData, setNewWriteOffData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0]!,
    category: "Other",
  });
  const [creatingWriteOff, setCreatingWriteOff] = useState(false);
  const [newWriteOffError, setNewWriteOffError] = useState<string | null>(null);

  useEffect(() => {
    loadWriteOffs();
  }, []);

  const loadWriteOffs = async () => {
    try {
      setLoading(true);
      const writeOffsData = await api.getAllWriteOffs();
      setWriteOffs(writeOffsData);
    } catch (err) {
      console.error("Failed to load write-offs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditWriteOff = (writeOff: WriteOff) => {
    setEditingWriteOff(writeOff.id!);
    setEditWriteOffData({
      description: writeOff.description,
      amount: writeOff.amount.toString(),
      date: writeOff.date,
      category: writeOff.category,
    });
  };

  const handleCancelEdit = () => {
    setEditingWriteOff(null);
    setEditWriteOffData({ description: "", amount: "", date: "", category: "" });
  };

  const handleSaveWriteOff = async (id: number) => {
    setSavingWriteOffId(id);
    try {
      const updated = await api.updateWriteOff(id, {
        description: editWriteOffData.description,
        amount: parseFloat(editWriteOffData.amount),
        date: editWriteOffData.date,
        category: editWriteOffData.category,
      });
      setWriteOffs(writeOffs.map((w) => (w.id === id ? updated : w)));
      setEditingWriteOff(null);
      setSuccessMessage("Write-off updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update write-off:", err);
    } finally {
      setSavingWriteOffId(null);
    }
  };

  const handleCreateWriteOff = async () => {
    if (!newWriteOffData.description.trim()) {
      setNewWriteOffError("Description is required");
      return;
    }
    if (!newWriteOffData.amount || parseFloat(newWriteOffData.amount) <= 0) {
      setNewWriteOffError("Amount must be greater than 0");
      return;
    }
    if (!newWriteOffData.date) {
      setNewWriteOffError("Date is required");
      return;
    }
    setCreatingWriteOff(true);
    setNewWriteOffError(null);
    try {
      await api.createWriteOff({
        description: newWriteOffData.description.trim(),
        amount: parseFloat(newWriteOffData.amount),
        date: newWriteOffData.date,
        category: newWriteOffData.category,
      });
      await loadWriteOffs();
      setNewWriteOffData({
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0]!,
        category: "Other",
      });
      setShowNewWriteOffForm(false);
      setSuccessMessage("Write-off created successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setNewWriteOffError((err as Error).message);
    } finally {
      setCreatingWriteOff(false);
    }
  };

  const handleDeleteWriteOff = async (id: number) => {
    try {
      await api.deleteWriteOff(id);
      setWriteOffs(writeOffs.filter((w) => w.id !== id));
      setShowDeleteConfirm(null);
      setSuccessMessage("Write-off deleted successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to delete write-off:", err);
      setShowDeleteConfirm(null);
    }
  };

  const totalWriteOffs = writeOffs.reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <Navigation
          title="Write-offs"
          showNewInvoice={false}
          actions={
            <button
              onClick={() => {
                setShowNewWriteOffForm((v) => !v);
                setNewWriteOffError(null);
                setNewWriteOffData({
                  description: "",
                  amount: "",
                  date: new Date().toISOString().split("T")[0]!,
                  category: "Other",
                });
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              title="New Write-off"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden lg:inline">New Write-off</span>
            </button>
          }
        />

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        {showNewWriteOffForm && (
          <div className="border border-gray-200 rounded-lg p-4 mb-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newWriteOffData.description}
                  onChange={(e) => {
                    setNewWriteOffData((d) => ({
                      ...d,
                      description: e.target.value,
                    }));
                    setNewWriteOffError(null);
                  }}
                  placeholder="Office supplies, laptop, etc."
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newWriteOffData.amount}
                  onChange={(e) => {
                    setNewWriteOffData((d) => ({ ...d, amount: e.target.value }));
                    setNewWriteOffError(null);
                  }}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newWriteOffData.date}
                  onChange={(e) =>
                    setNewWriteOffData((d) => ({ ...d, date: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newWriteOffData.category}
                  onChange={(e) =>
                    setNewWriteOffData((d) => ({ ...d, category: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {newWriteOffError && (
              <p className="text-sm text-red-600">{newWriteOffError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateWriteOff}
                disabled={creatingWriteOff}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 min-w-[100px] justify-center disabled:opacity-80 disabled:cursor-wait"
              >
                {creatingWriteOff ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewWriteOffForm(false);
                  setNewWriteOffError(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading write-offs...</p>
        ) : writeOffs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No write-offs yet.</p>
            <button
              onClick={() => setShowNewWriteOffForm(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Add your first write-off
            </button>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">
                  Total Write-offs
                </span>
                <span className="text-2xl font-bold text-blue-900">
                  {formatCurrency(totalWriteOffs)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {writeOffs.map((writeOff) => (
                <div
                  key={writeOff.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  {editingWriteOff === writeOff.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={editWriteOffData.description}
                            onChange={(e) =>
                              setEditWriteOffData({
                                ...editWriteOffData,
                                description: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editWriteOffData.amount}
                            onChange={(e) =>
                              setEditWriteOffData({
                                ...editWriteOffData,
                                amount: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={editWriteOffData.date}
                            onChange={(e) =>
                              setEditWriteOffData({
                                ...editWriteOffData,
                                date: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={editWriteOffData.category}
                            onChange={(e) =>
                              setEditWriteOffData({
                                ...editWriteOffData,
                                category: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveWriteOff(writeOff.id!)}
                          disabled={savingWriteOffId === writeOff.id}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 min-w-[100px] justify-center disabled:opacity-80 disabled:cursor-wait"
                        >
                          {savingWriteOffId === writeOff.id ? (
                            <>
                              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                              Saving…
                            </>
                          ) : (
                            "Save"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {writeOff.description}
                          </h3>
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                            {writeOff.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-semibold text-green-600 text-lg">
                            {formatCurrency(writeOff.amount)}
                          </span>
                          <span>{formatDate(writeOff.date, "short")}</span>
                        </div>
                      </div>
                      <div className="flex gap-3 ml-4">
                        <button
                          type="button"
                          onClick={() => handleEditWriteOff(writeOff)}
                          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(writeOff.id!)}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black opacity-75 z-0"
            onClick={() => setShowDeleteConfirm(null)}
          ></div>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 z-1">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Delete Write-off?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this write-off? This action cannot
              be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteWriteOff(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
