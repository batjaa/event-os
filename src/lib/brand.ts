/**
 * Apply a brand color to CSS custom properties on the document root.
 * Used by OrgBranding (layout mount) and OrganizationTab (live preview).
 */
export function applyBrandColor(color: string) {
  const root = document.documentElement;
  root.style.setProperty("--primary", color);
  root.style.setProperty("--ring", color);
  root.style.setProperty("--chart-1", color);
  root.style.setProperty("--sidebar-primary", color);
  root.style.setProperty("--sidebar-accent-foreground", color);
  root.style.setProperty("--sidebar-ring", color);

  // Sidebar accent bg at ~15% opacity
  root.style.setProperty("--sidebar-accent", `${color}26`);

  // For very dark brand colors, lighten the sidebar so the accent is visible
  const lum = hexLuminance(color);
  if (lum < 0.15) {
    root.style.setProperty("--sidebar", "#292524"); // stone-800
    root.style.setProperty("--sidebar-foreground", "#d6d3d1"); // stone-300
    root.style.setProperty("--sidebar-border", "#44403c"); // stone-700
  } else {
    // Restore defaults
    root.style.setProperty("--sidebar", "#1c1917"); // stone-900
    root.style.setProperty("--sidebar-foreground", "#d6d3d1");
    root.style.setProperty("--sidebar-border", "#292524"); // stone-800
  }
}

/** Remove brand color overrides — restore CSS to stylesheet defaults. */
export function clearBrandColor() {
  const root = document.documentElement;
  const props = [
    "--primary", "--ring", "--chart-1",
    "--sidebar-primary", "--sidebar-accent", "--sidebar-accent-foreground", "--sidebar-ring",
    "--sidebar", "--sidebar-foreground", "--sidebar-border",
  ];
  for (const p of props) root.style.removeProperty(p);
}

/** Relative luminance of a hex color (0 = black, 1 = white). */
function hexLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
