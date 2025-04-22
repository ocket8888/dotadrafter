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
 * @typedef {{
 * "1_pick": number;
 * "1_win": number;
 * "2_pick": number;
 * "2_win": number;
 * "3_pick": number;
 * "3_win": number;
 * "4_pick": number;
 * "4_win": number;
 * "5_pick": number;
 * "5_win": number;
 * "6_pick": number;
 * "6_win": number;
 * "7_pick": number;
 * "7_win": number;
 * "8_pick": number;
 * "8_win": number;
 * }} UnusualHeroProperties This is necessary because JSDoc doesn't handle property names that
 * aren't valid identifiers, but doing it this way doesn't allow descriptions which i may want to
 * add later.
 */

/** @typedef {BasicHero & HeroProperties & UnusualHeroProperties} Hero */

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
 * @property {HTMLLIElement} domElement
 * @property {number | null} fuzzyScore
 * @property {boolean} onTeam
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

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {string} text
 * @returns {HTMLElementTagNameMap[K]}
 */
function createElementWithText(tag, text) {
	const elem = document.createElement(tag);
	elem.textContent = text;
	return elem;
}

/** @type {Array<Hero>} */
const allHeroes = [];
/** @type {Map<number, HeroListing>} */
const heroMap = new Map();

/**
 * Constructs an icon element for a hero attribute.
 * @param {Attribute} attr
 * @returns {HTMLImageElement}
 */
function attrIcon(attr) {
	const prefix = "https://cdn.akamai.steamstatic.com/apps/dota2/images/dota_react/icons";
	let url;
	switch(attr) {
		case "agi":
			url = `${prefix}/hero_agility.png`;
			break;
		case "all":
			url = `${prefix}/hero_universal.png`;
			break;
		case "int":
			url = `${prefix}/hero_intelligence.png`;
			break;
		case "str":
			url = `${prefix}/hero_strength.png`;
			break;
	}

	const elem = document.createElement("img");
	elem.src = url;
	elem.alt = `"${attr}" stat icon`;
	return elem;
}

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

/** @type {HTMLUListElement} */
let heroesList;
/** @type {Array<HeroListing>} */
let heroes = [];

const filterState = {
	str: false,
	agi: false,
	int: false,
	all: false,
};

/** @type {null | Hero} */
let selectedHero = null;

/** @type {HTMLElement} */
let myTeam;
/** @type {HTMLElement} */
let enemyTeam;
/** @type {HTMLElement} */
let bannedTeam;

/**
 * Creates an `img` tag for an image of a given Hero.
 * @param {Hero} hero The hero in question
 * @returns {HTMLImageElement}
 */
function heroImage(hero) {
	const elem = document.createElement("img");
	elem.src = `https://cdn.cloudflare.steamstatic.com${hero.img}`;
	elem.alt = `an icon representative of DotA2 hero "${hero.localized_name}"`;
	return elem;
}

/**
 * @param {number} id
 * @returns {HeroListing}
 */
function getHero(id) {
	const hero = heroMap.get(id);
	if (!hero) {
		throw new Error(`no hero by ID ${id}`);
	}
	return hero;
}

/**
 * Removes a hero from the specified team.
 * @param {Hero} hero
 * @param {"ally" | "enemy" | "ban"} team
 */
function removeHeroFromTeam(hero, team) {
	let teamDom;
	switch(team) {
		case "ally":
			teamDom = myTeam;
			break;
		case "enemy":
			teamDom = enemyTeam;
			break;
		case "ban":
			teamDom = bannedTeam;
			break;
	}
	for (const child of teamDom.children) {
		if (child instanceof HTMLElement && Number(child.id) === hero.id) {
			teamDom.removeChild(child);
			break;
		}
	}
	getHero(hero.id).onTeam = false;
	updateListings();
}

/**
 * @param {Hero} hero
 * @param {"ally" | "enemy" | "ban"} team
 */
