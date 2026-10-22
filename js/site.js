// سكربت المنصة: النسخ، «جرّب في المحرر»، وضع العرض، الاختبار الذاتي، تقدم التمارين، والحساب الفوري للدرجات.
(function () {
    const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value;
    const store = {
        get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
        set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }
    };

    async function post(url, data) {
        const res = await fetch(url, {
            method: "POST",
            headers: { "RequestVerificationToken": token, "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(data)
        });
        if (!res.ok) throw new Error(res.status);
        return res.json();
    }

    // ---------- وضع العرض ----------
    const presentBtn = document.getElementById("presentBtn");
    function setPresent(on) {
        document.body.classList.toggle("present", on);
        presentBtn?.setAttribute("aria-pressed", on);
        store.set("present", on);
    }
    setPresent(!!store.get("present", false));
    presentBtn?.addEventListener("click", () => setPresent(!document.body.classList.contains("present")));

    // ---------- النسخ و«جرّب في المحرر» ----------
    document.addEventListener("click", e => {
        const copy = e.target.closest("[data-copy]");
        if (copy) {
            const pre = copy.closest(".codebox").querySelector("pre");
            const done = () => { copy.textContent = "تم النسخ"; setTimeout(() => copy.textContent = "نسخ", 1400); };
            const fallback = () => {
                const r = document.createRange(); r.selectNodeContents(pre);
                const s = getSelection(); s.removeAllRanges(); s.addRange(r);
                copy.textContent = "اضغط Ctrl+C";
            };
            if (navigator.clipboard) navigator.clipboard.writeText(pre.innerText).then(done, fallback); else fallback();
        }
        const tryCs = e.target.closest("[data-try-cs]");
        if (tryCs) {
            try { sessionStorage.setItem("csIncoming", tryCs.closest(".codebox").querySelector("pre").innerText); } catch { }
            location.href = document.body.dataset.csharp || "/CSharp";
        }
        const tryBtn = e.target.closest("[data-try]");
        if (tryBtn) {
            store.set("playCode", tryBtn.closest(".codebox").querySelector("pre").innerText);
            location.href = document.body.dataset.playground || "/Playground";
        }
    });

    // ---------- ربط شرح الكود بأسطره ----------
    // المرور على الشرح يبرز سطره في الكود، والضغط على سطر في الكود يبرز شرحه.
    function highlight(wrap, ln, scrollTo) {
        wrap.querySelectorAll(".hl").forEach(el => el.classList.remove("hl"));
        if (ln == null || ln < 0) return;
        wrap.querySelector(`pre .ln[data-ln="${ln}"]`)?.classList.add("hl");
        const item = wrap.querySelector(`.explain-list li[data-ln="${ln}"]`);
        item?.classList.add("hl");
        if (scrollTo && item) {
            const details = item.closest("details");
            if (details && !details.open) details.open = true;
            item.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        }
    }
    document.addEventListener("mouseover", e => {
        const li = e.target.closest(".explain-list li[data-ln]");
        if (li) highlight(li.closest(".codewrap"), +li.dataset.ln, false);
    });
    document.addEventListener("click", e => {
        const ln = e.target.closest("pre .ln");
        const wrap = ln?.closest(".codewrap");
        if (wrap?.querySelector(".explain-list")) highlight(wrap, +ln.dataset.ln, true);
    });

    // ---------- صفحة الدرس ----------
    const lesson = document.querySelector("article.lesson[data-day]");
    if (lesson) {
        const day = lesson.dataset.day;

        lesson.querySelectorAll(".q").forEach(q => {
            q.addEventListener("click", async e => {
                const opt = e.target.closest(".opt");
                if (!opt) return;
                try {
                    const { answer } = await post("/Lessons/Quiz", { day, question: q.dataset.question, selected: opt.dataset.option });
                    q.querySelectorAll(".opt").forEach(o => {
                        o.classList.remove("right", "wrong");
                        if (+o.dataset.option === answer) o.classList.add("right");
                        else if (o === opt) o.classList.add("wrong");
                    });
                } catch { opt.title = "تعذّر حفظ الإجابة، تحقق من الاتصال"; }
            });
        });

        lesson.querySelectorAll("[data-progress]").forEach(cb => {
            cb.addEventListener("change", async () => {
                try {
                    await post("/Lessons/Progress", { day, index: cb.dataset.progress, done: cb.checked });
                } catch { cb.checked = !cb.checked; alert("تعذّر الحفظ، تحقق من الاتصال وأعد المحاولة"); }
            });
        });

        const cur = document.querySelector('.rail [aria-current="true"]');
        if (cur && matchMedia("(max-width:860px)").matches) cur.scrollIntoView({ inline: "center", block: "nearest" });
    }

    // ---------- سجل الدرجات: حساب فوري قبل الحفظ ----------
    const evalTable = document.getElementById("evalTable");
    if (evalTable) {
        const fmt = n => (Math.round(n * 10) / 10).toString();
        const rating = t => t >= 90 ? ["ممتاز", "g-a"] : t >= 80 ? ["جيد جدًا", "g-b"] : t >= 70 ? ["جيد", "g-b"] : t >= 60 ? ["مقبول", "g-c"] : ["يحتاج دعمًا", "g-d"];

        function calcRow(tr) {
            const days = [...tr.querySelectorAll("[data-att]")].filter(c => c.checked).length;
            const att = Math.round(days / 10 * 5 * 10) / 10;
            const inputs = [...tr.querySelectorAll("[data-score]")];
            const has = days > 0 || inputs.some(i => i.value !== "");
            const total = att + inputs.reduce((a, i) => a + (parseFloat(i.value) || 0), 0);
            return { days, att, has, total };
        }
        function refresh() {
            const rows = [...evalTable.querySelectorAll("tr[data-row]")];
            const totals = [];
            let presentDays = 0;
            rows.forEach(tr => {
                const r = calcRow(tr);
                presentDays += r.days;
                tr.querySelector('[data-o="att"]').textContent = `${fmt(r.att)} / 5`;
                tr.querySelector('[data-o="total"]').textContent = r.has ? fmt(r.total) : "—";
                const [label, css] = rating(r.total);
                tr.querySelector('[data-o="grade"]').innerHTML = r.has ? `<span class="grade ${css}">${label}</span>` : '<span class="muted">—</span>';
                if (r.has) totals.push(r.total);
            });
            const s = k => document.querySelector(`[data-s="${k}"]`);
            s("avg").textContent = totals.length ? fmt(totals.reduce((a, b) => a + b, 0) / totals.length) : "—";
            s("best").textContent = totals.length ? fmt(Math.max(...totals)) : "—";
            s("att").textContent = rows.length ? Math.round(presentDays / (rows.length * 10) * 100) + "%" : "0%";
            s("support").textContent = totals.length ? totals.filter(t => t < 60).length : "—";
        }
        let dirty = false;
        evalTable.addEventListener("input", e => {
            if (e.target.matches("[data-score]")) {
                const max = +e.target.max;
                if (e.target.value !== "" && +e.target.value > max) e.target.value = max;
                if (e.target.value !== "" && +e.target.value < 0) e.target.value = 0;
            }
            refresh();
            dirty = true;
            document.getElementById("dirty").hidden = false;
        });
        document.getElementById("evalForm").addEventListener("submit", () => { dirty = false; });
        window.addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
    }
})();
