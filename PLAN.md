# I Am a Thing: planen

> Arbetsplan enligt `voxelparty-kvalitet` (full process: önskan är "så bra som möjligt").
> Banans detaljer (rum, inventarielista, Mormor, banevent, easter eggs) finns i
> `docs/maps/mormors-hus.md`. Den här filen säger **hur** vi bygger, i vilken ordning och när något är klart.

## Sammanfattning
- **Målet i en mening ett barn förstår:** Vättarna förvandlar sig till saker i mormors hus och gömmer sig, och kusinerna ska hitta dem med sugkoppspistoler innan kaffet är klart.
- **Typ:** fristående Voxel Party-spel (sessioner, kompisar hoppar in och ut). 1–10 spelare, CPU:er fyller ut.
- **Kontroller:** WASD, mus för att titta och klick.
  - **Vätte:** `E` = bli saken du tittar på, `R` = lås läget, `Q` = taunt, mellanslag = hoppa.
  - **Kusin:** klick = skjut sugkoppspil, `F` = ficklampa, `Tab` = inventarielistan.
- **Vad som gör prop hunt bra** (pelare):
  1. **Spänningen när någon går förbi dig.** Att stå still som en kopp medan en kusin tittar rakt på dig.
  2. **Att se fel.** Sökaren vinner genom att märka att något inte stämmer, inte genom att skjuta på allt.
  3. **Skratt.** En sko som springer, en byrå som tauntar och en kopp som klirrar i fel ögonblick.
  4. **Korta rundor och rollbyte**, så alla får både gömma sig och leta.
  5. **En plats man känner igen.** Mormors hus ska kännas som ett riktigt hus där varje sak har sin plats.
- **Vad vi inte gör (än), och varför:**
  - Bara **en bana** tills den är färdig och rolig. Spökslottet kommer sedan.
  - Inga egna banor eller props byggda av spelarna.
  - Ingen röstchatt; taunts och synthröster med textning räcker.

## 1. De första 90 sekunderna
1. **0–5 s:** titelkortet. Kameran glider sakta genom köksfönstret, där kaffepannan puttrar och gökuren tickar. Text: "I Am a Thing".
2. **5–10 s:** du är en **vätte**, en liten grå husande med röd luva, i hallen. En knapp-ruta visar `E: bli en sak`. Klockan visar 0:40 gömtid. Musiken är en lugn vals på synth-dragspel.
3. **10–25 s:** du springer in i köket. Saker du tittar på får en tunn kontur. Du trycker `E` på en kaffekopp, det blir ett **poff** med små voxel-konfetti, och nu är du en kopp. **Smälter in-mätaren** blir grön: "Koppar hör hemma här".
4. **25–40 s:** du rullar upp på kaffebordet bredvid de andra kopparna och trycker `R` (lås). Koppen rätar upp sig med ett litet *klink*. Gömtiden tickar ned och bussen hörs tuta utanför.
5. **40–50 s:** dörren slår upp och två **kusiner** springer in med sugkoppspistoler. Musiken byter till smygande pizzicato. Du ser dem i tredje person från din kopp.
6. **50–70 s:** en kusin går runt bordet och stannar. Hen skjuter på kakfatet bredvid dig: *plopp*. Pilen fastnar, kusinen tappar lite HP och en "Fel!"-ruta poppar upp. Du får **+2 nära-ögat** som ett litet tecken i hörnet.
7. **70–80 s:** gökuren slår. Hela huset skakar och alla riktiga koppar skramlar. Du trycker `Q` i tid och skramlar med (+2 p). Kusinen har ingen aning.
8. **80–90 s:** kusinen går mot skafferiet. Du låser upp, rullar ned under bordet och hörs bara som ett tyst *klink*. Hjärtat dunkar.

## 2. Kvalitetsribban
De fem testen från `voxelparty-kvalitet` §4 gäller, med de här tilläggen:
1. **Bildtestet:** varje fotopunkt har himmel och trädgård genom ett fönster (moln, ladans tak och björkar), väggar med djup (fönsterbänkar, lister och skåpluckor), något i förgrunden, en ljuskälla som drar blicken (fönstret, taklampan eller vedspisen) och en berättardetalj (lappar, korsord eller teckningar på kylen).
   - **Mätt:** högst 85 % nästan-svart i övre tredjedelen; tre ljusnivåer på minst 10 % var; de ljusaste 1 % ska vara lampor eller fönster; ingen ljus fläck över 3 %; högst två signalfärger.
   - Siffrorna kalibreras mot den look du väljer i fas 0.
