// محرر HTML: Monaco (محرر VS Code) مع اقتراحات عربية وEmmet وتوقع رمادي يُقبل بـ Tab.
// إذا تعذّر تحميل Monaco يبقى مربع النص العادي يعمل.
(function () {
    const ta = document.getElementById("editor");
    const host = document.getElementById("monaco");
    const preview = document.getElementById("preview");
    const statusEl = document.getElementById("editorStatus");
    const tpl = id => document.getElementById("tpl-" + id).textContent.trim();
    const load = () => { try { const v = localStorage.getItem("playCode"); return v ? JSON.parse(v) : null; } catch { return null; } };
    const save = v => { try { localStorage.setItem("playCode", JSON.stringify(v)); } catch { } };

    let getValue = () => ta.value;
    let setValue = v => { ta.value = v; };

    function update() {
        let src = getValue();
        if (!/<html/i.test(src))
            src = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><style>body{font-family:Tahoma;padding:16px}</style></head><body>${src}</body></html>`;
        preview.srcdoc = src;
    }
    function flash(msg) {
        statusEl.textContent = msg;
        clearTimeout(flash.t);
        flash.t = setTimeout(() => statusEl.textContent = "", 1600);
    }

    let t;
    const changed = () => { clearTimeout(t); t = setTimeout(() => { update(); save(getValue()); }, 250); };

    // ---------- مربع النص الاحتياطي ----------
    ta.value = load() || tpl("blank");
    update();
    ta.addEventListener("input", changed);
    ta.addEventListener("keydown", e => {
        if (e.key === "Tab") {
            e.preventDefault();
            ta.setRangeText("  ", ta.selectionStart, ta.selectionEnd, "end");
            changed();
        }
    });

    document.getElementById("starter").addEventListener("change", e => {
        if (!e.target.value) return;
        setValue(tpl(e.target.value));
        save(getValue()); update();
        e.target.value = "";
    });
    document.getElementById("copyCode").addEventListener("click", () => {
        navigator.clipboard?.writeText(getValue()).then(() => flash("تم النسخ"), () => flash("انسخ يدويًا: Ctrl+A ثم Ctrl+C"));
    });

    // ---------- Monaco ----------
    if (!window.require?.config) return;
    // مسار Monaco بجانب loader.js (يعمل في المنصة وفي موقع الطلاب على GitHub Pages)
    const loaderSrc = document.querySelector('script[src*="monaco/vs/loader.js"]')?.src || "/lib/monaco/vs/loader.js";
    window.require.config({ paths: { vs: loaderSrc.replace(/\/loader\.js.*$/, "") } });
    window.require(["vs/editor/editor.main"], () => {
        try { startMonaco(window.monaco); } catch (err) { console.error("تعذّر تشغيل المحرر المتقدم", err); }
    }, err => console.warn("تعذّر تحميل المحرر المتقدم، يُستخدم المحرر البسيط", err));

    function startMonaco(monaco) {
        const H = window.EditorHints;
        const dark = matchMedia("(prefers-color-scheme: dark)");

        const editor = monaco.editor.create(host, {
            value: ta.value,
            language: "html",
            theme: dark.matches ? "vs-dark" : "vs",
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', Consolas, 'IBM Plex Sans Arabic', monospace",
            wordWrap: "on",
            tabSize: 2,
            insertSpaces: true,
            scrollBeyondLastLine: false,
            padding: { top: 10, bottom: 10 },
            quickSuggestions: { other: true, comments: false, strings: true },
            quickSuggestionsDelay: 50,
            suggestOnTriggerCharacters: true,
            tabCompletion: "on",
            acceptSuggestionOnEnter: "on",
            snippetSuggestions: "top",
            suggest: { preview: true, showWords: false, insertMode: "replace" },
            inlineSuggest: { enabled: true },
            linkedEditing: true,
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            formatOnPaste: true,
            unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: false, nonBasicASCII: false },
        });
        const model = editor.getModel();
        dark.addEventListener?.("change", e => monaco.editor.setTheme(e.matches ? "vs-dark" : "vs"));

        ta.hidden = true;
        host.hidden = false;
        getValue = () => editor.getValue();
        setValue = v => {
            editor.pushUndoStop();
            editor.executeEdits("starter", [{ range: model.getFullModelRange(), text: v }]);
            editor.pushUndoStop();
            editor.setPosition({ lineNumber: 1, column: 1 });
        };
        editor.onDidChangeModelContent(changed);
        editor.focus();

        // Emmet: ul>li*3 ثم Tab
        window.emmetMonaco?.emmetHTML(monaco, ["html"]);

        // حفظ وترتيب
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => { save(getValue()); update(); flash("تم الحفظ"); });
        const fmt = document.getElementById("formatCode");
        fmt.hidden = false;
        fmt.addEventListener("click", () => editor.getAction("editor.action.formatDocument").run());

        // بعد قبول التوقع: ضع المؤشر داخل الوسم أو داخل علامتي التنصيص
        monaco.editor.registerCommand("academy.cursorBack", (_, n) => {
            const p = editor.getPosition();
            editor.setPosition({ lineNumber: p.lineNumber, column: Math.max(1, p.column - n) });
        });
        const cursorTarget = text => {
            const q = text.indexOf('""');
            if (q >= 0) return text.length - (q + 1);
            const c = text.indexOf("></");
            if (c >= 0) return text.length - (c + 1);
            return 0;
        };

        // ---------- إغلاق الوسم تلقائيًا عند كتابة > ----------
        editor.onDidChangeModelContent(e => {
            if (e.isUndoing || e.isRedoing || e.isFlush || e.changes.length !== 1 || e.changes[0].text !== ">") return;
            setTimeout(() => {
                const pos = editor.getPosition();
                const line = model.getLineContent(pos.lineNumber);
                const before = line.slice(0, pos.column - 1);
                const m = before.match(/<([a-zA-Z][\w-]*)(?:\s[^<>]*)?>$/);
                if (!m || before.endsWith("/>") || inStyle(pos)) return;
                const tag = m[1].toLowerCase();
                if (H.voidTags.has(tag) || line.slice(pos.column - 1).startsWith("</" + tag)) return;
                editor.executeEdits("autoclose", [{ range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column), text: `</${tag}>` }]);
                editor.setPosition(pos);
            }, 0);
        });

        // ---------- تحليل السياق ----------
        const textBefore = pos => model.getValueInRange(new monaco.Range(1, 1, pos.lineNumber, pos.column));
        function inStyle(pos) {
            const text = textBefore(pos);
            return text.lastIndexOf("<style") > text.lastIndexOf("</style");
        }
        // هل المؤشر داخل CSS؟ ويعيد: اسم خاصية أو قيمة أو محدد
        function cssContext(pos) {
            const text = textBefore(pos);
            let css = null;
            const so = text.lastIndexOf("<style"), sc = text.lastIndexOf("</style");
            if (so > sc) {
                const gt = text.indexOf(">", so);
                if (gt < 0) return null;
                css = text.slice(gt + 1);
            } else {
                const m = text.match(/style\s*=\s*"([^"]*)$/);
                if (m) css = "{" + m[1];
            }
            if (css == null) return null;
            const open = Math.max(css.lastIndexOf("{"), css.lastIndexOf(";"));
            if (css.lastIndexOf("}") > open) return { mode: "selector" };
            const seg = css.slice(open + 1);
            const colon = seg.indexOf(":");
            if (colon < 0) return { mode: "prop", word: seg.trim() };
            return { mode: "value", prop: seg.slice(0, colon).trim().toLowerCase(), word: seg.slice(colon + 1).trimStart() };
        }
        function innermostOpenTag(pos) {
            const text = textBefore(pos).replace(/<!--[\s\S]*?-->/g, "");
            const stack = [];
            for (const m of text.matchAll(/<(\/?)([a-zA-Z][\w-]*)[^>]*?(\/?)>/g)) {
                const tag = m[2].toLowerCase();
                if (m[1]) { const i = stack.lastIndexOf(tag); if (i >= 0) stack.length = i; }
                else if (!m[3] && !H.voidTags.has(tag)) stack.push(tag);
            }
            return stack[stack.length - 1];
        }
        const insideTag = before => before.lastIndexOf("<") > before.lastIndexOf(">");

        // ---------- اقتراحات عربية: خصائص CSS وقيمها وقوالب HTML ----------
        monaco.languages.registerCompletionItemProvider("html", {
            triggerCharacters: [":", " ", "!"],
            provideCompletionItems(model, pos) {
                const word = model.getWordUntilPosition(pos);
                const range = new monaco.Range(pos.lineNumber, word.startColumn, pos.lineNumber, word.endColumn);
                const Kind = monaco.languages.CompletionItemKind;
                const Snippet = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
                const ctx = cssContext(pos);

                if (ctx?.mode === "prop") {
                    return {
                        suggestions: H.cssProps.map(([name, ar, val], i) => ({
                            label: { label: name, description: ar },
                            kind: Kind.Property,
                            detail: ar,
                            documentation: `${name}: ${val.replace(/\$\{1:(.*)\}/, "$1")};`,
                            insertText: `${name}: ${val};`,
                            insertTextRules: Snippet,
                            sortText: String(i).padStart(3, "0"),
                            range,
                        })),
                    };
                }
                if (ctx?.mode === "value") {
                    const vals = H.cssValues[ctx.prop] || [];
                    return {
                        suggestions: vals.map((v, i) => ({
                            label: v, kind: Kind.Value, detail: "قيمة " + ctx.prop,
                            insertText: v, sortText: String(i).padStart(3, "0"), range,
                        })),
                    };
                }
                if (ctx) return { suggestions: [] };

                const line = model.getLineContent(pos.lineNumber).slice(0, pos.column - 1);
                if (insideTag(line)) return { suggestions: [] };
                const typed = line.match(/[A-Za-z0-9!_-]*$/)[0];
                const snipRange = new monaco.Range(pos.lineNumber, pos.column - typed.length, pos.lineNumber, pos.column);
                return {
                    suggestions: H.htmlSnippets.map(([label, ar, body]) => ({
                        label: { label, description: ar },
                        kind: Kind.Snippet,
                        detail: ar,
                        documentation: body.replace(/\$\{\d+:?([^}]*)\}/g, "$1").replace(/\$0/g, ""),
                        insertText: body,
                        insertTextRules: Snippet,
                        sortText: "!" + label,
                        preselect: label === "!" && typed === "!",
                        range: snipRange,
                    })),
                };
            },
        });

        // ---------- التوقع الرمادي (يُقبل بـ Tab) ----------
        const tagKeys = Object.keys(H.tagPrediction);
        monaco.languages.registerInlineCompletionsProvider("html", {
            provideInlineCompletions(model, pos) {
                const line = model.getLineContent(pos.lineNumber);
                const before = line.slice(0, pos.column - 1);
                const after = line.slice(pos.column - 1);
                const at = new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column);
                const item = (text, back = 0) => ({ items: [{ insertText: text, range: at, command: back ? { id: "academy.cursorBack", title: "", arguments: [back] } : undefined }] });
                if (after.trim() && !after.trimStart().startsWith("<")) return { items: [] };

                const ctx = cssContext(pos);
                if (ctx?.mode === "prop" && ctx.word.length >= 2) {
                    const p = H.cssProps.find(([n]) => n.startsWith(ctx.word) && n !== ctx.word);
                    if (p) return item(p[0].slice(ctx.word.length) + ": ");
                }
                if (ctx?.mode === "value") {
                    const vals = H.cssValues[ctx.prop] || [];
                    if (ctx.word) {
                        const v = vals.find(x => x.startsWith(ctx.word) && x !== ctx.word);
                        if (v) return item(v.slice(ctx.word.length) + ";");
                    } else if (vals.length && !after.trim()) {
                        return item((before.endsWith(":") ? " " : "") + vals[0] + ";");
                    }
                }
                if (ctx) return { items: [] };

                const m = before.match(/<([a-z][a-z0-9]*)$/i);
                if (m) {
                    const typed = m[1].toLowerCase();
                    const key = tagKeys.find(k => k.startsWith(typed) && (typed.length >= 2 || k === typed));
                    if (key) {
                        const rest = H.tagPrediction[key].slice(typed.length);
                        return item(rest, cursorTarget(rest));
                    }
                }
                if (!before.trim()) {
                    const child = H.childPrediction[innermostOpenTag(pos)];
                    if (child) return item(child, cursorTarget(child));
                }
                return { items: [] };
            },
            freeInlineCompletions() { },
            disposeInlineCompletions() { },
        });
    }
})();
