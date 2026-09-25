import { describe, it, expect } from 'vitest';
import { buildContentDispositionHeader } from '@/lib/documents/content-disposition';

describe('buildContentDispositionHeader', () => {
  it('passes plain ASCII filenames through unchanged', () => {
    expect(buildContentDispositionHeader('passport.pdf')).toBe(
      "attachment; filename=\"passport.pdf\"; filename*=UTF-8''passport.pdf"
    );
  });

  it('strips characters that would break the quoted filename param', () => {
    const header = buildContentDispositionHeader('weird"name\\.pdf');
    expect(header).not.toContain('"weird"name');
    expect(header).toContain("filename*=UTF-8''weird%22name%5C.pdf");
  });

  it('produces a header value usable by the Headers constructor for non-Latin-1 filenames', () => {
    const header = buildContentDispositionHeader('relevé 😀.pdf');
    expect(() => new Headers({ 'Content-Disposition': header })).not.toThrow();
  });

  it('encodes accented characters in the UTF-8 extended parameter', () => {
    const header = buildContentDispositionHeader('relevé.pdf');
    expect(header).toContain(`filename*=UTF-8''${encodeURIComponent('relevé.pdf')}`);
  });
});
