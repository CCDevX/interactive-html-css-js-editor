import { SUGGESTIONS } from "./auto-complete-config";
// Classe AutoComplete
export class AutoComplete {
  constructor() {
    this.suggestions = SUGGESTIONS;

    this.currentEditor = null;
    this.dropdownEl = null;
    this.currentSuggestions = [];
    this.selectedIndex = -1;
    this.isVisible = false;
    this.init();
  }

  init() {
    this.createDropdown();
    this.setupEditorListeners();
  }

  createDropdown() {
    this.dropdownEl = document.createElement("div");
    this.dropdownEl.className = "autocomplete-dropdown";
    document.body.appendChild(this.dropdownEl);
  }

  setupEditorListeners() {
    const editors = ["html-code", "css-code", "js-code"];
    editors.forEach((editorId) => {
      const editor = document.getElementById(editorId);
      if (editor) {
        editor.addEventListener("input", (e) => this.handleInput(e));
        editor.addEventListener("keydown", (e) => this.handleKeydown(e));
        editor.addEventListener("blur", () =>
          setTimeout(() => this.hideDropdown(), 100)
        );
        editor.addEventListener("focus", (e) =>
          this.setCurrentEditor(e.target)
        );
      }
    });
  }

  setCurrentEditor(editor) {
    this.currentEditor = editor;
  }

  handleInput(e) {
    const editor = e.target;
    const cursorPos = editor.selectionStart;
    const textBeforeCursor = editor.value.substring(0, cursorPos);
    const editorType = this.getEditorType(editor);
    const currentWord = this.getCurrentWord(textBeforeCursor);

    if (currentWord.length >= 1) {
      this.showSuggestions(currentWord, editorType, editor, cursorPos);
    } else {
      this.hideDropdown();
    }
  }

  getEditorType(editor) {
    if (editor.id.includes("html")) return "html";
    if (editor.id.includes("css")) return "css";
    if (editor.id.includes("js")) return "js";
    return "html";
  }

  getCurrentWord(text) {
    const match = text.match(/[\w-:.#@()]*$/);
    return match ? match[0] : "";
  }

  showSuggestions(word, type, editor, cursorPos) {
    const suggestions = this.suggestions[type] || [];
    this.currentSuggestions = suggestions
      .filter((suggestion) =>
        suggestion.toLowerCase().includes(word.toLowerCase())
      )
      .slice(0, 8);

    if (this.currentSuggestions.length === 0) {
      this.hideDropdown();
      return;
    }

    this.renderDropdown(word);
    this.positionDropdown(editor, cursorPos);
    this.selectedIndex = -1;
    this.isVisible = true;
  }

  renderDropdown(currentWord) {
    this.dropdownEl.innerHTML = "";
    this.currentSuggestions.forEach((suggestion, index) => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      const regex = new RegExp(`(${currentWord})`, "gi");
      const highlightedText = suggestion.replace(
        regex,
        '<mark style="background: var(--accent-primary); color: white; padding: 1px 2px; border-radius: 2px;">$1</mark>'
      );
      item.innerHTML = highlightedText;

      item.addEventListener("mouseenter", () => {
        this.selectedIndex = index;
        this.updateSelection();
      });

      item.addEventListener("click", () => {
        this.insertSuggestion(suggestion, currentWord);
      });

      this.dropdownEl.appendChild(item);
    });

    this.dropdownEl.style.display = "block";
  }

  positionDropdown(editor, cursorPos) {
    const editorRect = editor.getBoundingClientRect();
    const lineHeight = 20;
    const lines = editor.value.substring(0, cursorPos).split("\n");
    const currentLine = lines.length - 1;
    const currentCol = lines[lines.length - 1].length;

    const x = editorRect.left + Math.min(currentCol * 9, 300);
    const y = editorRect.top + currentLine * lineHeight + lineHeight;

    this.dropdownEl.style.left = Math.min(x, window.innerWidth - 220) + "px";
    this.dropdownEl.style.top = Math.min(y, window.innerHeight - 200) + "px";
  }

  handleKeydown(e) {
    if (!this.isVisible) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.selectedIndex = Math.min(
          this.selectedIndex + 1,
          this.currentSuggestions.length - 1
        );
        this.updateSelection();
        break;
      case "ArrowUp":
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;
      case "Enter":
      case "Tab":
        if (this.selectedIndex >= 0) {
          e.preventDefault();
          const suggestion = this.currentSuggestions[this.selectedIndex];
          const currentWord = this.getCurrentWord(
            this.currentEditor.value.substring(
              0,
              this.currentEditor.selectionStart
            )
          );
          this.insertSuggestion(suggestion, currentWord);
        }
        break;
      case "Escape":
        e.preventDefault();
        this.hideDropdown();
        break;
    }
  }

  updateSelection() {
    const items = this.dropdownEl.querySelectorAll(".autocomplete-item");
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.style.background = "var(--accent-primary)";
        item.style.borderLeftColor = "var(--accent-primary)";
        item.style.color = "white";
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.style.background = "transparent";
        item.style.borderLeftColor = "transparent";
        item.style.color = "var(--text-primary)";
      }
    });
  }

  insertSuggestion(suggestion, currentWord) {
    const editor = this.currentEditor;
    const cursorPos = editor.selectionStart;
    const textBefore = editor.value.substring(
      0,
      cursorPos - currentWord.length
    );
    const textAfter = editor.value.substring(cursorPos);

    editor.value = textBefore + suggestion + textAfter;
    const newCursorPos = textBefore.length + suggestion.length;
    editor.selectionStart = editor.selectionEnd = newCursorPos;

    this.hideDropdown();
    editor.focus();
    editor.dispatchEvent(new Event("input"));
  }

  hideDropdown() {
    this.dropdownEl.style.display = "none";
    this.isVisible = false;
    this.selectedIndex = -1;
    this.currentSuggestions = [];
  }
}
