# 📱 SarangTV Mobile App - Setup & Running Guide

This guide walks you through running and testing the **SarangTV Mobile App** using **Expo Go** on your physical phone (iOS / Android) or in a simulator/browser.

---

## 📌 Environment & Version Compatibility Reference

> [!IMPORTANT]
> This project is explicitly pinned and verified for **Expo SDK 57** to guarantee 100% compatibility with the latest Expo Go app on the iOS App Store and Google Play Store.

| Component | Target Version | Notes |
| :--- | :--- | :--- |
| **Expo SDK** | `^57.0.0` | Compatible with Expo Go SDK 57 |
| **React Native** | `0.86.3` | Pinned by Expo SDK 57 |
| **React / React DOM** | `19.2.3` | Required peer for React Native 0.86.3 |
| **Expo Font** | `~57.0.4` | For `@expo/vector-icons` / Ionicons |
| **Expo Status Bar** | `~57.0.1` | Status bar controller |
| **Node.js** | `>= 18.x` / `20.x` / `22.x` | Node runtime environment |
| **PHP (Backend)** | `>= 8.2` | Laravel API runtime |

---

## 📋 Prerequisites

1. **Node.js**: Installed on your machine.
2. **Expo Go App (SDK 57)**: Installed on your physical smartphone from the App Store (iOS) or Google Play Store (Android).
3. **Same Wi-Fi Network**: Ensure your PC and mobile device are connected to the exact same Wi-Fi connection.

---

## 🚀 Step-by-Step Instructions

### Step 1: Start the Backend API with LAN Access (Terminal 1)
Make sure your Laravel backend server is running and accessible to other devices on your Wi-Fi network:
```bash
cd c:\xampp\htdocs\AppDev-KdramaWatchlist\backend
php artisan serve --host=0.0.0.0 --port=8000
```
> [!IMPORTANT]
> The `--host=0.0.0.0` flag is essential! Without it, Laravel only listens to `127.0.0.1` on your PC and your physical phone will show a `Cannot reach the backend server` error.

---

### Step 2: Start the Expo Development Server (Terminal 2)
Open a new terminal window in VS Code, navigate to the `mobile` folder, and launch Expo:
```bash
cd c:\xampp\htdocs\AppDev-KdramaWatchlist\mobile
npx expo start --clear
```

This will display a **large QR code** and interactive keyboard shortcuts directly in your terminal.

---

### Step 3: Run on Your Preferred Device

#### 🍏 For Physical iOS (iPhone):
1. Ensure your iPhone is connected to the **same Wi-Fi** as your PC.
2. Open your iPhone's built-in **Camera** app.
3. Point your camera at the **QR code** in the terminal.
4. Tap the banner that says **"Open in Expo Go"**.

#### 🤖 For Physical Android:
1. Ensure your Android phone is connected to the **same Wi-Fi** as your PC.
2. Open the **Expo Go** app on your phone.
3. Tap **"Scan QR code"**.
4. Scan the **QR code** shown in the terminal.

#### 💻 For Web Browser:
1. In the terminal where Expo is running, simply press **`w`** on your keyboard (or open `http://localhost:8081`).
2. The web version will automatically connect to `http://localhost:8000/api/v1`.

#### 📱 For Android Emulator / iOS Simulator:
* **Android Emulator:** Press **`a`** in the terminal.
* **iOS Simulator (Mac only):** Press **`i`** in the terminal.

---

## 🌐 Troubleshooting Connection Issues

### 1. "Unable to reach the backend server"
* Check that Terminal 1 is running: `php artisan serve --host=0.0.0.0 --port=8000`.
* Check that both your PC and phone are on the **exact same Wi-Fi**.
* Ensure Windows Firewall isn't blocking incoming traffic on port 8000 (allow Apache/PHP through Private network).

### 2. Tunnel Mode (If Wi-Fi Blocks LAN Discovery)
If your Wi-Fi router has client isolation enabled (common in dorms, offices, or public hotspots):
```bash
npx expo start --tunnel
```
This proxies the Expo bundler connection over the internet.

---

## 🔄 Useful In-App Gestures & Shortcuts

| Action | How to Trigger |
| :--- | :--- |
| **Reload App** | Press `r` in the terminal, or shake your phone and tap **"Reload"** |
| **Developer Menu** | Shake your phone to access logs, inspector, and fast refresh settings |
| **Switch to Web** | Press `w` in the terminal to view in a browser |
| **Switch to Android Emulator** | Press `a` in the terminal |
| **Switch to iOS Simulator** | Press `i` in the terminal |
