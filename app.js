"use strict";

// 1. Ключ хранилища и элементы интерфейса.
const STORAGE_KEY = "lab8_shopping_list_v1";
const form = document.querySelector("#shopping-form");
const input = document.querySelector("#item-name");
const list = document.querySelector("#shopping-list");
const emptyState = document.querySelector("#empty-state");
const counter = document.querySelector("#counter");
const notice = document.querySelector("#notice");
const clearButton = document.querySelector("#clear-all");
const exportButton = document.querySelector("#export-json");
const importButton = document.querySelector("#import-json");
const fileInput = document.querySelector("#file-input");

// 2. Одна запись имеет вид { id: "...", name: "Молоко" }.
function validItems(value) {
  return Array.isArray(value) && value.every(item =>
    item !== null && typeof item === "object" &&
    typeof item.id === "string" && item.id.length > 0 &&
    typeof item.name === "string" &&
    item.name.trim().length > 0 && item.name.length <= 80
  );
}

function showNotice(message) {
  notice.textContent = message;
  notice.hidden = !message;
}

// 3. Чтение из localStorage: JSON.parse() и обработка ошибок.
function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!validItems(parsed)) throw new Error("Неверная структура JSON");
    return parsed;
  } catch (error) {
    showNotice("Не удалось прочитать сохранённые данные. Показан пустой список.");
    return [];
  }
}

let items = loadItems();

// 4. Сохранение массива: JSON.stringify().
function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    showNotice("");
  } catch (error) {
    showNotice("Браузер не разрешил сохранение. Изменения могут пропасть после обновления.");
  }
  render();
}

// 5. Безопасное отображение: названия добавляются через textContent.
function render() {
  list.replaceChildren();
  for (const item of items) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.className = "item-text";
    name.textContent = item.name;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-button";
    remove.textContent = "Удалить";
    remove.dataset.id = item.id;
    remove.setAttribute("aria-label", "Удалить товар: " + item.name);
    li.append(name, remove);
    list.append(li);
  }
  emptyState.hidden = items.length > 0;
  list.hidden = items.length === 0;
  counter.textContent = items.length + " " + (
    items.length % 10 === 1 && items.length % 100 !== 11 ? "товар" :
    [2, 3, 4].includes(items.length % 10) &&
    (items.length % 100 < 12 || items.length % 100 > 14) ? "товара" : "товаров"
  );
  clearButton.disabled = items.length === 0;
  exportButton.disabled = items.length === 0;
}

// 6. Добавление товара, включая защиту от пустого ввода.
form.addEventListener("submit", event => {
  event.preventDefault();
  const name = input.value.trim();
  if (!name) { showNotice("Введите название товара."); return; }
  items.push({ id: Date.now() + "-" + Math.random().toString(36).slice(2, 8), name });
  input.value = "";
  saveItems();
  input.focus();
});

// 7. Удаление одной записи по идентификатору.
list.addEventListener("click", event => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  items = items.filter(item => item.id !== button.dataset.id);
  saveItems();
});

// 8. Удаление всех записей с подтверждением.
clearButton.addEventListener("click", () => {
  if (items.length && confirm("Удалить все товары из списка?")) {
    items = [];
    saveItems();
  }
});

// 9. Дополнительное задание: экспорт данных в JSON-файл.
exportButton.addEventListener("click", () => {
  const data = JSON.stringify({ version: 1, items }, null, 2);
  const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "shopping_list.json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// 10. Дополнительное задание: импорт JSON с проверкой формата.
importButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;
  try {
    const loaded = JSON.parse(await file.text());
    const restored = Array.isArray(loaded) ? loaded : loaded?.items;
    if (!validItems(restored)) throw new Error("Неверный формат");
    items = restored;
    saveItems();
  } catch (error) {
    showNotice("Ошибка импорта: файл должен содержать корректный список JSON.");
  }
  fileInput.value = "";
});

// 11. Восстановление интерфейса при открытии и обновлении страницы.
render();
