import type { RNG } from './rng';
import type { Nationality } from './types';

const FIRST_USA = ['James','John','Robert','Michael','William','David','Joseph','Thomas','Charles','Chris','Daniel','Matthew','Anthony','Mark','Kevin','Brian','Ryan','Jack','Aaron','Noah','Nathan','Adam','Kyle','Austin','Logan','Cole','Trevor','Blake','Hunter','Tanner','Mason','Brody','Wyatt','Drew','Easton','Riley','Chase','Grant','Preston','Parker','Landon','Carson','Connor','Travis','Trent','Trey','Zane','Brett','Reid','Spencer','Shane','Tucker','Jett','Caleb','Brady','Braden','Colby','Clay','Garrett','Cooper','Jaxon','Cash','Rhett','Beau','Brooks','Lawson','Knox','Rocco'];
const FIRST_DOM = ['José','Juan','Carlos','Luis','Miguel','Rafael','Pedro','Manuel','Francisco','Jorge','Ángel','Víctor','Roberto','Julio','Starlin','Yoan','Nelson','Elvin','Robinson','Edwin','Wilson','Gleyber','Teoscar','Eloy','Sandy','Domingo','Jairo','Ronald','Yeison','Hanser','Vladimir','Franmil'];
const FIRST_VEN = ['Miguel','Salvador','Felix','Omar','Carlos','Ronald','Freddy','Eduardo','Gleyber','Rougned','Ender','Eugenio','Luis','Pablo','Orlando','Wilson','Anthony','Gerardo','Avisaíl','Wilmer'];
const FIRST_JPN = ['Shohei','Yu','Masahiro','Hideki','Hiroki','Kenta','Koji','Kenji','Daisuke','Yoshinobu','Seiya','Kosuke','Takashi','Shota','Shintaro'];
const FIRST_CUB = ['Yoenis','Yasiel','Aroldis','José','Yulieski','Aledmys','Luis','Yoán','Adalberto','Yandy','Norge','Randy','Yordan'];

const LAST_USA = ['Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Thompson','White','Harris','Clark','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Hill','Green','Adams','Nelson','Baker','Hall','Campbell','Mitchell','Carter','Roberts','Phillips','Evans','Turner','Parker','Edwards','Collins','Stewart','Morris','Murphy','Cook','Rogers','Morgan','Cooper','Peterson','Bailey','Reed','Kelly','Howard','Cox','Ward','Richardson','Watson','Brooks','Wood','James','Bennett','Gray','Hughes','Price','Sanders','Myers','Long','Ross','Foster','Powell','Jenkins','Perry','Russell','Sullivan','Bell','Coleman','Butler','Henderson','Barnes','Crawford','McCutchen','Freeman','Betts','Harper','Voit','Semien','Realmuto','Turnbull'];
const LAST_DOM = ['Peña','Pérez','Ramírez','García','Rodríguez','Martínez','Sánchez','Santana','Castillo','Jiménez','Guerrero','Ortiz','Soriano','Cabrera','Núñez','Polanco','Cano','Reyes','Beltré','Tatís','Soto','Arráez','Franco','Alcántara','Ozuna','Báez','Severino','Bautista','Marte','Colón'];
const LAST_VEN = ['Cabrera','Pérez','Rodríguez','González','Sánchez','Herrera','Escobar','Rojas','Álvarez','Contreras','Altuve','Moreno','Suárez','Arraez','Galvis','Urshela','Arenado','Chirinos','Santander','Odor'];
const LAST_JPN = ['Ohtani','Suzuki','Yamamoto','Tanaka','Matsui','Darvish','Maeda','Yoshida','Fujinami','Imanaga','Sasaki','Kikuchi','Senga'];
const LAST_CUB = ['Abreu','Moncada','Gurriel','Iglesias','Arozarena','Luis','Aguilar','García','Álvarez','Contreras','Urquidy'];

export const NAT_WEIGHTS: { item: Nationality; weight: number }[] = [
  { item: 'USA', weight: 62 },
  { item: 'DOM', weight: 15 },
  { item: 'VEN', weight: 9 },
  { item: 'CUB', weight: 5 },
  { item: 'JPN', weight: 4 },
  { item: 'PRI', weight: 3 },
  { item: 'MEX', weight: 2 },
];

export function pickName(nat: Nationality, rng: RNG): { first: string; last: string } {
  const firstPool =
    nat === 'DOM' ? FIRST_DOM :
    nat === 'VEN' ? FIRST_VEN :
    nat === 'JPN' ? FIRST_JPN :
    nat === 'CUB' ? FIRST_CUB :
    FIRST_USA;
  const lastPool =
    nat === 'DOM' ? LAST_DOM :
    nat === 'VEN' ? LAST_VEN :
    nat === 'JPN' ? LAST_JPN :
    nat === 'CUB' ? LAST_CUB :
    LAST_USA;
  return { first: rng.pick(firstPool), last: rng.pick(lastPool) };
}
