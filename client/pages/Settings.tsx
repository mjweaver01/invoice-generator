import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

// Approximate state income tax rates (top marginal or flat rate for freelancers)
const STATE_TAX_RATES: Record<string, number> = {
  Alabama: 5.0, Alaska: 0, Arizona: 2.5, Arkansas: 4.4, California: 9.3,
  Colorado: 4.4, Connecticut: 6.99, Delaware: 6.6, Florida: 0, Georgia: 5.49,
  Hawaii: 8.25, Idaho: 5.8, Illinois: 4.95, Indiana: 3.05, Iowa: 5.7,
  Kansas: 5.7, Kentucky: 4.0, Louisiana: 4.25, Maine: 7.15, Maryland: 5.75,
  Massachusetts: 5.0, Michigan: 4.25, Minnesota: 9.85, Mississippi: 4.7,
  Missouri: 4.8, Montana: 6.75, Nebraska: 5.84, Nevada: 0,
  "New Hampshire": 0, "New Jersey": 6.37, "New Mexico": 5.9,
  "New York": 6.85, "North Carolina": 4.5, "North Dakota": 2.5,
  Ohio: 3.99, Oklahoma: 4.75, Oregon: 9.9, Pennsylvania: 3.07,
  "Rhode Island": 5.99, "South Carolina": 6.2, "South Dakota": 0,
  Tennessee: 0, Texas: 0, Utah: 4.65, Vermont: 6.6, Virginia: 5.75,
  Washington: 0, "West Virginia": 5.12, Wisconsin: 7.65, Wyoming: 0,
  "Washington D.C.": 8.5,
};

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    your_name: "",
    business_name: "",
    business_address: "",
    default_hourly_rate: 150,
    ach_account: "",
    ach_routing: "",
    zelle_contact: "",
    state: "Ohio",
    federal_tax_rate: 25.0,
    state_tax_rate: 3.99,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <button
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Invoices
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            Settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Personal Information
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={settings.your_name}
                  onChange={(e) => handleChange("your_name", e.target.value)}
                  placeholder="John Doe"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Business Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={settings.business_name}
                    onChange={(e) =>
                      handleChange("business_name", e.target.value)
                    }
                    placeholder="My Consulting LLC"
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address
                  </label>
                  <textarea
                    value={settings.business_address}
                    onChange={(e) =>
                      handleChange("business_address", e.target.value)
                    }
                    placeholder="123 Main St, Suite 100&#10;New York, NY 10001"
                    rows={3}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Default Invoice Settings
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Hourly Rate ($)
                </label>
                <input
                  type="number"
                  value={settings.default_hourly_rate}
                  onChange={(e) =>
                    handleChange(
                      "default_hourly_rate",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  step="0.01"
                  min="0"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Tax Withholding
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Used to estimate quarterly taxes on the Analytics page. Rates are approximate — consult a tax professional for your exact situation.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <select
                    value={settings.state}
                    onChange={(e) => {
                      const state = e.target.value;
                      const suggestedRate = STATE_TAX_RATES[state] ?? 0;
                      handleChange("state", state);
                      handleChange("state_tax_rate", suggestedRate);
                    }}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {Object.keys(STATE_TAX_RATES).sort().map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Federal Rate (%)
                    </label>
                    <input
                      type="number"
                      value={settings.federal_tax_rate}
                      onChange={(e) =>
                        handleChange("federal_tax_rate", parseFloat(e.target.value) || 0)
                      }
                      step="0.1"
                      min="0"
                      max="100"
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Includes SE tax (~15.3%) + income tax</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State Rate (%)
                    </label>
                    <input
                      type="number"
                      value={settings.state_tax_rate}
                      onChange={(e) =>
                        handleChange("state_tax_rate", parseFloat(e.target.value) || 0)
                      }
                      step="0.1"
                      min="0"
                      max="100"
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Auto-filled when you select a state</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Payment Methods
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ACH Account Number
                  </label>
                  <input
                    type="text"
                    value={settings.ach_account}
                    onChange={(e) =>
                      handleChange("ach_account", e.target.value)
                    }
                    placeholder="0000009999999999"
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ACH Routing Number
                  </label>
                  <input
                    type="text"
                    value={settings.ach_routing}
                    onChange={(e) =>
                      handleChange("ach_routing", e.target.value)
                    }
                    placeholder="000000999"
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zelle Email or Phone
                  </label>
                  <input
                    type="text"
                    value={settings.zelle_contact}
                    onChange={(e) =>
                      handleChange("zelle_contact", e.target.value)
                    }
                    placeholder="email@example.com or 330.647.3989"
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/")}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : loading ? "Loading..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
