// Classe Console améliorée
export class Console {
  constructor() {
    this.element = document.getElementById("console");
    this.content = document.getElementById("console-content");
    this.summary = document.getElementById("console-summary");
    this.status = document.getElementById("console-status");
    this.toggle = document.getElementById("console-toggle");
    this.minimizeBtn = document.getElementById("minimize-console");
    this.isExpanded = false;
    this.errorCount = 0;
    this.warningCount = 0;
    this.setupToggle();
    this.setupMinimize();
    this.setupMessageListener();
  }

  setupToggle() {
    this.toggle?.addEventListener("click", () => {
      this.isExpanded = !this.isExpanded;
      this.element.classList.toggle("expanded", this.isExpanded);

      if (this.isExpanded) {
        this.toggle.innerHTML = '<i class="fas fa-chevron-down"></i> Réduire';
        this.minimizeBtn.style.display = "flex";
      } else {
        this.toggle.innerHTML = '<i class="fas fa-chevron-up"></i> Détails';
        this.minimizeBtn.style.display = "none";
      }
    });
  }

  setupMinimize() {
    this.minimizeBtn?.addEventListener("click", () => {
      this.isExpanded = false;
      this.element.classList.remove("expanded");
      this.toggle.innerHTML = '<i class="fas fa-chevron-up"></i> Détails';
      this.minimizeBtn.style.display = "none";
    });
  }

  setupMessageListener() {
    window.addEventListener("message", (event) => {
      if (event.data && event.data.type) {
        switch (event.data.type) {
          case "log":
            this.log(event.data.message, "info");
            break;
          case "error":
            this.error(event.data.message);
            break;
          case "warning":
            this.warn(event.data.message);
            break;
        }
      }
    });
  }

  updateStatus() {
    if (this.errorCount > 0) {
      this.status.className = "console-status error";
      this.status.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${this.errorCount} erreur(s)</span>`;
    } else if (this.warningCount > 0) {
      this.status.className = "console-status warning";
      this.status.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>${this.warningCount} warning(s)</span>`;
    } else {
      this.status.className = "console-status success";
      this.status.innerHTML =
        '<i class="fas fa-check-circle"></i><span>Aucune erreur</span>';
    }
  }

  addMessage(message, type = "info") {
    const timestamp = new Date().toLocaleTimeString();
    const messageEl = document.createElement("div");
    messageEl.className = `console-message ${type}`;
    messageEl.innerHTML = `
      <span class="timestamp">[${timestamp}]</span>
      <span class="message">${message}</span>
    `;

    this.content.appendChild(messageEl);
    this.content.scrollTop = this.content.scrollHeight;

    if (type === "error") {
      this.errorCount++;
      this.showToast(message, "error");
    } else if (type === "warning") {
      this.warningCount++;
      this.showToast(message, "warning");
    }

    this.updateStatus();
  }

  showToast(message, type) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas fa-${
        type === "error" ? "exclamation-circle" : "exclamation-triangle"
      }"></i>
      <span>${message.substring(0, 50)}${
      message.length > 50 ? "..." : ""
    }</span>
      <button class="close-btn"><i class="fas fa-times"></i></button>
    `;

    const closeBtn = toast.querySelector(".close-btn");
    closeBtn.addEventListener("click", () => {
      toast.classList.remove("show");
      setTimeout(() => container.removeChild(toast), 300);
    });

    container.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove("show");
        setTimeout(() => {
          if (toast.parentNode) container.removeChild(toast);
        }, 300);
      }
    }, 5000);
  }

  log(message, type = "info") {
    this.addMessage(message, type);
  }

  error(message) {
    this.addMessage(message, "error");
  }

  warn(message) {
    this.addMessage(message, "warning");
  }

  clear() {
    this.content.innerHTML = `
      <div class="console-message info">
        <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
        <span class="message">Console effacée</span>
      </div>
    `;
    this.errorCount = 0;
    this.warningCount = 0;
    this.updateStatus();
  }
}
