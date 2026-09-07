// A restrained workspace surface behind all in-app content. It deliberately
// avoids imagery so operational data stays easy to scan at every viewport.
export default function ScenicBackdrop() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: [
          'radial-gradient(900px 620px at 8% -10%, var(--nx-workspace-glow-1), transparent 64%)',
          'radial-gradient(760px 520px at 100% 8%, var(--nx-workspace-glow-2), transparent 62%)',
          'var(--nx-workspace-bg)',
        ].join(', '),
        pointerEvents: 'none',
      }}
    />
  );
}
