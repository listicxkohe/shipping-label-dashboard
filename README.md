# Shipping Label Dashboard

A simple Electron application for managing and printing Google Drive–hosted PDF shipping labels.

---

## 🖥️ Overview

This app connects to your Google Drive, lists all PDF shipping labels in a scrollable interface, and lets you:
- View and scroll through your labels
- Delete individual labels
- Print one label or batch-print them all
- Run in a frameless window with rounded corners

---

## 🚀 Features

- **Google Drive API** integration via the `googleapis` package
- **PDF printing** support with `pdf-to-printer`
- **Frameless Electron** window styled with CSS
- **Packaging** support via `electron-builder`

---

## 🛠️ Prerequisites

- **Node.js** (v14 or higher) and **npm**
- A **Google Cloud** project with the **Drive API** enabled
- A **credentials.json** file (not included—see below)

---

## 📦 Installation

1. **Clone the repo**  
   ```bash
   git clone https://github.com/your-username/shipping-label-dashboard.git
   cd shipping-label-dashboard
   ```

2. **Install dependencies**  
   _All required packages must be installed manually, as they're not checked into this repo._  
   ```bash
   npm install electron@37.2.3 electron-builder@26.0.12 googleapis@153.0.0 pdf-to-printer@5.6.0
   ```

---

## ⚙️ Configuration

Create a `credentials.json` file in the project root (this file is **NOT** included in the repo):

```json
{
  "installed": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "project_id": "YOUR_PROJECT_ID",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": [
      "http://localhost"
    ]
  }
}
```

Replace `YOUR_CLIENT_ID`, `YOUR_PROJECT_ID`, and `YOUR_CLIENT_SECRET` with values from your Google Cloud Console.

---

## ▶️ Running the App

```bash
npm start
```  

---

## 📦 Packaging for Distribution

Use **electron-builder** to generate distributables:

```bash
npx electron-builder
```

The built packages will appear in the `dist` directory.

---

## 📄 License

Distributed under the MIT License. See [LICENSE.md](LICENSE.md) for details.
