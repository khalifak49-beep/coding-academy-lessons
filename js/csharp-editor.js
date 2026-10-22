// محرر C# مع كونسول تفاعلي: يترجم البرنامج ويشغّله في المتصفح (Web Worker) بدون سيرفر.
(function () {
    const page = document.getElementById("csApp");
    if (!page) return;
    const workerUrl = page.dataset.worker;
    const TIMEOUT_MS = 8000;
    const STORE = "csCode";

    const ta = document.getElementById("csFallback");
    const host = document.getElementById("csMonaco");
    const conOut = document.getElementById("conOut");
    const conLine = document.getElementById("conLine");
    const conIn = document.getElementById("conIn");
    const status = document.getElementById("csStatus");
    const runBtn = document.getElementById("runBtn");
    const stopBtn = document.getElementById("stopBtn");
    const errBox = document.getElementById("csErrors");
    const tpl = id => document.getElementById("cs-tpl-" + id).textContent.replace(/^\n/, "");
    const load = () => { try { return localStorage.getItem(STORE); } catch { return null; } };
    const save = v => { try { localStorage.setItem(STORE, v); } catch { } };

    let editor = null, monacoRef = null;
    const getCode = () => editor ? editor.getValue() : ta.value;
    const setCode = v => {
        if (editor) { editor.pushUndoStop(); editor.executeEdits("load", [{ range: editor.getModel().getFullModelRange(), text: v }]); editor.pushUndoStop(); }
        else ta.value = v;
        save(v);
    };
    // كود قادم من زر «شغّل في محرر C#» في الدروس
    let incoming = null;
    try { incoming = sessionStorage.getItem("csIncoming"); sessionStorage.removeItem("csIncoming"); } catch { }
    ta.value = incoming || load() || tpl("hello");
    if (incoming) save(incoming);

    // ---------- العامل (Worker) ----------
    let worker = null, ready = false, nextId = 0, pending = null, timer = null;
    function startWorker() {
        ready = false;
        worker = new Worker(workerUrl, { type: "module" });
        worker.onmessage = e => {
            const m = e.data;
            if (m.status === "ready") { ready = true; setStatus("جاهز ✓ اضغط «تشغيل» أو Ctrl+Enter"); return; }
            if (pending && m.id === pending.id) { clearTimeout(timer); const p = pending; pending = null; p.resolve(m); }
        };
        worker.onerror = e => { setStatus("تعذّر تحميل مترجم C#: " + (e.message || "خطأ غير معروف"), true); };
        worker.postMessage({ type: "init", id: ++nextId });
        setStatus("جارٍ تحميل مترجم C#… (أول مرة قد تأخذ بضع ثوانٍ)");
    }
    function send(code, inputs, seed) {
        return new Promise(resolve => {
            const id = ++nextId;
            pending = { id, resolve };
            timer = setTimeout(() => {
                worker.terminate();
                pending = null;
                startWorker();
                resolve({ status: "timeout" });
            }, TIMEOUT_MS + (ready ? 0 : 30000));
            worker.postMessage({ type: "run", id, code, inputs, seed });
        });
    }
    startWorker();

    // ---------- التشغيل ----------
    let session = null; // { code, inputs, seed }
    async function run(fresh) {
        if (fresh) session = { code: getCode(), inputs: [], seed: Math.floor(Math.random() * 1e9) };
        if (!session) return;
        save(session.code);
        runBtn.disabled = true; stopBtn.disabled = false;
        conLine.hidden = true;
        clearMarkers();
        setStatus(ready ? "جارٍ الترجمة والتشغيل…" : "جارٍ تحميل المترجم ثم التشغيل…");
        const r = await send(session.code, session.inputs, session.seed);
        runBtn.disabled = false; stopBtn.disabled = true;
        show(r);
    }

    function show(r) {
        errBox.innerHTML = "";
        if (r.status === "compile") {
            renderOutput("");
            appendNote("لم يُشغَّل البرنامج: يوجد خطأ في الكتابة. أصلحه ثم اضغط «تشغيل».", "err");
            errBox.innerHTML = r.errors.map(e => `<li data-line="${e.line}"><b>السطر ${e.line}:</b> ${esc(e.arabic || "خطأ في الكتابة")}<br><small dir="ltr">${esc(e.code)} ${esc(e.message)}</small></li>`).join("");
            setMarkers(r.errors);
            setStatus(`يوجد ${r.errors.length} ${r.errors.length === 1 ? "خطأ" : "أخطاء"}`, true);
            return;
        }
        renderOutput(r.output || "");
        if (r.status === "input") {
            conLine.hidden = false;
            conIn.value = "";
            conIn.focus();
            setStatus("البرنامج ينتظر إدخالك: اكتب ثم اضغط Enter");
        } else if (r.status === "done") {
            appendNote("انتهى البرنامج ✓", "ok");
            setStatus("انتهى التشغيل ✓");
        } else if (r.status === "exception") {
            appendNote(`توقف البرنامج${r.line ? " عند السطر " + r.line : ""}: ${r.message || "خطأ"}${r.type ? "\n(" + r.type + ": " + (r.detail || "") + ")" : ""}`, "err");
            if (r.line) setMarkers([{ line: r.line, col: 1, endLine: r.line, endCol: 200, message: r.message }], true);
            setStatus("حدث خطأ أثناء التشغيل", true);
        } else if (r.status === "unsupported") {
            appendNote(r.message, "err");
            setStatus("لا يعمل في المتصفح", true);
        } else if (r.status === "timeout") {
            appendNote(`أُوقف البرنامج لأنه استغرق أكثر من ${TIMEOUT_MS / 1000} ثوانٍ. هل توجد حلقة لا تنتهي؟`, "err");
            setStatus("أُوقف البرنامج", true);
        } else {
            appendNote("تعذّر التشغيل: " + (r.message || "خطأ غير معروف"), "err");
            setStatus("تعذّر التشغيل", true);
        }
    }

    function renderOutput(text) {
        const ff = text.lastIndexOf("\f");
        if (ff >= 0) text = text.slice(ff + 1);
        conOut.innerHTML = esc(text).replace(/\u001e([\s\S]*?)\u001f/g, '<span class="con-typed">$1</span>');
        conOut.parentElement.scrollTop = conOut.parentElement.scrollHeight;
    }
    function appendNote(text, kind) {
        const div = document.createElement("div");
        div.className = "con-note " + kind;
        div.textContent = text;
        conOut.appendChild(div);
        conOut.parentElement.scrollTop = conOut.parentElement.scrollHeight;
    }
    const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    function setStatus(text, bad) { status.textContent = text; status.classList.toggle("bad", !!bad); }

    conIn.addEventListener("keydown", e => {
        if (e.key !== "Enter" || !session) return;
        e.preventDefault();
        session.inputs.push(conIn.value);
        run(false);
    });
    runBtn.addEventListener("click", () => run(true));
    stopBtn.addEventListener("click", () => {
        if (pending) { clearTimeout(timer); worker.terminate(); const p = pending; pending = null; startWorker(); p.resolve({ status: "fatal", message: "أوقفتَ البرنامج." }); }
        else { conLine.hidden = true; session = null; setStatus("أُوقف"); stopBtn.disabled = true; }
    });
    document.getElementById("clearBtn").addEventListener("click", () => { conOut.innerHTML = ""; errBox.innerHTML = ""; conLine.hidden = true; session = null; clearMarkers(); });
    document.getElementById("csSample").addEventListener("change", e => { if (e.target.value) setCode(tpl(e.target.value)); e.target.value = ""; });
    document.getElementById("csCopy").addEventListener("click", () => navigator.clipboard?.writeText(getCode()).then(() => setStatus("تم نسخ الكود"), () => { }));
    errBox.addEventListener("click", e => {
        const li = e.target.closest("li[data-line]");
        if (li && editor) { const line = +li.dataset.line; editor.revealLineInCenter(line); editor.setPosition({ lineNumber: line, column: 1 }); editor.focus(); }
    });
    document.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(true); } });
    ta.addEventListener("input", () => save(ta.value));

    // ---------- علامات الأخطاء في المحرر ----------
    function setMarkers(errors, runtime) {
        if (!editor) return;
        monacoRef.editor.setModelMarkers(editor.getModel(), "csharp", errors.map(e => ({
            startLineNumber: e.line, startColumn: e.col || 1, endLineNumber: e.endLine || e.line, endColumn: Math.max((e.endCol || 1), (e.col || 1) + 1),
            message: (runtime ? e.message : (e.arabic ? e.arabic + "\n" : "") + e.message), severity: monacoRef.MarkerSeverity.Error,
        })));
        editor.revealLineInCenterIfOutsideViewport(errors[0].line);
    }
    function clearMarkers() { if (editor) monacoRef.editor.setModelMarkers(editor.getModel(), "csharp", []); }

    // ---------- Monaco ----------
    if (!window.require?.config) return;
    const loaderSrc = document.querySelector('script[src*="monaco/vs/loader.js"]').src;
    window.require.config({ paths: { vs: loaderSrc.replace(/\/loader\.js.*$/, "") } });
    window.require(["vs/editor/editor.main"], () => {
        const monaco = monacoRef = window.monaco;
        const dark = matchMedia("(prefers-color-scheme: dark)");
        editor = monaco.editor.create(host, {
            value: ta.value, language: "csharp", theme: dark.matches ? "vs-dark" : "vs",
            automaticLayout: true, minimap: { enabled: false }, fontSize: 14,
            fontFamily: "'JetBrains Mono', Consolas, 'IBM Plex Sans Arabic', monospace",
            tabSize: 4, insertSpaces: true, scrollBeyondLastLine: false, padding: { top: 10, bottom: 10 },
            quickSuggestions: { other: true, comments: false, strings: false }, suggestOnTriggerCharacters: true,
            tabCompletion: "on", snippetSuggestions: "top", suggest: { preview: true, showWords: true },
            autoClosingBrackets: "always", autoClosingQuotes: "always", formatOnPaste: false,
            unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: false, nonBasicASCII: false },
        });
        dark.addEventListener?.("change", e => monaco.editor.setTheme(e.matches ? "vs-dark" : "vs"));
        ta.hidden = true; host.hidden = false;
        editor.onDidChangeModelContent(() => { save(editor.getValue()); clearMarkers(); });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => run(true));

        const H = window.CSharpHints;
        const Kind = monaco.languages.CompletionItemKind;
        const Snip = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
        monaco.languages.registerCompletionItemProvider("csharp", {
            triggerCharacters: ["."],
            provideCompletionItems(model, pos) {
                const word = model.getWordUntilPosition(pos);
                const range = new monaco.Range(pos.lineNumber, word.startColumn, pos.lineNumber, word.endColumn);
                const before = model.getLineContent(pos.lineNumber).slice(0, word.startColumn - 1);
                const dot = before.match(/([A-Za-z_][A-Za-z0-9_]*)\s*\.\s*$/);
                if (dot) {
                    const list = H.members[dot[1]] || H.common;
                    return { suggestions: list.map(([n, ar, body], i) => ({ label: { label: n, description: ar }, kind: Kind.Method, detail: ar, insertText: body, insertTextRules: Snip, sortText: String(i).padStart(3, "0"), range })) };
                }
                if (/\.\s*$/.test(before)) return { suggestions: H.common.map(([n, ar, body], i) => ({ label: { label: n, description: ar }, kind: Kind.Method, detail: ar, insertText: body, insertTextRules: Snip, sortText: String(i).padStart(3, "0"), range })) };
                return {
                    suggestions: [
                        ...H.snippets.map(([n, ar, body]) => ({ label: { label: n, description: ar }, kind: Kind.Snippet, detail: ar, documentation: body.replace(/\$\{\d+:?([^}]*)\}/g, "$1").replace(/\$\d/g, ""), insertText: body, insertTextRules: Snip, sortText: "0" + n, range })),
                        ...H.keywords.map(k => ({ label: k, kind: Kind.Keyword, insertText: k, sortText: "1" + k, range })),
                    ],
                };
            },
        });
        setCode(ta.value);
        editor.focus();
    }, () => { /* يبقى مربع النص البسيط */ });
})();
