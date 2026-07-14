import { webkit, devices } from 'playwright'
import { readFileSync } from 'fs'
import { memoryPhotos } from './src/data/memoryPhotos.js'

const puzzleData = JSON.parse(readFileSync('./src/data/puzzle_data.json', 'utf-8'))
const results = []
const log = (label, pass, detail = '') => {
  results.push({ label, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${label}${detail ? ' | ' + detail : ''}`)
}

const iPhone = devices['iPhone 13']
const browser = await webkit.launch()
const context = await browser.newContext({ ...iPhone })
const page = await context.newPage()

const consoleErrors = []
const pageErrors = []
const failedRequests = []
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => pageErrors.push(err.message))
page.on('requestfailed', (req) => failedRequests.push(req.url()))
page.on('response', (res) => {
  if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`)
})

// --- 3. Welcome -> Puzzle -> Completion flow ---
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
const welcomeVisible = await page.isVisible('text=Begin Puzzle')
log('3a. Welcome screen shows Begin Puzzle button', welcomeVisible)

await page.getByRole('button', { name: 'Begin Puzzle' }).tap()
const puzzleVisible = await page.waitForSelector('.crossword-grid', { timeout: 3000 }).then(() => true).catch(() => false)
log('3b. Tapping Begin Puzzle navigates to puzzle screen', puzzleVisible)

// --- 4. Crossword cells render correctly ---
const playableCellCount = await page.locator('.grid-cell-input').count()
const emptyCellCount = await page.locator('.grid-cell--empty').count()
const numberedCells = await page.locator('.grid-cell-number').count()
log(
  '4. Crossword grid renders playable/empty/numbered cells',
  playableCellCount > 0 && emptyCellCount > 0 && numberedCells === puzzleData.length,
  `playable=${playableCellCount} empty=${emptyCellCount} numbered=${numberedCells} expectedClues=${puzzleData.length}`
)

// --- 5. Tapping cells highlights the active word ---
await page.tap('input[aria-label="Crossword cell row 1, column 2"]') // ADDAMS start
await page.waitForTimeout(100)
const activeWordCount = await page.locator('.grid-cell--active-word').count()
log('5. Tapping a cell highlights the active word (multiple cells)', activeWordCount === 6, `count=${activeWordCount} expected=6 (ADDAMS)`)

// --- 6. Tapping intersection toggles across/down ---
const sharedCellSel = 'input[aria-label="Crossword cell row 9, column 3"]' // PENGUIN/PHILLY
await page.tap(sharedCellSel)
const dir1 = await page.textContent('.clue-card-direction')
await page.tap(sharedCellSel)
const dir2 = await page.textContent('.clue-card-direction')
await page.tap(sharedCellSel)
const dir3 = await page.textContent('.clue-card-direction')
log(
  '6. Tapping shared intersection toggles Across/Down',
  dir1 === 'Across' && dir2 === 'Down' && dir3 === 'Across',
  `sequence=${dir1}->${dir2}->${dir3}`
)

// --- 7. Correct letters advance ---
await page.tap('input[aria-label="Crossword cell row 1, column 2"]')
await page.keyboard.press('A')
await page.waitForTimeout(100)
const advancedLabel = await page.$eval('.grid-cell--selected input', (el) => el.getAttribute('aria-label'))
log('7. Correct letter auto-advances to next cell', advancedLabel === 'Crossword cell row 1, column 3', `got=${advancedLabel}`)

// --- 8. Incorrect letters show red X and stay on same cell ---
await page.tap('input[aria-label="Crossword cell row 3, column 1"]') // HAIKU start
await page.keyboard.press('Z')
await page.waitForTimeout(100)
const stayedLabel = await page.$eval('.grid-cell--selected input', (el) => el.getAttribute('aria-label'))
const hasIncorrectMark = await page.locator('.grid-cell--incorrect .grid-cell-incorrect-mark').count()
const incorrectMarkText = hasIncorrectMark > 0 ? await page.locator('.grid-cell--incorrect .grid-cell-incorrect-mark').first().textContent() : null
log(
  '8. Incorrect letter shows red X and stays on cell',
  stayedLabel === 'Crossword cell row 3, column 1' && hasIncorrectMark >= 1 && incorrectMarkText === '✕',
  `stayed=${stayedLabel} incorrectMarks=${hasIncorrectMark} markText=${incorrectMarkText}`
)
// clean up that incorrect entry so it doesn't interfere with full-solve later
await page.keyboard.press('Backspace')

