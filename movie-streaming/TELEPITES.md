# Nocturne telepítése a saját gépedre

A legegyszerűbb út a **Docker**: nem kell külön Node.js-t, adatbázist vagy ffmpeg-et telepítened, mindent a Docker intéz.

## 1. Telepítsd a Docker Desktopot (egyszer kell)

- **Windows / Mac:** töltsd le innen: https://www.docker.com/products/docker-desktop/ , telepítsd, majd **indítsd el**. Várd meg, amíg a bálna ikon azt mutatja, hogy fut.
- **Linux:** telepítsd a Docker Engine-t és a Compose plugint a disztribúciód leírása szerint.

## 2. Töltsd le a projektet

**A) ZIP-ként (nem kell hozzá Git):**
1. Nyisd meg a GitHub-on a `kriisisfxy/FastAsyncWorldedit` tárolót.
2. Válts a `ccr-28641187-bf2jq4` ágra (branch).
3. Kattints a zöld **Code → Download ZIP** gombra, és csomagold ki.
4. A kicsomagolt mappában a **`movie-streaming`** mappa kell neked.

**B) Git-tel:**
```bash
git clone -b ccr-28641187-bf2jq4 https://github.com/kriisisfxy/FastAsyncWorldedit.git
cd FastAsyncWorldedit/movie-streaming
```

## 3. Indítás

- **Windows:** kattints duplán az `inditas.bat` fájlra a `movie-streaming` mappában.
- **Mac / Linux:** nyiss terminált a `movie-streaming` mappában, és futtasd: `./inditas.sh`
- **Vagy kézzel, bármelyik rendszeren:** `docker compose up -d --build`

Az **első indítás 3–10 percig** tart, mert letölti és felépíti a szükséges részeket. A későbbi indítások gyorsak.

Utána nyisd meg a böngészőben: **http://localhost:3000**

| Fiók | E-mail | Jelszó |
|---|---|---|
| Admin | `admin@example.com` | `ChangeMe123!` |
| Néző | `viewer@example.com` | `Viewer123!` |

Az adminfelület: **http://localhost:3000/admin**

## Leállítás és újraindítás

- **Leállítás:** `leallitas.bat` (Windows) vagy `./leallitas.sh`, illetve `docker compose down`
- **Újraindítás:** ugyanúgy, mint az indításnál. Az adatbázis, a feltöltött képek és a felhasználók **megmaradnak**.
- **Minden adat törlése és tiszta újrakezdés:** `docker compose down -v` (ez a filmeket és a fiókokat is törli!)

## Saját admin jelszó az első indítás előtt

Ha az első indítás előtt saját admin belépést szeretnél, hozz létre a `movie-streaming` mappában egy `.env` nevű fájlt ezzel a tartalommal:

```
SEED_ADMIN_EMAIL=te@pelda.hu
SEED_ADMIN_PASSWORD=ValamiErosJelszo123
```

(Ez csak az első indításkor számít, amikor az adatbázis még üres.)

## Videók hozzáadása

1. Lépj be adminként, és nyisd meg az **Admin → Movies → Add movie** oldalt (vagy szerkessz egy meglévő filmet).
2. A **Video sources** résznél válaszd a **Videa (official embed)** lehetőséget.
3. A videa.hu-n nyisd meg a videót, kattints a **Beágyazás** gombra, és másold be a kapott `<iframe …>` kódot.
4. Mentsd el. A film ezután az oldaladon belül, a Videa beágyazott lejátszójával játszható le.

Csak olyan videót adj hozzá, amelynek a közzétételére jogod van.

## Ha valami nem megy

- **„Cannot connect to the Docker daemon” / „docker: command not found”:** a Docker Desktop nem fut. Indítsd el, várj fél percet, és próbáld újra.
- **„port is already allocated” (3000):** valami más már használja a 3000-es portot. A `docker-compose.yml`-ben írd át a `"3000:3000"` sort például `"3001:3000"`-ra, és a http://localhost:3001 címet nyisd meg.
- **Naplók megtekintése:** `docker compose logs -f app`
