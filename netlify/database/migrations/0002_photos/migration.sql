CREATE TABLE "intervention_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intervention_id" uuid NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interventions" ADD COLUMN "photo_token_hash" text;--> statement-breakpoint
ALTER TABLE "interventions" ADD COLUMN "photo_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "intervention_photos" ADD CONSTRAINT "intervention_photos_intervention_id_interventions_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "intervention_photos_intervention_idx" ON "intervention_photos" USING btree ("intervention_id");--> statement-breakpoint
CREATE INDEX "interventions_photo_token_idx" ON "interventions" USING btree ("photo_token_hash");