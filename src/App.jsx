import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Routes, Route, Link } from "react-router-dom";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const categories = ["Food", "Gas", "Home", "Other"];

/* ===================== ADD PAGE ===================== */

function AddPage() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [expense_date, setDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );

  async function fetchExpenses() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setExpenses(data || []);
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function addExpense(e) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Not logged in");
      return;
    }

    if (!amount) return;

    await supabase.from("expenses").insert([
      {
        amount: parseFloat(amount),
        category,
        note,
        expense_date,
        user_id: user.id,
      },
    ]);

    setAmount("");
    setNote("");
    setDate(new Date().toISOString().split("T")[0]);

    fetchExpenses();
  }

  async function deleteExpense(id) {
    await supabase.from("expenses").delete().eq("id", id);
    fetchExpenses();
  }

  return (
    <>
      <h2>Cash Tracker</h2>

      <form onSubmit={addExpense}>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: "100%", fontSize: 24, marginBottom: 10 }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <input
          type="date"
          value={expense_date}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <button style={{ width: "100%", padding: 10 }}>
          Add
        </button>
      </form>

      <hr />

      <h3>Recent</h3>
      {expenses.map((e) => (
        <div key={e.id} style={{ marginBottom: 10 }}>
          <strong>{e.amount} zł</strong> — {e.category}
          <br />
          <small>{e.note}</small>
          <br />
          <small>{e.expense_date}</small>
          <br />
          <button onClick={() => deleteExpense(e.id)}>
            Delete
          </button>
        </div>
      ))}
    </>
  );
}

/* ===================== EXPENSES PAGE ===================== */

function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);

  async function fetchExpenses() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setExpenses(data || []);
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function deleteExpense(id) {
    await supabase.from("expenses").delete().eq("id", id);
    fetchExpenses();
  }

  return (
    <>
      <h2>All Expenses</h2>

      {expenses.map((e) => (
        <div key={e.id} style={{ marginBottom: 10 }}>
          <strong>{e.amount} zł</strong> — {e.category}
          <br />
          <small>{e.note}</small>
          <br />
          <small>{e.expense_date}</small>
          <br />
          <button onClick={() => deleteExpense(e.id)}>
            Delete
          </button>
        </div>
      ))}
    </>
  );
}

/* ===================== AUTH PAGE ===================== */

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signUp() {
    await supabase.auth.signUp({ email, password });
    alert("Check your email!");
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
  }

  return (
    <div>
      <h2>Login</h2>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={signIn}>Login</button>
      <button onClick={signUp}>Sign up</button>
    </div>
  );
}

/* ===================== APP ===================== */

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (!session) {
    return <AuthPage />;
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link to="/">Add</Link> |{" "}
        <Link to="/expenses">All Expenses</Link>
      </nav>

      <Routes>
        <Route path="/" element={<AddPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
      </Routes>
    </div>
  );
}
