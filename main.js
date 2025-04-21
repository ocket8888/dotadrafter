/**
 * @typedef HeroDom extends HTMLDivElement
 * @type {object}
 * @extends HTMLDivElement
 */

/**
 * @typedef TeamListDom extends HTMLDivElement
 * @type {object}
 * @extends HTMLDivElement
 * @property {[HeroDom, HeroDom, HeroDom, HeroDom, HeroDom]} children
 */

/** @typedef {"Carry" | "Escape" | "Nuker" | "Support" | "Durable" | "Disabler"} Role */
/**
 * @typedef BasicHero
 * @type {object}
 * @property {"Melee" | "Ranged"} attack_type
 * @property {number} id
 * @property {number} legs
 * @property {string} localized_name
 * @property {string} name
 * @property {Array<Role>} roles
 */

/** @typedef {"str" | "agi" | "int" | "all"} Attribute */

/**
 * @typedef HeroProperties
 * @property {Attribute} primary_attr
 * @property {string} img
 * @property {string} icon
 * @property {number} base_health
 * @property {number} base_health_regen
 * @property {number} base_mana
 * @property {number} base_mana_regen
 * @property {number} base_armor
 * @property {number} base_mr
 * @property {number} base_attack_min
 * @property {number} base_attack_max
 * @property {number} base_str
 * @property {number} str_gain
 * @property {number} base_agi
 * @property {number} agi_gain
 * @property {number} base_int
 * @property {number} int_gain
 * @property {number} attack_range
 * @property {number} projectile_speed
 * @property {number} attack_rate
 * @property {number} base_attack_time
 * @property {number} attack_point
 * @property {number} move_speed
 * @property {number | null} turn_rate
 * @property {boolean} cm_enabled
 * @property {number} day_vision
 * @property {number} night_vision
 * @property {number} hero_id
 * @property {number} turbo_picks
 * @property {number} turbo_wins
 * @property {number} pro_ban
 * @property {number} pro_pick
 * @property {number} pro_win
 * @property {number} 1_pick
 * @property {number} 1_win
 * @property {number} 2_pick
 * @property {number} 2_win
 * @property {number} 3_pick
 * @property {number} 3_win
 * @property {number} 4_pick
 * @property {number} 4_win
 * @property {number} 5_pick
 * @property {number} 5_win
 * @property {number} 6_pick
 * @property {number} 6_win
 * @property {number} 7_pick
 * @property {number} 7_win
 * @property {number} 8_pick
 * @property {number} 8_win
 * @property {number} pub_pick
 * @property {[number, number, number, number, number, number, number]} pub_pick_trend
 * @property {number} pub_win
 * @property {[number, number, number, number, number, number, number]} pub_win_trend
 * @property {number} turbo_picks
 * @property {[number, number, number, number, number, number, number]} turbo_picks_trend
 * @property {number} turbo_wins
 * @property {[number, number, number, number, number, number, number]} turbo_wins_trend
 */

/** @typedef {BasicHero & HeroProperties} Hero */

/**
 * @typedef MatchUp
 * @type {object}
 * @property {number} hero_id
 * @property {number} games_played
 * @property {number} wins
 */

/**
 * @typedef HeroListing
 * @type {object}
 * @property {Hero} hero
 * @property {HeroDom} domElement
 * @property {number} fuzzyScore
 */

/**
 *
 * @returns {Promise<Array<BasicHero>>}
 */
async function getHeroes() {
	const response = await fetch(new URL("https://api.opendota.com/api/heroes"));
	return response.json();
}

/**
 * @returns {Promise<Array<Hero>>}
 */
async function getHeroStats() {
	const response = await fetch(new URL("https://api.opendota.com/api/heroStats"));
	return response.json();
}

/**
 *
 * @param {number} id
 * @returns {Promise<Array<MatchUp>>}
 */
async function getMatchups(id) {
	const response = await fetch(new URL(`https://api.opendota.com/api/heroes/${id}/matchups`));
	return response.json();
}

/** @type {Array<Hero>} */
const allHeroes = [];
/** @type {Map<number, Hero>} */
const heroMap = new Map();

/**
 *
 * @param {string} query
 * @param {string} item
 * @returns {number | null}
 */
function fuzzyScore(query, item) {
	if (!query) {
		return 0;
	}

	let score = 0;
	let queryPos = 0;
	for (const char of item) {
		if (char === query[queryPos]) {
			queryPos++;
			if (queryPos === query.length) {
				return score;
			}
			continue;
		}
		score++;
	}
	return null;
}

/** @type {HTMLUListElement & {children: Array<HTMLLIElement & {parentElement: HTMLUListElement}>}} */
let heroesList;
/** @type {Array<HeroListing>} */
let heroes = [];
/** @type {HTMLSelectElement & {value: Attribute | ""}} */
let attrFilter;

