export function buildContentDispositionHeader(filename: string): string {
  const asciiFallback =
    filename.replace(/[\\"\x00-\x1f\x7f]/g, '').replace(/[^\x20-\x7e]/g, '_') || 'file';
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
