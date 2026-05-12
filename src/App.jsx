import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Routes, Route, Link } from "react-router-dom";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* ===================== ADD PAGE ===================== */

function AddPage() {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [note, setNote] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [type, setType] = useState("expense");
  const [expense_date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [balance, setBalance] = useState(0);

  async function fetchExpenses() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("expenses")
      .select(`
        id,
        amount,
        note,
        expense_date,
        type,
        category_id,
        categories:category_id ( name )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setExpenses(data || []);
  }

  async function fetchCategories() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", type);

    setCategories(data || []);

    const first = data?.find(c => !c.parent_id);
    setCategoryId(first ? first.id : "");
  }

  async function fetchBalance() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("expenses")
      .select("amount, type")
      .eq("user_id", user.id);

    let total = 0;

    for (const row of data || []) {
      total += row.type === "income"
        ? Number(row.amount)
        : -Number(row.amount);
    }

    setBalance(total);
  }

  useEffect(() => {
    fetchExpenses();
    fetchBalance();
  }, []);

  useEffect(() => {
    setCategoryId("");
    fetchCategories();
  }, [type]);

  async function addExpense(e) {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!amount || !categoryId) return;

    await supabase.from("expenses").insert([
      {
        amount: parseFloat(amount),
        category_id: categoryId,
        note,
        expense_date,
        type,
        user_id: user.id,
      },
    ]);

    setAmount("");
    setNote("");
    fetchExpenses();
    fetchBalance();
  }

  async function deleteExpense(id) {
    await supabase.from("expenses").delete().eq("id", id);
    fetchExpenses();
    fetchBalance();
  }

  return (
    <>
      <h2>Cash Tracker</h2>

      <h2>
        Balance: {balance >= 0 ? "+" : ""}
        {balance.toFixed(2)} zł
      </h2>

      <form onSubmit={addExpense}>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: "100%", fontSize: 24, marginBottom: 10 }}
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        >
          <option value="">Select category</option>

          {categories
            .filter(c => !c.parent_id)
            .map(parent => {
              const children = categories.filter(
                c => c.parent_id === parent.id
              );

              if (!children.length) {
                return (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                );
              }

              return (
                <optgroup key={parent.id} label={parent.name}>
                  {children.map(child => (
                    <option key={child.id} value={child.id}>
                      ↳ {child.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
        </select>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note"
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

      {expenses.map(e => (
        <div key={e.id} style={{ marginBottom: 10 }}>
          <strong>
            {e.type === "income" ? "+" : "-"}
            {e.amount} zł
          </strong>{" "}
          — {e.categories?.name || "No category"}
          <br />
          <small>{e.note}</small>
          <br />
          <button onClick={() => deleteExpense(e.id)}>Delete</button>
        </div>
      ))}
    </>
  );
}

/* ===================== EXPENSES PAGE ===================== */

function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);

  async function fetchExpenses() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("expenses")
      .select(`
        id,
        amount,
        note,
        expense_date,
        type,
        categories:category_id ( name )
      `)
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

      {expenses.map(e => (
        <div key={e.id}>
          <strong>
            {e.type === "income" ? "+" : "-"}
            {e.amount} zł
          </strong>{" "}
          — {e.categories?.name || "No category"}
          <br />
          <small>{e.note}</small>
          <br />
          <button onClick={() => deleteExpense(e.id)}>Delete</button>
        </div>
      ))}
    </>
  );
}

/* ===================== AUTH ===================== */

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signIn() {
    await supabase.auth.signInWithPassword({ email, password });
  }

  async function signUp() {
    await supabase.auth.signUp({ email, password });
  }

  return (
    <div>
      <h2>Login</h2>

      <input onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" />

      <button onClick={signIn}>Login</button>
      <button onClick={signUp}>Sign up</button>
    </div>
  );
}

/* ===================== CATEGORIES ===================== */

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [type, setType] = useState("expense");
  const [parentId, setParentId] = useState("");

  async function fetchCategories() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id);

    setCategories(data || []);
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  async function addCategory(e) {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("categories").insert([
      {
        name: newCategory,
        type,
        parent_id: parentId || null,
        user_id: user.id,
      },
    ]);

    setNewCategory("");
    setParentId("");
    fetchCategories();
  }

  async function updateCategory(id, name) {
    await supabase
      .from("categories")
      .update({ name })
      .eq("id", id);

    fetchCategories();
  }

  async function deleteCategory(id) {
    await supabase.from("categories").delete().eq("id", id);
    fetchCategories();
  }

  return (
    <>
      <h2>Categories</h2>

      <form onSubmit={addCategory}>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <select value={parentId} onChange={e => setParentId(e.target.value)}>
          <option value="">No parent</option>

          {categories
            .filter(c => !c.parent_id && c.type === type)
            .map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>

        <input
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
        />

        <button>Add</button>
      </form>

      {categories
        .filter(c => c.type === type && !c.parent_id)
        .map(parent => (
          <div key={parent.id}>
            <CategoryRow category={parent} onSave={updateCategory} onDelete={deleteCategory} />

            {categories
              .filter(c => c.parent_id === parent.id)
              .map(child => (
                <div key={child.id} style={{ marginLeft: 20 }}>
                  <CategoryRow
                    category={child}
                    onSave={updateCategory}
                    onDelete={deleteCategory}
                  />
                </div>
              ))}
          </div>
        ))}
    </>
  );
}

function CategoryRow({ category, onSave, onDelete }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(category.name);

  return (
    <div>
      {edit ? (
        <>
          <input value={name} onChange={e => setName(e.target.value)} />
          <button onClick={() => { onSave(category.id, name); setEdit(false); }}>Save</button>
        </>
      ) : (
        <>
          {category.name}
          <button onClick={() => setEdit(true)}>Edit</button>
          <button onClick={() => onDelete(category.id)}>Delete</button>
        </>
      )}
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

    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  if (!session) return <AuthPage />;

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <nav>
        <Link to="/">Add</Link> |{" "}
        <Link to="/expenses">Expenses</Link> |{" "}
        <Link to="/categories">Categories</Link>
        <button onClick={logout}>Logout</button>
      </nav>

      <Routes>
        <Route path="/" element={<AddPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
      </Routes>
    </div>
  );
}
