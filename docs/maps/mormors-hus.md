# Bana 1: Mormors hus

> Status: utkast till bandesign. Motoroberoende. Siffror är startvärden för speltest, inte facit.

## Känsla i en mening
Ett varmt, lite för fullt rött trähus på landet en söndagseftermiddag. Kaffet puttrar, gökuren tickar och mormor städar. Där varje kopp har sin plats märks det direkt när något står fel, och det är hela poängen.

## Grunddata
| | |
|---|---|
| Spelare | 6–12 (bäst runt 8: 2 sökare och 6 gömmare) |
| Storlek | Liten till mellan. 7 zoner, ca 30 s att gå från ena änden till den andra |
| Gömfas | 40 s |
| Sökfas | 3 min 30 s, varav de sista 60 s är kafferepet |
| Stil | Voxel, 1 voxel = 5 cm på props och 10 cm på arkitektur |

## Planritning (översikt)

```
                         N
          ┌───────────────────────────────┐
          │         TRÄDGÅRD              │
          │  växthus   vinbär   tomtar    │
          │     ┌──────┐                  │
          │     │VERANDA│                 │
 ┌────────┴─────┴──┬───┴────┬─────────────┴──┐
 │                 │        │                │
 │   SOVRUM        │ BADRUM │   SYRUM        │
 │  säng, byrå,    │ (litet)│  symaskin,     │
 │  garderob ◄─────┼────────┼─► garn, kistor │
 │                 │        │                │
 ├──────┬──────────┴──┬─────┴───────┬────────┤
 │      │             │             │        │
 │ HALL │  VARDAGSRUM │    KÖK      │SKAFFERI│
 │(farstu)  gökur,    │  vedspis,   │        │
 │  ▲   │  gungstol,  │  kaffebord  │        │
 │  │   │  bokhylla   │      ▼      │        │
 └──┼───┴─────────────┴──────┼──────┴────────┘
    │                        │  (trappa ned)
 Sökarnas start         ┌────┴─────┐
 (busshållplatsen)      │ JORDKÄLLARE │  mörk
                        └──────────┘
```

- **Loopar:** hall → vardagsrum → kök → syrum → sovrum → hall. Det finns inga återvändsgränder förutom badrummet och skafferiet, som är små med flit (högrisk, högbelöning).
- **Två vägar ut** ur varje stort rum, så att sökare inte kan "låsa" ett rum.
- **Jordkällaren** nås bara från köket. Den är mörk, så sökarna behöver ficklampan där.
- **Trädgården** nås via verandan och sovrumsfönstret (gömmare kan hoppa ut, sökare kan klättra in långsamt).

## Rum för rum och inventarielistan

Inventarielistan är sökarens viktigaste verktyg på den här banan. Siffrorna nedan är exakt vad listan säger, så de **måste** stämma med banan.

### Hall / farstu
Trånga ytor och snabb genomgång.
| Prop | Antal | Storlek |
|---|---|---|
| Gummistövel (par) | 3 | S |
| Paraply | 2 | S |
| Hattpall | 1 | M |
| Rya-matta | 1 | M (platt) |
| Hatthylla med hatt | 4 | S |

### Vardagsrum
Det största rummet. Här finns gökuren.
| Prop | Antal | Storlek |
|---|---|---|
| Gungstol | 1 | L |
| Virkad duk | 3 | S (platt) |
| Dalahäst | 5 | S |
| Krukväxt (pelargon) | 4 | S |
| Fåtölj | 2 | L |
| Bok | 12 | S |
| Fotopall | 1 | M |
| TV (gammal tjock-TV) | 1 | L |

### Kök
Här samlas allt under kafferepet.
| Prop | Antal | Storlek |
|---|---|---|
| Kaffekopp | 8 | S |
| Kakfat | 3 | S |
| Kaffepanna | 1 | S |
| Köksstol | 6 | M |
| Brödkorg | 1 | S |
| Vedkorg | 1 | M |
| Grytlapp | 4 | S (platt) |

