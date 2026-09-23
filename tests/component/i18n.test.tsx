// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import frMessages from '../../messages/fr.json';
import enMessages from '../../messages/en.json';

function TitleProbe() {
  const t = useTranslations();
  return <h1>{t('home.title')}</h1>;
}

describe('i18n messages', () => {
  it('renders the French title', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={frMessages}>
        <TitleProbe />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading')).toHaveTextContent(frMessages.home.title);
  });

  it('renders the English title', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <TitleProbe />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading')).toHaveTextContent(enMessages.home.title);
  });

  it('keeps French and English message keys in sync', () => {
    function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
      return Object.entries(obj).flatMap(([key, value]) =>
        typeof value === 'object' && value !== null
          ? flatten(value as Record<string, unknown>, `${prefix}${key}.`)
          : [`${prefix}${key}`]
      );
    }
    expect(flatten(frMessages).sort()).toEqual(flatten(enMessages).sort());
  });
});
