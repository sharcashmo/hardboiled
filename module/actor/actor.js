import { RollDialog } from '../apps/roll-dialog.js';

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class HardboiledActor extends Actor {
	/**
	 * Augment the basic actor data with additional dynamic data.
	 */
	prepareData() {
		super.prepareData();

		const actorData = this.data;
		const data = actorData.data;
		const flags = actorData.flags;

		// Make separate methods for each Actor type (character, npc, etc.) to keep
		// things organized.
		if (actorData.type === 'character') this._prepareCharacterData(actorData);
	}

	/**
	 * Prepare Character type specific data
	 */
	_prepareCharacterData(actorData) {
		const data = actorData.data;
		
		// List of skills
		data.skills = [];
		for (let [key, skill] of Object.entries(actorData.items)) {
			if (skill.type === 'skill') {
				data.skills.push(skill);
			}
		}
		
		// List of talents
		data.talents = [];
		for (let [key, talent] of Object.entries(actorData.items)) {
			if (talent.type === 'talent') {
				data.talents.push(talent);
			}
		}
	}
	
	/**
	 * 
	 */
	async attributeCheck(attribute)
	{
		console.log('Attribute check ' + attribute);
		const template = 'systems/hardboiled/templates/chat/basic-check.html';
		const speaker = ChatMessage.getSpeaker(this);
		const roll = new Roll("1d100").roll();
		const attrValue = Number(this.data.data.characteristics[attribute].value);
		
		// Modifier dialog
		const usage = await RollDialog.create();
		let diceModifier = 0;
		if (usage) {
			diceModifier = usage.get('modifier') * 10;
		}
		
		// Values needed for the chat card
		const context = {
			cssClass: "hardboiled",
			actor: this,
			rollCheck: {
				value: roll.results[0],
				success: (roll.results[0] <= (attrValue + diceModifier) ? true : false)
			},
			checking: {
				name: game.i18n.localize(this.data.data.characteristics[attribute].label),
				value: attrValue,
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
	 * 
	 */
	async skillCheck(skillId) {
		console.log('Skill check ' + skillId);
		const template = 'systems/hardboiled/templates/chat/basic-check.html';
		const speaker = ChatMessage.getSpeaker(this);
		const skill = this.getOwnedItem(skillId);
		const skillValue = Number(skill.data.data.value);
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
			actor: this,
			rollCheck: {
				value: roll.results[0],
				success: (roll.results[0] <= (skillValue + diceModifier) ? true : false)
			},
			checking: {
				name: skill.data.name,
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
	 * 
	 */
	async talentCheck(talentId) {
		console.log('Talent check ' + talentId);
		const template = 'systems/hardboiled/templates/chat/basic-description.html';
		const speaker = ChatMessage.getSpeaker(this);
		const talent = this.getOwnedItem(talentId);
		
		// Values needed for the chat card
		const context = {
			cssClass: "hardboiled",
			actor: this,
			describe: {
				name: talent.data.name,
				description: talent.data.data.description
			}
		};

		const html = await renderTemplate(template, context);
		const chatMessage = await ChatMessage.create({
			speaker,
			content: html
		});
	}
	

	/**
	 * Special getters for actors
	 */
	get maxHP() {
		if( this.data.data.attributes.maxhp.auto) {
			if (this.data.data.characteristics.vigour.value != null) {
				const maxHP = 10;
				return maxHP;
			}
			else return null;
		}
		return parseInt( this.data.data.attributes.maxhp.value);
	}
	
	get punch() {
		if (this.data.data.attributes.punch.auto) {
			if (this.data.data.characteristics.vigour.value != null) {
				const punch = Math.floor((this.data.data.characteristics.vigour.value - 1) / 10) + 1;
				return punch;
			}
			else return null;
		}
		return parseInt (this.data.data.attributes.punch.value);
	}
}