// --- 9. Picture hints open and close ---
// AZURE start (row0,col4) also belongs to ADDAMS (across), so make sure we
// actually land on the Down (AZURE) clue before checking for the hint link.
const azureCellSel = 'input[aria-label="Crossword cell row 1, column 5"]'
await page.tap(azureCellSel)
for (let attempt = 0; attempt < 3; attempt++) {
  const direction = await page.textContent('.clue-card-direction')
  if (direction === 'Down') break
  await page.tap(azureCellSel)
}
await page.waitForTimeout(100)
const hintLinkVisible = await page.isVisible('text=View picture hint')
await page.click('text=View picture hint')
const modalVisible = await page.waitForSelector('.hint-modal-overlay', { timeout: 2000 }).then(() => true).catch(() => false)
const modalImgSrc = modalVisible ? await page.$eval('.hint-modal-image', (el) => el.getAttribute('src')) : null
await page.click('.hint-modal-close')
const modalClosed = await page.waitForSelector('.hint-modal-overlay', { state: 'detached', timeout: 2000 }).then(() => true).catch(() => false)
log(
  '9. Picture hint opens (correct image) and closes',
  hintLinkVisible && modalVisible && modalImgSrc === '/hint_photos/azure_photo.jpg' && modalClosed,
  `linkVisible=${hintLinkVisible} modalVisible=${modalVisible} src=${modalImgSrc} closed=${modalClosed}`
)

// Also test tap-outside-to-close
await page.click('text=View picture hint')
await page.waitForSelector('.hint-modal-overlay')
await page.click('.hint-modal-overlay', { position: { x: 5, y: 5 } })
const modalClosedByOutsideTap = await page.waitForSelector('.hint-modal-overlay', { state: 'detached', timeout: 2000 }).then(() => true).catch(() => false)
log('9b. Tapping outside the hint modal closes it', modalClosedByOutsideTap)

// --- 10 & 12: Solve the rest, check confetti timing + no console errors ---
// Clear the earlier test letters we typed into ADDAMS so re-solving is clean
for (const word of puzzleData) {
  const startLabel = `Crossword cell row ${word.row + 1}, column ${word.col + 1}`
  await page.tap(`input[aria-label="${startLabel}"]`)
  for (let attempt = 0; attempt < 3; attempt++) {
    const direction = await page.textContent('.clue-card-direction')
    const wantDirection = word.direction === 'across' ? 'Across' : 'Down'
    if (direction === wantDirection) break
    await page.tap(`input[aria-label="${startLabel}"]`)
  }
  for (const letter of word.answer) {
    await page.keyboard.press(letter)
  }
}

const solveFinishedAt = Date.now()
await page.waitForTimeout(1000)
const stillPuzzleAt1s = await page.evaluate(() => !!document.querySelector('.puzzle-screen'))
await page.waitForSelector('.completion-screen', { timeout: 8000 })
const transitionMs = Date.now() - solveFinishedAt
log(
  '10. Confetti lasts ~5s before transition (not instant, not way off)',
  stillPuzzleAt1s && transitionMs >= 4700 && transitionMs <= 6500,
  `stillPuzzleAt1s=${stillPuzzleAt1s} transitionMs=${transitionMs}`
)

// Confirm confetti only fired once (hasCompletedRef guard) by staying on
// completion screen for a bit and making sure nothing weird re-triggers.
await page.waitForTimeout(1500)
const stillCompletion = await page.evaluate(() => !!document.querySelector('.completion-screen'))
log('10b. Stays on completion screen (no repeat trigger / bounce back)', stillCompletion)

// --- 11. Memory gallery uses only memory_photos ---
const galleryImgSrcs = await page.locator('.memory-photo-image').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('src')))
const allMemoryPhotos = galleryImgSrcs.every((src) => src.startsWith('/memory_photos/'))
log(
  '11. Gallery uses only memory_photos, all present',
  allMemoryPhotos && galleryImgSrcs.length === memoryPhotos.length,
  `srcs=${JSON.stringify(galleryImgSrcs)}`
)

// --- 13. No broken image paths (check natural width > 0 for all rendered imgs) ---
const brokenImages = await page.locator('img').evaluateAll((imgs) =>
  imgs.filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.getAttribute('src'))
)
log('13. No broken images on completion screen', brokenImages.length === 0, `broken=${JSON.stringify(brokenImages)}`)

// --- 12. Mobile width - no horizontal overflow ---
const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
log('12. No horizontal overflow at mobile width (390px)', !hasHorizontalOverflow)

// --- Console/page error check across entire flow ---
log('2. No console errors during full flow', consoleErrors.length === 0 && pageErrors.length === 0, `consoleErrors=${JSON.stringify(consoleErrors)} pageErrors=${JSON.stringify(pageErrors)}`)
log('13b. No failed network requests (broken paths)', failedRequests.length === 0, `failed=${JSON.stringify(failedRequests)}`)

await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length) {
  console.log('FAILURES:', failed.map((f) => f.label).join(', '))
  process.exit(1)
}
