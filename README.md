# Mouthshut.com Sign-Up Automation with Playwright (Node.js)

This repository contains a complete **Playwright Node.js** automation script for performing user registration / sign-up on **[Mouthshut.com](https://www.mouthshut.com)** with the requested credentials.

---

## 📋 Credentials Used

- **Username**: `sameerapple`
- **Password**: `Khira@12` *(Meets all complexity criteria: 1 uppercase, 1 lowercase, 1 number, 1 special character, min 8 chars)*
- **Email**: `sameertest@merepost.com`

---

## 🔒 Handling CAPTCHA on MouthShut

MouthShut's registration page uses an image-based visual CAPTCHA (`/SIGNUP/Login/JpegImage.aspx` / `#imgCaptcha`). The script includes **Dual-Mode CAPTCHA Handling**:

1. **Direct Entry in Browser (Headed Mode)**:
   - The script highlights the CAPTCHA image with a glowing border and focuses the input field `#txtCaptcha`.
   - You can type the letters straight into the open Chrome browser window.
2. **Terminal Prompt**:
   - The script saves a cropped image of the CAPTCHA to `./screenshots/captcha_image.png`.
   - You can type the CAPTCHA characters in your command-line prompt.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js** (v16 or higher) installed on your machine.

### 2. Installation
Install dependencies:
```bash
npm install
```

Install Playwright browser binaries:
```bash
npx playwright install chromium
```

---

## 🏃 Execution Options

### Option 1: Standalone Interactive Runner (Recommended)
This runs in **headed browser mode** so you can see the form filled in real-time, solve the CAPTCHA, and complete the OTP verification:

```bash
node mouthshut_signup.js
# or
npm run register
```

### Option 2: Headless Mode
```bash
HEADLESS=true node mouthshut_signup.js
# or
npm run register:headless
```

### Option 3: Playwright Test Runner
```bash
npx playwright test
```

---

## 🛠️ Key Features

1. **Multi-Strategy Selectors**: Resilient element detection using IDs (`#txtUserName`, `#txtEmail`, `#txtPassword`), placeholders, input types, and XPath fallbacks.
2. **Interactive CAPTCHA & OTP Assistance**:
   - Detects visual CAPTCHAs, highlights them in the browser, and saves a screenshot to `./screenshots/captcha_image.png`.
   - Provides a console prompt for OTP entry with a built-in **`r` (Resend OTP)** shortcut.
3. **Popup & Overlay Handling**: Automatically dismisses notification requests and promotional banners.
4. **Step-by-Step Screenshots**: Automatically saves screenshots at each phase to `./screenshots/`.