2. **Tresekunderstestet:** en ny spelare kan säga "jag är i mormors kök", "kusinen med pistolen är farlig" och "dörren dit ljuset kommer ifrån leder vidare".
3. **Känslotestet:** allt reagerar på samma bildruta.
   - **Förvandling:** poff, konfetti, ljud, squash och kameran zoomar ut till tredje person.
   - **Skott:** rekyl, pilen syns i luften, *plopp*, och pilen fastnar på det den träffar.
   - **Fel träff:** kusinen rycker till, HP-mätaren blinkar rött och ett surt *bonk*.
   - **Rätt träff:** saken hoppar upp, vätten trillar ut med stjärnor runt huvudet och ett "Tagen!".
   - **Gökuren:** tick som blir högre, kameran skakar, alla koppar skramlar och ett *ko-ko*.
4. **Jämförelsetestet:** före och efter sida vid sida vid varje ändring.
5. **Ditt test:** "vill du spela en runda till, nu direkt?"

**Stilreferenser** (bara namn): svenska 1970-talskök, Carl Larssons interiörer, Wes Anderson-symmetri och mysig voxel-diorama.

## 3. Teknisk grund
- **Världen:** 1 enhet = 1 meter. Huset är en `Volume` med 1/8 m voxlar (väggar, golv, tak, fönsteröppningar och lister), meshad i delar per rum. Lösa saker (koppar, stolar och dalahästar) är kit-modeller i 1/16 m, byggda en gång per sort och sedan kopierade.
- **Ljusbudget:**
  - Solen från stagen, låg genom fönstren.
  - **Blockljus** för taklampor, fönsterljus och vedspisen, i dimmergrupper: grupp 1 taklampor, grupp 2 vedspisens fladder och grupp 3 fönsterglöd (gökur-blink, strömavbrott).
  - **Riktiga ljus:** kusinens ficklampa (spot, skugga, används i källaren) och ett mynningsblink. Max 8, max 2 med skugga.
- **Prestanda:** under 300 draw calls, 60 fps på en laptop och `vp check --long` utan ⚠.
- **Återanvänt:** `--fps`-mallens rörelse, `VoxelGrid` för kollision, `NavGrid` för CPU:er och hitscan-netcode.
- **Nyskrivet:** allt utseende, karaktärerna, förvandlingen och prop-reglerna.

## 4. Konstbibel
### Palett
| Roll | Färg | Var |
|---|---|---|
| Vägen | `#ffcf6e` varmt lampgult | tända dörröppningar, taklampor, ljuset från fönstret |
| Trygghet | `#9fd3b0` mintgrönt | kökets tapet, Smälter in-mätaren när det är bra |
| Fara | `#ff5a36` signalorange | kusinernas sugkoppspistoler och pilar, HP-förlust |
| Signaturfärgen | `#a8322a` falurött | huset utvändigt, vättarnas luvor |
| Trä | `#c99a5b` / `#9a6b3a` | furugolv, köksbord, stolar |
| Vitt | `#f2ebdc` | knutar, porslin, gardiner |
| Rosa | `#e8b4b8` | vardagsrummets tapet, rosor på porslin |
| Mässing | `#c8a24a` | lampor, handtag, kaffepanna |
| Linoleum | `#e9e1cf` / `#7b9a8c` | kökets rutiga golv |
| Himmel | `#8fc3e8` | utanför fönstren |
| Gräs | `#6fae4c` | trädgården |

### Himmel, dimma och grading (tre varianter till looktestet)
- **A. Söndagseftermiddag:** hög klar sol snett in genom fönstret, långa solkatter på golvet, varm grading (lätt gul i högdagrar).
- **B. Regnig eftermiddag:** grå himmel, taklampan och vedspisen tända, varmt inne och kallt ute. Mysigast.
- **C. Skymning:** blå timme utanför, lampor och fönster lyser, mest kontrast.

### Material och texturer
Furugolv, linoleumrutor, tapeter (mint med små blommor, rosa med ränder), vitmålade lister, kakel bakom spisen, gjutjärn, mässing, porslin (vitt med blå kant), virkat garn och tyg (rya, gardiner).

