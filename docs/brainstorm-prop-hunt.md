# I Am a Thing – brainstorm för ett prop hunt-spel

> Arbetsdokument. Allt här är idéer att välja bland, inte beslut.

## 1. Vad gör klassisk prop hunt tråkig – och hur löser vi det?

| Problem i klassisk prop hunt | Vår lösning |
|---|---|
| Gömmare står still i 4 minuter och har tråkigt | **Risk = poäng.** Taunts, rörelse och nära-ögat-situationer ger poäng. Den som bara står still överlever men vinner sällan. |
| Sökare skjuter på allt i panik | Felaktiga skott kostar HP **och** ger gömmarna poäng ("Paranoia-bonus"). |
| "Den enda tunnan i köket" – props som inte passar | **Smälter in-mätare** för gömmaren: visar hur naturligt propen ser ut i rummet. Lär nya spelare utan tutorial. |
| Snett placerade props avslöjar direkt | Valfri **snäpp-till-yta** (propen rätar upp sig mot golv/hylla). Tar 1 s med en liten animation, så det är ett val med risk. |
| Döda gömmare har inget att göra | **Spökläge:** döda gömmare blir poltergeister som kan knacka, fälla saker och skapa avledningar. |
| Slutet blir ett utdraget letande efter sista gömmaren | **Upptrappning:** sista 60 s väcks banan (radar-ping, ljus flimrar, banevent). |
| Gömställen sökaren inte kan nå | Banregel: varje plats en prop kan nå ska sökaren kunna nå. Otillgängliga zoner är "kill volumes". |

## 2. Kärnloop

1. **Lobby → rollval.** Ca 1 sökare per 3 gömmare. Rollerna roterar varje runda.
2. **Gömfas (30–45 s).** Sökarna sitter i ett "väntrum" med något roligt att göra (t.ex. skjuta lerduvor, gissa vilka props som finns på banan).
3. **Sökfas (3–4 min).** Banevent sker med jämna mellanrum.
4. **Upptrappning (sista 60 s).** Radar, ljud blir tydligare och banans slutevent startar.
5. **Avslut.** Repris av roliga ögonblick och utmärkelser.

## 3. Mekaniker som gör det unikt

### Gömmare
- **Prop-stats:** varje prop har storlek, HP, fart och ibland en egen förmåga.
  - Boll: kan rulla snabbt men låter.
  - Lampa: kan släcka sitt eget ljus.
  - Kylskåp: mycket HP men står nästan still.
  - Klocka: tickar (dåligt) men får dubbla taunt-poäng (bra).
- **Byte under rundan:** 2–3 laddningar för att byta prop. Bytet syns och hörs som ett litet "poff".
- **Lockbete:** skapa en kopia av din prop som vandrar iväg.
- **Duo-prop:** två gömmare går ihop till en stor prop (en soffa, en flygel). En styr och en tittar runt. Det blir kaos och skratt.
- **Blockform (voxel-unikt):** bli ett enda voxelblock och smält in i en vägg eller ett golv. Du kan inte röra dig, och sökarens "knacka-på-väggen"-verktyg avslöjar dig.
- **Taunts med spänningsnivåer:** pip (1 p), visslande (3 p) eller full disco med lampor (10 p). Ju modigare, desto mer poäng.

### Sökare
- **Inventarielistan** ⭐ (en av de bästa idéerna): sökaren har ett skrivblock där det står vad rummet *ska* innehålla, t.ex. "Kök: 4 stolar, 1 kruka, 6 koppar". Hittar du 5 stolar vet du att något är fel.
  - Motdrag för gömmarna: de kan "ficka" ett original-objekt (gömma det) och ta dess plats. Då stämmer listan igen.
- **Polaroidkamera:** ta ett foto av ett rum och jämför senare med "hitta fem fel". Har något flyttat sig?
- **Färgpistol:** markera props med färg. Om en målad prop rör sig syns det.
- **Sniffhund / robotdammsugare:** ett AI-djur som springer runt och blir nyfiket nära gömmare, men luras ibland av lockbeten.
- **Knackverktyg:** knacka på väggar och golv för att hitta gömmare i blockform.
- **Skrämselgranat:** alla props inom radien "rycker till" en bråkdel av en sekund. Gömmare som inte håller sig stilla avslöjas.

