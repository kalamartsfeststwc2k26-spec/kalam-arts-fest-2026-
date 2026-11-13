// PDF export represents the public results view, not drafts or private admin data.
const indiaDateTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

export function formatPdfDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : `${indiaDateTime.format(date)} IST`;
}

export function makePublishedResultsPdf(
  results,
  generatedAt = new Date(),
  watermarkDataUrl
) {
  if (!Array.isArray(results) || !results.length) {
    throw new Error('There are no published results to download.');
  }

  const ids = new Set();

  for (const row of results) {
    if (
      !row.id ||
      ids.has(row.id) ||
      row.status !== 'published' ||
      !row.published_at
    ) {
      throw new Error(
        'The results changed during download. Please try again.'
      );
    }

    ids.add(row.id);
  }

  if (
    typeof watermarkDataUrl !== 'string' ||
    !watermarkDataUrl.startsWith('data:image/png;base64,')
  ) {
    throw new Error(
      'Could not load the KALAM watermark. Please try again.'
    );
  }

  const cell = value => String(value ?? '—');

  const heading = [
    'Event',
    'Student / team',
    'Team',
    'Place',
    'Grade',
    'Points',
    'Published (IST)',
  ].map(text => ({
    text,
    bold: true,
    color: '#ffffff',
    fillColor: '#54240c',
  }));

  const body = results.map(row => [
    cell(row.event_name || 'Event'),
    cell(row.student_name || row.team_name || 'Participant not listed'),
    cell(row.team_name || '—'),
    cell(row.placement),
    cell(row.grade || '—'),
    cell(row.points),
    formatPdfDate(row.published_at),
  ]);

  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [32, 36, 32, 42],

    images: {
      kalamWatermark: watermarkDataUrl,
    },

    // The source logo is 1600 × 1000; keep its full aspect ratio and centre it.
    background: (_currentPage, pageSize) => ({
      image: 'kalamWatermark',
      width: 380,
      opacity: 0.07,
      absolutePosition: {
        x: (pageSize.width - 380) / 2,
        y: (pageSize.height - (380 * 1000 / 1600)) / 2,
      },
    }),

    info: {
      title: 'KALAM 2K26 Published Results',
      author: 'KALAM 2K26',
    },

    defaultStyle: {
      font: 'Manjari',
      fontSize: 8,
      color: '#2b1409',
    },

    footer: (currentPage, pageCount) => ({
      text: `KALAM 2K26 · Page ${currentPage} of ${pageCount}`,
      alignment: 'right',
      fontSize: 8,
      margin: [32, 0, 32, 0],
      color: '#6b5446',
    }),

    content: [
      {
        text: 'KALAM 2K26',
        fontSize: 17,
        bold: true,
        color: '#54240c',
      },
      {
        text: 'Published Results',
        fontSize: 14,
        bold: true,
        margin: [0, 3, 0, 5],
      },
      {
        text: `Generated: ${formatPdfDate(generatedAt)}   |   Results: ${results.length}`,
        fontSize: 9,
        color: '#6b5446',
        margin: [0, 0, 0, 3],
      },
      {
        text: 'Includes currently public results only. A downloaded PDF is a snapshot.',
        fontSize: 8,
        color: '#6b5446',
        margin: [0, 0, 0, 12],
      },
      {
        layout: 'lightHorizontalLines',
        table: {
          headerRows: 1,
          widths: ['*', '*', 55, 28, 28, 32, 69],
          body: [heading, ...body],
        },
      },
    ],
  };
}
