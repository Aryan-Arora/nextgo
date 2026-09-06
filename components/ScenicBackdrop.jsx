// Real HD photograph (rolling green hills — sourced from Unsplash, free to
// use) pinned behind the whole dashboard as a fixed wallpaper. Sits at zIndex
// 0, below the app chrome (sidebar/topbar are 30/40+) and above the app's
// flat page background. A dark scrim keeps the glass cards' text readable
// over the photo's bright/light patches.
export default function ScenicBackdrop({ mode = 'hero' }) {
  const workspace = mode === 'workspace';
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        backgroundImage: [
          workspace
            ? 'linear-gradient(rgba(10,18,14,.72), rgba(10,18,14,.72))'
            : 'linear-gradient(rgba(10,18,14,.42), rgba(10,18,14,.42))',
          'url(/dashboard-field.jpg)',
        ].join(', '),
        backgroundSize: 'cover',
        backgroundPosition: 'center 65%',
        backgroundRepeat: 'no-repeat',
        filter: workspace ? 'saturate(.62) contrast(.9)' : 'none',
        pointerEvents: 'none',
      }}
    />
  );
}
