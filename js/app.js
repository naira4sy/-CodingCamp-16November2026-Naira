"use strict";

/* ---------- Helper ---------- */
const $ = (id) => document.getElementById(id);
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* abaikan */ }
  }
};
const showMsg = (id, text) => { $(id).textContent = text; };

/* ---------- 1. Jam, tanggal, sapaan ---------- */
let userName = store.get("ld_name", "");

function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return "Good Morning";
  if (hour >= 12 && hour <= 16) return "Good Afternoon";
  if (hour >= 17 && hour <= 20) return "Good Evening";
  return "Good Night";
}

function updateClock() {
  const now = new Date();
  $("clock").textContent = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  $("date").textContent = now.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  const hello = getGreeting(now.getHours());
  $("greeting").textContent = userName ? hello + ", " + userName : hello;

  const sub = $("brand-sub");
  if (sub) sub.textContent = userName ? userName + "'s Dashboard" : "Student Dashboard";
}
$("save-name").addEventListener("click", () => {
  userName = $("name-input").value.trim();
  store.set("ld_name", userName);
  updateClock();
});
$("name-input").addEventListener("keydown", (e) => { if (e.key === "Enter") $("save-name").click(); });
$("name-input").value = userName;
updateClock();
setInterval(updateClock, 1000);

/* ---------- 2. Dark mode ---------- */
let theme = store.get("ld_theme", "light");
function applyTheme() {
  document.documentElement.setAttribute("data-theme", theme);
  $("theme-toggle").textContent = theme === "dark" ? "☀️" : "🌙";
}
applyTheme();
$("theme-toggle").addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  store.set("ld_theme", theme);
  applyTheme();
});

/* ---------- 3. Pomodoro timer ---------- */
const RING = 439.82; // keliling lingkaran (2 * PI * 70)
let minutes = store.get("ld_minutes", 25);
let total = minutes * 60;
let remaining = total;
let timerId = null;

function renderTimer() {
  const m = String(Math.floor(remaining / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");
  $("timer-display").textContent = m + ":" + s;
  $("ring-bar").style.strokeDashoffset = String(RING * (1 - remaining / total));
  $("timer-stop").disabled = timerId === null;
}

function startTimer() {
  if (timerId !== null || remaining <= 0) return; // cegah interval ganda
  showMsg("timer-msg", "");
  timerId = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      remaining = 0;
      clearInterval(timerId);
      timerId = null;
      showMsg("timer-msg", "🎉 Session complete!");
    }
    renderTimer();
  }, 1000);
  renderTimer();
}
function stopTimer() {
  clearInterval(timerId);
  timerId = null;
  renderTimer();
}
function resetTimer() {
  stopTimer();
  remaining = total;
  showMsg("timer-msg", "");
  renderTimer();
}
function setDuration() {
  const value = parseInt($("duration").value, 10);
  if (!value || value < 1 || value > 60) {
    showMsg("timer-msg", "Isi durasi 1–60 menit.");
    return;
  }
  minutes = value;
  total = minutes * 60;
  store.set("ld_minutes", minutes);
  $("duration").value = "";
  resetTimer();
}
$("timer-start").addEventListener("click", startTimer);
$("timer-stop").addEventListener("click", stopTimer);
$("timer-reset").addEventListener("click", resetTimer);
$("duration-set").addEventListener("click", setDuration);
$("duration").addEventListener("keydown", (e) => { if (e.key === "Enter") setDuration(); });
renderTimer();

/* ---------- 4. Daily motivation + streak ---------- */
const QUOTES = [
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "Small steps every day lead to big results.", author: "Unknown" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" }
];
let quoteIndex = new Date().getDate() % QUOTES.length;

function renderQuote() {
  $("quote-text").textContent = QUOTES[quoteIndex].text;
  $("quote-author").textContent = "— " + QUOTES[quoteIndex].author;
}
$("next-quote").addEventListener("click", () => {
  quoteIndex = (quoteIndex + 1) % QUOTES.length;
  renderQuote();
});
renderQuote();

function dayKey(date) {
  return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
}
function updateStreak() {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const saved = store.get("ld_streak", { count: 0, last: "" });
  if (saved.last !== dayKey(today)) {
    saved.count = saved.last === dayKey(yesterday) ? saved.count + 1 : 1;
    saved.last = dayKey(today);
    store.set("ld_streak", saved);
  }
  $("streak").textContent = "🔥 " + saved.count + " day streak";
}
updateStreak();

