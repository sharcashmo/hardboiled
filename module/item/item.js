import { RollDialog } from '../apps/roll-dialog.js';

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class HardboiledItem extends Item {
	/**
	 * Augment the basic Item data model with additional dynamic data.
	 */
	prepareData() {
		super.prepareData();

		// Get the Item's data
		/* Unused code ??
		const itemData = this.system
		const actorData = this.actor ? this.actor.system: {};
		const data = itemData.system
		*/
	}

	/**
	 * Handle value modifications
	 * 
	 * @param {Number} value	The new value for the item
	 * @private
	 */
	async updateValue(value) {
		if ('skill' != this.type)
			return null;
		await this.update({'system.value': Number(value)});
	}
	
	/**
	 * Handle toggle values
	 * 
	 * @param {String} propertyId	The name of the property to be toggled
	 */
	async toggleProperty(propertyId) {
		// Melee and range are not toggled, but activated
		if (propertyId === 'melee') {
			this.system.flags.melee = true;
			this.system.flags.range = false;
			this.system.flags.automatic = false;
		}
		else if (propertyId === 'range') {
			this.system.flags.range = true;
			this.system.flags.melee = false;
			this.system.flags.automatic = false;
		}
		else if (propertyId === 'automatic') {
			this.system.flags.automatic = !this.system.flags.automatic &&
				this.system.flags.range;
		}
		await console.log ("flags", this.system.flags);this.update({
			'system.flags.melee': this.system.flags.melee,
			'system.flags.range': this.system.flags.range,
			'system.flags.automatic': this.system.flags.automatic
		})
	}

	/**
	 * Handle clickable rolls
	 * @private
	 */
	async roll() {
		const template = 'systems/hardboiled/templates/chat/basic-check.html';
		const speaker = ChatMessage.getSpeaker(this.actor);
		const skillValue = Number(this.system.value);
		const roll = new Roll("1d100")
		await roll.evaluate({async:true});
		
		// Modifier dialog
		const usage = await RollDialog.create();
		let diceModifier = 0;
		if (usage) {
			diceModifier = usage.get('modifier') * 10;
		}
		
		if (this.actor.system.flags.injured) diceModifier -= 20;
		
		// Values needed for the chat card
		const context = {
			cssClass: "hardboiled",
			actor: this.actor,
			rollCheck: {
				value: roll.result,
				success: (roll.result <= (skillValue + diceModifier) ? true : false)
			},
			checking: {
				name: this.name,
				value: Math.max(0, skillValue + diceModifier)
			},
			diceModifier: (diceModifier > 0 ? '+' + diceModifier : diceModifier)
		};

		const html = await renderTemplate(template, context);
		const chatMessage = await ChatMessage.create({
			speaker,
			type: CONST.CHAT_MESSAGE_TYPES.ROLL,
			roll: roll,
			rollMode: game.settings.get("core", "rollMode"),
			content: html
		});
	}

	/**
	 * Handle item descriptions on chat window
	 * @private
	 */
	async describe() {
		const template = 'systems/hardboiled/templates/chat/basic-description.html';
		const speaker = ChatMessage.getSpeaker(this.actor);
		// Values needed for the chat card
		const context = {
			cssClass: "hardboiled",
			actor: this.actor,
			describe: {
				name: this.name,
				description: this.system.description
			}
		};

		const html = await renderTemplate(template, context);
		const chatMessage = await ChatMessage.create({
			speaker,
			content: html
		});
	}

	/**
	 * Handle combat rolls
	 * @private
	 */
	async startAttack() {
		const speaker = ChatMessage.getSpeaker(this.actor);
		const [fightingSkill, shootingSkill] = this.actor.combatSkills;
		const isMelee = this.system.flags.melee;
		const template = isMelee ? 'systems/hardboiled/templates/chat/combat/melee-combat.html' :
			'systems/hardboiled/templates/chat/combat/ranged-combat.html';
		const combatSkill = isMelee ? fightingSkill : shootingSkill;
		let skillValue = Number(combatSkill.system.value);
		if (this.actor.system.flags.injured) skillValue = Math.max(0, skillValue - 20);
		
		// Values needed for the chat card
		const context = {
			cssClass: "hardboiled",
			actor: this.actor,
			skill: combatSkill,
			weapon: this,
			modifiedValues: {
				skill: skillValue
			},
			flags: {
				range: {
					value: 'basic',
					basic: true
				}
			}
		};
		
		// Generate combat card
		const html = await renderTemplate(template, context);
		
		// and show it
		const chatMessage = await ChatMessage.create({
			speaker,
			content: html
		});
	}
}