### Poäng och utmärkelser (det som skapar snack efteråt)
- Gömmare får poäng för överlevnadstid, taunts, nära ögat (sökaren inom 2 m), lurade sökare (skott på lockbete) och för att vara sist kvar.
- Sökare får poäng för fångster, träffsäkerhet och snabbaste fångst.
- Utmärkelser i slutet, till exempel:
  - **"Modigaste stolen"** – flest taunts
  - **"Paranoid"** – flest felskott
  - **"Mitt framför näsan"** – längst tid inom 3 m från en sökare utan att bli upptäckt
  - **"Bästa spöket"** – flest lyckade avledningar
- **Repris från propens perspektiv:** visa sökaren som stirrar rakt på dig och sedan går därifrån.

## 4. Kvalitet och känsla

- **Spelkänsla:** förvandlingen ska vara ett konfettipoff med ljud. Props får googly eyes när de tauntar, och träffade props säger "AJ!".
- **Läsbarhet:** konsekvent voxelstil så att inga props sticker ut av fel anledning. Samma voxelstorlek överallt.
- **Ljud:** gömmarnas ljud är riktningsbaserade, och tydligheten är en designvariabel som stärks i upptrappningsfasen.
- **Fysik:** riktiga props följer fysiken (en mugg i luften faller). Gömmare som "fryser" i luften blir en avslöjande ledtråd, och det är ett medvetet skill-moment.
- **Onboarding:** Smälter in-mätaren och en "prova att gömma dig"-lobby räcker som tutorial.
- **Rättvisa:** spawn- och gömtid skalar med banans storlek, och rollerna roterar automatiskt.

## 5. Banexempel

Varje bana har ett **tema**, en **unik mekanik** och ett **slutevent**.

### 🏡 Mormors hus
Rya-mattor, dalahästar, kaffekoppar, virkade dukar och en gökur.
- **Mekanik:** Mormor (NPC) går runt och *städar*. Hon ställer tillbaka saker på "rätt" plats, och försöker hon lyfta dig blir du avslöjad. Hon kan också skälla på sökare som skjuter sönder porslin (straffpoäng).
- **Event:** gökuren slår varje minut och hela huset skakar lite. Riktiga props skramlar men gömmare gör det inte, om de inte själva trycker på "skramla".
- **Slutevent:** kafferepet. Alla koppar samlas på bordet, så kaffekoppsgömmare måste fly.

### 🛋️ Möbellabyrinten (möbelvaruhus)
Utställningsrum som ser nästan likadana ut, pilar i golvet, en restaurang, ett lager med höga hyllor och ett bollhav.
- **Mekanik:** alla riktiga props har en **prislapp**. Gömmare har det inte, men kan köpa en (kostar poäng) i "kassan".
- **Event:** högtalarutrop: *"Kan Tobbe hämtas i bollhavet?"*. Då släcks lagret i 10 s.
- **Slutevent:** stängning. Rum efter rum släcks och låses, så banan krymper mot kassorna.

### 🦕 Naturhistoriska museet om natten
Dinosaurieskelett, montrar, uppstoppade djur och planetarium.
- **Mekanik:** det är mörkt och sökarna har ficklampor. Gömmare **kan bara röra sig när de inte är belysta**, som i "statyleken".
- **Event:** planetarieshow. Hela salen blir stjärnhimmel i 15 s.
- **Slutevent:** utställningen vaknar. Riktiga montrar börjar röra sig lite, och det blir kaos för båda lagen.

### 🚀 Rymdstationen
Tyngdlöshet, verktyg, matpaket och kablar.
- **Mekanik:** allt svävar, så en svävande prop är **inte** misstänkt. Det vänder på all instinkt.
- **Event:** luftslussen öppnas i en modul och lösa props sugs mot öppningen. Gömmare måste hålla sig fast (kostar stamina).
- **Slutevent:** stationen roterar och gravitationen slås på. Allt faller.

