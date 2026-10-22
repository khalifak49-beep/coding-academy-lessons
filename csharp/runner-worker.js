// يعمل في Web Worker: يحمّل .NET ومترجم C# ويشغّل برامج المتدربين بعيدًا عن الصفحة،
// فإذا علق برنامج (حلقة لا تنتهي) توقفه الصفحة دون أن تتجمد.
import { dotnet } from "./_framework/dotnet.js";

const ready = (async () => {
    const { getAssemblyExports, getConfig } = await dotnet.create();
    const exports = await getAssemblyExports(getConfig().mainAssemblyName);
    self.__diag = exports.Runner.Diagnose();
    return exports.Runner;
})();

self.onmessage = async e => {
    const m = e.data;
    try {
        const runner = await ready;
        if (m.type === "init") { self.postMessage({ id: m.id, status: "ready", diag: self.__diag }); return; }
        const result = JSON.parse(runner.Run(m.code, JSON.stringify(m.inputs || []), m.seed | 0));
        self.postMessage({ id: m.id, ...result });
    } catch (err) {
        self.postMessage({ id: m.id, status: "fatal", message: String(err && err.message || err) });
    }
};
