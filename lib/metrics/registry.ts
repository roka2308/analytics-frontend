/**
 * Zentrale Metrik-Registry.
 *
 * Jede Metrik hat:
 *  - id           : maschineller Identifier (matched mit Widget-Config)
 *  - label        : kurzer Anzeigename
 *  - definition   : kurze, fachliche Definition (1 Satz)
 *  - explanation  : laengere Erklaerung, was die Zahl aussagt
 *  - recommendations: konkrete Massnahmen / Best Practices
 *  - lowerIsBetter: true = weniger ist besser (z.B. Bounce Rate)
 *  - format       : Hinweis, wie die Zahl formatiert wird
 *
 * Neue Metrik hinzufuegen:
 *  - Eintrag in METRIC_REGISTRY anlegen
 *  - Im Widget die metric-id verwenden, MetricInfo zeigt automatisch
 *    die richtigen Texte.
 *
 * Spaeter (Phase E.2) koennen diese Texte projekt-spezifisch ueberschrieben
 * werden – die Struktur ist darauf vorbereitet.
 */

export type MetricKind = "kpi" | "analysis";

export interface MetricDefinition {
  id: string;
  kind: MetricKind;
  label: string;
  definition: string;
  explanation: string;
  recommendations: string[];
  lowerIsBetter?: boolean;
  format?: string;
}

export const METRIC_REGISTRY: Record<string, MetricDefinition> = {
  visits: {
    id: "visits",
    kind: "kpi",
    label: "Besuche",
    definition: "Anzahl aller Besuche im gewählten Zeitraum.",
    explanation:
      "Ein Besuch zählt jedes Mal, wenn jemand deine Website öffnet und mindestens eine Aktion durchführt. Wiederkehrende Besucher zählen pro Besuch erneut. Diese Zahl zeigt das gesamte Verkehrsaufkommen.",
    recommendations: [
      "SEO-Maßnahmen: Inhalte zu relevanten Suchanfragen optimieren.",
      "Bezahlte Kampagnen (Google Ads, Social Ads) zur Reichweite testen.",
      "Newsletter-Versand erhöht wiederkehrende Besuche.",
      "Wenn die Zahl plötzlich einbricht: Tracking prüfen (Cookie-Banner, Domain-Wechsel).",
    ],
    format: "Ganzzahl",
  },
  uniqueVisitors: {
    id: "uniqueVisitors",
    kind: "kpi",
    label: "Unique Visitors",
    definition: "Anzahl unterschiedlicher Personen im gewählten Zeitraum.",
    explanation:
      "Im Gegensatz zu Besuchen werden hier wiederkehrende Personen nur einmal gezählt. Das ist die Antwort auf die Frage: Wie viele Menschen erreichen wir wirklich?",
    recommendations: [
      "Reichweiten-Kampagnen erhöhen Unique Visitors – nicht nur Besuche.",
      "Vergleiche das Verhältnis Besuche/Unique: hoch = treue Wiederkehrer, niedrig = vor allem Erstbesucher.",
      "Auf Mehrgeräte-Erkennung achten: Bei Matomo kann ein Nutzer auf Handy + Desktop als zwei Unique zählen.",
    ],
    format: "Ganzzahl",
  },
  pageviews: {
    id: "pageviews",
    kind: "kpi",
    label: "Seitenaufrufe",
    definition: "Gesamtzahl aller aufgerufenen Seiten.",
    explanation:
      "Jede einzelne Seite, die im Zeitraum geöffnet wurde – inklusive Wiederaufrufe derselben Seite. Mehrere Seitenaufrufe pro Besuch sind ein Zeichen für Engagement.",
    recommendations: [
      "Interne Verlinkung verbessern: Verwandte Inhalte vorschlagen.",
      "Call-to-Action-Elemente platzieren, die zu weiteren Seiten führen.",
      "Bei niedrigen Werten Top-Einstiegsseiten prüfen: Verlieren sie Nutzer sofort?",
    ],
    format: "Ganzzahl",
  },
  bounceRate: {
    id: "bounceRate",
    kind: "kpi",
    label: "Bounce Rate",
    definition: "Anteil der Besuche mit nur einer einzigen Seitenansicht.",
    explanation:
      "Ein Bounce ist ein Besucher, der die Seite verlässt, ohne eine zweite Seite zu öffnen. Eine hohe Bounce Rate kann ein Hinweis sein, dass Inhalte nicht zur Suchintention passen – muss aber nicht: Bei Info-Seiten (z.B. Adressen, Öffnungszeiten) ist sie oft hoch und vollkommen okay.",
    recommendations: [
      "Lade-Zeit prüfen: > 3 Sekunden = hohe Absprungrate ist garantiert.",
      "Mobile Darstellung testen – die meisten Bounces passieren am Handy.",
      "Klare Überschriften und schnelles Erkennen, was die Seite bietet.",
      "Bei Landingpages: deutliche CTAs einbauen, die zur nächsten Aktion führen.",
      "Bei Blog/Content: verwandte Artikel anbieten.",
    ],
    lowerIsBetter: true,
    format: "Prozent",
  },
  avgDuration: {
    id: "avgDuration",
    kind: "kpi",
    label: "Ø Verweildauer",
    definition: "Durchschnittliche Zeit, die Besucher auf der Website verbringen.",
    explanation:
      "Höhere Verweildauer ist meist ein Engagement-Indikator – außer bei reinen Such-Anfragen (z.B. Telefonnummer), wo schnelle Verweildauer gewünscht ist. Bewerte den Wert im Kontext deiner Inhalte.",
    recommendations: [
      "Inhalte länger und tiefer machen, wenn Beratungs-/Content-Marketing das Ziel ist.",
      "Video- und interaktive Inhalte erhöhen die Dauer signifikant.",
      "Bei niedrigen Werten: Sind die Besucher überhaupt richtig adressiert?",
      "Vorsicht bei Interpretation: Matomo misst nur Zeit bis zur letzten Aktion – die letzte Seite vor dem Schließen wird nicht voll gezählt.",
    ],
    format: "Minuten/Sekunden",
  },
};

