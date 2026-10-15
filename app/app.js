"use strict";
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: works until reload */ }
}

const money = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (s) => { const n = Number(String(s).replace(/[\s,]/g, "")); return Number.isFinite(n) && n >= 0 ? n : 0; };

const $ = (id) => document.getElementById(id);
const iso = (d) => d.toISOString().slice(0, 10);
let inv = load("invoice", null) ?? { items: [{ d: "Website design", q: 1, p: 1200 }, { d: "Hosting (12 months)", q: 12, p: 15 }] };
const me = load("invoice-me", { from: "", cur: "$", tax: "0", notes: "" });

function fill() {
  $("from").value = me.from;
  $("cur").value = me.cur;
  $("tax").value = me.tax;
  $("notes").value = me.notes;
  $("to").value = inv.to ?? "";
  $("num").value = inv.num ?? `INV-${new Date().getFullYear()}-001`;
  $("date").value = inv.date ?? iso(new Date());
  $("due").value = inv.due ?? iso(new Date(Date.now() + 14 * 864e5));
}

function items() {
  $("items").replaceChildren(...inv.items.map((it, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><input aria-label="Description"></td><td class="n"><input inputmode="decimal" style="text-align:right" aria-label="Quantity"></td><td class="n"><input inputmode="decimal" style="text-align:right" aria-label="Price"></td><td class="n amt"></td><td><button class="del" aria-label="Remove line">✕</button></td>`;
    const [d, q, p] = tr.querySelectorAll("input");
    d.value = it.d; q.value = it.q; p.value = it.p;
    d.addEventListener("input", () => { it.d = d.value; totals(); });
    q.addEventListener("input", () => { it.q = q.value; totals(); });
    p.addEventListener("input", () => { it.p = p.value; totals(); });
    tr.querySelector(".del").addEventListener("click", () => { inv.items.splice(i, 1); items(); });
    return tr;
  }));
  totals();
}

function totals() {
  const c = $("cur").value;
  const sub = inv.items.reduce((s, it) => s + num(it.q) * num(it.p), 0);
  const tax = sub * num($("tax").value) / 100;
  [...$("items").querySelectorAll(".amt")].forEach((td, i) => { td.textContent = c + money.format(num(inv.items[i].q) * num(inv.items[i].p)); });
  $("sub").textContent = c + money.format(sub);
  $("taxv").textContent = c + money.format(tax);
  $("total").textContent = c + money.format(sub + tax);
  Object.assign(inv, { to: $("to").value, num: $("num").value, date: $("date").value, due: $("due").value });
  Object.assign(me, { from: $("from").value, cur: $("cur").value, tax: $("tax").value, notes: $("notes").value });
  save("invoice", inv);
  save("invoice-me", me);
}

document.querySelector(".sheet").addEventListener("input", totals);
$("cur").addEventListener("input", totals);
$("add").addEventListener("click", () => { inv.items.push({ d: "", q: 1, p: 0 }); items(); $("items").lastElementChild.querySelector("input").focus(); });
$("print").addEventListener("click", () => window.print());
$("new").addEventListener("click", () => {
  const n = ($("num").value.match(/(\d+)$/) || [, "0"])[1];
  inv = { items: [{ d: "", q: 1, p: 0 }], num: $("num").value.replace(/\d+$/, String(Number(n) + 1).padStart(n.length, "0")) };
  fill();
  items();
});
fill();
items();
