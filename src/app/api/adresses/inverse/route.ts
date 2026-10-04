/** Adresse correspondant à la position du téléphone (bouton « Utiliser ma position »). */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { reverseGeocode } from "@/server/geo/service";
import { rateLimitByIp } from "@/server/security/rate-limit";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ result: null }, { status: 400 });
  const limit = await rateLimitByIp("adresse-inverse", 30, 60);
  if (!limit.ok) return NextResponse.json({ result: null }, { status: 429 });
  const result = await reverseGeocode(parsed.data);
  return NextResponse.json(
    { result: result ? { label: result.label, lat: parsed.data.lat, lng: parsed.data.lng, postcode: result.postcode, city: result.city } : null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
