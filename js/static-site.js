// موقع الدورة الثابت: الحساب الحالي، الخروج، الاختبار الذاتي، وتحكم المدرب عبر GitHub API.
(function () {
    const html = document.documentElement;
    const repo = html.dataset.repo;
    const user = window.CA_USER || {};
    const TOKEN_KEY = "ca-gh-token";

    // ---------- الحساب والخروج ----------
    const who = document.getElementById("whoAmI");
    if (who && user.name) who.textContent = `${user.name} · ${user.role === "trainer" ? "مدرب" : "متدرب"}`;
    const logout = document.getElementById("logoutBtn");
    logout?.addEventListener("click", () => {
        try { localStorage.removeItem("ca-session"); } catch { }
        location.replace(logout.dataset.login);
    });

    // ---------- الاختبار الذاتي (تصحيح في المتصفح) ----------
    document.querySelectorAll(".quiz .q").forEach(q => {
        q.addEventListener("click", e => {
            const opt = e.target.closest(".opt[data-correct]");
            if (!opt) return;
            q.querySelectorAll(".opt").forEach(o => {
                o.classList.remove("right", "wrong");
                if (o.dataset.correct === "1") o.classList.add("right");
                else if (o === opt) o.classList.add("wrong");
            });
        });
    });

    // ---------- GitHub API (للمدرب فقط) ----------
    const token = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
    async function gh(path, options = {}) {
        const t = token();
        if (!t) throw { code: "no-token" };
        const res = await fetch("https://api.github.com" + path, {
            ...options,
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: "Bearer " + t,
                "X-GitHub-Api-Version": "2022-11-28",
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...(options.headers || {}),
            },
        });
        if (!res.ok) throw { code: res.status, message: await res.text().catch(() => "") };
        return res.status === 204 ? null : res.json();
    }
    function explain(err) {
        if (err?.code === "no-token") return "اربط الموقع بحساب GitHub أولًا من صفحة «الإعدادات».";
        if (err?.code === 401) return "مفتاح GitHub غير صالح أو منتهي. أنشئ مفتاحًا جديدًا من «الإعدادات».";
        if (err?.code === 403 || err?.code === 404) return "المفتاح لا يملك الصلاحيات المطلوبة (Actions وContents: Read and write) على المستودع.";
        if (err?.code === 409) return "تغيّرت البيانات على GitHub من مكان آخر. حدّث الصفحة ثم أعد المحاولة.";
        return "تعذّر الاتصال بـ GitHub. تحقق من الإنترنت ثم أعد المحاولة.";
    }
    function flash(text, ok = true) {
        const el = document.getElementById("caFlash");
        if (!el) { alert(text); return; }
        el.className = "flash " + (ok ? "ok" : "bad");
        el.textContent = text;
        el.hidden = false;
        el.scrollIntoView({ block: "nearest" });
    }
    window.CA = { gh, explain, flash, repo, hasToken: () => !!token() };

    // ---------- إكمال الدروس: يشغّل سير العمل الذي يحدّث course.json وينشر الموقع ----------
    async function setCompleted(n, btn) {
        if (btn) btn.disabled = true;
        try {
            await gh(`/repos/${repo}/actions/workflows/publish-site.yml/dispatches`, {
                method: "POST",
                body: JSON.stringify({ ref: "main", inputs: { completed: String(n) } }),
            });
            flash(`تم. الدروس المكتملة الآن ${n}. يتحدث الموقع للجميع خلال دقيقتين تقريبًا؛ حدّث الصفحة بعدها.`);
            try { sessionStorage.setItem("ca-pending", JSON.stringify({ n, at: Date.now() })); } catch { }
        } catch (err) {
            flash(explain(err), false);
            if (btn) btn.disabled = false;
        }
    }
    document.addEventListener("click", e => {
        const btn = e.target.closest("[data-set-completed]");
        if (!btn || user.role !== "trainer") return;
        if (btn.dataset.confirm && !confirm(btn.dataset.confirm)) return;
        setCompleted(+btn.dataset.setCompleted, btn);
    });
    document.getElementById("applyCompleted")?.addEventListener("click", e => {
        const n = +document.getElementById("completedSelect").value;
        if (confirm(`جعل عدد الدروس المكتملة ${n}؟ سيكون الدرس الحالي اليوم ${n + 1}.`)) setCompleted(n, e.currentTarget);
    });

    // حالة الربط في لوحة المدرب
    const ghStatus = document.getElementById("ghStatus");
    if (ghStatus && user.role === "trainer") {
        const settings = (document.body.dataset.root || "") + "settings.html";
        ghStatus.innerHTML = token()
            ? `<span class="ok-text">● متصل بـ GitHub</span>`
            : `<a href="${settings}">اربط الموقع بحساب GitHub لتفعيل الأزرار</a>`;
    }
    try {
        const pending = JSON.parse(sessionStorage.getItem("ca-pending") || "null");
        if (pending && Date.now() - pending.at < 180000 && user.role === "trainer" && document.getElementById("caFlash"))
            flash(`جارٍ نشر التحديث (الدروس المكتملة: ${pending.n}). إذا لم يتغير شيء خلال دقيقتين حدّث الصفحة.`);
    } catch { }

    // ---------- صفحة الإعدادات ----------
    const form = document.getElementById("tokenForm");
    if (form) {
        const state = document.getElementById("ghState");
        const show = (text, ok) => { state.textContent = text; state.className = "gh-status " + (ok ? "ok" : ok === false ? "bad" : ""); };
        async function verify() {
            if (!token()) { show("غير مرتبط. أضف مفتاح الوصول لتفعيل إكمال الدروس وحفظ الدرجات.", false); return; }
            show("جارٍ التحقق…");
            try {
                const r = await gh(`/repos/${repo}`);
                await gh(`/repos/${repo}/actions/workflows/publish-site.yml`);
                show(`● متصل بالمستودع ${r.full_name}. أزرار التحكم مفعّلة في هذا المتصفح.`, true);
            } catch (err) { show(explain(err), false); }
        }
        form.addEventListener("submit", e => {
            e.preventDefault();
            const v = document.getElementById("ghToken").value.trim();
            if (!v) return;
            try { localStorage.setItem(TOKEN_KEY, v); } catch { }
            document.getElementById("ghToken").value = "";
            verify();
        });
        document.getElementById("removeToken").addEventListener("click", () => {
            try { localStorage.removeItem(TOKEN_KEY); } catch { }
            verify();
        });
        verify();
    }
})();
