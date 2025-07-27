import { CONFIG } from "./config.js";
import { AutoComplete } from "./auto-complete.js";
import { LineNumbers } from "./line-numbers.js";
import { Console } from "./console.js";

export class CodeEditor {
  constructor() {
    this.editors = {
      html: document.getElementById("html-code"),
      css: document.getElementById("css-code"),
      js: document.getElementById("js-code"),
    };
    this.lineNumbers = {};
    this.output = document.getElementById("output");
    this.console = new Console();

    // 🔁 Anciennes variables globales maintenant internes
    this.currentTheme = "dark";
    this.isResizing = false;
    this.debounceTimer = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeLineNumbers();
    this.loadFromStorage();
    this.setupResizer();
    this.initAutoComplete();
    this.run();
  }

  initAutoComplete() {
    setTimeout(() => {
      this.autoComplete = new AutoComplete();
    }, 100);
  }

  setupEventListeners() {
    Object.values(this.editors).forEach((editor) => {
      editor.addEventListener("input", () => this.debouncedRun());
      editor.addEventListener("keydown", (e) => this.handleKeyDown(e));
    });

    document
      .getElementById("run-btn")
      ?.addEventListener("click", () => this.run());
    document
      .getElementById("reset-btn")
      ?.addEventListener("click", () => this.reset());
    document
      .getElementById("theme-toggle")
      ?.addEventListener("click", () => this.toggleTheme());
    document
      .getElementById("refresh-output")
      ?.addEventListener("click", () => this.run());
    document
      .getElementById("fullscreen-btn")
      ?.addEventListener("click", () => this.toggleFullscreen());
    document
      .getElementById("clear-console")
      ?.addEventListener("click", () => this.console.clear());

    this.setupDownloadButtons();
    window.addEventListener("beforeunload", () => this.saveToStorage());
  }

