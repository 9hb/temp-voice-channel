# Temp Voice Bot

Discord bot pro automatické vytváření dočasných hlasových kanálů pro uživatele.

## Funkce

- **Automaticky vytvářené kanály**: Uživatelé mohou vytvořit vlastní hlasový kanál pomocí tlačítka
- **Personalizované kanály**: Kanály jsou pojmenovány podle uživatelů (`kanal-[username]`)
- **Rozšířená oprávnění**: Tvůrce kanálu získává speciální oprávnění (správa kanálu, prioritní mluvčí, atd.)
- **Automatické mazání**: Kanály jsou automaticky smazány 10 sekund po odchodu posledního uživatele
- **Prevence zneužití**: Uživatel nemůže vytvořit nový kanál, pokud už jeden má
- **Časové omezení**: Po smazání kanálu musí uživatel čekat 1 minutu před vytvořením nového

## Instalace

1. Naklonujte repozitář
2. Nainstalujte závislosti: `npm install`
3. Vyplňte údaje v souboru `config.json`
4. Spusťte bota: `node index.js`

## Nastavení

V souboru `config.json` můžete nakonfigurovat:

- `token`: Discord bot token
- `barva`: Barva embeddů
- `popisDesc`: Popis v embeddu
- `popisFooter`: Text v patičce embeddu
- `ikonkaFooter`: URL ikony v patičce
- `clientID`: ID aplikace (pro Discord API)
- `guildID`: ID serveru

## Použití

1. Bot po přidání na server reaguje na příkaz `!sendMessage`
2. Tento příkaz odešle zprávu s tlačítkem pro vytvoření kanálů
3. Uživatelé mohou kliknout na tlačítko a vytvořit si vlastní hlasový kanál
