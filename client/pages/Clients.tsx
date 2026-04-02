import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import Navigation from "../components/Navigation";
import { Input, Textarea, Button, Card, Alert, Modal } from "../components/ui";

export default function Clients({ onLogout }: { onLogout?: () => void }) {
  const navigate = useNavigate();
  const [clients, setClients] = useState<
    Array<{ id: number; name: string; address: string | null }>
  >([]);
  const [editingClient, setEditingClient] = useState<number | null>(null);
  const [editClientData, setEditClientData] = useState({
    name: "",
    address: "",
    updateExistingInvoices: true,
  });
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingClientId, setSavingClientId] = useState<number | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: "", address: "" });
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClientError, setNewClientError] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await api.getAllClients();
      setClients(clientsData);
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client.id);
    setEditClientData({
      name: client.name,
      address: client.address || "",
      updateExistingInvoices: true,
    });
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
    setEditClientData({ name: "", address: "", updateExistingInvoices: true });
  };

  const handleSaveClient = async (id: number) => {
    setSavingClientId(id);
    try {
      await api.updateClient(id, editClientData);
      setClients(
        clients.map((c) => (c.id === id ? { ...c, ...editClientData } : c)),
      );
      setEditingClient(null);
      const msg = editClientData.updateExistingInvoices
        ? "Client updated — existing invoices updated too."
        : "Client updated successfully!";
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update client:", err);
    } finally {
      setSavingClientId(null);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientData.name.trim()) {
      setNewClientError("Client name is required");
      return;
    }
    setCreatingClient(true);
    setNewClientError(null);
    try {
      await api.createClient({
        name: newClientData.name.trim(),
        address: newClientData.address || undefined,
      });
      await loadClients();
      setNewClientData({ name: "", address: "" });
      setShowNewClientForm(false);
      setSuccessMessage("Client created successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setNewClientError((err as Error).message);
    } finally {
      setCreatingClient(false);
    }
  };

  const handleDeleteClient = async (id) => {
    try {
      await api.deleteClient(id);
      setClients(clients.filter((c) => c.id !== id));
      setShowDeleteConfirm(null);
      setSuccessMessage("Client deleted successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to delete client:", err);
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card padding="lg">
        <Navigation
          title="Clients"
          showNewInvoice={false}
          onLogout={onLogout}
          actions={
            <button
              onClick={() => {
                setShowNewClientForm((v) => !v);
                setNewClientError(null);
                setNewClientData({ name: "", address: "" });
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 h-11 rounded-lg transition-colors flex items-center gap-2"
              title="New Client"
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
              <span className="hidden sm:inline">New Client</span>
            </button>
          }
        />

        {successMessage && (
          <Alert variant="success" className="mb-6">
            {successMessage}
          </Alert>
        )}

        {showNewClientForm && (
          <div className="border border-gray-200 rounded-lg p-4 mb-3 space-y-3">
            <Input
              label="Client Name"
              type="text"
              value={newClientData.name}
              onChange={(e) => {
                setNewClientData((d) => ({ ...d, name: e.target.value }));
                setNewClientError(null);
              }}
              placeholder="Acme Corp"
              autoFocus
              inputSize="sm"
              error={newClientError || undefined}
            />
            <Textarea
              label="Address"
              value={newClientData.address}
              onChange={(e) =>
                setNewClientData((d) => ({ ...d, address: e.target.value }))
              }
              rows={2}
              placeholder="123 Main St, Columbus, OH 43201"
              textareaSize="sm"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCreateClient}
                loading={creatingClient}
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
                  setShowNewClientForm(false);
                  setNewClientError(null);
                }}
                className="bg-gray-100 hover:bg-gray-200 border-0"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading clients...</p>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No clients yet.</p>
            <Button
              variant="success"
              size="lg"
              onClick={() => setShowNewClientForm(true)}
            >
              Add your first client
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <div
                key={client.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                {editingClient === client.id ? (
                  <div className="space-y-3">
                    <Input
                      label="Client Name"
                      type="text"
                      value={editClientData.name}
                      onChange={(e) =>
                        setEditClientData({
                          ...editClientData,
                          name: e.target.value,
                        })
                      }
                      inputSize="sm"
                    />
                    <Textarea
                      label="Address"
                      value={editClientData.address}
                      onChange={(e) =>
                        setEditClientData({
                          ...editClientData,
                          address: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Enter client address"
                      textareaSize="sm"
                    />
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editClientData.updateExistingInvoices}
                        onChange={(e) =>
                          setEditClientData({
                            ...editClientData,
                            updateExistingInvoices: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">
                        Update existing invoices with new client info
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleSaveClient(client.id)}
                        loading={savingClientId === client.id}
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
                      <h3 className="text-lg font-semibold text-gray-900">
                        {client.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                        {client.address || (
                          <span className="italic text-gray-400">
                            No address provided
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-3 ml-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClient(client)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost-danger"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(client.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Client Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          title="Delete Client?"
          message="Are you sure you want to delete this client? This will not affect existing invoices."
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={() => handleDeleteClient(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
