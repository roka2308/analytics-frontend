"use client";

import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import "@/components/editor/grid-editor.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface Props {
  layout: Layout[];
  children: React.ReactNode;
}

/**
 * Statische Raster-Darstellung (nicht ziehbar/skalierbar) fuer die
 * normale Dashboard-Ansicht. Nutzt dieselbe Raster-Logik wie der
 * Editor, damit die Anordnung 1:1 uebereinstimmt (WYSIWYG).
 *
 * Mobile (sm): eine Spalte, Widgets stapeln in Layout-Reihenfolge.
 */
export function DashboardGrid({ layout, children }: Props) {
  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout, md: layout, sm: layout }}
      breakpoints={{ lg: 1024, md: 768, sm: 0 }}
      cols={{ lg: 12, md: 12, sm: 1 }}
      rowHeight={84}
      margin={[16, 16]}
      isDraggable={false}
      isResizable={false}
      compactType="vertical"
    >
      {children}
    </ResponsiveGridLayout>
  );
}
