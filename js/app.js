import { CodeEditor } from "./code-editor.js";

// Initialisation de l'application
document.addEventListener("DOMContentLoaded", () => {
  const editor = new CodeEditor();

  editor.console.log("Éditeur prêt - Commencez à coder !");

  // Exposition globale pour compatibilité
  window.run = () => editor.run();
  window.codeEditor = editor;

  // Raccourcis clavier globaux
  document.addEventListener("keydown", (e) => {
    // F12 pour toggle console détails
    if (e.key === "F12") {
      e.preventDefault();
      editor.console.toggle?.click();
    }
  });

  console.log("Live Code Editor Pro initialisé avec succès!");
});
