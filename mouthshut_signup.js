/**
 * Playwright Automation Script for Mouthshut.com User Registration / Sign-Up
 *
 * Credentials:
 *   - Username: sameerapple
 *   - Password: Khira@12
 *   - Email: sameertest@merepost.com
 *
 * Features:
 *   - Automatic form filling with multi-strategy selector fallbacks
 *   - Smart Dual-Mode CAPTCHA Handling (type in browser OR type in terminal)
 *   - Visual CAPTCHA highlighting and screenshot capture
 *   - Interactive OTP prompt with "Resend OTP" (type 'r' to resend)
 *   - On-screen error & validation diagnostics
 *   - Step-by-step screenshots in ./screenshots/
 */

const { chromium } = require('playwright');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// --- Configuration & Credentials ---
const CONFIG = {
  baseUrl: 'https://www.mouthshut.com/signup/login/login_now.php',
  fallbackUrl: 'https://www.mouthshut.com',
  credentials: {
    username: process.env.MS_USERNAME || 'sameerapple',
    password: process.env.MS_PASSWORD || 'Khira@12',
    email: process.env.MS_EMAIL || 'sameertest@merepost.com',
    gender: 'male',
    country: 'India'
  },
  headless: process.env.HEADLESS === 'true', // Default to headed so you can see live browser
  slowMo: 100,
  timeout: 60000,
  screenshotsDir: path.join(__dirname, 'screenshots'),
  isDryRun: process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true'
};

// Helper: Ask user input in CLI
function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Helper: Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Helper: Dismiss annoying promotional/notification modals
async function dismissPopups(page) {
  const dismissSelectors = [
    'button:has-text("No Thanks")',
    'a:has-text("No Thanks")',
    'button:has-text("Close")',
    'a:has-text("Close")',
    'button:has-text("Later")',
    '#btnClose',
    '.close-btn',
    '.modal .close',
    '[aria-label="Close"]',
    'img[src*="close"]'
  ];

  for (const selector of dismissSelectors) {
    try {
      const btn = await page.$(selector);
      if (btn && (await btn.isVisible())) {
        console.log(`ℹ️ Dismissing popup/banner using selector: ${selector}`);
        await btn.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(500);
      }
    } catch {}
  }
}

// Helper: Fill input with multiple fallback selectors
async function fillWithFallback(page, selectors, value, fieldName) {
  let filled = false;
  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 })) {
        await el.click();
        await el.fill('');
        await el.pressSequentially(value, { delay: 40 });
        console.log(`✅ [${fieldName}] filled successfully using selector: "${selector}"`);
        filled = true;
        break;
      }
    } catch {}
  }

  if (!filled) {
    console.warn(`⚠️ [${fieldName}] could not be found with default selectors.`);
  }
  return filled;
}

// Helper: Click element with fallback selectors
async function clickWithFallback(page, selectors, elementName) {
  let clicked = false;
  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 })) {
        await el.click();
        console.log(`✅ Clicked [${elementName}] using selector: "${selector}"`);
        clicked = true;
        break;
      }
    } catch {}
  }
  return clicked;
}

// Helper: Scan page for error messages or validation warnings
async function checkPageErrors(page) {
  const errorSelectors = [
    '.error',
    '.alert-danger',
    '.errormsg',
    '.validation-summary-errors',
    'span[id*="err" i]',
    'label[id*="err" i]',
    'div[id*="err" i]',
    '.text-danger'
  ];

  const foundErrors = [];
  for (const sel of errorSelectors) {
    try {
      const els = await page.$$(sel);
      for (const el of els) {
        if (await el.isVisible()) {
          const text = (await el.innerText()).trim();
          if (text && text.length > 1 && !foundErrors.includes(text)) {
            foundErrors.push(text);
          }
        }
      }
    } catch {}
  }

  return foundErrors;
}