  setupDownloadButtons() {
    const dropdownBtn = document.getElementById("download-dropdown");
    const dropdownMenu = document.getElementById("download-menu");
    document
      .getElementById("download-btn")
      ?.addEventListener("click", () => this.downloadAll());

    dropdownBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu?.classList.toggle("show");
    });

    document.addEventListener("click", () =>
      dropdownMenu?.classList.remove("show")
    );

    ["html", "css", "js"].forEach((type) => {
      document
        .getElementById(`download-${type}`)
        ?.addEventListener("click", () => this.downloadFile(type));
    });

    document
      .getElementById("download-all")
      ?.addEventListener("click", () => this.downloadAll());
  }

  downloadFile(type) {
    let content = this.editors[type].value;
    const extensions = { html: "html", css: "css", js: "js" };
    const mimeTypes = {
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
    };

    if (!content.trim()) {
      this.console.warn(`Le fichier ${type.toUpperCase()} est vide`);
      return;
    }

    if (type === "html") {
      content = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
${content}
</body>
</html>`;
    }

    this.createDownload(content, `index.${extensions[type]}`, mimeTypes[type]);
    this.console.log(`Fichier ${type.toUpperCase()} téléchargé`, "info");
    document.getElementById("download-menu")?.classList.remove("show");
  }

  downloadAll() {
    const htmlContent = this.editors.html.value;
    const cssContent = this.editors.css.value;
    const jsContent = this.editors.js.value;

    const zip = new JSZip();
    zip.file("style.css", cssContent);
    zip.file("script.js", jsContent);

    const fullHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Projet exporté</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  ${htmlContent}
  <script src="script.js"></script>
</body>
</html>`;

    zip.file("index.html", fullHTML);

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "mon-projet.zip");
      this.console.log("Projet complet exporté en .zip", "info");
    });

    document.getElementById("download-menu")?.classList.remove("show");
  }

  createDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  debouncedRun() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.run(), CONFIG.debounceDelay);
  }

  run() {
    try {
      this.showLoading(true);
      const fullHTML = this.buildFullHTML(
        this.editors.html.value,
        this.editors.css.value,
        this.editors.js.value
      );
      this.updateOutput(fullHTML);
      this.console.log("Code exécuté avec succès", "info");
      this.saveToStorage();
    } catch (error) {
      this.console.error(`Erreur d'exécution: ${error.message}`);
    } finally {
      setTimeout(() => this.showLoading(false), 300);
    }
  }

  buildFullHTML(html, css, js) {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Aperçu Live Code Editor</title>
<style>body{margin:0;padding:20px;font-family:sans-serif;}${css}</style>
<script>
window.onerror = function(msg,url,line,col,error){
  try{window.parent.postMessage({type:'error',message:msg,line:line,column:col},'*');}catch(e){}
  return false;
};
(function(){
  const original = { log: console.log, error: console.error, warn: console.warn };
  console.log = function(...args){try{window.parent.postMessage({type:'log',message:args.join(' ')},'*');}catch(e){}original.log(...args);};
  console.error = function(...args){try{window.parent.postMessage({type:'error',message:args.join(' ')},'*');}catch(e){}original.error(...args);};
  console.warn = function(...args){try{window.parent.postMessage({type:'warning',message:args.join(' ')},'*');}catch(e){}original.warn(...args);};
})();
</script>
</head>
<body>
${html}
<script>try{${js}}catch(e){console.error('Erreur JavaScript:',e.message);}</script>
</body>
</html>`;
  }

  updateOutput(html) {
    this.output.src =
      "data:text/html;charset=utf-8," + encodeURIComponent(html);
  }

  initializeLineNumbers() {
    Object.entries(this.editors).forEach(([type, editor]) => {
      const lineNumbersEl = document.getElementById(`${type}-lines`);
      if (lineNumbersEl) {
        this.lineNumbers[type] = new LineNumbers(editor, lineNumbersEl);
      }
    });
  }

  handleKeyDown(e) {
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      this.saveToStorage();
      this.console.log("Code sauvegardé", "info");
    }
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      this.run();
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      e.target.value =
        e.target.value.substring(0, start) +
        "    " +
        e.target.value.substring(end);
      e.target.selectionStart = e.target.selectionEnd = start + 4;
    }
  }

  showLoading(show) {
    const loading = document.getElementById("loading");
    if (loading) {
      loading.classList.toggle("show", show);
    }
  }

  reset() {
    if (confirm("Êtes-vous sûr de vouloir effacer tout le code ?")) {
      Object.values(this.editors).forEach((editor) => (editor.value = ""));
      Object.values(this.lineNumbers).forEach((ln) => ln.updateLineNumbers());
      this.run();
      this.console.clear();
      this.console.log("Éditeurs réinitialisés", "info");
    }
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === "dark" ? "light" : "dark";
    this.applyTheme(this.currentTheme);
    localStorage.setItem("editorTheme", this.currentTheme);
  }

  applyTheme(theme) {
    const root = document.documentElement;
    const themeVars = CONFIG.themes[theme];
    Object.entries(themeVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  toggleFullscreen() {
    const rightPanel = document.querySelector(".right-panel");
    rightPanel.classList.toggle("fullscreen");

    if (rightPanel.classList.contains("fullscreen")) {
      Object.assign(rightPanel.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        zIndex: "9999",
      });
    } else {
      Object.assign(rightPanel.style, {
        position: "",
        top: "",
        left: "",
        width: "",
        height: "",
        zIndex: "",
      });
    }
  }

  saveToStorage() {
    const data = {
      html: this.editors.html.value,
      css: this.editors.css.value,
      js: this.editors.js.value,
      theme: this.currentTheme,
    };
    localStorage.setItem("liveCodeEditor", JSON.stringify(data));
  }

  loadFromStorage() {
    const data = localStorage.getItem("liveCodeEditor");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.editors.html.value = parsed.html || "";
        this.editors.css.value = parsed.css || "";
        this.editors.js.value = parsed.js || "";
        if (parsed.theme) {
          this.currentTheme = parsed.theme;
          this.applyTheme(this.currentTheme);
        }
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
      }
    }
  }

  setupResizer() {
    const resizer = document.getElementById("resizer");
    const leftPanel = document.querySelector(".left-panel");
    const rightPanel = document.querySelector(".right-panel");
    if (!resizer || !leftPanel || !rightPanel) return;

    resizer.addEventListener("mousedown", (e) => {
      this.isResizing = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (e) => {
        if (!this.isResizing) return;
        const containerWidth = document.querySelector(".container").clientWidth;
        const newLeftWidth = (e.clientX / containerWidth) * 100;
        if (newLeftWidth > 20 && newLeftWidth < 80) {
          leftPanel.style.flex = `0 0 ${newLeftWidth}%`;
          rightPanel.style.flex = `0 0 ${100 - newLeftWidth}%`;
        }
      };

      const onMouseUp = () => {
        this.isResizing = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  }
}