### 🍣 Sushibandet
En restaurang med rullband, ångande kök och akvarium.
- **Mekanik:** rullbandet rör sig konstant, så gömmare som är en sushibit åker runt, syns hela tiden och är svåra att följa.
- **Event:** kocken byter ut tallrikar på bandet och kan råka plocka upp en gömmare.
- **Slutevent:** stängning. Bandet går dubbelt så fort och kocken diskar.

### 📦 Flyttdagen
Ett hus mitt i en flytt, fullt av kartonger, rullade mattor och möbler under lakan.
- **Mekanik:** flyttgubbar (NPC:er) bär **ut** props till lastbilen under hela rundan. Huset töms gradvis och gömställena blir färre, vilket ger naturlig upptrappning.
- Blir en gömmare utburen hamnar den i lastbilen och kan smita in igen om den vågar.
- **Slutevent:** lastbilen kör. Sista chansen att ta sig ut ur den.

### 🌼 Midsommarängen
Midsommarstång, jordgubbstårta, sill, snapsglas, korgar och kubbspel.
- **Mekanik:** sol och skuggor. Gömmare i skugga är svårare att se.
- **Event:** **"Små grodorna"**. Alla riktiga props börjar hoppa i takt i 20 s. Det är ett fritt fönster för gömmarna att byta plats, men den som hoppar i otakt avslöjas.
- **Slutevent:** regnet kommer. Props blir blöta och glänsande, men gömmare blir det inte.

### 🏔️ Fjällstugan i snöstorm
Stuga, vedbod, skidor och snöskoter.
- **Mekanik:** **fotspår i snön** utanför. Gömmare som rör sig ute lämnar spår som snöar igen efter ca 30 s.
- **Event:** strömavbrott. Bara brasan lyser.
- **Slutevent:** stormen tar i. Sikten utomhus går mot noll och alla måste in.

### 🪞 Spökslottet
Rustningar, porträtt, ljuskronor och speglar.
- **Mekanik:** **speglar visar gömmarnas sanna form** (spelarens avatar). Sökare kan bära med sig en handspegel med begränsade laddningar.
- **Event:** porträttens ögon följer närmaste gömmare.
- **Slutevent:** midnatt. Alla speglar spricker och slottets riktiga spöken dyker upp.

### Fler snabba idéer
- **Leksaksaffären:** spelarna är små och gömmer sig bland legobitar. Ett barn kommer in och leker.
- **Snabbköpet:** tusentals konservburkar. Sökaren kan "skanna" props i självkassan, och en gömmare ger ett felpip.
- **Biblioteket:** tyst sal där alla ljud förstärks och taunts ger dubbla poäng.
- **Skroten:** en magnetkran lyfter slumpmässiga props.
- **Modelljärnvägen:** gömmare blir hus och träd i en miniatyrvärld som tåget kör igenom.
- **Konstgalleriet:** gömmare blir tavlor eller skulpturer, och vakten går sin runda.

## 6. Spellägen (senare)
- **Klassiskt:** sökare mot gömmare.
- **Infektion:** fångade gömmare blir sökare.
- **Alla är props:** ingen sökare. Gömmarna tar fast varandra genom att peka ut "fel" prop, och felgissning kostar.
- **Kameleont:** banan byter tema mitt i rundan, från kök till rymd, och alla måste byta prop på 10 s.
- **Hitta mig:** en gömmare och resten letar. Bäst för 4–5 spelare.

## 7. Förslag på MVP (för att testa om det är kul tidigt)
1. **En bana:** Mormors hus eller Möbellabyrinten.
2. **Kärnloopen:** göm, sök, upptrappning, avslut.
3. **Gömmare:** välj prop, snäpp-till-yta, taunts med poäng och ett lockbete.
4. **Sökare:** pistol med HP-kostnad vid felskott och inventarielistan.
5. **Spökläge** för döda gömmare (enkla knack-ljud).
6. **Utmärkelser** i slutet av rundan.

Speltesta tidigt med riktiga människor och mät: *Skrattar folk? Vill de köra en runda till?*

## 8. Öppna frågor
- Plattform och motor? (webb/three.js, Godot, Unity, Roblox …)
- Online, lokalt eller båda? Antal spelare per match?
- Hur viktig är voxelstilen? Ska spelarna kunna bygga egna props eller banor?
- Målgrupp: barn/familj, kompisgäng eller streamers?
