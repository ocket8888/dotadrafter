/** @typedef {import("./types").Attribute} Attribute */
/** @typedef {import("./types").Hero} Hero */
/** @typedef {import("./types").HeroListing} HeroListing */
/** @typedef {import("./types").MatchUp} MatchUp */

/**
 * @returns {Promise<Array<Hero>>}
 */
async function getHeroStats() {
	const response = await fetch(new URL("https://api.opendota.com/api/heroStats"));
	return response.json();
}

/**
 * Gets matchup stats for a given hero versus other heroes.
 *
 * @param {number} id The ID of the hero to fetch.
 * @returns {Promise<Array<MatchUp>>} A list of the matchups for the Hero identified by `id`.
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

const colorMax = 225;
const colorMin =  70;

/** @param {number} n */
function getNumberColor(n) {
	if (n > 10) {
		n = 10;
	} else if (n < -10) {
		n = -10;
	}
	const midPoint = ((colorMax + colorMin)/2);
	const midPointDistance = (colorMax-colorMin)/2;
	const g = midPoint + (n*midPointDistance/10);
	const r = midPoint - (n*midPointDistance/10);
	const b = midPoint - Math.abs(n)*(midPoint - colorMin)/10;
	return [r, g, b];
}

/** @type {Array<Hero>} */
const allHeroes = [];
/** @type {Map<number, HeroListing>} */
const heroMap = new Map();
/** @type {Map<number, Record<number, MatchUp>>} */
const matchupMap = new Map();

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
 *
 * @param {Hero} hero The hero in question.
 * @returns {HTMLImageElement} An HTML image element that displays the hero.
 */
function heroImage(hero) {
	const elem = document.createElement("img");
	elem.src = `https://cdn.cloudflare.steamstatic.com${hero.img}`;
	elem.alt = `an icon representative of DotA2 hero "${hero.localized_name}"`;
	return elem;
}

/**
 * Gets a hero from the local cache of hero listings.
 *
 * @param {number} id The ID of the hero to fetch.
 * @returns {HeroListing} The requested hero.
 * @throws {Error} If no Hero exists with the given `id`.
 */
function getHero(id) {
	const hero = heroMap.get(id);
	if (!hero) {
		throw new Error(`no hero by ID ${id}`);
	}
	return hero;
}

/**
 * Removes a hero from the specified team or ban list.
 *
 * @param {Hero} hero The hero to remove.
 * @param {"ally" | "enemy" | "ban"} team The team from which to remove the hero (or "ban" to unban
 * a hero).
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
 * Adds a hero to a team or the ban list.
 *
 * @param {Hero} hero The hero to add.
 * @param {"ally" | "enemy" | "ban"} team The team to which to add the hero (or "ban" for adding it
 * to the ban list).
 */
function addToTeam(hero, team) {
	if (!matchupMap.has(hero.id)) {
		getMatchups(hero.id).then(
			m => {
				matchupMap.set(hero.id, Object.fromEntries(m.map(x => [x.hero_id, x])));
			}
		);
	}
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
 * Selects a hero for display in the detailed view pane on the right.
 *
 * @param {null | Hero} hero The selected hero, or `null` to clear selection.
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
 * @returns {[HTMLLIElement, HTMLSpanElement]} The full DOM element for the hero and the descendent
 * span for holding matchup text.
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
	const matchupSpan = document.createElement("span");
	matchupSpan.classList.add("matchup-text");
	elem.appendChild(matchupSpan);
	elem.addEventListener("click", () => {
		selectHero(hero);
	});
	elem.classList.add(hero.primary_attr);
	return [elem, matchupSpan];
}

/**
 * Checks if a given hero listing should be hidden based on the current filter states and the hero's
 * fuzzy score.
 *
 * @param {HeroListing} heroListing The hero to check.
 * @returns {boolean} `true` if the hero should be hidden, `false` otherwise.
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
 * Gets a specified team or ban list.
 *
 * @param {"ally" | "enemy" | "ban"} team The team to get - or "ban" to retrieve the ban list.
 * @returns {Array<number>} A list of the IDs of the Heroes on the requested team.
 */
function getTeam(team) {
	let teamElem;
	switch (team) {
		case "ally":
			teamElem = myTeam;
			break;
		case "enemy":
			teamElem = enemyTeam;
			break;
		case "ban":
			teamElem = bannedTeam;
			break;
	}
	return Array.from(teamElem.children).map(e => Number(e.id));
}

/**
 *
 * @param {HeroListing} hero
 * @param {MatchUp | null} matchup
 */
function setMatchups(hero, matchup) {
	let amt = 0;
	if (matchup !== null) {
		amt = Math.round((1000 * matchup.wins / matchup.games_played) - 500)/10;
	}
	for (const child of hero.matchUpText.children) {
		hero.matchUpText.removeChild(child);
	}
	hero.matchUpText.style.color = `rgb(${getNumberColor(amt).join(", ")})`
	hero.matchUpText.textContent = `${amt < 0 ? "" : "+"}${amt.toFixed(1)}%`;
	const txt = matchup === null ? "(0/0)" : `(${matchup.wins}/${matchup.games_played})`;
	hero.matchUpText.appendChild(createElementWithText("span", txt));
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
	/** @type {null | Record<number, MatchUp>} */
	let matchups = null;
	const enemies = getTeam("enemy");
	let enemy = enemies.pop();
	if (enemy) {
		const initialMatchups = matchupMap.get(enemy);
		if (!initialMatchups) {
			console.warn("attempting to calculate winrates before matchup request complete for hero", enemy);
		} else {
			matchups = initialMatchups;
			for (enemy of enemies) {
				const mus = matchupMap.get(enemy);
				if (!mus) {
					console.warn("attempting to calculate winrates before matchup request complete for hero", enemy);
					continue;
				}
				for (const [id, mu] of Object.entries(mus)) {
					const numericID = Number(id);
					matchups[numericID].games_played += mu.games_played;
					matchups[numericID].wins += mu.wins;
				}
			}
		}
	}
	for (const hero of heroes) {
		// some heroes have no match data; e.g. Kez in captains mode games (so pro league)
		setMatchups(hero, matchups === null ? null : matchups[hero.hero.id] ?? null);
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
	if (!(searchBox instanceof HTMLInputElement)) {
		console.debug(searchBox);
		console.error("search box input should be an input");
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
	searchBox.value = "";
	document.addEventListener("reset", search);

	const hs = await getHeroStats();
	for (const h of hs.sort((a,b) => a.localized_name > b.localized_name ? 1 : -1)) {
		allHeroes.push(h);
		const [domElement, matchUpText] = createHeroListing(h);
		const hero = {
			hero: h,
			domElement,
			matchUpText,
			fuzzyScore: 0,
			onTeam: false
		};
		setMatchups(hero, null);
		heroes.push(hero)
		heroMap.set(h.id, hero);
		heroesList.appendChild(hero.domElement);
	}
});
