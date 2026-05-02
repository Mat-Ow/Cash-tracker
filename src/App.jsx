import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Routes, Route, Link } from "react-router-dom";

const supabase = createClient(
  "https://giflhochtosqycmeqykx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZmxob2NodG9zcXljbWVxeWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MzUyMDMsImV4cCI6MjA5MzExMTIwM30.uZtLpU1tDlJoCOvPbSzTNPoy9tXo2Efr56g9GUSuyXM"
);

const categories = ["Food", "Gas", "Home", "Other"];


function AddPage() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [expense_date, setDate] = useState(() => {
  return new Date().toISOString().split("T")[0]; // default today
  });

  async function fetchExpenses() {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    setExpenses(data || []);
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function addExpense(e) {
    e.preventDefault();

    if (!amount) return;

    await supabase.from("expenses").insert([
      {
        amount: parseFloat(amount),
        category,
        note,
        expense_date
      },
    ]);

    setAmount("");
    setNote("");
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


function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);

  async function fetchExpenses() {
    const { data } = await supabase
      .from("expenses")
      .select("*")
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



export default function App() {
  

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


