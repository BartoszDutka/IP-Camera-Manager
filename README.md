# CamManager

Aplikacja webowa do podglądu i sterowania kamerami IP (RTSP) z kategoriami, PTZ oraz audio.

## Funkcje

- Logowanie (login/hasło z pliku `.env` — nie commituj sekretów)
- Dodawanie / edycja / usuwanie kamer
- Kategorie kamer
- Podgląd na żywo (RTSP → przeglądarka przez **go2rtc**)
- Włączanie / wyciszanie audio
- Sterowanie PTZ (lewo, prawo, góra, dół, zoom) — Dahua, Hikvision, ONVIF

## Szybki start (Docker)

1. Skopiuj env:

```bash
cp .env.example .env
```

2. Plik `.env` jest już ustawiony pod produkcję:

```env
NEXT_PUBLIC_GO2RTC_URL=http://itr.igrabka.instytut:50005/go2rtc
```

3. Uruchom:

```bash
docker compose up -d --build
```

Aplikacja: http://itr.igrabka.instytut:50005  
Stream (go2rtc): http://itr.igrabka.instytut:50005/go2rtc

## Development (bez Dockera)

Potrzebujesz lokalnie działającego go2rtc (port 1984) albo zmień `GO2RTC_URL`.

```bash
npm install
npm run dev
```

## Dodawanie kamery

URL RTSP jak w VLC, np.:

```text
rtsp://admin:MojeHaslo@192.168.103.84
```

Aplikacja rejestruje stream w go2rtc — w przeglądarce nie trzeba VLC.

## PTZ

Przy dodawaniu kamery wybierz typ:

| Typ | Kiedy |
|-----|--------|
| Dahua / Uniarch | Kamery Dahua, Uniarch, część OEM |
| Hikvision | Kamery Hikvision / HiLook |
| ONVIF | Kamery z włączonym ONVIF PTZ |
| Bez PTZ | Tylko podgląd |

## Bezpieczeństwo

- `.env` jest w `.gitignore`
- Na GitHub wrzucaj tylko `.env.example`
- Zmień `AUTH_SECRET` i hasło przed produkcją
- RTSP z hasłem w URL jest przechowywany lokalnie w `data/store.json` (volume Dockera)

## Reverse proxy (domena)

Przykład Nginx:

- `/` → `cam-manager:3000`
- `/go2rtc/` → `cam-go2rtc:1984` (WebSocket też!)

Potem ustaw:

```env
NEXT_PUBLIC_GO2RTC_URL=https://twojadomena.pl/go2rtc
```