function addToTeam(hero, team) {
	const elem = document.createElement("figure");
	elem.id = `${hero.id}`;
	const figImage = heroImage(hero);
	elem.appendChild(figImage);

	const remover = document.createElement("div");
	remover.classList.add("remover");
	const removeButton = createElementWithText("button", "❌");
	removeButton.type = "button";
	removeButton.title = `remove ${hero.localized_name} from ${team}${team !== "ban" ? " " +team+" team" : "s"}`;
	removeButton.addEventListener("click", () => {
		removeHeroFromTeam(hero, team);
	});
	remover.appendChild(removeButton);

	if (team === "ban") {
		elem.appendChild(remover);
		bannedTeam.appendChild(elem);
		return;
	}

	elem.appendChild(createElementWithText("figcaption", hero.localized_name));
	elem.appendChild(remover);
	if (team === "enemy") {
		enemyTeam.appendChild(elem);
	} else {
		myTeam.appendChild(elem);
	}
}

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

	const name = document.createElement("H1");
	name.appendChild(createElementWithText("span", hero.localized_name));
	name.appendChild(attrIcon(hero.primary_attr));
	selHeroDiv.appendChild(name);

	const heroShortName = hero.name.substring("npc_dota_hero_".length);
	const videoPrefix = "https://cdn.akamai.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders"
	const heroImg = document.createElement("video");
	heroImg.poster = `${videoPrefix}/${heroShortName}.png`;
	heroImg.autoplay = true;
	heroImg.loop = true;
	heroImg.playsInline = true;
	heroImg.preload = "auto";

	const mp4Src = document.createElement("source");
	mp4Src.type = "video/mp4; codecs=&quot;hvc1&quot"
	mp4Src.src = `${videoPrefix}/${heroShortName}.mov`;
	heroImg.appendChild(mp4Src);

	const webmSrc = document.createElement("source");
	webmSrc.type = "video/webm";
	webmSrc.src = `${videoPrefix}/${heroShortName}.webm`;
	heroImg.appendChild(webmSrc);

	const imgSrc = document.createElement("img");
	imgSrc.src = heroImg.poster;
	imgSrc.alt = `fallback image for DotA2 hero "${hero.localized_name}"`;
	heroImg.appendChild(imgSrc);

	selHeroDiv.appendChild(heroImg);

	const hpBar = document.createElement("div");
	hpBar.classList.add("hp-bar");
	hpBar.appendChild(createElementWithText("span", String(hero.base_health)));
	hpBar.appendChild(createElementWithText("span", `+${hero.base_health_regen}`));
	selHeroDiv.appendChild(hpBar);

	const manaBar = document.createElement("div");
	manaBar.classList.add("mana-bar");
	manaBar.appendChild(createElementWithText("span", String(hero.base_mana)));
	manaBar.appendChild(createElementWithText("span", `+${hero.base_mana_regen}`));
	selHeroDiv.appendChild(manaBar);

	const attrContainer = document.createElement("div");
	attrContainer.classList.add("attr-container");

	const agi = document.createElement("span");
	agi.appendChild(attrIcon("agi"));
	agi.appendChild(createElementWithText("span", `${hero.base_agi} +${hero.agi_gain}`));
	attrContainer.appendChild(agi);

	const int = document.createElement("span");
	int.appendChild(attrIcon("int"));
	int.appendChild(createElementWithText("span", `${hero.base_int} +${hero.int_gain}`));
	attrContainer.appendChild(int);

	const str = document.createElement("span");
	str.appendChild(attrIcon("str"));
	str.appendChild(createElementWithText("span", `${hero.base_str} +${hero.str_gain}`));
	attrContainer.appendChild(str);

	selHeroDiv.appendChild(attrContainer);

	const footer = document.createElement("footer");
	footer.classList.add("action-bar");

	const addToTeamButton = createElementWithText("button", "Add to Team");
	addToTeamButton.type = "button";
	addToTeamButton.disabled = myTeam.children.length >= 5;
	addToTeamButton.addEventListener("click", () => {
		addToTeam(hero, "ally");
		getHero(hero.id).onTeam = true;
		selectHero(null);
		updateListings();
	});
	footer.appendChild(addToTeamButton);

	const banButton = createElementWithText("button", "Ban");
	banButton.type = "button";
	banButton.disabled = bannedTeam.children.length >= 14;
	banButton.addEventListener("click", () => {
		addToTeam(hero, "ban");
		getHero(hero.id).onTeam = true;
		selectHero(null);
		updateListings();
	});
	footer.appendChild(banButton);

	const addToEnemyButton = createElementWithText("button", "Add to Enemy Team");
	addToEnemyButton.type = "button";
	addToEnemyButton.disabled = enemyTeam.children.length >= 5;
	addToEnemyButton.addEventListener("click", () => {
		addToTeam(hero, "enemy");
		getHero(hero.id).onTeam = true;
		selectHero(null);
		updateListings();
	});
	footer.appendChild(addToEnemyButton);

	selHeroDiv.appendChild(footer);
}

