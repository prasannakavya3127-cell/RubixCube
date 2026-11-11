// Shows the outcome of cube validation. `errors` come from decodeCube; `warnings`
// are non-blocking notes from the colour classifier.
export default function ValidationPanel({ errors, warnings = [], uncertainCount = 0, complete }) {
  if (!complete) {
    return (
      <Panel tone="neutral" title="Waiting for all six faces">
        Capture the remaining faces to validate the cube.
      </Panel>
    );
  }
  if (errors.length === 0) {
    return (
      <Panel tone="success" title="Cube state is valid">
        All sticker counts, centres, corners and edges check out, so this cube can be solved.
        {uncertainCount > 0 && (
          <> {uncertainCount} sticker{uncertainCount === 1 ? ' is' : 's are'} outlined in amber because the colour match was uncertain. Check them against the cube.</>
        )}
      </Panel>
    );
  }
  return (
    <Panel tone="error" title={`${errors.length} problem${errors.length === 1 ? '' : 's'} found`}>
      <ul className="list-disc space-y-1 pl-5">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
      <p className="mt-2 text-sm">Tap a sticker in the net and choose the correct colour, or retake the affected face.</p>
      {warnings.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm opacity-90">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

const TONES = {
  neutral: 'border-slate-200 bg-white text-slate-700',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  error: 'border-rose-300 bg-rose-50 text-rose-900',
};

function Panel({ tone, title, children }) {
  return (
    <section role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border p-4 text-sm ${TONES[tone]}`}>
      <h3 className="mb-1 text-base font-semibold">{title}</h3>
      <div>{children}</div>
    </section>
  );
}
