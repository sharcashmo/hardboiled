//Import Modules
import { HardboiledActor } from "./actor/actor.js";
import { HardboiledActorSheet } from "./actor/actor-sheet.js";
import { HardboiledItem } from "./item/item.js";
import { HardboiledItemSheet } from "./item/item-sheet.js";
import { HardboiledCardHelper } from './helper.js';
import { preloadHandlebarsTemplates } from "./templates.js";

Hooks.once('init', async function() {

	game.hardboiled = {
			HardboiledActor,
			HardboiledItem,
			rollItemMacro
	};

	/**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
	CONFIG.Combat.initiative = {
			formula: "@characteristics.dextery.value + @characteristics.insight.value / 100",
			decimals: 4
	};

	// Define custom Entity classes
	CONFIG.Actor.entityClass = HardboiledActor;
	CONFIG.Item.entityClass = HardboiledItem;

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("hardboiled", HardboiledActorSheet, { makeDefault: true });

	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("hardboiled", HardboiledItemSheet, { makeDefault: true });
	
	console.log(game.i18n.localize("Hardboiled.Settings.FightingSkill.default"));
	console.log(game.system.data.title);
	console.log(game.system);
	console.log(game);

	// Register system settings
	game.settings.register("hardboiled", "fightingSkill", {
		name: "Hardboiled.Settings.FightingSkill.label",
		hint: "Hardboiled.Settings.FightingSkill.hint",
		scope: "world",
		type: String,
		default: "Hardboiled.Settings.FightingSkill.default",
		config: true
	});

	game.settings.register("hardboiled", "shootingSkill", {
		name: "Hardboiled.Settings.ShootingSkill.label",
		hint: "Hardboiled.Settings.ShootingSkill.hint",
		scope: "world",
		type: String,
		default: "Hardboiled.Settings.ShootingSkill.default",
		config: true
	});

	preloadHandlebarsTemplates();

	Handlebars.registerHelper('concat', function() {
		var outStr = '';
		for (var arg in arguments) {
			if (typeof arguments[arg] != 'object') {
				outStr += arguments[arg];
			}
		}
		return outStr;
	});
	
	Handlebars.registerHelper('camelConcat', function() {
		var outStr = '';
		for (var arg in arguments) {
			if (typeof arguments[arg] != 'object' && arguments[arg]) {
				let tmpStr = String(arguments[arg]);
				outStr += tmpStr.charAt(0).toUpperCase() + tmpStr.slice(1);;
			}
		}
		return outStr;
	})

	Handlebars.registerHelper('toLowerCase', function(str) {
		return str.toLowerCase();
	});
});

Hooks.once('setup', async function() {
	const fightingSkill = game.i18n.localize(game.settings.get("hardboiled", "fightingSkill"));
	const shootingSkill = game.i18n.localize(game.settings.get("hardboiled", "shootingSkill"));
	
	// Register system settings again, to set their default value
	// It cannot be done at init time because i18n doesn't work by then
	game.settings.register("hardboiled", "fightingSkill", {
		name: "Hardboiled.Settings.FightingSkill.label",
		hint: "Hardboiled.Settings.FightingSkill.hint",
		scope: "world",
		type: String,
		default: fightingSkill,
		config: true
	});

	game.settings.register("hardboiled", "shootingSkill", {
		name: "Hardboiled.Settings.ShootingSkill.label",
		hint: "Hardboiled.Settings.ShootingSkill.hint",
		scope: "world",
		type: String,
		default: shootingSkill,
		config: true
	});
	
	game.settings.set("hardboiled", "fightingSkill", fightingSkill);
	game.settings.set("hardboiled", "shootingSkill", shootingSkill);
});

Hooks.once("ready", async function() {
	// Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
	Hooks.on("hotbarDrop", (bar, data, slot) => createHardboiledMacro(data, slot));
});

Hooks.on('renderChatLog', (app, html, data) => HardboiledCardHelper.activateListeners(app, html, data));

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createHardboiledMacro(data, slot) {
	if (data.type !== "Item") return;
	if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
	const item = data.data;

	// Create the macro command
	const command = `game.hardboiled.rollItemMacro("${item.name}");`;
	let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
	if (!macro) {
		macro = await Macro.create({
			name: item.name,
			type: "script",
			img: item.img,
			command: command,
			flags: { "hardboiled.itemMacro": true }
		});
	}
	game.user.assignHotbarMacro(macro, slot);
	return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
	const speaker = ChatMessage.getSpeaker();
	let actor;
	if (speaker.token) actor = game.actors.tokens[speaker.token];
	if (!actor) actor = game.actors.get(speaker.actor);
	const item = actor ? actor.items.find(i => i.name === itemName) : null;
	if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

	// Trigger the item roll
	return item.roll();
}