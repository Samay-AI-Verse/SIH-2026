import { cn } from "../../utils/cn";

const fieldClass =
  "w-full rounded-md border-2 border-web bg-white px-4 py-3 text-sm text-ink outline-none transition duration-300 placeholder:text-ink/40 focus:border-spidey focus:shadow-[0_0_0_4px_rgb(225_29_46/0.18)]";

export function Field({ label, error, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-web">{label}</span>
      {children}
      {error ? <span className="text-xs text-spidey">{error}</span> : null}
    </label>
  );
}

export function TextInput(props) {
  return <input {...props} className={cn(fieldClass, props.className)} />;
}

export function TextArea(props) {
  return <textarea {...props} className={cn(fieldClass, "min-h-32 resize-y", props.className)} />;
}

export function SelectInput(props) {
  return <select {...props} className={cn(fieldClass, props.className)} />;
}