### Skafferi
Litet och fullt.
| Prop | Antal | Storlek |
|---|---|---|
| Syltburk | 10 | S |
| Mjölpåse | 3 | S |
| Burk med pepparkakor | 2 | S |

### Sovrum
| Prop | Antal | Storlek |
|---|---|---|
| Kudde | 4 | S |
| Väckarklocka | 1 | S |
| Byrå | 1 | L |
| Pall | 1 | M |
| Toffel (par) | 2 | S |
| Hatt-ask | 3 | M |

### Syrum
| Prop | Antal | Storlek |
|---|---|---|
| Garnnystan | 9 | S |
| Symaskin | 1 | M |
| Kista | 2 | L |
| Provdocka | 1 | L |
| Tygbal | 4 | M |

### Badrum
| Prop | Antal | Storlek |
|---|---|---|
| Handduk (vikt) | 3 | S |
| Tvålkopp | 1 | S |
| Badanka | 1 | S |
| Tvättkorg | 1 | M |

### Jordkällare (mörk)
| Prop | Antal | Storlek |
|---|---|---|
| Potatissäck | 4 | M |
| Äppellåda | 3 | M |
| Saftflaska | 6 | S |

### Trädgård och veranda
| Prop | Antal | Storlek |
|---|---|---|
| Trädgårdstomte | 5 | S |
| Vattenkanna | 2 | S |
| Blomkruka | 6 | S |
| Skottkärra | 1 | L |
| Vedklabbe | 8 | S |

**Designregel:** varje rum har minst en prop-typ med 5+ exemplar ("massgömställe") och minst en unik stor prop ("den modiga platsen").

## Prop-stats (de viktigaste)
| Prop | HP | Fart | Specialförmåga |
|---|---|---|---|
| Kaffekopp | 1 | Snabb | Kan "klirra" mot andra koppar (gratis taunt utan riktning) |
| Dalahäst | 1 | Snabb | Gungar fram (lustigt, låter lite) |
| Garnnystan | 1 | Mycket snabb (rullar) | Lämnar en tunn tråd efter sig i 5 s |
| Syltburk | 1 | Långsam | Kan "sväva" på hylla utan fysikavslöjande |
| Köksstol | 2 | Mellan | Kan stå på bordet ("mormor glömde ställa ned dem") |
| Gungstol | 3 | Långsam | Gungar av sig själv ändå, så rörelse syns mindre |
| Byrå | 4 | Mycket långsam | En lådas plats: en S-gömmare kan gömma sig *i* byrån |
| Trädgårdstomte | 2 | Mellan | Lätt att ha som lockbete (rör sig "som en tomte") |

## Mormor (NPC)

Mormor är banans stjärna. Hon är **varken gömmarens eller sökarens vän**, bara en kraft på banan.

### Beteende
1. **Promenad:** hon går en fast men slumpad rutt genom rummen och stannar 5–10 s i varje rum.
2. **Städning:** om en prop står i *fel rum* enligt inventarielistan bär hon tillbaka den.
   - Är det en riktig prop som flyttats (t.ex. av ett spöke) bär hon bara tillbaka den.
   - Är det en **gömmare** säger hon *"Nämen, vad är detta för en?"*, gömmaren lyser i 3 s och är synlig för sökarna, men dör inte. Gömmaren får "panikfart" i 2 s för att fly.
3. **Porslin:** sökare som skjuter sönder porslin (koppar, kakfat) blir utskällda: *"Akta mormors fina porslin!"* De saktas ned i 3 s och tappar poäng.
4. **Tittar inte på gömmare som står rätt.** En kaffekopp i köket ignoreras alltid.

### Varför det funkar
- Gömmare lär sig att **rätt prop i rätt rum** är säkert. Det är samma kunskap som inventarielistan ger sökarna, så båda lagen spelar på samma regelbok.
- Sökare kan följa efter mormor och hoppas att hon avslöjar någon, men hon är långsam.

