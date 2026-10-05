# Bana 2: Spökslottet

> Status: utkast till bandesign. Motoroberoende. Siffror är startvärden för speltest.

## Känsla i en mening
Ett gammalt slott en stormig natt. Stearinljus fladdrar, rustningar står i givakt och speglarna ljuger aldrig. Det är mysrysligt, inte läskigt på riktigt: mer Scooby-Doo än skräckfilm.

## Grunddata
| | |
|---|---|
| Spelare | 8–14 (bäst runt 10: 3 sökare och 7 gömmare) |
| Storlek | Mellan till stor. Två våningar plus källare, och ett torn |
| Gömfas | 45 s |
| Sökfas | 4 min, varav de sista 60 s är midnatt |
| Stil | Voxel, samma skala som Mormors hus. Kallare palett: stengrått, mörkt trä, vinrött och guld |

## Planritning (översikt)

```
              TORNKAMMARE (vån 3, spiraltrappa)
                        │
 ┌──────────────┬───────┴───────┬───────────────┐
 │ SPEGEL-      │   GALLERIET   │   BIBLIOTEK   │  VÅNING 2
 │ GALLERIET    │  (porträtt)   │  ▓ hemlig     │
 │ (farligt!)   │               │    bokhylla   │
 └──────┬───────┴───────┬───────┴───────┬───────┘
        │ stora trappan │               │ (hemlig gång ned
 ┌──────┴───────┬───────┴───────┬───────┴───────┐  till kryptan)
 │ RUSTKAMMARE  │  STORA SALEN  │  SLOTTSKÖK    │  VÅNING 1
 │ (rustningar) │  långbord,    │  grytor,      │
 │              │  ▓ öppen spis │  slaktbänk    │
 └──────────────┴───────┬───────┴───────┬───────┘
                        │               │
              ┌─────────┴───┐   ┌───────┴───────┐
              │ BORGGÅRD /  │   │  VINKÄLLARE   │  KÄLLARE
              │ VINDBRYGGA  │   │  ─── KRYPTAN  │
              │ (sökarstart)│   │  (sarkofager) │
              └─────────────┘   └───────────────┘
   ▓ = hemlig passage
```

- **Vertikalitet** är det stora nya jämfört med Mormors hus. Stora trappan är huvudvägen, spiraltrappan till tornet en återvändsgränd, och hemliga gångar ger genvägar.
- **Hemliga passager (3 st):** den öppna spisen i stora salen leder till biblioteket, bokhyllan i biblioteket leder till kryptan, och en sarkofag i kryptan leder till borggården. De öppnas av den som hittar mekanismen och syns sedan för alla.
- **Spegelgalleriet** är banans "farliga rum": den snabbaste vägen mellan väst och öst på våning 2, men full av speglar.

## Kärnmekanik: speglarna
- **Speglar visar gömmarnas sanna form.** I en spegel ser en gömmare ut som sin spelaravatar, inte som sin prop.
- Speglar finns i spegelgalleriet (många), i stora salen (en stor) och utspridda (små handspeglar på byråer).
- **Sökarens handspegel:** 3 laddningar per runda. Den visar sanna former i en kon framför sökaren i 2 s.
- **Gömmarnas motdrag:**
  - **Lakan:** dra ett lakan över en spegel. Det tar 2 s och syns, men spegeln är "död" tills någon drar av lakanet.
  - **Spräck spegeln:** en duo-prop eller en stor prop kan välta en spegel. Det låter mycket.
  - Stå i spegelns döda vinkel. Banan har tydliga golvmönster som visar vinklarna, så det går att lära sig.

## Rum för rum och inventarielistan (kortversion)
| Rum | Typiska props (antal) | Specialare |
|---|---|---|
| Borggård | Tunna (6), hölass (2), vagnshjul (4), fackla (4) | Sökarstart. Regn och lera |
| Stora salen | Kandelaber (8), bägare (12), stol (14), tallrik (14), sköld på vägg (6) | Långbordet, den öppna spisen och den stora spegeln |
| Rustkammare | Rustning (6), sköld (8), svärdställ (3), hjälm (5) | Gömmare kan kliva *in* i en rustning |
| Slottskök | Gryta (4), kålhuvud (6), korv på krok (10), kittel (1) | Kitteln bubblar och maskerar ljud |
| Galleriet | Porträtt (10), byst (4), vas (6) | Porträtt med ögon som följer |
| Bibliotek | Bok (30), glob (1), läslampa (3), stege (2) | Hemlig bokhylla, tystnad som förstärker ljud |
| Spegelgalleriet | Spegel (12), pall (4), ljusstake (6) | Farligt för gömmare |
| Tornkammare | Teleskop (1), kista (2), fladdermus (hängande, 5) | Återvändsgränd med utsikt |
| Vinkällare | Vinfat (8), flaska (20), råtta (4) | Mörk |
| Kryptan | Sarkofag (4), dödskalle (8), ljus (10) | Mörk. En sarkofag är en hemlig gång |

## Prop-stats (urval)
| Prop | HP | Fart | Specialförmåga |
|---|---|---|---|
| Kandelaber | 1 | Mellan | Kan blåsa ut sina ljus (blir mörkare runt den) |
| Bägare | 1 | Snabb | Rullar och klingar |
| Rustning | 4 | Långsam | Kan "vakna" och gå tre steg (dess taunt är en skrammelmarsch). En S-gömmare kan gömma sig inuti |
| Porträtt | 2 | Kan inte gå, bara hoppa mellan krokar | Kan byta krok på väggen med en teleport-animation |
| Fladdermus | 1 | Mycket snabb (flyger) | Kan bara hänga i tak. Tauntar med pip |
| Dödskalle | 1 | Snabb (rullar) | Käken klapprar som taunt |
| Vinfat | 3 | Rullar nedför | Kan rulla nedför trappor med full fart |

