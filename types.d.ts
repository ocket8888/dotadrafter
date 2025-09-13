export type Role = "Carry" | "Escape" | "Nuker" | "Support" | "Durable" | "Disabler";

export interface BasicHero {
	attack_type: "Melee" | "Ranged";
	id: number;
	legs: number;
	localized_name: string;
	name: string;
	roles: Array<Role>;
}

export type Attribute = "str" | "agi" | "int" | "all";

type Trend = [number, number, number, number, number, number, number];

interface HeroProperties {
	primary_attr: Attribute;
	img: string;
	icon: string;
	base_health: number;
	base_health_regen: number;
	base_mana: number;
	base_mana_regen: number;
	base_armor: number;
	base_mr: number;
	base_attack_min: number;
	base_attack_max: number;
	base_str: number;
	str_gain: number;
	base_agi: number;
	agi_gain: number;
	base_int: number;
	int_gain: number;
	attack_range: number;
	projectile_speed: number;
	attack_rate: number;
	base_attack_time: number;
	attack_point: number;
	move_speed: number;
	turn_rate: number | null;
	cm_enabled: boolean;
	day_vision: number;
	night_vision: number;
	hero_id: number;
	turbo_picks: number;
	turbo_wins: number;
	pro_ban: number;
	pro_pick: number;
	pro_win: number;
	pub_pick: number;
	pub_pick_trend: Trend;
	pub_win: number;
	pub_win_trend: Trend;
	turbo_picks: number;
	turbo_picks_trend: Trend;
	turbo_wins: number;
	turbo_wins_trend: Trend;

	"1_pick": number;
	"1_win": number;
	"2_pick": number;
	"2_win": number;
	"3_pick": number;
	"3_win": number;
	"4_pick": number;
	"4_win": number;
	"5_pick": number;
	"5_win": number;
	"6_pick": number;
	"6_win": number;
	"7_pick": number;
	"7_win": number;
	"8_pick": number;
	"8_win": number;
}

export type Hero = BasicHero & HeroProperties;

export interface MatchUp {
	hero_id: number;
	games_played: number;
	wins: number;
}

export interface HeroListing {
	hero: Hero;
	domElement: HTMLLIElement;
	matchUpText: HTMLSpanElement;
	fuzzyScore: number | null;
	onTeam: boolean;
}
