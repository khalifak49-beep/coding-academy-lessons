// عرض الدرس: شريحة واحدة في كل مرة، التنقل بالأسهم والمسافة، وإخفاء أزرار التحكم عند عدم تحريك الفأرة.
(function () {
    const deck = document.getElementById("deck");
    if (!deck) return;
    const slides = [...deck.querySelectorAll(".slide")];
    const count = document.getElementById("deckCount");
    const bar = document.getElementById("deckProgress");
    const exitUrl = deck.querySelector(".deck-top a").href;
    let i = 0;

    // في العرض يبدأ شرح الكود مغلقًا: اعرض الكود أولًا ثم افتح «شرح الكود سطرًا بسطر»
    deck.querySelectorAll("details.explain").forEach(d => d.open = false);

    function show(n) {
        i = Math.max(0, Math.min(slides.length - 1, n));
        slides.forEach((s, k) => s.hidden = k !== i);
        slides[i].scrollTop = 0;
        count.textContent = `${i + 1} / ${slides.length}`;
        bar.style.width = ((i + 1) / slides.length * 100) + "%";
        history.replaceState(null, "", "#s" + (i + 1));
    }
    const m = /^#s(\d+)$/.exec(location.hash);
    show(m ? +m[1] - 1 : 0);

    document.getElementById("nextBtn").addEventListener("click", () => show(i + 1));
    document.getElementById("prevBtn").addEventListener("click", () => show(i - 1));

    const fsBtn = document.getElementById("fsBtn");
    function toggleFullscreen() {
        if (document.fullscreenElement) document.exitFullscreen?.();
        else document.documentElement.requestFullscreen?.().catch(() => { });
    }
    fsBtn.addEventListener("click", toggleFullscreen);

    document.addEventListener("keydown", e => {
        if (e.target.closest("input, textarea, select")) return;
        // الاتجاه من اليمين لليسار: السهم الأيسر للتالي
        if (["ArrowLeft", "PageDown", " "].includes(e.key)) { e.preventDefault(); show(i + 1); }
        else if (["ArrowRight", "PageUp"].includes(e.key)) { e.preventDefault(); show(i - 1); }
        else if (e.key === "Home") show(0);
        else if (e.key === "End") show(slides.length - 1);
        else if (e.key === "f" || e.key === "F") toggleFullscreen();
        else if (e.key === "Escape" && !document.fullscreenElement) location.href = exitUrl;
    });

    // سحب باللمس
    let x0 = null;
    deck.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    deck.addEventListener("touchend", e => {
        if (x0 == null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 60) show(dx > 0 ? i + 1 : i - 1);
        x0 = null;
    });

    // إخفاء أزرار التحكم بعد ثانيتين من عدم الحركة
    let idle;
    const wake = () => { deck.classList.remove("idle"); clearTimeout(idle); idle = setTimeout(() => deck.classList.add("idle"), 2200); };
    ["mousemove", "keydown", "touchstart"].forEach(ev => document.addEventListener(ev, wake, { passive: true }));
    wake();

    document.getElementById("revealQuiz")?.addEventListener("click", e => {
        document.getElementById("deckQuiz").classList.toggle("reveal");
        e.currentTarget.textContent = document.getElementById("deckQuiz").classList.contains("reveal") ? "أخفِ الإجابات" : "أظهر الإجابات";
    });
})();
