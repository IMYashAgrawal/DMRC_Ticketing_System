const BASE = "http://localhost:8000/api/v1";

async function req(path: string, method = "GET", body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// Auth
export const register = (payload: object) => req("/auth/register", "POST", payload);
export const login = (email: string, password: string) => req("/auth/login", "POST", { email, password });
export const verifyFace = (user_id: number, face_image_b64: string) =>
  req("/auth/verify-face", "POST", { user_id, face_image_b64 });

// Route
export const calcRoute = (source: string, destination: string) =>
  req(`/route/calculate?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`);

// Wallet
export const getBalance = (user_id: number) => req(`/wallet/balance/${user_id}`);
export const topup = (user_id: number, amount: number) => req("/wallet/topup", "POST", { user_id, amount });
export const getTransactions = (user_id: number) => req(`/wallet/transactions/${user_id}`);
export const buyTicket = (user_id: number, source: string, destination: string, fare: number) => 
  req("/wallet/buy-ticket", "POST", { user_id, source, destination, fare });

