# Accessibility statement

Spare Key aims to meet the **Web Content Accessibility Guidelines (WCAG) 2.2 at level AA**.

## How it is tested

- **Automatically, on every change**: axe checks every page, and the tool with a completed lookup and an open service, in light and dark themes. A failure stops the release.
- **Colour contrast**: a unit test checks every text and control colour in both themes against the 4.5:1 and 3:1 thresholds.
- **By hand**: keyboard only, browser zoom to 400%, and phone widths.

## What to expect

- Everything works with a keyboard, with a visible focus outline and a "skip to content" link.
- Form errors are announced, linked to their fields, and move focus to the first problem.
- Status messages (lookups, copying, saving) are announced to screen readers.
- The theme switch is a real switch with its state announced.
- Animations stop if your system asks for reduced motion.
- Downloaded Word documents use real headings and table headers.

## Known limitations

- Some registry and certificate details come from third-party services and are shown as they arrive.
- The Excel template uses colour to highlight risks. The risk is also written out in words in the same cell.

## Feedback

If something doesn't work for you, email hello@jharbourne.com or use the [feedback page](https://sparekey.dev/feedback). We aim to reply within five working days.
