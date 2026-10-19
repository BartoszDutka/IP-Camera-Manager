# CamManager

CamManager is a web application for monitoring and controlling RTSP-based IP cameras. It provides camera categories, live browser playback, audio controls, and PTZ support in one dashboard.

## Features

- Admin authentication configured through environment variables
- Add, edit, and remove cameras
- Organize cameras into categories
- Convert RTSP streams for browser playback through **go2rtc**
- Enable or mute camera audio
- PTZ controls for Dahua, Hikvision, and ONVIF-compatible cameras

## Screenshots

### Camera dashboard

![CamManager dashboard](docs/screenshots/dashboard.svg)

### Add camera form

![Add camera form](docs/screenshots/add-camera.svg)

## Quick start with Docker

1. Create a local environment file from the example:

```bash
cp .env.example .env
```

2. Configure the go2rtc URL for your environment. Do not commit `.env` or real credentials.

```env
NEXT_PUBLIC_GO2RTC_URL=http://localhost:1984
```

3. Build and start the application:

```bash
docker compose up -d --build
```

The application is then available at `http://localhost:3000` unless your deployment overrides the port.

## Local development

Run go2rtc locally on port `1984`, or update `NEXT_PUBLIC_GO2RTC_URL` to point to an existing instance.

```bash
npm install
npm run dev
```

## Adding a camera

Enter an RTSP URL in the same format used by VLC. Use a placeholder while documenting or testing the application:

```text
rtsp://username:your-password@camera.example.local
```

CamManager registers the stream with go2rtc, so the browser does not need VLC to display the live view.

## PTZ support

Choose the appropriate PTZ type when adding a camera:

| Type | Recommended for |
| --- | --- |
| Dahua / Uniarch | Dahua, Uniarch, and compatible OEM cameras |
| Hikvision | Hikvision and HiLook cameras |
| ONVIF | Cameras with ONVIF PTZ enabled |
| No PTZ | Cameras used for viewing only |

## Security notes

- Keep `.env` files out of version control.
- Commit only safe example configuration such as `.env.example`.
- Use a unique `AUTH_SECRET` and strong camera credentials in production.
- RTSP URLs containing credentials are stored locally by the application and should be protected accordingly.

## Reverse proxy

For an Nginx deployment, proxy the application and go2rtc separately:

- `/` -> `cam-manager:3000`
- `/go2rtc/` -> `cam-go2rtc:1984`, including WebSocket support

Then configure the public go2rtc URL:

```env
NEXT_PUBLIC_GO2RTC_URL=https://your-domain.example/go2rtc
```
