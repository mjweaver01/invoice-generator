import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { formatCurrency, formatDate } from "../utils";
import type { WriteOff } from "../types";
import Navigation from "../components/Navigation";
import { Input, Select, Button, Card, Alert, Modal } from "../components/ui";

const CATEGORIES = [
  "Home Office",
  "Equipment",
  "Software/Subscriptions",
  "Travel",
  "Meals",
  "Professional Services",
  "Other",
];

export default function WriteOffs({ onLogout }: { onLogout?: () => void }) {
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
    setEditWriteOffData({
      description: "",
      amount: "",
      date: "",
      category: "",
    });
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

  const sortedWriteOffs = [...writeOffs].sort(
    (a, b) => b.date.localeCompare(a.date) || (b.id ?? 0) - (a.id ?? 0),
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card padding="lg">
        <Navigation
          title="Write-offs"
          showNewInvoice={false}
          onLogout={onLogout}
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
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 h-11 rounded-lg transition-colors flex items-center gap-2"
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
              <span className="hidden sm:inline">New Write-off</span>
            </button>
          }
        />

        {successMessage && (
          <Alert variant="purple" className="mb-6">
            {successMessage}
          </Alert>
        )}

        {showNewWriteOffForm && (
          <div className="border border-gray-200 rounded-lg p-4 mb-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Description"
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
                inputSize="sm"
              />
              <Input
                label="Amount"
                type="number"
                step="0.01"
                min="0"
                value={newWriteOffData.amount}
                onChange={(e) => {
                  setNewWriteOffData((d) => ({
                    ...d,
                    amount: e.target.value,
                  }));
                  setNewWriteOffError(null);
                }}
                placeholder="0.00"
                inputSize="sm"
              />
              <Input
                label="Date"
                type="date"
                value={newWriteOffData.date}
                onChange={(e) =>
                  setNewWriteOffData((d) => ({ ...d, date: e.target.value }))
                }
                inputSize="sm"
              />
              <Select
                label="Category"
                value={newWriteOffData.category}
                onChange={(e) =>
                  setNewWriteOffData((d) => ({
                    ...d,
                    category: e.target.value,
                  }))
                }
                selectSize="sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>
            {newWriteOffError && (
              <p className="text-sm text-red-600">{newWriteOffError}</p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCreateWriteOff}
                loading={creatingWriteOff}
                loadingText="Saving..."
                className="min-w-[100px]"
              >
                Save
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowNewWriteOffForm(false);
                  setNewWriteOffError(null);
                }}
                className="bg-gray-100 hover:bg-gray-200 border-0"
              >
                Cancel
              </Button>
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
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
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
              {sortedWriteOffs.map((writeOff) => (
                <div
                  key={writeOff.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  {editingWriteOff === writeOff.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Description"
                          type="text"
                          value={editWriteOffData.description}
                          onChange={(e) =>
                            setEditWriteOffData({
                              ...editWriteOffData,
                              description: e.target.value,
                            })
                          }
                          inputSize="sm"
                        />
                        <Input
                          label="Amount"
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
                          inputSize="sm"
                        />
                        <Input
                          label="Date"
                          type="date"
                          value={editWriteOffData.date}
                          onChange={(e) =>
                            setEditWriteOffData({
                              ...editWriteOffData,
                              date: e.target.value,
                            })
                          }
                          inputSize="sm"
                        />
                        <Select
                          label="Category"
                          value={editWriteOffData.category}
                          onChange={(e) =>
                            setEditWriteOffData({
                              ...editWriteOffData,
                              category: e.target.value,
                            })
                          }
                          selectSize="sm"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveWriteOff(writeOff.id!)}
                          loading={savingWriteOffId === writeOff.id}
                          loadingText="Saving..."
                          className="min-w-[100px]"
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="bg-gray-100 hover:bg-gray-200 border-0"
                        >
                          Cancel
                        </Button>
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
                          <span className="font-semibold text-purple-600 text-lg">
                            {formatCurrency(writeOff.amount)}
                          </span>
                          <span>{formatDate(writeOff.date, "short")}</span>
                        </div>
                      </div>
                      <div className="flex gap-3 ml-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditWriteOff(writeOff)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost-danger"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(writeOff.id!)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {showDeleteConfirm && (
        <Modal
          title="Delete Write-off?"
          message="Are you sure you want to delete this write-off? This action cannot be undone."
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={() => handleDeleteWriteOff(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
