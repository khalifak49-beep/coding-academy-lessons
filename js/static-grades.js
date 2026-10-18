// سجل الدرجات والحضور للمدرب: يُقرأ ويُحفظ في Data/grades.json داخل المستودع الخاص عبر GitHub API.
(function () {
    const app = document.getElementById("gradesApp");
    if (!app || !window.CA) return;
    const { gh, explain, repo } = window.CA;
    const PATH = "Data/grades.json";
    const FIELDS = [["part", 5], ["ex", 20], ["mid", 15], ["pHtml", 8], ["pSql", 8], ["pCs", 12], ["pPres", 7], ["fin", 20]];
    const configured = JSON.parse(app.dataset.students || "[]");
    const table = document.getElementById("evalTable");
    const tbody = table.querySelector("tbody");
    const saveBtn = document.getElementById("saveBtn");
    const state = document.getElementById("saveState");
    let data = null, sha = null, dirty = false;

    const blank = s => ({ id: s.id, name: s.name, att: Array(10).fill(false), part: "", ex: "", mid: "", pHtml: "", pSql: "", pCs: "", pPres: "", fin: "", notes: "" });
    const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
    const attPts = s => Math.round(s.att.filter(Boolean).length / 10 * 5 * 10) / 10;
    const total = s => attPts(s) + FIELDS.reduce((a, [k]) => a + num(s[k]), 0);
    const graded = s => s.att.some(Boolean) || FIELDS.some(([k]) => s[k] !== "" && s[k] != null);
    const fmt = n => (Math.round(n * 10) / 10).toString();
    const rating = t => t >= 90 ? ["ممتاز", "g-a"] : t >= 80 ? ["جيد جدًا", "g-b"] : t >= 70 ? ["جيد", "g-b"] : t >= 60 ? ["مقبول", "g-c"] : ["يحتاج دعمًا", "g-d"];
    const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const toB64 = str => { const bytes = new TextEncoder().encode(str); let bin = ""; bytes.forEach(b => bin += String.fromCharCode(b)); return btoa(bin); };
    const fromB64 = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), c => c.charCodeAt(0)));
    const setState = (text, bad) => { state.textContent = text; state.style.color = bad ? "var(--bad)" : ""; };

    async function load() {
        if (!window.CA.hasToken()) {
            tbody.innerHTML = `<tr><td colspan="13">لعرض الدرجات وحفظها اربط الموقع بحساب GitHub من <a href="settings.html">الإعدادات</a>.</td></tr>`;
            return;
        }
        try {
            const file = await gh(`/repos/${repo}/contents/${PATH}`);
            sha = file.sha;
            data = JSON.parse(fromB64(file.content));
        } catch (err) {
            if (err?.code !== 404) { tbody.innerHTML = `<tr><td colspan="13" class="field-error">${esc(explain(err))}</td></tr>`; return; }
            data = { students: [] };
        }
        // مطابقة قائمة المتدربين مع الحسابات المضبوطة، مع الإبقاء على الدرجات المحفوظة
        const byId = Object.fromEntries((data.students || []).map(s => [s.id, s]));
        data.students = configured.map(c => Object.assign(blank(c), byId[c.id] || {}));
        render();
        saveBtn.disabled = false;
        setState(sha ? "" : "لا توجد درجات محفوظة بعد.");
    }

    function render() {
        tbody.innerHTML = data.students.map((s, i) => {
            const t = total(s), [gl, gc] = rating(t), has = graded(s);
            return `<tr data-i="${i}">
                <td><input class="name" data-f="name" value="${esc(s.name)}" aria-label="اسم المتدرب"><br><small class="muted" dir="ltr">${esc(s.id)}</small></td>
                <td><div class="att">${s.att.map((a, d) => `<label>${d + 1}<input type="checkbox" data-att="${d}" ${a ? "checked" : ""} aria-label="حضور اليوم ${d + 1}"></label>`).join("")}</div><small class="muted" data-o="att">${fmt(attPts(s))} / 5</small></td>
                ${FIELDS.map(([k, max]) => `<td class="num"><input type="number" data-f="${k}" min="0" max="${max}" step="0.5" value="${esc(s[k])}"></td>`).join("")}
                <td class="num"><span class="total" data-o="total">${has ? fmt(t) : "—"}</span></td>
                <td class="num" data-o="grade">${has ? `<span class="grade ${gc}">${gl}</span>` : `<span class="muted">—</span>`}</td>
                <td><textarea data-f="notes" aria-label="ملاحظات">${esc(s.notes)}</textarea></td>
            </tr>`;
        }).join("");
        summary();
    }

    function summary() {
        const tots = data.students.filter(graded).map(total);
        const avg = tots.length ? tots.reduce((a, b) => a + b, 0) / tots.length : 0;
        const att = data.students.reduce((a, s) => a + s.att.filter(Boolean).length, 0) / Math.max(1, data.students.length * 10) * 100;
        document.getElementById("evalSummary").innerHTML = `
            <div class="panel stat"><b>${tots.length ? fmt(avg) : "—"}</b><span>متوسط الدفعة من 100</span></div>
            <div class="panel stat"><b>${tots.length ? fmt(Math.max(...tots)) : "—"}</b><span>أعلى مجموع</span></div>
            <div class="panel stat"><b>${Math.round(att)}%</b><span>نسبة الحضور الكلية</span><div class="bar" style="margin-top:6px"><i style="width:${att}%"></i></div></div>
            <div class="panel stat"><b>${tots.length ? tots.filter(t => t < 60).length : "—"}</b><span>متدربون يحتاجون دعمًا (أقل من 60)</span></div>`;
    }

    table.addEventListener("input", e => {
        const tr = e.target.closest("tr[data-i]");
        if (!tr || !data) return;
        const s = data.students[+tr.dataset.i];
        if (e.target.dataset.att != null) s.att[+e.target.dataset.att] = e.target.checked;
        else if (e.target.dataset.f) {
            const f = e.target.dataset.f;
            if (e.target.type === "number") {
                const max = +e.target.max;
                if (e.target.value !== "" && +e.target.value > max) e.target.value = max;
                if (e.target.value !== "" && +e.target.value < 0) e.target.value = 0;
                s[f] = e.target.value === "" ? "" : num(e.target.value);
            } else s[f] = e.target.value;
        }
        const t = total(s), [gl, gc] = rating(t), has = graded(s);
        tr.querySelector('[data-o="att"]').textContent = `${fmt(attPts(s))} / 5`;
        tr.querySelector('[data-o="total"]').textContent = has ? fmt(t) : "—";
        tr.querySelector('[data-o="grade"]').innerHTML = has ? `<span class="grade ${gc}">${gl}</span>` : `<span class="muted">—</span>`;
        summary();
        dirty = true;
        setState("تغييرات غير محفوظة");
    });

    saveBtn.addEventListener("click", async () => {
        saveBtn.disabled = true;
        setState("جارٍ الحفظ في GitHub…");
        data.updatedAt = new Date().toISOString();
        try {
            const res = await gh(`/repos/${repo}/contents/${PATH}`, {
                method: "PUT",
                body: JSON.stringify({ message: "تحديث الدرجات والحضور", content: toB64(JSON.stringify(data, null, 2) + "\n"), ...(sha ? { sha } : {}) }),
            });
            sha = res.content.sha;
            dirty = false;
            setState("محفوظ ✓");
        } catch (err) { setState(explain(err), true); }
        saveBtn.disabled = false;
    });

    document.getElementById("csvBtn").addEventListener("click", () => {
        if (!data) return;
        const head = ["اسم المستخدم", "الاسم", "أيام الحضور", "الحضور/5", "المشاركة/5", "التمارين/20", "المنتصف/15", "مشروع HTML/8", "مشروع SQL/8", "مشروع C#/12", "العرض/7", "النهائي/20", "المجموع/100", "التقدير", "ملاحظات"];
        const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const rows = data.students.map(s => { const t = total(s); return [s.id, s.name, s.att.filter(Boolean).length, fmt(attPts(s)), ...FIELDS.map(([k]) => s[k]), fmt(t), rating(t)[0], s.notes].map(q).join(","); });
        const blob = new Blob(["﻿" + [head.map(q).join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `grades-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });

    window.addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
    load();
})();
