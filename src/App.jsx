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
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [note, setNote] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [expense_date, setDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [type, setType] = useState("expense");
  const [balance, setBalance] = useState(0);
  

  async function fetchExpenses() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
  .from("expenses")
  .select(`
    id,
    amount,
    note,
    expense_date,
    category_id,
    type,
    categories:category_id ( name )
  `)
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

console.log(data, error);

    setExpenses(data || []);
  }
  
async function fetchCategories() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", type)
    .order("name");

  if (error) {
    console.error(error);
    return;
  }

  setCategories(data || []);

  // select first category automatically
  if (data?.length) {
    setCategoryId(data[0].id);
  } else {
    setCategoryId(null);
  }
}

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    fetchBalance();
  }, [type]);

  async function addExpense(e) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Not logged in");
      return;
    }

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
    setDate(new Date().toISOString().split("T")[0]);

    fetchExpenses();
    fetchBalance();
  }

  async function deleteExpense(id) {
    await supabase.from("expenses").delete().eq("id", id);
    fetchExpenses();
    fetchBalance();
  }
  
  
  async function fetchBalance() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data } = await supabase
    .from("expenses")
    .select("amount, type")
    .eq("user_id", user.id);

  let total = 0;

  for (const row of data || []) {
    if (row.type === "income") {
      total += Number(row.amount);
    } else {
      total -= Number(row.amount);
    }
  }

  setBalance(total);
}


  return (
    <>
      <h2>Cash Tracker</h2>

<h2>Balance: {balance.toFixed(2)} zł</h2>

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
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: "100%", fontSize: 24, marginBottom: 10 }}
        />

        <select
          value={categoryId || ""}
          onChange={(e) => setCategoryId(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
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
          <strong>
  {e.type === "income" ? "+" : "-"}
  {e.amount} zł
</strong> —{" "}
          {e.categories?.name || "No category"}
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

    const { data, error } = await supabase
  .from("expenses")
  .select(`
    id,
    amount,
    note,
    expense_date,
    category_id,
    type,
    categories!inner (name)
  `)
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

console.log(data, error);

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
          <strong>
  {e.type === "income" ? "+" : "-"}
  {e.amount} zł
</strong> —{" "}
          {e.categories?.name || "No category"}
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("User created");
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


/* ================== Category =================== */

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [type, setType] = useState("expense");

  async function fetchCategories() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setCategories(data || []);
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  async function addCategory(e) {
    e.preventDefault();

    if (!newCategory.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("categories")
      .insert({
        name: newCategory.trim(),
        user_id: user.id,
        type: type,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setNewCategory("");
    fetchCategories();
  }

  async function updateCategory(id, name) {
    const trimmed = name.trim();

    if (!trimmed) return;

    const { error } = await supabase
      .from("categories")
      .update({ name: trimmed })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchCategories();
  }

  async function deleteCategory(id) {
    const confirmed = window.confirm(
      "Delete this category?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchCategories();
  }

  return (
    <>
      <h2>Categories</h2>
      
<select
  value={type}
  onChange={(e) => setType(e.target.value)}
  style={{
    width: "100%",
    marginBottom: 10,
  }}
>
  <option value="expense">Expense</option>
  <option value="income">Income</option>
</select>


      <form onSubmit={addCategory}>
        <input
          placeholder="New category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          style={{
            width: "100%",
            marginBottom: 10,
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 20,
          }}
        >
          Add Category
        </button>
      </form>

      {categories.map((c) => (
        <CategoryRow
          key={c.id}
          category={c}
          onSave={updateCategory}
          onDelete={deleteCategory}
        />
      ))}
    </>
  );
} 


/* =============================================== */

function CategoryRow({
  category,
  onSave,
  onDelete,
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 10,
        marginBottom: 10,
      }}
    >
      {editing ? (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              marginBottom: 10,
            }}
          />

          <button
            onClick={() => {
              onSave(category.id, name);
              setEditing(false);
            }}
            style={{ marginRight: 10 }}
          >
            Save
          </button>

          <button
            onClick={() => {
              setEditing(false);
              setName(category.name);
            }}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <strong>{category.name}</strong>

          <br />

          <button
            onClick={() => setEditing(true)}
            style={{ marginRight: 10 }}
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(category.id)}
          >
            Delete
          </button>
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

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
  }

  if (!session) return <AuthPage />;

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link to="/">Add</Link> |{" "}
        <Link to="/expenses">All Expenses</Link> |{" "}
        <Link to="/categories">Categories</Link>
        <button
          onClick={logout}
          style={{ marginLeft: 10, padding: "4px 8px" }}
        >
          Logout
        </button>
      </nav>

      <Routes>
        <Route path="/" element={<AddPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
      </Routes>
    </div>
  );
}
