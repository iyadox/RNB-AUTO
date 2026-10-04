/** Suggestions d'adresses pour le formulaire (autocomplétion). Limité pour éviter les abus. */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { searchAddresses } from "@/server/geo/service";
import { rateLimitByIp } from "@/server/security/rate-limit";

const querySchema = z.object({
  q: z.string().trim().min(3).max(200),
  lat: z.coerce.number().min(41).max(52).optional(),
  lng: z.coerce.number().min(-5.5).max(10).optional(),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ results: [] });
  const limit = await rateLimitByIp("adresses", 90, 60);
  if (!limit.ok) {
    return NextResponse.json({ results: [], error: "Trop de recherches, réessayez dans un instant." }, { status: 429 });
  }
  const { q, lat, lng } = parsed.data;
  const results = await searchAddresses(q, lat !== undefined && lng !== undefined ? { lat, lng } : null, 5);
  return NextResponse.json(
    { results: results.map(({ label, lat: rLat, lng: rLng, postcode, city }) => ({ label, lat: rLat, lng: rLng, postcode, city })) },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}
