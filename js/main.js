/* Seekers — interacciones de la web.
   Todo es mejora progresiva: sin JavaScript la página se ve completa y legible. */
(() => {
    "use strict";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* 1. Hero: el muro de fotos se endereza y se desplaza con el scroll -------- */
    const hero = document.querySelector("[data-hero]");
    if (hero && !reduceMotion) {
        let queued = false;

        const updateHero = () => {
            queued = false;
            const progress = Math.min(Math.max(window.scrollY / hero.offsetHeight, 0), 1);
            hero.style.setProperty("--p", progress.toFixed(4));
        };

        window.addEventListener(
            "scroll",
            () => {
                if (!queued) {
                    queued = true;
                    requestAnimationFrame(updateHero);
                }
            },
            { passive: true }
        );
        updateHero();
    }

    /* 2. Cifras: cuentan hasta su valor al entrar en pantalla ------------------ */
    const counters = document.querySelectorAll("[data-count]");
    if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
        const format = (el, value) => {
            const decimals = Number(el.dataset.decimals || 0);
            const prefix = el.dataset.prefix || "";
            const suffix = el.dataset.suffix || "";
            el.textContent = prefix + value.toFixed(decimals) + suffix;
        };

        const run = (el) => {
            const target = Number(el.dataset.count);
            const duration = 1400;
            const start = performance.now();

            const tick = (now) => {
                const t = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - t, 3);
                format(el, target * eased);
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        run(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.6 }
        );

        counters.forEach((el) => {
            format(el, 0);
            observer.observe(el);
        });
    }

    /* 3. Servicios: pestañas con teclado y cambio de foto ---------------------- */
    document.querySelectorAll("[data-tabs]").forEach((root) => {
        const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
        const images = Array.from(root.querySelectorAll("[data-tab-image]"));

        const select = (index, moveFocus) => {
            tabs.forEach((tab, i) => {
                const active = i === index;
                const panel = document.getElementById(tab.getAttribute("aria-controls"));
                tab.setAttribute("aria-selected", String(active));
                tab.tabIndex = active ? 0 : -1;
                if (panel) panel.hidden = !active;
                if (images[i]) images[i].classList.toggle("is-active", active);
            });
            if (moveFocus) tabs[index].focus();
        };

        tabs.forEach((tab, i) => {
            tab.addEventListener("click", () => select(i));

            tab.addEventListener("keydown", (event) => {
                let next = null;
                if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (i + 1) % tabs.length;
                if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
                if (event.key === "Home") next = 0;
                if (event.key === "End") next = tabs.length - 1;
                if (next !== null) {
                    event.preventDefault();
                    select(next, true);
                }
            });
        });
    });

    /* 4. Testimonios: carrusel con botones ------------------------------------- */
    const quotes = document.querySelector("[data-quotes]");
    if (quotes) {
        document.querySelectorAll("[data-quotes-step]").forEach((button) => {
            button.addEventListener("click", () => {
                const card = quotes.querySelector(".quote");
                const step = card ? card.getBoundingClientRect().width + 16 : quotes.clientWidth * 0.8;
                quotes.scrollBy({
                    left: Number(button.dataset.quotesStep) * step,
                    behavior: reduceMotion ? "auto" : "smooth",
                });
            });
        });
    }

    /* 5. Navegación flotante: resalta la sección visible ----------------------- */
    const navLinks = Array.from(document.querySelectorAll('.float-nav a[href^="#"]'));
    if (navLinks.length && "IntersectionObserver" in window) {
        const byId = new Map();
        navLinks.forEach((link) => {
            const id = link.getAttribute("href").slice(1);
            const target = id && document.getElementById(id);
            if (target) byId.set(target, link);
        });

        const spy = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    navLinks.forEach((link) => link.classList.remove("is-active"));
                    byId.get(entry.target).classList.add("is-active");
                });
            },
            { rootMargin: "-45% 0px -50% 0px" }
        );

        byId.forEach((_, target) => spy.observe(target));
    }

    /* 6. Casos: ficha de proyecto en un diálogo -------------------------------- */
    const dialog = document.getElementById("work-dialog");
    if (dialog && typeof dialog.showModal === "function") {
        const dImg = dialog.querySelector(".work-dialog__img");
        const dTitle = dialog.querySelector(".work-dialog__title");
        const dText = dialog.querySelector(".work-dialog__text");
        const dTags = dialog.querySelector(".work-dialog__tags");
        let opener = null;

        document.querySelectorAll("[data-work]").forEach((button) => {
            button.addEventListener("click", () => {
                const item = button.closest(".work");
                const detail = item.querySelector(".work__detail");
                const img = button.querySelector("img");
                dImg.src = img.currentSrc || img.src;
                dImg.alt = img.alt;
                dImg.width = img.naturalWidth || img.width;
                dImg.height = img.naturalHeight || img.height;
                dTitle.textContent = detail.querySelector("h3").textContent;
                dText.textContent = detail.querySelector("p").textContent;
                dTags.innerHTML = detail.querySelector("ul").innerHTML;
                opener = button;
                dialog.showModal();
            });
        });

        dialog.addEventListener("click", (event) => {
            if (event.target === dialog || event.target.closest("[data-work-close]")) dialog.close();
        });
        dialog.addEventListener("close", () => {
            if (opener) opener.focus({ preventScroll: true });
        });
    }
})();
