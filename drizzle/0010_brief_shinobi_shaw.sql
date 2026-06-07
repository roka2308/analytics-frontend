INSERT INTO data_sources (id, organization_id, type, label, matomo_site_id, created_at)
SELECT 'ds_' || ms.id, ms.organization_id, 'matomo', ms.label, ms.matomo_site_id, ms.created_at
FROM matomo_sites ms
WHERE NOT EXISTS (SELECT 1 FROM data_sources ds WHERE ds.id = 'ds_' || ms.id);--> statement-breakpoint
DROP TABLE `matomo_sites`;
