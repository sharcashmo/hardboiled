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
		const itemData = this.data;
		const actorData = this.actor ? this.actor.data : {};
		const data = itemData.data;
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
		await this.update({'data.value': Number(value)});
	}
	
	/**
	 * Handle toggle values
	 * 
	 * @param {String} propertyId	The name of the property to be toggled
	 */
	async toggleProperty(propertyId) {
		// Melee and range are not toggled, but activated
		if (propertyId === 'melee') {
			this.data.data.flags.melee = true;
			this.data.data.flags.range = false;
			this.data.data.flags.automathic = false;
		}
		else if (propertyId === 'range') {
			this.data.data.flags.range = true;
			this.data.data.flags.melee = false;
			this.data.data.flags.automathic = false;
		}
		else if (propertyId === 'automathic') {
			this.data.data.flags.automathic = !this.data.data.flags.automathic &&
				this.data.data.flags.range;
		}
		
		await this.update({
			'data.flags.melee': this.data.data.flags.melee,
			'data.flags.range': this.data.data.flags.range,
			'data.flags.automathic': this.data.data.flags.automathic
		})
	}

	/**
	 * Handle clickable rolls
	 * @private
	 */
	async roll() {
		const template = 'systems/hardboiled/templates/chat/basic-check.html';
		const speaker = ChatMessage.getSpeaker(this.actor);
		const skillValue = Number(this.data.data.value);
		const roll = new Roll("1d100").roll();
		
		// Modifier dialog
		const usage = await RollDialog.create();
		let diceModifier = 0;
		if (usage) {
			diceModifier = usage.get('modifier') * 10;
		}
		
		// Values needed for the chat card
		const context = {
			cssClass: "hardboiled",
			actor: this.actor,
			rollCheck: {
				value: roll.results[0],
				success: (roll.results[0] <= (skillValue + diceModifier) ? true : false)
			},
			checking: {
				name: this.data.name,
				value: skillValue
			},
			diceModifier: (diceModifier > 0 ? '+' + diceModifier : diceModifier)
		};

		const html = await renderTemplate(template, context);
		const chatMessage = await ChatMessage.create({
			speaker,
			type: CHAT_MESSAGE_TYPES.ROLL,
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
				name: this.data.name,
				description: this.data.data.description
			}
		};

		const html = await renderTemplate(template, context);
		const chatMessage = await ChatMessage.create({
			speaker,
			content: html
		});
	}
}