/* ---------- 5. Tasks ---------- */
let todos = store.get("ld_todos", []);

function saveTodos() { store.set("ld_todos", todos); }

function renderProgress() {
  const done = todos.filter((t) => t.done).length;
  const percent = todos.length ? Math.round((done / todos.length) * 100) : 0;
  $("progress-bar").style.width = percent + "%";
  $("progress-text").textContent = todos.length ? "(" + done + "/" + todos.length + ")" : "";
}

function renderTodos() {
  const list = $("todo-list");
  list.textContent = "";
  if (todos.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No tasks remaining.";
    list.appendChild(empty);
  }
  todos.forEach((todo) => {
    const li = document.createElement("li");
    if (todo.done) li.className = "done";

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = todo.done;
    check.setAttribute("aria-label", "Selesai: " + todo.text);
    check.addEventListener("change", () => {
      todo.done = check.checked;
      saveTodos();
      renderTodos();
    });

    const text = document.createElement("span");
    text.className = "text";
    text.textContent = todo.text;

    const edit = document.createElement("button");
    edit.className = "icon-btn";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => {
      const next = prompt("Ubah tugas:", todo.text);
      if (next === null) return;
      const clean = next.trim();
      if (!clean) return showMsg("todo-msg", "Tugas tidak boleh kosong.");
      if (todos.some((t) => t.id !== todo.id && t.text.toLowerCase() === clean.toLowerCase())) {
        return showMsg("todo-msg", "Tugas itu sudah ada.");
      }
      todo.text = clean;
      showMsg("todo-msg", "");
      saveTodos();
      renderTodos();
    });

    const del = document.createElement("button");
    del.className = "icon-btn";
    del.textContent = "Hapus";
    del.addEventListener("click", () => {
      todos = todos.filter((t) => t.id !== todo.id);
      saveTodos();
      renderTodos();
    });

    li.append(check, text, edit, del);
    list.appendChild(li);
  });
  renderProgress();
}

function addTodo() {
  const text = $("todo-input").value.trim();
  if (!text) return showMsg("todo-msg", "Tulis tugasnya dulu.");
  if (todos.some((t) => t.text.toLowerCase() === text.toLowerCase())) {
    return showMsg("todo-msg", "Tugas itu sudah ada.");
  }
  todos.push({ id: Date.now(), text: text, done: false });
  saveTodos();
  $("todo-input").value = "";
  showMsg("todo-msg", "");
  renderTodos();
}
$("todo-add").addEventListener("click", addTodo);
$("todo-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addTodo(); });
renderTodos();

/* ---------- 6. Quick links ---------- */
let links = store.get("ld_links", []);

function normalizeUrl(raw) {
  let value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = "https://" + value;
  try {
    const url = new URL(value);
    return url.hostname.includes(".") ? url.href : null;
  } catch (e) { return null; }
}

function renderLinks() {
  const box = $("link-list");
  box.textContent = "";
  if (links.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "No quick links saved yet.";
    box.appendChild(p);
    return;
  }
  links.forEach((link) => {
    const chip = document.createElement("span");
    chip.className = "chip";

    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = link.name;

    const del = document.createElement("button");
    del.className = "icon-btn";
    del.textContent = "✕";
    del.setAttribute("aria-label", "Hapus link " + link.name);
    del.addEventListener("click", () => {
      links = links.filter((l) => l.id !== link.id);
      store.set("ld_links", links);
      renderLinks();
    });

    chip.append(a, del);
    box.appendChild(chip);
  });
}

function addLink() {
  const name = $("link-name").value.trim();
  const url = normalizeUrl($("link-url").value);
  if (!name) return showMsg("link-msg", "Isi label link.");
  if (!url) return showMsg("link-msg", "URL tidak valid. Contoh: google.com");
  links.push({ id: Date.now(), name: name, url: url });
  store.set("ld_links", links);
  $("link-name").value = "";
  $("link-url").value = "";
  showMsg("link-msg", "");
  renderLinks();
}
$("link-add").addEventListener("click", addLink);
$("link-url").addEventListener("keydown", (e) => { if (e.key === "Enter") addLink(); });
renderLinks();
