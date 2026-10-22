// اقتراحات محرر C# بوصف عربي: قوالب الجمل، وأعضاء Console وMath وint، وأعضاء النصوص والقوائم الشائعة.
window.CSharpHints = (function () {
    // [الاسم، الوصف، النص (snippet)]
    const snippets = [
        ["cw", "طباعة سطر: Console.WriteLine", 'Console.WriteLine(${1:"مرحبًا"});'],
        ["Console.WriteLine", "طباعة نص ثم الانتقال لسطر جديد", 'Console.WriteLine(${1:"مرحبًا"});'],
        ["Console.Write", "طباعة نص في نفس السطر", 'Console.Write(${1:"اكتب: "});'],
        ["Console.ReadLine", "قراءة ما يكتبه المستخدم (نص)", "Console.ReadLine()"],
        ["readint", "قراءة رقم صحيح من المستخدم", 'Console.Write("${1:أدخل رقمًا: }");\nint ${2:n} = int.Parse(Console.ReadLine());'],
        ["readstring", "قراءة نص من المستخدم", 'Console.Write("${1:اسمك: }");\nstring ${2:name} = Console.ReadLine();'],
        ["if", "شرط: ينفذ الكود إذا تحقق", "if (${1:x > 0})\n{\n\t$0\n}"],
        ["ifelse", "شرط مع بديل", "if (${1:x > 0})\n{\n\t$2\n}\nelse\n{\n\t$0\n}"],
        ["else", "البديل إذا لم يتحقق الشرط", "else\n{\n\t$0\n}"],
        ["elseif", "شرط آخر", "else if (${1:x < 0})\n{\n\t$0\n}"],
        ["for", "حلقة بعدد مرات معروف", "for (int ${1:i} = ${2:1}; $1 <= ${3:10}; $1++)\n{\n\t$0\n}"],
        ["foreach", "المرور على كل عنصر في مصفوفة أو قائمة", "foreach (var ${1:item} in ${2:list})\n{\n\t$0\n}"],
        ["while", "حلقة ما دام الشرط صحيحًا", "while (${1:condition})\n{\n\t$0\n}"],
        ["do", "حلقة تنفذ مرة على الأقل", "do\n{\n\t$0\n} while (${1:condition});"],
        ["switch", "اختيار من عدة حالات", 'switch (${1:choice})\n{\n\tcase ${2:"1"}:\n\t\t$0\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}'],
        ["case", "حالة داخل switch", 'case ${1:"1"}:\n\t$0\n\tbreak;'],
        ["try", "التعامل مع الأخطاء", "try\n{\n\t$1\n}\ncatch (Exception ex)\n{\n\tConsole.WriteLine(ex.Message);\n}"],
        ["method", "دالة ترجع قيمة", "static ${1:int} ${2:Add}(${3:int a, int b})\n{\n\treturn ${4:a + b};\n}"],
        ["void", "دالة لا ترجع قيمة", "static void ${1:Greet}(${2:string name})\n{\n\t$0\n}"],
        ["class", "تعريف كلاس بخصائص", "class ${1:Student}\n{\n\tpublic string ${2:Name} { get; set; }\n\tpublic int ${3:Grade} { get; set; }\n}"],
        ["prop", "خاصية داخل كلاس", "public ${1:string} ${2:Name} { get; set; }"],
        ["list", "قائمة List جديدة", "var ${1:names} = new List<${2:string}>();"],
        ["array", "مصفوفة بقيم", "int[] ${1:numbers} = { ${2:1, 2, 3} };"],
        ["tryparse", "تحويل آمن لرقم", 'if (int.TryParse(Console.ReadLine(), out int ${1:n}))\n{\n\t$0\n}\nelse\n{\n\tConsole.WriteLine("الرجاء إدخال رقم صحيح");\n}'],
        ["menu", "قائمة برنامج تتكرر حتى الخروج", 'string choice = "";\nwhile (choice != "0")\n{\n\tConsole.WriteLine("1) ${1:إضافة}  2) ${2:عرض}  0) خروج");\n\tchoice = Console.ReadLine();\n\tswitch (choice)\n\t{\n\t\tcase "1":\n\t\t\t$0\n\t\t\tbreak;\n\t\tcase "2":\n\t\t\tbreak;\n\t}\n}'],
        ["int", "متغير عدد صحيح", "int ${1:x} = ${2:0};"],
        ["double", "متغير عدد عشري", "double ${1:price} = ${2:0.0};"],
        ["string", "متغير نص", 'string ${1:name} = "${2}";'],
        ["bool", "متغير صح/خطأ", "bool ${1:ok} = ${2:true};"],
        ["var", "متغير يُستنتج نوعه", "var ${1:x} = ${2:0};"],
        ["$", "نص فيه متغيرات", '$"${1:الاسم}: {${2:name}}"'],
    ];

    const keywords = ["int", "double", "string", "bool", "char", "decimal", "var", "if", "else", "for", "foreach", "in", "while", "do",
        "switch", "case", "default", "break", "continue", "return", "static", "void", "class", "public", "private", "new", "true", "false",
        "null", "try", "catch", "finally", "const", "List", "Console", "Math", "Random"];

    // أعضاء بعد النقطة: [الاسم، الوصف، النص]
    const members = {
        Console: [["WriteLine", "طباعة ثم سطر جديد", 'WriteLine(${1})'], ["Write", "طباعة بدون سطر جديد", 'Write(${1})'], ["ReadLine", "قراءة سطر من المستخدم", "ReadLine()"], ["Clear", "مسح الشاشة", "Clear()"]],
        Math: [["Max", "الأكبر بين رقمين", "Max(${1:a}, ${2:b})"], ["Min", "الأصغر بين رقمين", "Min(${1:a}, ${2:b})"], ["Abs", "القيمة المطلقة", "Abs(${1:x})"],
            ["Round", "تقريب", "Round(${1:x}, ${2:2})"], ["Sqrt", "الجذر التربيعي", "Sqrt(${1:x})"], ["Pow", "الأس: Pow(2, 3) = 8", "Pow(${1:x}, ${2:2})"],
            ["PI", "ثابت π = 3.14159", "PI"], ["Floor", "تقريب للأسفل", "Floor(${1:x})"], ["Ceiling", "تقريب للأعلى", "Ceiling(${1:x})"]],
        int: [["Parse", "تحويل نص إلى رقم صحيح", "Parse(${1:Console.ReadLine()})"], ["TryParse", "تحويل آمن: يرجع true إذا نجح", "TryParse(${1:text}, out int ${2:n})"],
            ["MaxValue", "أكبر قيمة لـ int", "MaxValue"], ["MinValue", "أصغر قيمة لـ int", "MinValue"]],
        double: [["Parse", "تحويل نص إلى عدد عشري", "Parse(${1:Console.ReadLine()})"], ["TryParse", "تحويل آمن", "TryParse(${1:text}, out double ${2:x})"]],
        decimal: [["Parse", "تحويل نص إلى decimal", "Parse(${1:Console.ReadLine()})"]],
        string: [["IsNullOrEmpty", "هل النص فارغ؟", "IsNullOrEmpty(${1:text})"], ["Join", "دمج عناصر بفاصل", 'Join(${1:", "}, ${2:list})']],
        Random: [["Shared", "مولد أرقام عشوائية جاهز", "Shared.Next(${1:1}, ${2:101})"]],
    };
    // أعضاء شائعة لأي متغير (نص، قائمة، مصفوفة)
    const common = [
        ["Length", "عدد الحروف أو عدد عناصر المصفوفة", "Length"], ["Count", "عدد عناصر القائمة", "Count"],
        ["Add", "إضافة عنصر إلى القائمة", "Add(${1})"], ["Remove", "حذف عنصر من القائمة", "Remove(${1})"], ["Contains", "هل يحتوي على…؟", "Contains(${1})"],
        ["ToUpper", "تحويل لأحرف كبيرة", "ToUpper()"], ["ToLower", "تحويل لأحرف صغيرة", "ToLower()"], ["Trim", "حذف المسافات من الطرفين", "Trim()"],
        ["Split", "تقسيم النص", "Split('${1: }')"], ["Substring", "جزء من النص", "Substring(${1:0}, ${2:3})"], ["Replace", "استبدال", 'Replace("${1}", "${2}")'],
        ["ToString", "تحويل إلى نص", 'ToString(${1})'], ["Sum", "مجموع العناصر", "Sum()"], ["Average", "متوسط العناصر", "Average()"],
        ["Max", "أكبر عنصر", "Max()"], ["Min", "أصغر عنصر", "Min()"], ["OrderBy", "ترتيب تصاعدي", "OrderBy(${1:x} => $1)"],
        ["Where", "تصفية", "Where(${1:x} => ${2:x > 0})"], ["ToList", "تحويل إلى قائمة", "ToList()"], ["Clear", "حذف كل العناصر", "Clear()"],
        ["IndexOf", "موقع عنصر أو نص", "IndexOf(${1})"], ["StartsWith", "هل يبدأ بـ…؟", 'StartsWith("${1}")'], ["Next", "رقم عشوائي", "Next(${1:1}, ${2:101})"],
    ];

    return { snippets, keywords, members, common };
})();
