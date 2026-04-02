import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../api";
import { Input, Button, Alert } from "../components/ui";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        await auth.signup(username, password);
      } else {
        await auth.login(username, password);
      }
      onLogin();
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleEnterSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || loading) {
      return;
    }
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            {isSignup ? "Create Account" : "Sign In"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignup
              ? "Create a new account to get started"
              : "Sign in to your account"}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <Alert variant="error">{error}</Alert>}

          <div className="space-y-4">
            <Input
              label="Username"
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleEnterSubmit}
              inputSize="sm"
              className="mt-1 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            />

            <div>
              <Input
                label="Password"
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleEnterSubmit}
                inputSize="sm"
                className="mt-1 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                hint={isSignup ? "Must be at least 6 characters" : undefined}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              loadingText="Please wait..."
              className="w-full shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSignup ? "Sign Up" : "Sign In"}
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
              }}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isSignup
                ? "Already have an account? Sign in"
                : "Need an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
