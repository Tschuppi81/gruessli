import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

// End-to-end "save a postcard": the app ships with example photos, so a fresh
// page can render and export a card immediately. Clicking "Save as PNG" must
// produce a real PNG download AND bump the "postcards created" counter.
test('saving a postcard downloads a PNG and increments the counter', async ({ page }) => {
  await page.goto('/')

  // The counter badge starts at 0 (served by the API on load).
  const badge = page.locator('#madeNum')
  await expect(badge).toHaveText('0')

  // Target by id so the test is language-agnostic (the label is localized).
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#save').click(),
  ])

  // It's offered as postcard.png and is a real PNG (magic-number check).
  expect(download.suggestedFilename()).toBe('postcard.png')
  const path = await download.path()
  const head = readFileSync(path).subarray(0, 8)
  expect([...head]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  // The save registered with the server and the badge now reads 1.
  await expect(badge).toHaveText('1')
})
