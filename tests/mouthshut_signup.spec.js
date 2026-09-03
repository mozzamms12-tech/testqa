// @ts-check
const { test, expect } = require('@playwright/test');

const USER_DATA = {
  username: process.env.MS_USERNAME || 'sameerapple',
  password: process.env.MS_PASSWORD || 'Khira@12',
  email: process.env.MS_EMAIL || 'sameertest@merepost.com',
  country: 'India'
};

test.describe('Mouthshut.com Sign Up Registration Flow', () => {
  test('should navigate to MouthShut and fill the registration form', async ({ page }) => {
    // 1. Navigate to MouthShut Registration Page
    console.log('Navigating to MouthShut signup page...');
    await page.goto('/signup/login/login_now.php', { waitUntil: 'domcontentloaded' }).catch(async () => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    });

    // 2. Dismiss any initial promotional/notification overlays
    const popupSelectors = [
      'button:has-text("No Thanks")',
      'a:has-text("No Thanks")',
      'button:has-text("Close")',
      '#btnClose',
      '.close-btn'
    ];
    for (const sel of popupSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
        await el.click().catch(() => {});
      }
    }

    // 3. Open Sign Up form if on home page
    const isFormPresent = await page.locator('input[type="password"]').first().isVisible().catch(() => false);
    if (!isFormPresent) {
      const signUpBtn = page.locator('a:has-text("Sign In / Sign Up"), a:has-text("Sign Up"), #signbtn').first();
      if (await signUpBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await signUpBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // 4. Fill in Username
    const usernameInput = page.locator('#txtUserName, #txtusername, input[name*="username" i], input[placeholder*="Username" i], input[placeholder*="MouthShut ID" i]').first();
    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    await usernameInput.fill(USER_DATA.username);
    console.log(`Filled Username: ${USER_DATA.username}`);

    // 5. Fill in Email
    const emailInput = page.locator('#txtEmail, #txtemail, input[type="email"], input[name*="email" i], input[placeholder*="Email" i]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill(USER_DATA.email);
    console.log(`Filled Email: ${USER_DATA.email}`);

    // 6. Fill in Password
    const passwordInput = page.locator('#txtPassword, #txtpassword, input[name*="password" i], input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await passwordInput.fill(USER_DATA.password);
    console.log('Filled Password');

    // 7. Fill in Confirm Password if present
    const confirmPasswordInput = page.locator('#txtCPassword, #txtConfirmPassword, input[placeholder*="Confirm Password" i]').first();
    if (await confirmPasswordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmPasswordInput.fill(USER_DATA.password);
      console.log('Filled Confirm Password');
    }

    // 8. Select Gender (Male)
    const maleRadio = page.locator('#rdoMale, #rbMale, input[value="Male" i], label:has-text("Male")').first();
    if (await maleRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
      await maleRadio.click();
      console.log('Selected Gender: Male');
    }

    // 9. Take snapshot of filled form
    await page.screenshot({ path: 'screenshots/playwright_test_form_filled.png' });

    // 10. Check if visual CAPTCHA is present
    const captchaImg = page.locator('img[src*="JpegImage" i], #imgCaptcha, img[src*="captcha" i]').first();
    const hasCaptcha = await captchaImg.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasCaptcha) {
      console.log('⚠️ Visual CAPTCHA detected. In headed mode or interactive session, solve the CAPTCHA to proceed.');
      await captchaImg.screenshot({ path: 'screenshots/captcha_detected.png' });
    }

    // 11. Agree to terms if checkbox exists
    const termsCheckbox = page.locator('#chkTerms, #chkAgree, input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible({ timeout: 1500 }).catch(() => false)) {
      if (!(await termsCheckbox.isChecked())) {
        await termsCheckbox.check();
      }
    }

    // 12. Submit form
    const submitBtn = page.locator('#btnSubmit, #btnRegister, #btnSignUp, button:has-text("Submit"), button:has-text("Sign Up"), input[type="submit"]').first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Clicking Submit button...');
      await submitBtn.click();
    }

    // 13. Wait for post-submission state / OTP prompt
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/playwright_test_post_submit.png' });

    console.log('Test step completed. Check screenshots directory for visual artifacts.');
  });
});