/** @type {null | Hero} */
let selectedHero = null;

/**
 * @param {null | Hero} hero
 */
function selectHero(hero) {
	selectedHero = hero;

	const selHeroDiv = document.getElementById("selected-hero");
	if (!selHeroDiv || !(selHeroDiv instanceof HTMLDivElement)) {
		throw new Error("no selected hero div in document");
	}

	selHeroDiv.replaceChildren();
	if (hero === null) {
		return;
	}

	const name = document.createElement("H2");
	name.textContent = hero.localized_name;
	selHeroDiv.appendChild(name);

	const heroImg = document.createElement("img");
	heroImg.src = `https://cdn.cloudflare.steamstatic.com${hero.img}`;
	heroImg.alt = `image depicting DotA2 hero ${hero.localized_name}`;
	selHeroDiv.appendChild(heroImg);

	const primaryAttr = document.createElement("span");
	primaryAttr.textContent = hero.primary_attr;
	selHeroDiv.appendChild(primaryAttr);

	const agi = document.createElement("span");
	agi.textContent = `${hero.base_agi} +${hero.agi_gain}`;
	selHeroDiv.appendChild(agi);
	const int = document.createElement("span");
	int.textContent = `${hero.base_int} +${hero.int_gain}`;
	selHeroDiv.appendChild(int);
	const str = document.createElement("span");
	str.textContent = `${hero.base_str} +${hero.str_gain}`;
	selHeroDiv.appendChild(str);
}

/**
 * @param {Attribute} attr
 */
function filterAttribute(attr) {
	for (const child of heroesList.children) {
		child.hidden = heroMap.get(Number(child.id)).primary_attr !== attr;
	}
}

/**
 * @param {Hero} hero
 * @returns {HTMLLIElement}
 */
function createHeroListing(hero) {
	const elem = document.createElement("li");
	elem.id = String(hero.id);
	const figure = document.createElement("figure");
	const figCaption = document.createElement("figcaption");
	figCaption.textContent = hero.localized_name;
	const figImage = document.createElement("img");
	figImage.src = `https://cdn.cloudflare.steamstatic.com${hero.icon}`;
	figImage.alt = `an icon representative of DotA2 hero "${hero.localized_name}"`
	figure.appendChild(figImage);
	figure.appendChild(figCaption);
	elem.appendChild(figure);
	elem.addEventListener("click", () => {
		selectHero(hero);
	});
	elem.classList.add(hero.primary_attr);
	return elem;
}

/**
 * @this {HTMLInputElement}
 * @param {KeyboardEvent} evt
 */
function search(evt) {
	evt.stopPropagation();
	if (!this.value) {
		[...heroesList.children].sort((a, b) => {
			a.hidden = false;
			b.hidden = false;
			const nameA = heroMap.get(Number(a.id)).localized_name;
			const nameB = heroMap.get(Number(b.id)).localized_name;
			return nameA > nameB ? 1 : -1;
		}).forEach(n => n.parentElement.appendChild(n));
		return;
	}

	const query = this.value.toLowerCase();
	[...heroesList.children].sort((a, b) => {
		const scoreA = fuzzyScore(query, heroMap.get(Number(a.id)).localized_name.toLowerCase());
		const scoreB = fuzzyScore(query, heroMap.get(Number(b.id)).localized_name.toLowerCase());
		if (scoreA === null) {
			a.hidden = true;
			if (scoreB === null) {
				b.hidden = true;
				return 0;
			}
			return 1;
		}
		if (scoreB === null) {
			b.hidden = true;
			return -1;
		}
		return scoreA - scoreB;
	}).forEach(n => n.parentElement.appendChild(n));
}

globalThis.addEventListener("load", async () => {
	/** @type {TeamListDom | null} */
	const myTeam = document.getElementById("my-team");
	/** @type {TeamListDom | null} */
	const enemyTeam = document.getElementById("enemy-team");
	/** @type { HTMLInputElement & {type: "search"} | null} */
	const searchBox = document.getElementById("search");
	heroesList = document.getElementById("herolist");
	attrFilter = document.getElementById("attr-filter");

	if (!myTeam || !enemyTeam || !searchBox || !heroesList || !attrFilter) {
		throw new Error("document setup not ready before script ran");
	}

	attrFilter.addEventListener("change", () => {
		if (attrFilter.value === "") {
			// need to not un-hide search-filtered heroes
		}
	});
	searchBox.addEventListener("input", search);

	const heroes = await getHeroStats();
	for (const h of heroes.sort((a,b) => a.localized_name > b.localized_name ? 1 : -1)) {
		allHeroes.push(h);
		heroMap.set(h.id, h);
		heroesList.appendChild(createHeroListing(h));
	}

	console.log(heroes);
});
