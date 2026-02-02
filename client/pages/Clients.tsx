import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<
    Array<{ id: number; name: string; address: string | null }>
  >([]);
  const [editingClient, setEditingClient] = useState<number | null>(null);
  const [editClientData, setEditClientData] = useState({
    name: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    });
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
    setEditClientData({ name: "", address: "" });
  };

  const handleSaveClient = async (id) => {
    try {
      await api.updateClient(id, editClientData);
      setClients(
        clients.map((c) => (c.id === id ? { ...c, ...editClientData } : c)),
      );
      setEditingClient(null);
      setSuccessMessage("Client updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update client:", err);
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <button
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Invoices
          </button>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading clients...</p>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              No clients yet. Create an invoice to add clients.
            </p>
            <button
              onClick={() => navigate("/new")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create your first invoice
            </button>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client Name
                      </label>
                      <input
                        type="text"
                        value={editClientData.name}
                        onChange={(e) =>
                          setEditClientData({
                            ...editClientData,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        value={editClientData.address}
                        onChange={(e) =>
                          setEditClientData({
                            ...editClientData,
                            address: e.target.value,
                          })
                        }
                        rows={3}
                        placeholder="Enter client address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y placeholder:text-gray-400"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveClient(client.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Save
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
                      <button
                        type="button"
                        onClick={() => handleEditClient(client)}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(client.id)}
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
        )}
      </div>

      {/* Delete Client Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black opacity-75 z-0"
            onClick={() => setShowDeleteConfirm(null)}
          ></div>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 z-1">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Delete Client?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this client? This will not affect
              existing invoices.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteClient(showDeleteConfirm)}
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
