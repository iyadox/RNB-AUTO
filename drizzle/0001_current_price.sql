ALTER TABLE "interventions" ADD COLUMN "current_price_cents" integer;--> statement-breakpoint
UPDATE "interventions" AS i SET "current_price_cents" = q."price_ttc_cents" FROM "quotes" AS q WHERE q."id" = i."current_quote_id";
