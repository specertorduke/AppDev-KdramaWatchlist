# 📱 SarangTV Mobile App - Setup & Running Guide

This guide walks you through running and testing the **SarangTV Mobile App** using **Expo Go** on your physical phone (iOS / Android) or in a simulator/browser.

---

## 📌 Environment & Version Compatibility Reference

> [!IMPORTANT]
> This project is explicitly pinned and verified for **Expo SDK 54** to guarantee 100% compatibility with the latest Expo Go app on the iOS App Store and Google Play Store.

| Component | Target Version | Notes |
| :--- | :--- | :--- |
| **Expo SDK** | `^54.0.37` | Compatible with Expo Go SDK 54 |
| **React Native** | `0.81.5` | Pinned by Expo SDK 54 |
| **React / React DOM** | `19.1.0` | Required peer for React Native 0.81.5 |
| **Expo Font** | `~14.0.12` | For `@expo/vector-icons` / Ionicons |
| **Node.js** | `>= 18.x` / `20.x` / `22.x` | Node runtime environment |
| **PHP (Backend)** | `>= 8.2` | Laravel API runtime |

---

## 📋 Prerequisites

1. **Node.js**: Installed on your machine.
2. **Expo Go App (SDK 54)**: Installed on your physical smartphone from the App Store (iOS) or Google Play Store (Android).
3. **Same Wi-Fi Network**: Ensure your PC and mobile device are connected to the exact same Wi-Fi connection.

---

## 🚀 Step-by-Step Instructions

### Step 1: Start the Backend API (Terminal 1)
Make sure your Laravel backend server is running so the mobile app can fetch data and authenticate users:
```bash
cd c:\xampp\htdocs\AppDev-KdramaWatchlist\backend
php artisan serve
```
> [!NOTE]
> The backend runs by default on `http://127.0.0.1:8000`.

---

### Step 2: Start the Expo Development Server (Terminal 2)
Open a new terminal window in VS Code, navigate to the `mobile` folder, and launch Expo with cache clearing:
```bash
cd c:\xampp\htdocs\AppDev-KdramaWatchlist\mobile
npx expo start --clear
```

This will display a **large QR code** and interactive keyboard shortcuts directly in your terminal.

---

### Step 3: Open on Your Smartphone (Expo Go)

#### 🍏 For iOS (iPhone):
1. Open your phone's built-in **Camera** app.
2. Point your camera at the **QR code** in the terminal.
3. Tap the yellow banner that says **"Open in Expo Go"**.

#### 🤖 For Android:
1. Open the **Expo Go** app on your phone.
2. Tap **"Scan QR code"**.
3. Scan the **QR code** shown in the terminal.

---

## 🌐 Alternative: Tunnel Mode (If Wi-Fi Blocks LAN Discovery)
If your phone fails to connect or your Wi-Fi has strict client isolation (like school/office networks), run:
```bash
npx expo start --tunnel
```
This routes the connection through a secure tunnel over the internet without needing the same local network.

---

## 🔄 Useful In-App Gestures & Shortcuts

| Action | How to Trigger |
| :--- | :--- |
| **Reload App** | Press `r` in the terminal, or shake your phone and tap **"Reload"** |
| **Developer Menu** | Shake your phone to access logs, inspector, and fast refresh settings |
| **Switch to Web** | Press `w` in the terminal to view in a browser |
| **Switch to Android Emulator** | Press `a` in the terminal |
| **Switch to iOS Simulator** | Press `i` in the terminal |