// Helper: Handle CAPTCHA with dual-mode (Browser manual entry OR terminal prompt)
async function handleCaptcha(page) {
  const captchaImgSelectors = [
    'img[src*="JpegImage" i]',
    '#imgCaptcha',
    'img[src*="captcha" i]',
    'img[id*="Captcha" i]'
  ];
  const captchaInputSelectors = [
    '#txtCaptcha',
    '#txtcaptcha',
    '#txtCode',
    'input[name*="captcha" i]',
    'input[placeholder*="captcha" i]',
    'input[placeholder*="enter code" i]'
  ];

  let captchaImgEl = null;
  for (const sel of captchaImgSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      captchaImgEl = el;
      break;
    }
  }

  if (!captchaImgEl) {
    console.log('ℹ️ No visual CAPTCHA detected on this page.');
    return;
  }

  console.log('\n🔒 Visual CAPTCHA detected on MouthShut registration page!');

  // Highlight the CAPTCHA image with a glowing border in browser
  await captchaImgEl.evaluate((node) => {
    node.style.border = '4px solid #ef4444';
    node.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.7)';
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }).catch(() => {});

  // Save screenshot of CAPTCHA image
  const captchaImgPath = path.join(CONFIG.screenshotsDir, 'captcha_image.png');
  await captchaImgEl.screenshot({ path: captchaImgPath }).catch(() => {});
  console.log(`📸 CAPTCHA cropped image saved to: ${captchaImgPath}`);

  // Find CAPTCHA input field and highlight it
  let captchaInputEl = null;
  for (const sel of captchaInputSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
      captchaInputEl = el;
      await el.evaluate((node) => {
        node.style.border = '2px solid #10b981';
        node.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.5)';
      }).catch(() => {});
      await el.focus().catch(() => {});
      break;
    }
  }

  console.log('\n-----------------------------------------------------------');
  console.log('👉 YOU CAN SOLVE THE CAPTCHA IN TWO WAYS:');
  console.log('   1. Type the letters into the active Chrome browser window');
  console.log('   2. OR enter the letters into this terminal prompt below');
  console.log('-----------------------------------------------------------');

  // Check if user already typed in browser or wants to type via terminal
  const userEnteredInCli = await promptUser('👉 Enter CAPTCHA characters (or press Enter if typed in browser): ');

  if (userEnteredInCli && captchaInputEl) {
    await captchaInputEl.fill(userEnteredInCli);
    console.log(`✅ Filled CAPTCHA from terminal: "${userEnteredInCli}"`);
  } else if (captchaInputEl) {
    const val = await captchaInputEl.inputValue().catch(() => '');
    console.log(`✅ Value in CAPTCHA input field: "${val}"`);
  }
}

