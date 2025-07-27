// CORRECTION MAJEURE: Classe LineNumbers pour gestion précise
export class LineNumbers {
  constructor(editor, lineNumbersEl) {
    this.editor = editor;
    this.lineNumbersEl = lineNumbersEl;
    this.isScrolling = false;
    this.init();
  }

  init() {
    this.updateLineNumbers();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.editor.addEventListener("input", () => this.updateLineNumbers());
    this.editor.addEventListener("scroll", () => this.syncScroll());
    window.addEventListener("resize", () => this.updateLineNumbers());
  }

  updateLineNumbers() {
    const lines = this.editor.value.split("\n");
    const lineCount = lines.length;

    let lineNumbers = "";
    for (let i = 1; i <= lineCount; i++) {
      lineNumbers += i + "\n";
    }

    lineNumbers = lineNumbers.slice(0, -1);
    this.lineNumbersEl.textContent = lineNumbers;
    this.syncScroll();
  }

  syncScroll() {
    if (!this.isScrolling) {
      this.isScrolling = true;
      requestAnimationFrame(() => {
        this.lineNumbersEl.scrollTop = this.editor.scrollTop;
        this.isScrolling = false;
      });
    }
  }
}
