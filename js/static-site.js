// موقع الطلاب الثابت: الخروج، وتصحيح الاختبار الذاتي في المتصفح (بدون خادم).
(function () {
    const logout = document.getElementById("logoutBtn");
    logout?.addEventListener("click", () => {
        try { localStorage.removeItem("ca-auth"); } catch { }
        location.replace(logout.dataset.login);
    });

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
})();
