# SQL-Datenquelle – View-Katalog

> Referenz für die `SqlDataSource`. Das Dashboard der Kollegin liest **nur diese
> 5 vorberechneten MySQL-Views** per `SELECT *` – keine rohen Queries zur Laufzeit.
> Die explorativen Queries in `ecommerce_analysis.sql` sind Vorarbeit, NICHT live.

## Datenbank-Schema (4 Basistabellen)

| Tabelle      | Zeilen | Wichtige Felder |
|--------------|--------|-----------------|
| users        | 2.000  | user_id, registration_date, channel, device, country |
| sessions     | 8.800  | session_id, user_id, session_date, page_views, session_duration_sec, bounced, channel |
| events       | 25.177 | event_id, user_id, event_type (view/cart/purchase), product_id, price, event_timestamp |
| transactions | 1.429  | transaction_id, user_id, amount, quantity, transaction_date, channel, device, country |

## Die 5 Views (das, was das Dashboard tatsächlich liest)

| View                | Format     | Liefert | → normalisiert als |
|---------------------|------------|---------|--------------------|
| `monthly_revenue`   | Zeitreihe  | 12 Rows, Umsatz/Monat (month `YYYY-MM`, total_revenue) | `timeseries` |
| `funnel_overall`    | Einzelwert | 1 Row, CVR gesamt (cart 89 %, purchase 53 %) | `scalar` |
| `funnel_channel`    | Tabelle    | N Rows, CVR pro Channel | `table` |
| `bounce_by_channel` | Tabelle    | N Rows, Bounce-Rate pro Channel | `table` |
| `revenue_by_channel`| Tabelle    | N Rows, Umsatz/Trans./Ø Bestellwert pro Channel | `table` |

## Normalisierungs-Hinweise

- **Datum**: `monthly_revenue.month` liegt als `YYYY-MM` vor → auf ISO
  (`YYYY-MM-01`) bringen, damit es zu Matomos Datumsformat passt.
- **Prozentwerte**: CVR / Bounce-Rate als `unit: "percent"` kennzeichnen.
  Prüfen, ob die View 0–1 oder 0–100 liefert, und einheitlich machen.
- **Currency**: total_revenue, avg_order_value → `unit: "currency"`.

## Herkunft (Original-Repo der Kollegin)

- `ecommerce_analysis.sql` – Schema + Views + explorative Queries
- `dashboard_generator.py` – DB-Connection, liest Views, serialisiert JSON ins HTML
- `ecommerce_dashboard.html` – Frontend mit eingebettetem JSON

→ Migriert wird die **Funktionalität** (welche Metriken), nicht der Code.
  HTML-Frontend und Python-Generator entfallen; Views bleiben in der DB.
