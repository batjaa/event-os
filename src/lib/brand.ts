/**
 * Apply a brand color to CSS custom properties on the document root.
 * Used by OrgBranding (layout mount) and OrganizationTab (live preview).
 */
export function applyBrandColor(color: string) {
  const root = document.documentElement;
  const lum = hexLuminance(color);

  // Main app tokens — always the raw brand color
  root.style.setProperty("--primary", color);
  root.style.setProperty("--ring", color);
  root.style.setProperty("--chart-1", color);

  // Sidebar needs special handling: dark brand colors are invisible
  // on the dark sidebar, so we derive a lighter accent for the sidebar.
  if (lum < 0.2) {
    // Dark color — use white/light text for active items in sidebar
    const light = lighten(color, 0.6);
    root.style.setProperty("--sidebar-primary", light);
    root.style.setProperty("--sidebar-accent-foreground", light);
    root.style.setProperty("--sidebar-ring", light);
    root.style.setProperty("--sidebar-accent", `${light}26`);
    // Lighten sidebar bg slightly so it's not identical to the brand
    root.style.setProperty("--sidebar", "#292524");
    root.style.setProperty("--sidebar-foreground", "#d6d3d1");
    root.style.setProperty("--sidebar-border", "#44403c");
  } else {
    // Normal/bright color — use directly
    root.style.setProperty("--sidebar-primary", color);
    root.style.setProperty("--sidebar-accent-foreground", color);
    root.style.setProperty("--sidebar-ring", color);
    root.style.setProperty("--sidebar-accent", `${color}26`);
    // Restore default sidebar
    root.style.setProperty("--sidebar", "#1c1917");
    root.style.setProperty("--sidebar-foreground", "#d6d3d1");
    root.style.setProperty("--sidebar-border", "#292524");
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

/** Lighten a hex color by mixing it toward white. amount: 0 = no change, 1 = white. */
function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${mix(r).toString(16).padStart(2, "0")}${mix(g).toString(16).padStart(2, "0")}${mix(b).toString(16).padStart(2, "0")}`;
}

/** Relative luminance of a hex color (0 = black, 1 = white). */
function hexLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
