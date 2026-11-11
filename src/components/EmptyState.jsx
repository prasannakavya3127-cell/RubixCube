export default function EmptyState({ title, text, action, onAction }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-2 text-slate-600">{text}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-500"
      >
        {action}
      </button>
    </div>
  );
}