/**
 * @param {Hero} hero
 * @returns {HTMLLIElement}
 */
function createHeroListing(hero) {
	const elem = document.createElement("li");
	elem.id = String(hero.id);
	const figure = document.createElement("figure");
	figure.classList.add("hero-list-figure");
	const figCaption = createElementWithText("figcaption", hero.localized_name);
	const figImage = heroImage(hero);
	figImage.width = 140;
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
 * @param {HeroListing} heroListing
 * @returns {boolean}
 */
function shouldFilter(heroListing) {
	if (heroListing.onTeam || heroListing.fuzzyScore === null) {
		return true;
	}
	if (Object.values(filterState).some(x => x) && !filterState[heroListing.hero.primary_attr]) {
		return true;
	}
	return false;
}

/**
 * Sorts and filters the hero listing based on the current filters. Fuzzy scores must have already
 * been applied.
 */
function updateListings() {
	heroes.sort((a, b) => {
		if (shouldFilter(a)) {
			a.domElement.hidden = true;
			if (shouldFilter(b)) {
				b.domElement.hidden = true;
				return 0;
			}
			return 1;
		}
		a.domElement.hidden = false;
		if (shouldFilter(b)) {
			b.domElement.hidden = true;
			return -1;
		}
		b.domElement.hidden = false;
		if (a.fuzzyScore === b.fuzzyScore) {
			return a.hero.localized_name > b.hero.localized_name ? 1 : -1;
		}
		return (a.fuzzyScore ?? 0) - (b.fuzzyScore ?? 0);
	});
	for (const hero of heroes) {
		heroesList.appendChild(hero.domElement);
	}
}

/**
 * @this {HTMLInputElement}
 */
function search() {
	if (!this.value) {
		for (const hero of heroes) {
			hero.fuzzyScore = 0;
		}
	} else {
		for (const hero of heroes) {
			hero.fuzzyScore = fuzzyScore(this.value.toLowerCase(), hero.hero.localized_name.toLowerCase());
		}
	}

	updateListings();
}

globalThis.addEventListener("load", async () => {
	const me = document.getElementById("my-team");
	const enemy = document.getElementById("enemy-team");
	const searchBox = document.getElementById("search");
	const hList = document.getElementById("herolist");
	const strFilter = document.getElementById("str-filter");
	const agiFilter = document.getElementById("agi-filter");
	const intFilter = document.getElementById("int-filter");
	const uniFilter = document.getElementById("uni-filter");
	const bans = document.getElementById("bans");

	if (!me || !enemy || !searchBox || !hList || !strFilter || !agiFilter || !intFilter || !uniFilter || !bans) {
		console.error("document setup not ready before script ran");
		return;
	}
	if (!(hList instanceof HTMLUListElement)) {
		console.debug(hList);
		console.error("hList should be an HTMLUListElement");
		return;
	}
	if (!(strFilter instanceof HTMLInputElement && agiFilter instanceof HTMLInputElement && intFilter instanceof HTMLInputElement && uniFilter instanceof HTMLInputElement)) {
		console.debug(strFilter, agiFilter, intFilter, uniFilter);
		console.error("filters should be checkbox inputs");
		return;
	}
	myTeam = me;
	enemyTeam = enemy;
	heroesList = hList;
	bannedTeam = bans;

	strFilter.checked = false;
	strFilter.addEventListener("change", () => {
		filterState.str = !filterState.str;
		updateListings();
	});
	agiFilter.checked = false;
	agiFilter.addEventListener("change", () => {
		filterState.agi = !filterState.agi;
		updateListings();
	});
	intFilter.checked = false;
	intFilter.addEventListener("change", () => {
		filterState.int = !filterState.int;
		updateListings();
	});
	uniFilter.checked = false;
	uniFilter.addEventListener("change", () => {
		filterState.all = !filterState.all;
		updateListings();
	});
	searchBox.addEventListener("input", search);

	const hs = await getHeroStats();
	for (const h of hs.sort((a,b) => a.localized_name > b.localized_name ? 1 : -1)) {
		allHeroes.push(h);
		const hero = {
			hero: h,
			domElement: createHeroListing(h),
			fuzzyScore: 0,
			onTeam: false
		};
		heroes.push(hero)
		heroMap.set(h.id, hero);
		heroesList.appendChild(hero.domElement);
	}
});