### Kit-modeller per plats (fas 0: köket)
| Grupp | Modeller |
|---|---|
| Möbler | köksbord, köksstol, kökssoffa (utdragssoffa), vitrinskåp |
| Kök | vedspis, diskbänk, överskåp, kylskåp (rundat 50-tal), fönster med spröjs och gardiner |
| Saker (gömbara) | kaffekopp, kakfat, kaffepanna, brödkorg, vedkorg, grytlapp, krukväxt (pelargon), dalahäst |
| Berättande | korsord och tidning, barnteckningar på kylen, lappen "Glöm ej kaffet!", vykort från slottet |
| Utsikt | ladans tak, björkar, tvättlina med mammelucker, staket, moln |

### Karaktärer
- **Vättarna (gömmare):** små (0,6 m), runda och gråa, med en stor falröd luva, knappnäsa, stora blanka ögon och mossgrön väst. Varianter: luvans form (spetsig, böjd eller lapp), skägg/inget skägg och väst i 4 nyanser.
  - **Lägen:** stå, springa, hoppa, förvandla (snurr och poff), som sak (låst eller olåst), tagen (trillar ut med stjärnor) och spöke (genomskinlig och svävande).
- **Kusinerna (sökare):** barn (1,3 m) i mormorsstickade tröjor med mönster, keps eller tofsmössa och gummistövlar. Varianter: tröjmönster × hår × mössa.
  - **Lägen:** stå, springa, sikta, skjuta (rekyl), ladda (ny pil från bältet), fel träff (rycker till), "aha!" (pekar) och segerpose.
- **Mormor och Misse:** egna modeller i fas 4.

### Det hållna föremålet
Sugkoppspistolen är orange plast med en gul pil som sticker ut. Den har rekyl, en pil som flyger, en ny pil som trycks in för hand och pilar som fastnar där de träffar (och försvinner efter 6 s).

### Effekter
Förvandlingens poff (voxel-konfetti i husets färger), sugkoppens plopp (en liten krusning på träffytan), tagen-stjärnor, gökurens skak (damm från taket) och kaffeånga.

### HUD
- **Nere till vänster:** din roll och din HP (kusin) eller Smälter in-mätaren (vätte).
- **Uppe i mitten:** timern (SDK:ns).
- **Höger sida:** en flöde med händelser.
- **Inventarielistan:** ett papper på `Tab` med mormors handstil.
- Uppe till höger är sidans och hålls fri.

## 5. Ljud och musik
- **Ambiens per rum:** köket har kaffepanna och ett surrande kylskåp; vardagsrummet har gökurens tickande; hallen har vind från brevinkastet; källaren har droppar.
- **Effekter:** förvandling (3 st), sugkopp (skott, plopp på trä, porslin och tyg), taunts (klink, klapp och fladder), gökur, steg på trä och linoleum, samt "Tagen!".
- **Musik:**
  - gömfas: lugn vals;
  - sökfas: smygande pizzicato;
  - sista minuten: snabbare polka;
  - seger: dragspelsfanfar.
- **Röster:** synthpip med textning ("Nämen!", "Tagen!").
- **Nivåer:** sugkoppsskott och "Tagen!" högst, taunts i mitten och ambiens lägst.

## 6. Världen, plats för plats
Se `docs/maps/mormors-hus.md` för alla rum. I fas 0 byggs **bara köket** i färdig kvalitet.

**Köket** (6 × 5 m, takhöjd 2,5 m):
- **Utseende:** mint tapet, rutigt golv, vedspis med kakel och ett stort fönster mot trädgården.
- **Landmärke:** kaffebordet med virkad duk och kaffepannan.
- **Berättelse:** kaffet är på väg, sju sorters kakor står och väntar, och det ligger ett halvlöst korsord på bordet. På kylen sitter teckningar och vykortet från slottet.
- **Ljus:** fönstret, taklampan och spisens glöd.
- **Ljud:** kaffepannan och kylskåpet.

### Fotopunkter (fas 0)
| # | Var | Tittar på |
|---|---|---|
| K1 | Dörröppningen från hallen, ståhöjd | hela köket: bordet i mitten, fönstret och spisen |
| K2 | Hörnet vid spisen | fönstret: trädgården, ladan, tvättlinan och himlen |
| K3 | Vättehöjd (0,4 m), vid bordskanten | koppar och kakfat i förgrunden, kusinen i dörren |

## 7. Mekanik med siffror (startvärden)
- **Kusin:**
  - 100 HP; ett felskott kostar 8 HP och en rätt träff ger tillbaka 15.
  - 1 skott per 0,6 s; pilens räckvidd är 25 m.