### Misse (katten)
- Sover oftast i fåtöljen.
- Vaknar när en gömmare rör sig nära, går fram och **sätter sig bredvid** närmaste gömmare. Men hon sätter sig lika gärna bredvid garnnystan, så det är en ledtråd, inte ett bevis.
- Ger 5 bonuspoäng till en gömmare som lyckas ha Misse bredvid sig i 10 s utan att bli skjuten (utmärkelsen "Kattvännen").

## Banevent och tidslinje

| Tid (sökfas) | Händelse |
|---|---|
| 0:00 | Sökarna kliver av bussen och går in genom hallen |
| varje hel minut | **Gökuren slår.** Hela huset skakar 2 s. Riktiga S-props skramlar. Gömmare som trycker "skramla" inom fönstret får +2 p, och de som inte gör det står ut som helt stilla. |
| 1:00 | Mormor sätter på kaffet: kaffepannan visslar och köket blir högljutt i 15 s (bra fönster för att röra sig i köket) |
| 2:00 | Radion i vardagsrummet slås på: dansbandsmusik i 20 s döljer gömmarljud i vardagsrummet |
| 2:30 | **Kafferepet startar** (se nedan) |
| 3:30 | Slut |

### Slutevent: kafferepet (sista 60 s)
- Mormor dukar upp. **Alla kaffekoppar, kakfat och kaffepannan** i hela huset börjar vandra (på osynliga vägar) mot kaffebordet i köket.
- Gömmare som *är* koppar eller kakfat måste **antingen** följa med (de hamnar på bordet mitt framför sökarna) **eller** byta prop (kostar en byteladdning) **eller** fly (då ser man en kopp som går åt fel håll).
- "Sju sorters kakor" dyker upp på bordet. Sökare som skjuter på kakor förlorar HP dubbelt (mormor blir arg).
- Radar-ping var 15:e sekund för sökarna.

## Gömställen och siktlinjer (designregler)
- **Inga perfekta gömställen.** Varje plats ska synas från minst en vinkel en sökare naturligt går förbi.
- **Höjd:** hyllor, skåp och byrån ger höjdgömställen, men alltid åtkomliga för sökare via stol eller pall.
- **Under-ytor:** under sängen och under kaffebordet är okej, men sökarnas ficklampa lyser in dit.
- **Jordkällaren:** mörk, men bara en ingång. Den som gömmer sig där väljer att bli instängd.
- **Fönster:** sovrumsfönstret är en flyktväg. Sökaren hinner inte klättra efter (2 s), men ser vart du sprang.

## Ljud
- Golvplankor knarrar på vissa ställen (markerade med lite mörkare voxlar). Gömmare som rör sig där låter.
- Gökuren tickar konstant i vardagsrummet, vilket maskerar små ljud där.
- Rörelseljud från props skalar med storlek: kopp *klink*, stol *skrap* och byrå *dunk*.

## Visuell stil och färg
- **Palett:** falurött utvändigt med vita knutar. Inne är det ljust furu, ljusrosa och mintgröna tapeter med små blommönster, och mässing på lampor och handtag.
- **Ljus:** varmt eftermiddagsljus snett genom fönstren och dammpartiklar i ljuset. Jordkällaren är nästan helt mörk.
- **Läsbarhet:** inga props får ha egna starka färger som gör dem lättare att hitta än andra. Alla rum följer samma färgregler.
- **Detaljer som ger liv:** en fluga vid fönstret, ånga från kaffepannan, en tidning på köksbordet med en voxel-korsord.

## Balansering att testa
- Hur ofta avslöjar mormor gömmare? Mål: ca 1 gång per runda.
- Gökurens fönster: 1 s eller 2 s?
- Är jordkällaren för stark eller för svag?
- Vinner gömmarna ca 50 % av rundorna med 2 sökare mot 6 gömmare?
- Tar kafferepet för många gömmare på en gång?

## Bygga i ordning (första version)
1. Grå låda-version (blockout) av huset för att testa siktlinjer och gångtider.
2. Props i rätt antal, inventarielistan och prop-stats.
3. Gökur-eventet (enkelt och testar skramla-mekaniken).
4. Mormor: bara promenad och städning.
5. Kafferepet.
6. Misse, radio, kaffepanna, knarrande golv och full grafik.
