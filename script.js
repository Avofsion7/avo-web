/* =========================================================
   AVO WEB — script.js
   Разделы: мобильное меню → подсветка года →
   reveal-анимации → ссылки «Заказать» из услуг →
   форма заказа (валидация + демо-отправка в Telegram)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initFooterYear();
  initRevealAnimations();
  initServiceShortcuts();
  initOrderForm();
});

/* ---------- Мобильное меню ---------- */
function initMobileMenu() {
  const burger = document.getElementById("burger");
  const menu = document.getElementById("mobile-menu");
  if (!burger || !menu) return;

  const closeMenu = () => {
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    menu.classList.add("open");
    burger.setAttribute("aria-expanded", "true");
  };

  burger.addEventListener("click", () => {
    const isOpen = menu.classList.contains("open");
    isOpen ? closeMenu() : openMenu();
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
}

/* ---------- Текущий год в подвале ---------- */
function initFooterYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/* ---------- Появление блоков при прокрутке ---------- */
function initRevealAnimations() {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  if (prefersReduced || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 3, 2) * 80}ms`;
    observer.observe(el);
  });
}

/* ---------- Кнопки «Заказать» в карточках услуг ---------- */
function initServiceShortcuts() {
  const buttons = document.querySelectorAll("[data-service]");
  const select = document.getElementById("site-type");
  if (!buttons.length || !select) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const value = btn.getAttribute("data-service");
      if (value) {
        select.value = value;
      }
      const target = document.getElementById("order");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const nameField = document.getElementById("name");
      if (nameField) {
        window.setTimeout(() => nameField.focus(), 450);
      }
    });
  });
}

/* ---------- Форма заказа ---------- */
function initOrderForm() {
  const form = document.getElementById("order-form");
  if (!form) return;

  const successPanel = document.getElementById("order-success");
  const submitBtn = form.querySelector('button[type="submit"]');
  const telegramLink = document.getElementById("telegram-send-link");

  const fields = {
    name: { el: document.getElementById("name"), minLength: 2 },
    contact: { el: document.getElementById("contact"), minLength: 3 },
    siteType: { el: document.getElementById("site-type"), isSelect: true },
    budget: { el: document.getElementById("budget"), isSelect: true },
    description: {
      el: document.getElementById("description"),
      minLength: 10,
    },
    consent: { el: document.getElementById("consent"), isCheckbox: true },
  };

  let isSubmitting = false;

  function showError(key, message) {
    const field = fields[key];
    if (!field || !field.el) return;
    const wrap = field.el.closest(".field, .consent");
    const errorEl = document.getElementById(`${field.el.id}-error`);
    if (wrap) wrap.classList.toggle("has-error", Boolean(message));
    if (errorEl) errorEl.textContent = message || "";
  }

  function validate() {
    let firstInvalid = null;
    let valid = true;

    Object.keys(fields).forEach((key) => {
      const field = fields[key];
      if (!field.el) return;
      let message = "";

      if (field.isCheckbox) {
        if (!field.el.checked) {
          message = "Нужно согласие на обработку данных";
        }
      } else if (field.isSelect) {
        if (!field.el.value) {
          message = "Выберите значение из списка";
        }
      } else {
        const value = field.el.value.trim();
        if (value.length < field.minLength) {
          message = `Минимум ${field.minLength} символа`;
        }
      }

      showError(key, message);
      if (message) {
        valid = false;
        if (!firstInvalid) firstInvalid = field.el;
      }
    });

    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  function buildTelegramMessage() {
    const lines = [
      "Заявка с сайта AVO WEB",
      `Имя: ${fields.name.el.value.trim()}`,
      `Контакт: ${fields.contact.el.value.trim()}`,
      `Тип сайта: ${fields.siteType.el.selectedOptions[0].text}`,
      `Бюджет: ${fields.budget.el.selectedOptions[0].text}`,
      `Задача: ${fields.description.el.value.trim()}`,
    ];
    return lines.join("\n");
  }

  /*
   * Демонстрационная отправка.
   * Сервер и Telegram Bot API пока не подключены, поэтому форма
   * ничего не отправляет автоматически — секретный токен бота
   * нельзя хранить во фронтенд-коде. Когда появится серверный
   * обработчик (например, небольшая функция на бэкенде), эта
   * функция должна делать fetch на него, например:
   *
   *   await fetch("/api/order", {
   *     method: "POST",
   *     headers: { "Content-Type": "application/json" },
   *     body: JSON.stringify(payload),
   *   });
   *
   * Токен бота при этом должен храниться только на сервере.
   */
  function sendToServerStub() {
    return Promise.resolve({ ok: false, demo: true });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    isSubmitting = true;
    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = "Отправка…";

    await sendToServerStub();
    await new Promise((resolve) => window.setTimeout(resolve, 450));

    if (telegramLink) {
      const text = encodeURIComponent(buildTelegramMessage());
      telegramLink.href = `https://t.me/avofsionWEB?text=${text}`;
    }

    form.setAttribute("hidden", "true");
    if (successPanel) {
      successPanel.classList.add("visible");
      successPanel.focus();
    }

    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
    isSubmitting = false;
  });

  Object.keys(fields).forEach((key) => {
    const field = fields[key];
    if (!field.el) return;
    const eventName = field.isCheckbox || field.isSelect ? "change" : "input";
    field.el.addEventListener(eventName, () => showError(key, ""));
  });
}
