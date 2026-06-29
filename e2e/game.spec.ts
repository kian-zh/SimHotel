import { test, expect } from '@playwright/test'

test.describe('SimHotel', () => {
  test('start screen loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('酒店模拟')).toBeVisible()
    await expect(page.getByRole('button', { name: '开始游戏' })).toBeVisible()
  })

  test('can start a new game', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '开始游戏' }).click()
    await expect(page.getByRole('button', { name: '暂停' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: '新闻' })).toBeVisible()
    await expect(page.getByText('图层')).toBeVisible()
  })
})