// ──────────────────────────────────────────────────────────────
// Analyse-Definitionen (fuer Widgets ohne klassische "Metrik")
// ──────────────────────────────────────────────────────────────

export const ANALYSIS_REGISTRY: Record<string, MetricDefinition> = {
  "visitor-trend": {
    id: "visitor-trend",
    kind: "analysis",
    label: "Besuchertrend",
    definition: "Tägliche Entwicklung der Besucherzahlen im gewählten Zeitraum.",
    explanation:
      "Zeigt Spitzen und Täler im Verkehrsaufkommen. Wochentags-Muster sind normal: B2B-Sites haben oft mehr Verkehr Mo–Fr, Shop-Sites am Wochenende oder abends.",
    recommendations: [
      "Spitzen mit Kampagnen-Starts oder externen Events korrelieren.",
      "Einbrüche analysieren: gab es technische Probleme, Tracking-Ausfall, externe Sichtbarkeit verloren?",
      "Vorperiode oder Vorjahr aktivieren, um saisonale Effekte zu erkennen.",
    ],
  },
  "top-pages": {
    id: "top-pages",
    kind: "analysis",
    label: "Top-Seiten",
    definition: "Die am häufigsten aufgerufenen Seiten im Zeitraum.",
    explanation:
      "Zeigt, welche Inhalte am meisten genutzt werden. Wichtige Erkenntnis-Quelle: Welche Themen interessieren wirklich? Gibt es Seiten, die unerwartet stark performen?",
    recommendations: [
      "Top-Performer-Seiten ausbauen und intern stärker verlinken.",
      "Erfolgreiche Inhalte als Basis für weitere Beiträge nutzen.",
      "Auf konvertierungsrelevante Seiten achten: Sind sie unter den Top-Seiten? Wenn nein, Sichtbarkeit erhöhen.",
      "URLs prüfen: Werden Tracking-Parameter (utm_*) als eigene URL gezählt? Ggf. URL-Normalisierung in Matomo aktivieren.",
    ],
  },
};

export function getMetricDefinition(id: string): MetricDefinition | null {
  return METRIC_REGISTRY[id] ?? ANALYSIS_REGISTRY[id] ?? null;
}
