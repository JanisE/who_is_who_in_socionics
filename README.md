# Who Is Who in Socionics

Given a list of people names and their socionics types, adds the corresponding type in parenthesis after each occurence of a person's name on a page.

Who is of which socionics type – you set it in the extension's settings yourself. You may also load data from a Facebook poll along with people list added manually.

The code was initially built upon https://github.com/pelmers/text-rewriter mainly by removing a lot of functionality, to make it even simpler to use – for this specific use case.

## Install

* For [Firefox](https://addons.mozilla.org/en-US/firefox/addon/who-is-who-in-socionics/)
* For [Chrome](https://chrome.google.com/webstore/detail/who-is-who-in-socionics/edgafhhkoaeojfhofmfnkffppnjbboli?hl=en)

## Usage

### Enable add-on's icon in the add-on toolbar, for Chrome

In Chrome, the icon is not visible in the add-on toolbar, by default. In order to load poll data or get to the configuration editing easier, one must:
1. click on the add-ons icon (a puzzle piece icon) on the right side of the toolbar;
2. find "Who Is Who in Socionics" on the add-on list and click its pin icon "Pin Extension" to be active.

### Create person list manually

In the extension settings page, fill in the type and person list in the text box, and click on `Save`.

Configuration example:

```
# You can write notes on lines that start with a hash symbol,
# they will be ignored for text replacement.

IEI
- Terry Pratchett
- Hans Christian Andersen

# Each person name goes on its own line,
# prefixed by "-" or "*":

LSI
* Hillary Clinton
* Vladimir Putin


# Empty lines have no effect on the replacer.
# Types may be repeated (with a different list of people):
IEI
- Mother Teresa
```

### Load data from a Facebook poll

1. Open a Facebook poll post (currently only polls with at least one option with more than 10 voters (more than one scrollable page of voters) supported);
2. click on the extension's icon;
3. click on the "Load" button under "Load types from a Facebook poll".

This data will not affect the manual list. Any successful subsequent data loads will overwrite the previous one.

# Kurš ir kurš socionikā

Lapā atrod vārdus, kas ir starp iestatījumos norādītajiem, un pieraksta aiz tiem iekavās attiecīgo socionikas tipu. Vārdus var gan pats norādīt brīvā konfigurācijā, gan arī ielādēt no Facebook aptaujas.

## Instalēšana

* Pārlūkam [Firefox](https://addons.mozilla.org/lv/firefox/addon/who-is-who-in-socionics/)
* Pārlūkam [Chrome](https://chrome.google.com/webstore/detail/who-is-who-in-socionics/edgafhhkoaeojfhofmfnkffppnjbboli?hl=lv)

## Lietošana

### Iespējot paplašinājuma ikonu Chromē

Lai ielādētu tipus no aptaujas un vieglāk tiktu pie tipu saraksta rediģēšanas, paplašinājuma ikonu vajag dabūt redzamu paplašinājumu rīkjoslā. Chrome ikonu pēc noklusējuma nepievieno, tāpēc pašam:
1. jānoklikšķina uz paplašinājumu ikonas (puzles ikona);
2. jāatrod sarakstā paplašinājums "Kurš ir kurš socionikā" un jānoklikšķina blakus uz piespraudes ikonas ("Piespraust paplašinājumu"), lai padarītu to aktīvu.

### Personu saraksta rakstīšana pašam

Ievadiet tipu un atbilstošo personu sarakstu lodziņā (piemērs zemāk) un spiediet &quot;Saglabāt&quot;!</p>

Konfigurācijas piemērs:

```
# Rindās, kas sākas ar restīti, var rakstīt piezīmes,
# tās netiks izmantotas aizvietošanā.

jeseņins
- Terijs Prečets
- Hanss Kristians Andersens

# Katru aizvietojamo personu raksta savā rindiņā,
# priekšā pieliekot "-" vai "*":

maksims
* Hilarija Klintone
* Vladimirs Putins


# Tukšas rindiņas aizvietošanu neietekmē.
# Tipi var būt sadalīti vairākās porcijās / atkārtoties:
jeseņins
- Māte Terēze
```

### Datu ielasīšana no Facebook aptaujas

1. Atveriet Facebook ierakstu ar aptauju ();
2. uzklikšķiniet uz paplašinājuma ikonas;
3. uzklikšķiniet uz pogas "Ielasīt" zem "Ielasīt tipus no Facebook aptaujas".

No aptaujas ielasītie dati neietekmē paša ierakstītos datus. Sekmīgi ielasīti aptaujas dati aizvietos iepriekš ielasītos datus.
