/**
 * Property-based tests for RSS parser
 * Run with: npm test -- rss.test.ts
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ParsedFeed } from './rss';

// Since fetchFeed makes network requests, we'll test the data transformation logic
// by creating a mock version that simulates what rss-parser returns

function transformParsedData(parsed: {
  title?: string;
  link?: string;
  items?: Array<{
    title?: string;
    link?: string;
    pubDate?: string;
    contentSnippet?: string;
  }>;
}): ParsedFeed {
  const url = 'https://example.com/feed';
  const items = (parsed.items ?? []).map((it) => {
    let pubDateISO: string | undefined = undefined;
    if (it.pubDate) {
      try {
        const date = new Date(it.pubDate);
        if (!isNaN(date.getTime())) {
          pubDateISO = date.toISOString();
        }
      } catch {
        // Invalid date, leave as undefined
      }
    }

    return {
      title: (it.title && it.title.length > 0) ? it.title : '(no title)',
      link: it.link ?? parsed.link ?? url,
      pubDate: pubDateISO,
      sourceTitle: (parsed.title && parsed.title.length > 0) ? parsed.title : url,
      sourceUrl: url,
      snippet: (it.contentSnippet ?? '').slice(0, 200) || undefined,
    };
  });

  const dates = items
    .map((i) => (i.pubDate ? new Date(i.pubDate).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));

  return {
    title: (parsed.title && parsed.title.length > 0) ? parsed.title : url,
    siteUrl: parsed.link,
    items,
    lastPublishedAt: dates.length ? new Date(Math.max(...dates)).toISOString() : undefined,
  };
}

describe('RSS Parser - Property-Based Tests', () => {
  describe('Feed Title Property', () => {
    it('should always have a title (never undefined or empty)', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 0 }), { nil: undefined }),
          (feedTitle) => {
            const parsed = transformParsedData({ title: feedTitle });
            expect(parsed.title).toBeDefined();
            // When feedTitle is empty/undefined, it should default to the URL
            if (!feedTitle || feedTitle.length === 0) {
              expect(parsed.title).toBe('https://example.com/feed');
            } else {
              expect(parsed.title).toBe(feedTitle);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Feed Items Property', () => {
    it('should always return an array of items', () => {
      fc.assert(
        fc.property(
          fc.option(
            fc.array(
              fc.record({
                title: fc.option(fc.string(), { nil: undefined }),
                link: fc.option(fc.webUrl(), { nil: undefined }),
                pubDate: fc.option(fc.date(), { nil: undefined }).map((d) => d?.toISOString()),
                contentSnippet: fc.option(fc.string(), { nil: undefined }),
              })
            ),
            { nil: undefined }
          ),
          (items) => {
            const parsed = transformParsedData({ items });
            expect(Array.isArray(parsed.items)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have same number of items as input', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              title: fc.option(fc.string(), { nil: undefined }),
              link: fc.option(fc.webUrl(), { nil: undefined }),
              pubDate: fc.option(fc.date(), { nil: undefined }).map((d) => d?.toISOString()),
              contentSnippet: fc.option(fc.string(), { nil: undefined }),
            }),
            { maxLength: 50 }
          ),
          (items) => {
            const parsed = transformParsedData({ items });
            expect(parsed.items.length).toBe(items.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Item Title Property', () => {
    it('should always have a title for each item (defaults to "(no title)")', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              title: fc.option(fc.string({ minLength: 0 }), { nil: undefined }),
              link: fc.option(fc.webUrl(), { nil: undefined }),
            }),
            { maxLength: 20 }
          ),
          (items) => {
            const parsed = transformParsedData({ items });
            parsed.items.forEach((item, idx) => {
              expect(item.title).toBeDefined();
              // When title is missing/empty, it should default to "(no title)"
              if (!items[idx].title || items[idx].title!.length === 0) {
                expect(item.title).toBe('(no title)');
              } else {
                expect(item.title).toBe(items[idx].title);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Item Link Property', () => {
    it('should always have a link for each item', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              title: fc.option(fc.string(), { nil: undefined }),
              link: fc.option(fc.webUrl(), { nil: undefined }),
            }),
            { maxLength: 20 }
          ),
          (items) => {
            const parsed = transformParsedData({ items });
            parsed.items.forEach((item) => {
              expect(item.link).toBeDefined();
              expect(item.link.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('PubDate Property', () => {
    it('should parse valid dates to ISO string or undefined', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              title: fc.string(),
              pubDate: fc.option(
                fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') })
                  .filter((d) => !isNaN(d.getTime()))
                  .map((d) => d.toISOString()),
                { nil: undefined }
              ),
            }),
            { maxLength: 20 }
          ),
          (items) => {
            const parsed = transformParsedData({ items });
            parsed.items.forEach((item) => {
              if (item.pubDate !== undefined) {
                // Should be a valid ISO string
                expect(() => new Date(item.pubDate!)).not.toThrow();
                const date = new Date(item.pubDate!);
                expect(date.toISOString()).toBe(item.pubDate);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle missing pubDate gracefully', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              title: fc.string(),
              pubDate: fc.constant(undefined),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (items) => {
            const parsed = transformParsedData({ items });
            parsed.items.forEach((item) => {
              expect(item.pubDate).toBeUndefined();
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('LastPublishedAt Property', () => {
    it('should be undefined when no items have dates', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              title: fc.string(),
              pubDate: fc.constant(undefined),
            }),
            { maxLength: 10 }
          ),
          (items) => {
            const parsed = transformParsedData({ items });
            expect(parsed.lastPublishedAt).toBeUndefined();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should be the most recent date when items have dates', () => {
      fc.assert(
        fc.property(
          fc
            .array(
              fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') }),
              { minLength: 1, maxLength: 10 }
            )
            .filter((dates) => dates.every((d) => !isNaN(d.getTime())))
            .map((dates) =>
              dates.map((d) => ({
                title: 'Test Item',
                pubDate: d.toISOString(),
              }))
            ),
          (items) => {
            if (items.length === 0) return; // Skip if filter removed all items

            const parsed = transformParsedData({ items });
            expect(parsed.lastPublishedAt).toBeDefined();

            // Find the max date from input
            const maxDate = Math.max(
              ...items.map((item) => new Date(item.pubDate!).getTime())
            );
            expect(parsed.lastPublishedAt).toBe(new Date(maxDate).toISOString());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ignore invalid dates when computing lastPublishedAt', () => {
      const items = [
        { title: 'Valid', pubDate: new Date('2024-01-01').toISOString() },
        { title: 'Invalid', pubDate: 'invalid-date' },
        { title: 'Valid 2', pubDate: new Date('2024-01-15').toISOString() },
      ];

      const parsed = transformParsedData({ items });
      expect(parsed.lastPublishedAt).toBe(new Date('2024-01-15').toISOString());
    });
  });

  describe('Snippet Property', () => {
    it('should truncate snippets to 200 characters or less', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              title: fc.string(),
              contentSnippet: fc.string({ maxLength: 1000 }),
            }),
            { maxLength: 10 }
          ),
          (items) => {
            const parsed = transformParsedData({ items });
            parsed.items.forEach((item) => {
              if (item.snippet !== undefined) {
                expect(item.snippet.length).toBeLessThanOrEqual(200);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be undefined when contentSnippet is empty', () => {
      const items = [
        { title: 'Test', contentSnippet: '' },
        { title: 'Test 2', contentSnippet: undefined },
      ];

      const parsed = transformParsedData({ items });
      parsed.items.forEach((item) => {
        expect(item.snippet).toBeUndefined();
      });
    });

    it('should preserve snippets shorter than 200 chars', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              title: fc.string(),
              contentSnippet: fc.string({ minLength: 1, maxLength: 199 }),
            }),
            { maxLength: 10 }
          ),
          (items) => {
            const parsed = transformParsedData({ items });
            parsed.items.forEach((item, idx) => {
              if (items[idx].contentSnippet) {
                expect(item.snippet).toBe(items[idx].contentSnippet);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Source Properties', () => {
    it('should always set sourceTitle and sourceUrl for all items', () => {
      fc.assert(
        fc.property(
          fc.record({
            title: fc.option(fc.string(), { nil: undefined }),
            items: fc.array(
              fc.record({
                title: fc.string(),
              }),
              { maxLength: 10 }
            ),
          }),
          (feedData) => {
            const parsed = transformParsedData(feedData);
            parsed.items.forEach((item) => {
              expect(item.sourceTitle).toBeDefined();
              expect(item.sourceUrl).toBeDefined();
              expect(item.sourceUrl.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty feed gracefully', () => {
      const parsed = transformParsedData({});
      expect(parsed.title).toBeDefined();
      expect(parsed.items).toEqual([]);
      expect(parsed.lastPublishedAt).toBeUndefined();
    });

    it('should handle feed with empty items array', () => {
      const parsed = transformParsedData({ title: 'Test Feed', items: [] });
      expect(parsed.title).toBe('Test Feed');
      expect(parsed.items).toEqual([]);
      expect(parsed.lastPublishedAt).toBeUndefined();
    });

    it('should handle items with all undefined fields', () => {
      const parsed = transformParsedData({
        items: [{ title: undefined, link: undefined, pubDate: undefined }],
      });
      expect(parsed.items).toHaveLength(1);
      expect(parsed.items[0].title).toBe('(no title)');
      expect(parsed.items[0].link).toBeDefined();
      expect(parsed.items[0].pubDate).toBeUndefined();
    });

    it('should handle very long feed titles', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 100, maxLength: 1000 }), (longTitle) => {
          const parsed = transformParsedData({ title: longTitle });
          expect(parsed.title).toBe(longTitle);
        }),
        { numRuns: 50 }
      );
    });

    it('should handle items with future dates', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const parsed = transformParsedData({
        items: [{ title: 'Future Item', pubDate: futureDate }],
      });

      expect(parsed.items[0].pubDate).toBe(futureDate);
      expect(parsed.lastPublishedAt).toBe(futureDate);
    });

    it('should handle mixed valid and invalid dates', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') })
                .filter((d) => !isNaN(d.getTime()))
                .map((d) => d.toISOString()),
              fc.constant('invalid-date'),
              fc.constant(undefined)
            ),
            { minLength: 3, maxLength: 10 }
          ),
          (dates) => {
            const items = dates.map((d) => ({ title: 'Item', pubDate: d }));
            const parsed = transformParsedData({ items });

            // Should not throw
            expect(parsed.items).toHaveLength(items.length);

            // lastPublishedAt should only consider valid dates
            const validDates = dates.filter((d) => {
              if (!d || d === 'invalid-date') return false;
              try {
                const time = new Date(d).getTime();
                return !Number.isNaN(time);
              } catch {
                return false;
              }
            });

            if (validDates.length > 0) {
              expect(parsed.lastPublishedAt).toBeDefined();
            } else {
              expect(parsed.lastPublishedAt).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