async function runSignUp() {
  ensureDir(CONFIG.screenshotsDir);

  console.log('====================================================');
  console.log('🚀 Starting Mouthshut.com Registration Automation');
  console.log('====================================================');
  console.log(`👤 Username : ${CONFIG.credentials.username}`);
  console.log(`📧 Email    : ${CONFIG.credentials.email}`);
  console.log(`🔒 Password : ${CONFIG.credentials.password.replace(/./g, '*')}`);
  console.log(`🖥️  Mode     : ${CONFIG.headless ? 'Headless' : 'Headed (Visual Browser)'}`);
  console.log('====================================================\n');

  let browser;
  try {
    browser = await chromium.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--start-maximized'
      ]
    });
  } catch (err) {
    if (err.message && err.message.includes("Executable doesn't exist")) {
      console.warn('⚠️ Notice: Playwright browser binaries are not installed in this environment.');
      console.warn('👉 To run with the live browser on your computer:');
      console.warn('     1. npx playwright install chromium');
      console.warn('     2. node mouthshut_signup.js\n');
      return;
    }
    throw err;
  }

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'en-US',
    permissions: ['geolocation']
  });

  const page = await context.newPage();
  page.setDefaultTimeout(CONFIG.timeout);

  try {
    // 1. Navigate to MouthShut Registration
    console.log(`🌐 Navigating to ${CONFIG.baseUrl}...`);
    try {
      await page.goto(CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    } catch (err) {
      console.warn(`⚠️ Direct navigation slow or redirected: ${err.message}. Trying homepage...`);
      await page.goto(CONFIG.fallbackUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    }

    await page.waitForTimeout(2000);
    await dismissPopups(page);

    await page.screenshot({ path: path.join(CONFIG.screenshotsDir, '01_signup_page.png') });

    // 2. Open Signup Modal if on homepage
    const isModalNeeded = !(await page.$('input[type="password"]'));
    if (isModalNeeded) {
      console.log('🔍 Looking for Sign Up trigger on page...');
      const openSignUpSelectors = [
        'a:has-text("Sign In / Sign Up")',
        'button:has-text("Sign In / Sign Up")',
        'a:has-text("Sign Up")',
        '#signbtn',
        'a[href*="signup"]'
      ];
      await clickWithFallback(page, openSignUpSelectors, 'Sign In / Sign Up button');
      await page.waitForTimeout(1500);

      const tabSelectors = [
        'a:has-text("Sign Up")',
        'button:has-text("Sign Up")',
        'a:has-text("Register")',
        '#tabSignup',
        'a:has-text("Create my account")'
      ];
      await clickWithFallback(page, tabSelectors, 'Sign Up Tab');
      await page.waitForTimeout(1000);
    }

    await dismissPopups(page);

    // 3. Fill Username
    console.log('\n📝 Filling registration form fields...');
    const usernameSelectors = [
      '#txtUserName',
      '#txtusername',
      '#txtUser',
      'input[name*="username" i]',
      'input[placeholder*="Username" i]',
      'input[placeholder*="MouthShut ID" i]'
    ];
    await fillWithFallback(page, usernameSelectors, CONFIG.credentials.username, 'Username');

    // 4. Fill Email
    const emailSelectors = [
      '#txtEmail',
      '#txtemail',
      'input[type="email"]',
      'input[name*="email" i]',
      'input[placeholder*="Email" i]'
    ];
    await fillWithFallback(page, emailSelectors, CONFIG.credentials.email, 'Email Address');

    // 5. Fill Password
    const passwordSelectors = [
      '#txtPassword',
      '#txtpassword',
      'input[name*="password" i]',
      'input[type="password"]'
    ];
    await fillWithFallback(page, passwordSelectors, CONFIG.credentials.password, 'Password');

    // 6. Fill Confirm Password
    const confirmPasswordSelectors = [
      '#txtCPassword',
      '#txtcpassword',
      '#txtConfirmPassword',
      'input[placeholder*="Confirm Password" i]'
    ];
    await fillWithFallback(page, confirmPasswordSelectors, CONFIG.credentials.password, 'Confirm Password');

    // 7. Select Gender & Country
    const genderSelectors = ['#rdoMale', '#rbMale', 'input[value="Male" i]', 'label:has-text("Male")'];
    await clickWithFallback(page, genderSelectors, 'Gender (Male)');

    try {
      const countrySelect = page.locator('select[name*="country" i], #ddlCountry').first();
      if (await countrySelect.isVisible({ timeout: 1500 })) {
        await countrySelect.selectOption({ label: CONFIG.credentials.country }).catch(() => {});
      }
    } catch {}

    // 8. Accept Terms
    const termsSelectors = ['#chkTerms', '#chkAgree', 'input[type="checkbox"]'];
    for (const selector of termsSelectors) {
      try {
        const chk = page.locator(selector).first();
        if (await chk.isVisible({ timeout: 1000 })) {
          if (!(await chk.isChecked())) {
            await chk.check();
          }
          break;
        }
      } catch {}
    }

    // 9. Handle Visual CAPTCHA
    await handleCaptcha(page);

    await page.screenshot({ path: path.join(CONFIG.screenshotsDir, '02_form_filled.png') });

    // 10. Submit Form
    console.log('\n🚀 Submitting the registration form...');
    const submitBtnSelectors = [
      '#btnSubmit',
      '#btnRegister',
      '#btnSignUp',
      'button:has-text("Submit")',
      'button:has-text("Sign Up")',
      'a:has-text("Create my account")',
      'input[type="submit"]'
    ];
    await clickWithFallback(page, submitBtnSelectors, 'Submit Button');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(CONFIG.screenshotsDir, '03_post_submit.png') });

    // Check for on-screen errors
    const errors = await checkPageErrors(page);
    if (errors.length > 0) {
      console.warn('\n⚠️ Alert / Validation message on page:');
      errors.forEach((e) => console.warn(`   ❌ ${e}`));
    }

    // 11. OTP Verification Flow with Resend Support
    console.log('\n🔍 Handling OTP Verification...');
    const otpInputSelectors = [
      '#txtOTP',
      '#txtOtp',
      '#txtEmailOTP',
      '#txtMobileOTP',
      'input[placeholder*="OTP" i]',
      'input[placeholder*="4-digit" i]',
      'input[placeholder*="6-digit" i]'
    ];

    let otpResolved = false;
    while (!otpResolved) {
      let otpInput = null;
      for (const sel of otpInputSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          otpInput = el;
          break;
        }
      }

      if (otpInput) {
        console.log(`\n📩 OTP screen active for: ${CONFIG.credentials.email}`);
        console.log('Options:');
        console.log('  - Enter your 4-digit/6-digit OTP code');
        console.log("  - Type 'r' or 'resend' to trigger Resend OTP");
        console.log("  - Type 'exit' to quit");

        const userInput = await promptUser('\n👉 Enter OTP (or "r" to resend): ');

        if (userInput.toLowerCase() === 'r' || userInput.toLowerCase() === 'resend') {
          console.log('🔄 Triggering "Resend OTP" on page...');
          const resendSelectors = [
            'a:has-text("Resend OTP")',
            'button:has-text("Resend OTP")',
            'a:has-text("Re-send OTP")',
            '#btnResendOTP',
            '#lnkResend'
          ];
          await clickWithFallback(page, resendSelectors, 'Resend OTP Link');
          await page.waitForTimeout(2000);
          console.log('✅ Resend request sent. Please recheck your inbox and spam folder.');
        } else if (userInput.toLowerCase() === 'exit') {
          break;
        } else if (userInput) {
          await otpInput.fill(userInput);
          console.log(`✅ Filled OTP: ${userInput}`);

          const verifyBtnSelectors = [
            '#btnVerify',
            '#btnSubmitOTP',
            'button:has-text("Verify")',
            'button:has-text("SUBMIT")',
            'input[value*="Verify" i]'
          ];
          await clickWithFallback(page, verifyBtnSelectors, 'Verify OTP Button');
          await page.waitForTimeout(3000);
          otpResolved = true;
        }
      } else {
        break;
      }
    }

    // 12. Final Status & Screenshot
    const finalScreenshot = path.join(CONFIG.screenshotsDir, '05_final_result.png');
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    console.log(`\n📸 Final screenshot saved: ${finalScreenshot}`);

    console.log('\n====================================================');
    console.log('🎉 Registration Process Completed!');
    console.log('====================================================');

    if (!CONFIG.headless) {
      console.log('⏳ Browser will remain open for 15s...');
      await page.waitForTimeout(15000);
    }
  } catch (error) {
    console.error(`\n❌ Error during execution: ${error.message}`);
    await page.screenshot({ path: path.join(CONFIG.screenshotsDir, 'error_state.png') }).catch(() => {});
  } finally {
    if (browser) await browser.close();
  }
}

if (require.main === module) {
  runSignUp().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { runSignUp, CONFIG };
