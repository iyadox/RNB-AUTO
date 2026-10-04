/**
 * Nettoyage d'une photo JPEG sans la décoder : on garde l'image et on retire tout le reste
 * (EXIF avec la position GPS, XMP, commentaires, images secondaires après la fin de l'image).
 * Le téléphone a déjà réduit et réencodé la photo ; ceci protège aussi les envois directs.
 */

export type CleanJpeg = { data: Uint8Array; width: number; height: number };

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const APP0 = 0xe0;
const APP2 = 0xe2;
const APP14 = 0xee;
const COM = 0xfe;

/** Marqueurs « début d'image » (dimensions), hors tables de Huffman / arithmétique. */
function isStartOfFrame(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function startsWith(segment: Uint8Array, offset: number, text: string): boolean {
  for (let k = 0; k < text.length; k++) if (segment[offset + k] !== text.charCodeAt(k)) return false;
  return true;
}

/** Segments conservés : JFIF (APP0), profil de couleurs ICC (APP2) et Adobe (APP14). */
function keepApplicationSegment(marker: number, segment: Uint8Array): boolean {
  if (marker === APP0) return true;
  if (marker === APP2) return startsWith(segment, 4, "ICC_PROFILE\0");
  if (marker === APP14) return startsWith(segment, 4, "Adobe");
  return false;
}

export function cleanJpeg(input: Uint8Array): CleanJpeg | null {
  if (input.length < 4 || input[0] !== 0xff || input[1] !== SOI) return null;
  const parts: Uint8Array[] = [input.subarray(0, 2)];
  let width = 0;
  let height = 0;
  let i = 2;
  let ended = false;

  while (i < input.length - 1) {
    if (input[i] !== 0xff) return null;
    let marker = input[i + 1] as number;
    // Octets de remplissage 0xFF avant un marqueur.
    while (marker === 0xff && i < input.length - 2) {
      i++;
      marker = input[i + 1] as number;
    }
    if (marker === EOI) {
      parts.push(new Uint8Array([0xff, EOI]));
      ended = true;
      break;
    }
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      parts.push(input.subarray(i, i + 2));
      i += 2;
      continue;
    }
    if (i + 3 >= input.length) return null;
    const length = ((input[i + 2] as number) << 8) | (input[i + 3] as number);
    if (length < 2 || i + 2 + length > input.length) return null;
    const segment = input.subarray(i, i + 2 + length);
    i += 2 + length;

    if (marker === COM) continue;
    if (marker >= APP0 && marker <= 0xef && !keepApplicationSegment(marker, segment)) continue;
    if (isStartOfFrame(marker) && length >= 7) {
      height = ((segment[5] as number) << 8) | (segment[6] as number);
      width = ((segment[7] as number) << 8) | (segment[8] as number);
    }
    parts.push(segment);

    if (marker === SOS) {
      // Données compressées : jusqu'au prochain vrai marqueur (ni 0xFF00, ni redémarrage).
      const start = i;
      while (i < input.length - 1) {
        if (input[i] === 0xff) {
          const next = input[i + 1] as number;
          if (next !== 0x00 && !(next >= 0xd0 && next <= 0xd7)) break;
        }
        i++;
      }
      if (i >= input.length - 1) return null;
      parts.push(input.subarray(start, i));
    }
  }

  if (!ended || width === 0 || height === 0) return null;
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const data = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    data.set(part, offset);
    offset += part.length;
  }
  return { data, width, height };
}
