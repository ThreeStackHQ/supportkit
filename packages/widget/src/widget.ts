interface WidgetConfig {
  workspaceName: string;
  primaryColor: string;
  greeting: string;
}

interface SupportKitOptions {
  widgetKey: string;
  apiBase?: string;
}

const WIDGET_ID = "supportkit-widget";
const LAUNCHER_ID = "supportkit-launcher";
const PANEL_ID = "supportkit-panel";

function getApiBase(opts: SupportKitOptions): string {
  return opts.apiBase ?? "https://supportkit-dev.threestack.io";
}

async function fetchConfig(widgetKey: string, apiBase: string): Promise<WidgetConfig | null> {
  try {
    const res = await fetch(`${apiBase}/api/widget/config?key=${encodeURIComponent(widgetKey)}`);
    if (!res.ok) return null;
    return res.json() as Promise<WidgetConfig>;
  } catch {
    return null;
  }
}

function injectStyles(color: string): void {
  if (document.getElementById("supportkit-styles")) return;
  const style = document.createElement("style");
  style.id = "supportkit-styles";
  style.textContent = `
#${LAUNCHER_ID}{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:${color};border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2);z-index:9999;display:flex;align-items:center;justify-content:center;transition:transform .2s}
#${LAUNCHER_ID}:hover{transform:scale(1.05)}
#${LAUNCHER_ID} svg{width:24px;height:24px;fill:#fff}
#${PANEL_ID}{position:fixed;bottom:92px;right:24px;width:360px;max-width:calc(100vw - 48px);background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.15);z-index:9999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden;transform:translateY(20px) scale(0.95);opacity:0;transition:transform .25s,opacity .25s;pointer-events:none}
#${PANEL_ID}.open{transform:translateY(0) scale(1);opacity:1;pointer-events:all}
.sk-header{background:${color};padding:20px;color:#fff}
.sk-header h3{margin:0;font-size:16px;font-weight:600}
.sk-header p{margin:6px 0 0;font-size:13px;opacity:.85;line-height:1.4}
.sk-header .sk-close{position:absolute;top:16px;right:16px;background:none;border:none;color:#fff;cursor:pointer;opacity:.8;font-size:20px;line-height:1;padding:4px}
.sk-header .sk-close:hover{opacity:1}
.sk-body{padding:20px}
.sk-form label{display:block;font-size:12px;font-weight:500;color:#374151;margin-bottom:4px}
.sk-form input,.sk-form textarea{width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .15s}
.sk-form input:focus,.sk-form textarea:focus{border-color:${color}}
.sk-form textarea{resize:vertical;min-height:80px}
.sk-form .sk-field{margin-bottom:12px}
.sk-form .sk-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sk-btn{width:100%;padding:10px;background:${color};color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;margin-top:4px;transition:opacity .15s}
.sk-btn:hover{opacity:.9}
.sk-btn:disabled{opacity:.6;cursor:not-allowed}
.sk-success{text-align:center;padding:24px 20px;color:#374151}
.sk-success .sk-check{width:48px;height:48px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:22px}
.sk-success p{margin:8px 0 0;font-size:14px;color:#6b7280}
  `.trim();
  document.head.appendChild(style);
}

function createLauncher(color: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.id = LAUNCHER_ID;
  btn.setAttribute("aria-label", "Open support chat");
  btn.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 2a8 8 0 110 16 8 8 0 010-16zm-4 7a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2z"/></svg>`;
  return btn;
}

function createPanel(config: WidgetConfig): HTMLDivElement {
  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Support chat");
  panel.innerHTML = `
<div class="sk-header" style="position:relative">
  <button class="sk-close" aria-label="Close">&times;</button>
  <h3>${config.workspaceName}</h3>
  <p>${config.greeting}</p>
</div>
<div class="sk-body">
  <form class="sk-form" id="supportkit-form">
    <div class="sk-row">
      <div class="sk-field">
        <label for="sk-name">Name</label>
        <input type="text" id="sk-name" name="name" placeholder="Your name" required />
      </div>
      <div class="sk-field">
        <label for="sk-email">Email</label>
        <input type="email" id="sk-email" name="email" placeholder="you@example.com" required />
      </div>
    </div>
    <div class="sk-field">
      <label for="sk-subject">Subject</label>
      <input type="text" id="sk-subject" name="subject" placeholder="How can we help?" required />
    </div>
    <div class="sk-field">
      <label for="sk-message">Message</label>
      <textarea id="sk-message" name="message" placeholder="Describe your issue..." required></textarea>
    </div>
    <button type="submit" class="sk-btn" id="sk-submit">Send message</button>
  </form>
  <div id="sk-success" class="sk-success" style="display:none">
    <div class="sk-check">✓</div>
    <strong>Message sent!</strong>
    <p>We'll get back to you soon! ✓</p>
  </div>
</div>
  `.trim();
  return panel;
}

async function submitForm(
  form: HTMLFormElement,
  widgetKey: string,
  apiBase: string
): Promise<void> {
  const btn = document.getElementById("sk-submit") as HTMLButtonElement;
  btn.disabled = true;
  btn.textContent = "Sending...";

  const name = (document.getElementById("sk-name") as HTMLInputElement).value;
  const email = (document.getElementById("sk-email") as HTMLInputElement).value;
  const subject = (document.getElementById("sk-subject") as HTMLInputElement).value;
  const body = (document.getElementById("sk-message") as HTMLTextAreaElement).value;

  try {
    const res = await fetch(`${apiBase}/api/widget/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgetKey, email, name, subject, body }),
    });

    if (res.ok) {
      form.style.display = "none";
      const success = document.getElementById("sk-success");
      if (success) success.style.display = "block";
    } else {
      btn.disabled = false;
      btn.textContent = "Send message";
      alert("Failed to send message. Please try again.");
    }
  } catch {
    btn.disabled = false;
    btn.textContent = "Send message";
    alert("Network error. Please try again.");
  }
}

export function init(opts: SupportKitOptions): void {
  if (document.getElementById(WIDGET_ID)) return;

  const apiBase = getApiBase(opts);
  const container = document.createElement("div");
  container.id = WIDGET_ID;
  document.body.appendChild(container);

  fetchConfig(opts.widgetKey, apiBase).then((config) => {
    const c = config ?? {
      workspaceName: "Support",
      primaryColor: "#7c3aed",
      greeting: "Hi! How can we help you today?",
    };

    injectStyles(c.primaryColor);

    const launcher = createLauncher(c.primaryColor);
    const panel = createPanel(c);

    container.appendChild(panel);
    container.appendChild(launcher);

    let open = false;

    function togglePanel(): void {
      open = !open;
      panel.classList.toggle("open", open);
      launcher.setAttribute("aria-expanded", String(open));
    }

    launcher.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePanel();
    });

    const closeBtn = panel.querySelector(".sk-close");
    closeBtn?.addEventListener("click", () => {
      open = false;
      panel.classList.remove("open");
    });

    document.addEventListener("click", (e) => {
      if (open && !panel.contains(e.target as Node) && e.target !== launcher) {
        open = false;
        panel.classList.remove("open");
      }
    });

    const form = document.getElementById("supportkit-form") as HTMLFormElement | null;
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await submitForm(form, opts.widgetKey, apiBase);
    });
  });
}
