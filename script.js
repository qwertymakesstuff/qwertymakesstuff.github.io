const editor = document.querySelector("#editor");
const lineTemplate = document.querySelector("#lineTemplate");
const formatButtons = [...document.querySelectorAll(".format-button")];
const sceneList = document.querySelector("#sceneList");
const castList = document.querySelector("#castList");
const castCount = document.querySelector("#castCount");
const sceneCount = document.querySelector("#sceneCount");
const pageCount = document.querySelector("#pageCount");
const wordCount = document.querySelector("#wordCount");
const scratchpad = document.querySelector("#scratchpad");
const scriptTitle = document.querySelector("#scriptTitle");
const scriptAuthor = document.querySelector("#scriptAuthor");
const titlePageTitle = document.querySelector("#titlePageTitle");
const titlePageAuthor = document.querySelector("#titlePageAuthor");
const saveState = document.querySelector("#saveState");
const focusMode = document.querySelector("#focusMode");
const autoCaps = document.querySelector("#autoCaps");

const storeKey = "screentype-draft-v1";
const sampleLines = [
  ["scene", "INT. COFFEE SHOP - NIGHT"],
  ["action", "Rain frets against the front window. MAYA, 30s, watches a cursor blink on her laptop."],
  ["character", "MAYA"],
  ["dialogue", "A blank page is only scary until it starts telling on you."],
  ["transition", "CUT TO:"],
  ["scene", "EXT. CITY ROOFTOP - LATER"],
  ["action", "The skyline glows in broken strips of green, amber, and white."],
];

let saveTimer = null;

function makeLine(format = "action", text = "") {
  const line = lineTemplate.content.firstElementChild.cloneNode(true);
  line.className = `line ${format}`;
  line.dataset.format = format;
  line.textContent = text;
  if (!text) line.append(document.createElement("br"));
  return line;
}

function ensureEditorHasLine() {
  if (!editor.querySelector(".line")) {
    editor.append(makeLine("scene", ""));
  }
}

function getLines() {
  return [...editor.querySelectorAll(".line")];
}

function getCurrentLine() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return getLines()[0];
  const node = selection.anchorNode?.nodeType === Node.TEXT_NODE
    ? selection.anchorNode.parentElement
    : selection.anchorNode;
  return node?.closest?.(".line") || getLines()[0];
}

function placeCaretAtEnd(element) {
  element.focus();
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function setFormat(line, format) {
  if (!line) return;
  line.className = `line ${format}`;
  line.dataset.format = format;
  if (autoCaps.checked && ["scene", "character", "transition"].includes(format)) {
    line.textContent = line.textContent.toUpperCase();
  }
  updateActiveFormat(format);
  refresh();
}

function updateActiveFormat(format) {
  formatButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.format === format);
  });
}

function nextFormat(format, text) {
  const trimmed = text.trim();
  if (format === "scene") return "action";
  if (format === "character") return "dialogue";
  if (format === "parenthetical") return "dialogue";
  if (format === "dialogue") return "action";
  if (format === "transition") return "scene";
  if (/^(INT\.|EXT\.|INT\/EXT\.)/i.test(trimmed)) return "scene";
  if (/^(CUT TO:|FADE OUT\.|FADE TO:|DISSOLVE TO:|SMASH CUT:)/i.test(trimmed)) return "transition";
  return "action";
}

function insertLineAfter(current, format) {
  const next = makeLine(format, "");
  current.after(next);
  placeCaretAtEnd(next);
  updateActiveFormat(format);
  refresh();
}

function normalizeEditor() {
  [...editor.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      editor.insertBefore(makeLine("action", node.textContent), node);
      node.remove();
    } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains("line")) {
      const text = node.textContent;
      editor.insertBefore(makeLine("action", text), node);
      node.remove();
    }
  });
  ensureEditorHasLine();
}

function updateOutline() {
  const scenes = getLines().filter((line) => line.dataset.format === "scene");
  sceneList.innerHTML = "";
  scenes.forEach((scene, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = scene.textContent.trim() || `Scene ${index + 1}`;
    button.addEventListener("click", () => {
      scene.scrollIntoView({ behavior: "smooth", block: "center" });
      placeCaretAtEnd(scene);
    });
    item.append(button);
    sceneList.append(item);
  });
  sceneCount.textContent = scenes.length;
}

