import pdfMake from 'pdfmake/build/pdfmake';
import regularFontUrl from '../assets/fonts/Manjari-Regular.ttf?url';
import boldFontUrl from '../assets/fonts/Manjari-Bold.ttf?url';
import { makePublishedResultsPdf } from './publishedResultsPdfData';

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

async function preparePdfAssets() {
  // This existing public asset is bundled with the site; it is not a remote URL.
  const logoUrl = `${import.meta.env.BASE_URL}kalam-logo-college-v2.png`;

  const [regularResponse, boldResponse, logoResponse] = await Promise.all([
    fetch(regularFontUrl),
    fetch(boldFontUrl),
    fetch(logoUrl),
  ]);

  if (!regularResponse.ok || !boldResponse.ok) {
    throw new Error('Could not load the PDF fonts. Please try again.');
  }

  if (!logoResponse.ok) {
    throw new Error('Could not load the KALAM watermark. Please try again.');
  }

  const [regular, bold, logo] = await Promise.all([
    regularResponse.arrayBuffer(),
    boldResponse.arrayBuffer(),
    logoResponse.arrayBuffer(),
  ]);

  pdfMake.addVirtualFileSystem({
    'Manjari-Regular.ttf': toBase64(regular),
    'Manjari-Bold.ttf': toBase64(bold),
  });

  pdfMake.addFonts({
    Manjari: {
      normal: 'Manjari-Regular.ttf',
      bold: 'Manjari-Bold.ttf',
      italics: 'Manjari-Regular.ttf',
      bolditalics: 'Manjari-Bold.ttf',
    },
  });

  return `data:image/png;base64,${toBase64(logo)}`;
}

export async function downloadPublishedResultsPdf(results) {
  const generatedAt = new Date();
  const watermark = await preparePdfAssets();

  const document = makePublishedResultsPdf(
    results,
    generatedAt,
    watermark
  );

  // Fixed India-time date keeps the filename meaningful for the festival.
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(generatedAt);

  await pdfMake
    .createPdf(document)
    .download(`KALAM-published-results-${date}.pdf`);
}
