import express from 'express';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config(); // Automatycznie ładuje plik .env z głównego katalogu projektu

const apiKey = process.env.VITE_API_KEY || process.env.REACT_APP_API_KEY || process.env.GEMINI_API_KEY || null;
//const apiVersion = "gemini-3.5-flash-lite";
//const apiVersion = "gemini-flash-latest";
const apiVersion = "gemini-2.5-flash";

const app = express();
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${apiVersion}:streamGenerateContent?alt=sse`;
    let response;

    // Prosta, czytelna pętla ponawiająca próby w razie przeciążenia (maksymalnie 3 podejścia)
    for (let i = 3; i >= 0; i--) {
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                body: JSON.stringify(req.body)
            });

            // Jeśli zapytanie przeszło pomyślnie lub błąd NIE JEST przeciążeniem (503), przerywamy pętlę
            if (response.ok || response.status !== 503 || i === 0) break;

            console.warn(`Google API przeciążone (503). Ponawiam próbę... (Pozostało prób: ${i})`);
            await new Promise(r => setTimeout(r, 1500));
        } catch (err) {
            if (i === 0) throw err;
            console.warn(`Błąd sieciowy. Ponawiam próbę... (Pozostało prób: ${i})`);
            await new Promise(r => setTimeout(r, 1500));
        }
    }

    try {
        if (!response.ok) {
            const errorJson = await response.json();
            return res.status(response.status).json(errorJson);
        }

        // Nagłówki wyłączające buforowanie i zapewniające płynny strumień danych
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        // Przekierowanie strumienia bezpośrednio do zaktualizowanego frontendu
        Readable.fromWeb(response.body).pipe(res);

    } catch (error) {
        console.error("Błąd krytyczny serwera:", error);
        res.status(500).json({ error: { message: "Wystąpił wewnętrzny błąd serwera." } });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🤖 Serwer proxy działa na porcie ${PORT}`));