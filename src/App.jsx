import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://giflhochtosqycmeqykx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZmxob2NodG9zcXljbWVxeWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MzUyMDMsImV4cCI6MjA5MzExMTIwM30.uZtLpU1tDlJoCOvPbSzTNPoy9tXo2Efr56g9GUSuyXM"
);

const categories = ["Food", "Gas", "Home", "Other"];

export default function App() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [expenses, setExpenses] = useState([]);

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
      },
    ]);

    setAmount("");
    setNote("");
    fetchExpenses();
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
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
        </div>
      ))}
    </div>
  );
}