- **Vätte:** HP enligt prop-tabellen i `docs/maps/mormors-hus.md` (koppar 1, stolar 2, byrå 4).
- **Rörelse:** vätte 5 m/s som sig själv, prop-fart enligt tabellen; kusin 4,5 m/s.
- **Runda:** 40 s gömtid och 3 min 30 s sök, varav sista minuten är kafferepet. Kusiner : vättar = 1 : 3.
- **Poäng:** se brainstormen (överlevnad, taunts, nära ögat och fångster).

## 8. Berättelse och text
- **Premiss:** mormor har bjudit in barnbarnen på kaffe. Vättarna som bor i huset vill inte bli upptäckta.
- **Text i världen** (högst 6 ord, upplyst): "Glöm ej kaffet!", "Mormors kök" (broderad bonad), "Hälsningar från slottet!" och korsordet.
- **Röstrader:** Mormor: "Nämen!", "Akta porslinet!"; kusin: "Aha!"; vätte: "Hihi".

## 9. Faser

### Fas 0: looktestet ← **vi är här**
**Mål:** låsa stilen innan vi bygger mer.
**Du får se:** köket i färdig kvalitet med en kusin (med pistol) och en vätte, i tre ljusvarianter.
- [ ] Projektet uppsatt (Voxel Party SDK, `--fps`-mallen som grund).
- [ ] Texturer: golv, tapet, kakel, trä och porslin.
- [ ] Köket som husvolym: väggar, fönster med spröjs, dörröppning och tak.
- [ ] Kit-modeller: bord, stolar, spis, diskbänk, skåp, kyl, koppar, kakfat, kaffepanna och berättardetaljer.
- [ ] Utsikten: trädgård, lada, tvättlina med mammelucker och himmel.
- [ ] Karaktärerna: kusin med sugkoppspistol och vätte.
- [ ] Tre ljusvarianter (A/B/C) och fotopunkterna K1–K3.
- [ ] Bildtestet på alla bilder och galleriet läst.

**Klart när:** du har valt en look, bilderna klarar bildtestet och det går i 60 fps.
**Bevis:** varianterna sida vid sida från samma fotopunkt och gallerisidorna.

### Fas 1: känslan
Förvandlingen och sugkoppsskottet med alla reaktioner. En vätte-CPU som gömmer sig och en kusin-CPU som letar, i köket.
**Bevis:** filmremsor av förvandling, skott, fel träff och rätt träff.

### Fas 2: en hel runda i köket och skafferiet
Gömfas, sökfas, slut, poäng, inventarielistan och Smälter in-mätaren. Rollbyte mellan rundor.

### Fas 3: vardagsrummet och hallen
Gökuren och dess event, samt radion.

### Fas 4: sovrum, syrum och badrum, plus Mormor och Misse
Mormors städrutin.

### Fas 5: källaren, trädgården, kafferepet och easter eggs

### Fas 6: polering och delning
Musik, alla ljud, utmärkelser, `vp check --long` och `vp share`.

## 10. Tester och speltest
- **Automatiskt:** reglerna headless (förvandling, träffar, HP och poäng), netcode med `FakeRoom`, CPU:er som spelar hela rundor och inventarielistan som stämmer med banan.
- **Speltest efter varje fas**, med sex frågor:
  1. Spela utan förklaring.
  2. Vad hände?
  3. Vad var bäst och vad var sämst?
  4. När var du vilse?
  5. Var något orättvist, fult eller förvirrande?
  6. Vill du spela igen nu direkt?

## 11. Risker
| Risk | Vad vi gör |
|---|---|
| Små props (koppar) är svåra att träffa och att se | Lätt överdriven skala (rejäla koppar) och träffytor något större än modellen |
| Inomhus blir mörkt och platt | Blockljus från fönster och lampor, fönster i varje fotopunkt och bildtestet |
| Vättar gömmer sig på omöjliga ställen | Kollision mot taket och ett "kan en kusin se dig härifrån?"-test i CPU-testerna |
| För många modeller blir för många draw calls | Instansera alla kopior av samma sak och slå ihop det som står still |

## 12. Beslut för dig
- **Looken** i fas 0: A, B eller C (eller en blandning).
- **Namnen:** "vättar" och "kusiner", och sugkoppspistoler i stället för riktiga vapen. Okej?
