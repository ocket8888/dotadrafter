/**
 * @typedef HeroDom extends HTMLDivElement
 * @type {object}
 */

/**
 * @typedef TeamListDom extends HTMLDivElement
 * @type {object}
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
 * @typedef Hero extends BasicHero
 * @type {object}
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

/**
 * @typedef MatchUp
 * @type {object}
 * @property {number} hero_id
 * @property {number} games_played
 * @property {number} wins
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
 * @returns {Array<MatchUp>}
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

/** @type {HTMLUListElement & {children: Array<HTMLLIElement>}} */
let heroesList;
/** @type {HTMLSelectElement & {value: Attribute | ""}} */
let attrFilter;

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
	elem.id = hero.id;
	elem.appendChild(document.createTextNode(hero.localized_name));
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