function updateCast() {
  const names = [...new Set(getLines()
    .filter((line) => line.dataset.format === "character")
    .map((line) => line.textContent.trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  castList.innerHTML = "";
  names.forEach((name) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = name;
    castList.append(chip);
  });
  castCount.textContent = names.length;
}

function updateStats() {
  const text = editor.innerText.trim();
  const words = text ? text.split(/\s+/).length : 0;
  wordCount.textContent = words;
  pageCount.textContent = Math.max(2, Math.ceil(words / 240) + 1);
}

function updateTitlePage() {
  const title = scriptTitle.value.trim() || "Untitled Screenplay";
  const author = scriptAuthor.value.trim() || "Creator name";
  titlePageTitle.textContent = title;
  titlePageAuthor.textContent = author;
}

function updateCurrentLine() {
  const current = getCurrentLine();
  getLines().forEach((line) => line.classList.toggle("current-line", focusMode.checked && line === current));
  updateActiveFormat(current?.dataset.format || "action");
}

function serialize() {
  return {
    title: scriptTitle.value,
    author: scriptAuthor.value,
    scratch: scratchpad.value,
    dark: document.body.classList.contains("dark"),
    lines: getLines().map((line) => ({
      format: line.dataset.format,
      text: line.textContent,
    })),
  };
}

function saveDraft() {
  localStorage.setItem(storeKey, JSON.stringify(serialize()));
  saveState.textContent = "Saved locally";
}

function scheduleSave() {
  saveState.textContent = "Saving...";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 350);
}

function refresh() {
  normalizeEditor();
  updateOutline();
  updateCast();
  updateStats();
  updateTitlePage();
  updateCurrentLine();
  scheduleSave();
}

function loadDraft() {
  const saved = localStorage.getItem(storeKey);
  if (!saved) {
    sampleLines.forEach(([format, text]) => editor.append(makeLine(format, text)));
    refresh();
    return;
  }
  const draft = JSON.parse(saved);
  scriptTitle.value = draft.title || "Untitled Screenplay";
  scriptAuthor.value = draft.author || (draft.credit && draft.credit !== "Written by" ? draft.credit : "");
  scratchpad.value = draft.scratch || "";
  document.body.classList.toggle("dark", Boolean(draft.dark));
  editor.innerHTML = "";
  (draft.lines?.length ? draft.lines : sampleLines.map(([format, text]) => ({ format, text })))
    .forEach((line) => editor.append(makeLine(line.format, line.text)));
  refresh();
}

function toFountain() {
  const title = `Title: ${scriptTitle.value.trim() || "Untitled Screenplay"}`;
  const credit = "Credit: Written by";
  const author = `Author: ${scriptAuthor.value.trim() || "Creator name"}`;
  const body = getLines().map((line) => {
    const text = line.textContent.trim();
    if (!text) return "";
    if (line.dataset.format === "character") return `\n${text.toUpperCase()}`;
    if (line.dataset.format === "transition") return `\n> ${text.toUpperCase()}`;
    if (line.dataset.format === "scene") return `\n${text.toUpperCase()}`;
    return text;
  }).join("\n");
  return `${title}\n${credit}\n${author}\n\n${body.trim()}\n`;
}

function downloadFountain() {
  const blob = new Blob([toFountain()], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  const filename = `${(scriptTitle.value || "screenplay").trim().replace(/[^\w-]+/g, "-").toLowerCase()}.fountain`;
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

formatButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const line = getCurrentLine();
    setFormat(line, button.dataset.format);
    placeCaretAtEnd(line);
  });
});

editor.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    const order = ["scene", "action", "character", "parenthetical", "dialogue", "transition"];
    const line = getCurrentLine();
    const next = order[(order.indexOf(line.dataset.format) + 1) % order.length];
    setFormat(line, next);
    return;
  }

  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    const line = getCurrentLine();
    insertLineAfter(line, nextFormat(line.dataset.format, line.textContent));
  }
});

editor.addEventListener("input", () => {
  const line = getCurrentLine();
  if (line && autoCaps.checked && ["scene", "character", "transition"].includes(line.dataset.format)) {
    const selection = window.getSelection();
    const offset = selection.anchorOffset;
    line.textContent = line.textContent.toUpperCase();
    const range = document.createRange();
    range.setStart(line.firstChild || line, Math.min(offset, line.textContent.length));
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  refresh();
});

editor.addEventListener("keyup", updateCurrentLine);
editor.addEventListener("mouseup", updateCurrentLine);
editor.addEventListener("paste", () => setTimeout(refresh, 0));

document.querySelector("#addScene").addEventListener("click", () => {
  const current = getCurrentLine() || getLines().at(-1);
  insertLineAfter(current, "scene");
});

document.querySelector("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  refresh();
});

document.querySelector("#downloadFountain").addEventListener("click", downloadFountain);
document.querySelector("#printDraft").addEventListener("click", () => window.print());

document.querySelector("#newDraft").addEventListener("click", () => {
  if (!confirm("Start a new blank draft?")) return;
  editor.innerHTML = "";
  scriptTitle.value = "Untitled Screenplay";
  scriptAuthor.value = "";
  scratchpad.value = "";
  editor.append(makeLine("scene", ""));
  refresh();
  placeCaretAtEnd(editor.firstElementChild);
});

[scriptTitle, scriptAuthor, scratchpad, focusMode, autoCaps].forEach((control) => {
  control.addEventListener("input", refresh);
  control.addEventListener("change", refresh);
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

loadDraft();