## Slottets invånare (NPC:er)

### Vita frun
- Ett genomskinligt spöke som svävar igenom väggar på en slumpad rutt.
- När hon passerar ett rum **besätter** hon 1–2 riktiga props, som rör sig lite i 5 s. Det blir falska ledtrådar för sökarna.
- Svävar hon rakt igenom en gömmare skakar gömmaren till (en liten animation som syns) och gömmaren känner en "kall kåre" (får 2 s snabbhet). Bra eller dåligt beroende på läge.
- Ignorerar sökarna helt, och kulor går rakt igenom henne.

### Porträtten
- Porträttens ögon följer **närmaste gömmare inom 8 m**.
- **Men:** 2 av 10 porträtt är "lögnare" som alltid tittar mot närmaste *lockbete* eller *besatta prop*. Sökarna får lära sig vilka.
- Gömmare som själva är porträtt har ögon som följer sökaren. Det är både läskigt och roligt.

### Spökena (döda gömmare)
- På den här banan är spökläget **starkare**: döda gömmare kan besätta en riktig prop i 4 s (nedkylning 15 s), precis som Vita frun.
- Det ger kaos för sökarna och känns rätt för temat.

## Banevent och tidslinje
| Tid (sökfas) | Händelse |
|---|---|
| 0:00 | Vindbryggan fälls ned och sökarna springer in |
| var 40–50 s (slump) | **Blixten.** Allt lyser upp skarpt i 0,3 s och kastar skuggor. **Gömmarnas skuggor visar deras sanna form** i det ögonblicket. Gömmare som står i skugga eller inomhus utan fönster är säkra. |
| 1:30 | **Orgeln** i stora salen börjar spela av sig själv i 20 s och dränker allt ljud på våning 1 |
| 2:30 | **Draget:** en vindpust blåser ut alla stearinljus på våning 2 i 15 s. Bara sökarnas lyktor lyser |
| 3:00 | **Midnatt** (se nedan) |
| 4:00 | Slut |

### Slutevent: midnatt (sista 60 s)
- Tornklockan slår tolv slag, ett slag var 5:e sekund. Varje slag skickar en radar-puls för sökarna.
- **Alla speglar spricker** vid första slaget. Sökarnas viktigaste verktyg försvinner och gömmarna får ett andrum.
- Som motvikt **vaknar slottets spöken**: alla rustningar vänder huvudet mot närmaste gömmare (inom 6 m) i 2 s vid varje slag.
- Döda gömmare (spökena) får besätta props utan nedkylning. Det blir totalt kaos.
- Vid tolfte slaget faller den stora ljuskronan i stora salen. Gömmare under den får panikfart och fly.

## Gömställen och siktlinjer
- **Inuti saker:** rustningar, kistor och sarkofager kan rymma S-gömmare. Sökare kan knacka (ett *klang* eller ett ihåligt eko avslöjar). Varje "inuti" har max en plats.
- **Höjd:** ljuskronor (bara för fladdermöss och ljus), bokhyllor med stege och takbjälkar i köket.
- **Spegelgalleriet:** ska kännas omöjligt att gömma sig i, men har exakt tre döda vinklar för den som lär sig dem.
- **Tornet:** en återvändsgränd med ett fönster. En gömmare kan hoppa ut och "glida" ned till borggården som ett fladdrande lakan (bara en gång per runda).

## Gömda roliga saker (easter eggs)
- **En rustning med en gummikyckling** i stället för huvud. Den finns alltid men står på olika ställen varje runda.
- **Spöket som vill ha te:** på en byrå i biblioteket står en tom tekopp. Häller en spelare te i den (från köket) säger Vita frun *"Äntligen!"* och skippar ett av sina besättningsvarv.
- **Mormors porträtt som ung** hänger i galleriet, med en mammelucka i ena hörnet av tavlan. Det kopplar ihop banorna: mormors syster bor här.
- **Dödskallen Gustav** i kryptan har en liten mössa. Skjuter man på honom säger han *"Vad gör du?"* och ingen poäng dras. Han kan inte dö.
- **Fängelsehålan bakom vinkällaren** är tom, förutom ett skelett som spelar kort mot sig själv. Står man bredvid honom i 10 s delar han ut en kortlek och utmärkelsen "Patiens".
- **Biblioteksboken "Hur man gömmer sig som en bok"** ger +1 byteladdning till den som hittar den.
- **Orgeln:** står man vid den när den spelar och trycker på taunt spelar den en hemlig melodi (en dansbandslåt från mormors radio).

### Hemliga utmärkelser
- **"Spegelblank"**: gå igenom hela spegelgalleriet som gömmare utan att avslöjas.
- **"Teservitör"**: servera Vita frun te.
- **"Ridderlig"**: överlev en hel runda inuti en rustning.

## Balansering att testa
- Är speglarna för starka? Mål: spegelgalleriet ska användas som väg av ca hälften av gömmarna.
- Hur ofta ska blixten slå? Skuggregeln får inte kännas orättvis.
- Ska Vita frun ge sökare falska spår 1 eller 2 gånger per minut?
- Är den hemliga gången bibliotek → krypta för stark som flyktväg?

## Bygga i ordning (första version)
1. Blockout med tre våningar och trappor. Testa gångtider och vertikalitet.
2. Speglar och sökarens handspegel (banans kärna).
3. Hemliga passager.
4. Blixten.
5. Midnatt.
6. Vita frun, porträtten och starkare spöken.
7. Easter eggs och full grafik.
