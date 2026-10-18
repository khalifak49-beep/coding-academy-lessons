// بيانات الاقتراحات العربية لمحرر HTML وCSS: خصائص CSS وقيمها، قوالب HTML جاهزة، وتوقعات العنصر التالي.
window.EditorHints = (function () {
    // خصائص CSS الأكثر استخدامًا للمبتدئين، مرتبة حسب الشيوع (الأولى تُفضَّل في التكملة الرمادية)
    const cssProps = [
        ["color", "لون النص", "${1:#333}"],
        ["background", "الخلفية (لون أو صورة)", "${1:#f5f5f5}"],
        ["background-color", "لون الخلفية", "${1:white}"],
        ["font-size", "حجم الخط", "${1:16px}"],
        ["font-family", "نوع الخط", "${1:Tahoma}"],
        ["font-weight", "سماكة الخط", "${1:bold}"],
        ["text-align", "محاذاة النص", "${1:center}"],
        ["margin", "المسافة الخارجية", "${1:10px}"],
        ["padding", "المسافة الداخلية", "${1:10px}"],
        ["border", "الإطار", "${1:1px solid #ccc}"],
        ["border-radius", "استدارة الحواف", "${1:8px}"],
        ["width", "العرض", "${1:100%}"],
        ["height", "الارتفاع", "${1:200px}"],
        ["display", "طريقة العرض", "${1:flex}"],
        ["gap", "المسافة بين العناصر (flex/grid)", "${1:16px}"],
        ["justify-content", "توزيع العناصر أفقيًا في flex", "${1:space-between}"],
        ["align-items", "محاذاة العناصر عموديًا في flex", "${1:center}"],
        ["flex-wrap", "السماح بنزول العناصر لسطر جديد", "${1:wrap}"],
        ["flex-direction", "اتجاه العناصر في flex", "${1:column}"],
        ["max-width", "أقصى عرض", "${1:800px}"],
        ["min-height", "أقل ارتفاع", "${1:100px}"],
        ["line-height", "ارتفاع السطر", "${1:1.6}"],
        ["text-decoration", "خط تحت النص", "${1:none}"],
        ["box-shadow", "ظل الصندوق", "${1:0 2px 8px rgba(0,0,0,.15)}"],
        ["cursor", "شكل مؤشر الفأرة", "${1:pointer}"],
        ["opacity", "الشفافية من 0 إلى 1", "${1:0.8}"],
        ["position", "طريقة التموضع", "${1:relative}"],
        ["top", "المسافة من الأعلى", "${1:0}"],
        ["right", "المسافة من اليمين", "${1:0}"],
        ["left", "المسافة من اليسار", "${1:0}"],
        ["bottom", "المسافة من الأسفل", "${1:0}"],
        ["overflow", "ما يحدث للمحتوى الزائد", "${1:auto}"],
        ["list-style", "شكل نقاط القائمة", "${1:none}"],
        ["border-collapse", "دمج حدود الجدول", "${1:collapse}"],
        ["border-bottom", "الإطار السفلي", "${1:1px solid #ddd}"],
        ["margin-bottom", "المسافة الخارجية السفلية", "${1:10px}"],
        ["margin-top", "المسافة الخارجية العلوية", "${1:10px}"],
        ["padding-top", "المسافة الداخلية العلوية", "${1:10px}"],
        ["grid-template-columns", "أعمدة الشبكة", "${1:repeat(3, 1fr)}"],
        ["transition", "حركة ناعمة عند التغيير", "${1:all 0.3s}"],
        ["text-transform", "تحويل حالة الأحرف", "${1:uppercase}"],
        ["direction", "اتجاه النص", "${1:rtl}"],
        ["z-index", "ترتيب الطبقات", "${1:10}"],
    ];

    const colors = ["white", "black", "red", "green", "blue", "orange", "gray", "darkblue", "#333", "#f5f5f5", "#0f766e", "transparent"];
    const cssValues = {
        "display": ["flex", "block", "inline-block", "grid", "none", "inline"],
        "text-align": ["center", "right", "left", "justify"],
        "font-weight": ["bold", "normal", "600", "300"],
        "font-family": ["Tahoma", "Arial", "\"Segoe UI\"", "sans-serif"],
        "justify-content": ["center", "space-between", "space-around", "flex-start", "flex-end"],
        "align-items": ["center", "flex-start", "flex-end", "stretch"],
        "flex-direction": ["row", "column"],
        "flex-wrap": ["wrap", "nowrap"],
        "position": ["relative", "absolute", "fixed", "sticky", "static"],
        "text-decoration": ["none", "underline", "line-through"],
        "cursor": ["pointer", "default", "not-allowed"],
        "overflow": ["auto", "hidden", "scroll", "visible"],
        "list-style": ["none", "disc", "decimal"],
        "border-collapse": ["collapse", "separate"],
        "text-transform": ["uppercase", "lowercase", "capitalize"],
        "direction": ["rtl", "ltr"],
        "border": ["1px solid #ccc", "2px solid black", "none"],
        "width": ["100%", "50%", "300px", "auto"],
        "font-size": ["16px", "20px", "24px", "32px", "1.2em"],
    };
    for (const p of ["color", "background", "background-color", "border-color"]) cssValues[p] = colors;

    // قوالب HTML جاهزة بأسماء إنجليزية قصيرة ووصف عربي
    const htmlSnippets = [
        ["!", "هيكل صفحة HTML كامل بالعربية (من اليمين لليسار)",
            '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <title>${1:صفحتي}</title>\n  <style>\n    body { font-family: Tahoma; padding: 20px; }\n  </style>\n</head>\n<body>\n  ${0}\n</body>\n</html>'],
        ["page-ar", "هيكل صفحة HTML كامل بالعربية",
            '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <title>${1:صفحتي}</title>\n</head>\n<body>\n  ${0}\n</body>\n</html>'],
        ["style-block", "وسم style لكتابة CSS داخل الصفحة", '<style>\n  ${1:body} {\n    ${0}\n  }\n</style>'],
        ["link-css", "ربط ملف CSS خارجي", '<link rel="stylesheet" href="${1:style.css}">'],
        ["a-blank", "رابط يفتح في نافذة جديدة", '<a href="${1:https://}" target="_blank">${2:نص الرابط}</a>'],
        ["img-alt", "صورة مع نص بديل", '<img src="${1:photo.jpg}" alt="${2:وصف الصورة}" width="${3:300}">'],
        ["ul-3", "قائمة نقطية بثلاثة عناصر", '<ul>\n  <li>${1:العنصر الأول}</li>\n  <li>${2:العنصر الثاني}</li>\n  <li>${3:العنصر الثالث}</li>\n</ul>'],
        ["ol-3", "قائمة مرقمة بثلاثة عناصر", '<ol>\n  <li>${1:الخطوة الأولى}</li>\n  <li>${2:الخطوة الثانية}</li>\n  <li>${3:الخطوة الثالثة}</li>\n</ol>'],
        ["table-grades", "جدول بعناوين وصفين", '<table border="1">\n  <tr>\n    <th>${1:الاسم}</th>\n    <th>${2:الدرجة}</th>\n  </tr>\n  <tr>\n    <td>${3:سارة}</td>\n    <td>${4:95}</td>\n  </tr>\n  <tr>\n    <td></td>\n    <td></td>\n  </tr>\n</table>'],
        ["form-student", "نموذج تسجيل طالب", '<form>\n  <p><label>الاسم: <input type="text" required></label></p>\n  <p><label>البريد: <input type="email"></label></p>\n  <p><label>العمر: <input type="number" min="15"></label></p>\n  <p><label>الدورة:\n    <select>\n      <option>HTML</option>\n      <option>C#</option>\n      <option>SQL</option>\n    </select></label></p>\n  <button type="submit">${1:تسجيل}</button>\n</form>'],
        ["input-label", "حقل إدخال مع عنوانه", '<label>${1:الاسم}: <input type="${2:text}" placeholder="${3}"></label>'],
        ["radio-group", "اختيار واحد من عدة خيارات", '<label><input type="radio" name="${1:g}"> ${2:ذكر}</label>\n<label><input type="radio" name="${1:g}"> ${3:أنثى}</label>'],
        ["select-3", "قائمة منسدلة", '<select>\n  <option>${1:الخيار 1}</option>\n  <option>${2:الخيار 2}</option>\n  <option>${3:الخيار 3}</option>\n</select>'],
        ["nav-3", "شريط تنقل بثلاثة روابط", '<nav>\n  <a href="#">${1:الرئيسية}</a>\n  <a href="#">${2:من نحن}</a>\n  <a href="#">${3:تواصل}</a>\n</nav>'],
        ["layout", "تقسيم الصفحة: header وnav وmain وfooter", '<header>\n  <h1>${1:اسم الموقع}</h1>\n</header>\n<nav>\n  <a href="#">الرئيسية</a>\n</nav>\n<main>\n  ${0}\n</main>\n<footer>\n  <p>© 2026</p>\n</footer>'],
        ["card", "بطاقة: صندوق فيه عنوان وفقرة", '<div class="card">\n  <h3>${1:العنوان}</h3>\n  <p>${2:الوصف}</p>\n</div>'],
    ];

    // التوقع: ما الذي يُكتب عادةً داخل كل وسم مفتوح
    const childPrediction = {
        ul: "<li></li>", ol: "<li></li>", select: "<option></option>", table: "<tr></tr>",
        tr: "<td></td>", thead: "<tr></tr>", tbody: "<tr></tr>", nav: '<a href="#"></a>',
        head: '<meta charset="UTF-8">', form: '<label></label>', dl: "<dt></dt>",
    };

    // التوقع عند كتابة بداية وسم: أكمل الوسم بخصائصه المعتادة
    const tagPrediction = {
        a: 'a href=""></a>', img: 'img src="" alt="">', input: 'input type="text" placeholder="">',
        link: 'link rel="stylesheet" href="style.css">', label: 'label></label>', button: 'button type="submit"></button>',
        select: 'select></select>', option: 'option></option>', table: 'table border="1"></table>',
        textarea: 'textarea rows="3"></textarea>', form: 'form></form>', style: 'style></style>',
        div: 'div class=""></div>', span: 'span></span>', section: 'section></section>',
        header: 'header></header>', footer: 'footer></footer>', main: 'main></main>', nav: 'nav></nav>',
        h1: 'h1></h1>', h2: 'h2></h2>', h3: 'h3></h3>', p: 'p></p>', li: 'li></li>', ul: 'ul></ul>', ol: 'ol></ol>',
        strong: 'strong></strong>', meta: 'meta charset="UTF-8">', title: 'title></title>', br: 'br>',
    };

    const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

    return { cssProps, cssValues, htmlSnippets, childPrediction, tagPrediction, voidTags };
})();
