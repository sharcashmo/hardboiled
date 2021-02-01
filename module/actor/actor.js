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
	 * Handle toggle values
	 * 
	 * @param {String} propertyId	The name of the property to be toggled
	 */
	async toggleProperty(propertyId) {
		switch (propertyId) {
		case 'unconscious':
			this.data.data.flags.unconscious = !Boolean(this.data.data.flags.unconscious);
			break;
		case 'injured':
			this.data.data.flags.injured = !Boolean(this.data.data.flags.injured);
			this.data.data.flags.critical = false;
			this.data.data.flags.dying = false;
			this.data.data.flags.dead = false;
			break;
		case 'critical':
			this.data.data.flags.critical = !Boolean(this.data.data.flags.critical);
			this.data.data.flags.injured = this.data.data.flags.critical || this.data.data.flags.injured;
			this.data.data.flags.dying = false;
			this.data.data.flags.dead = false;
			break;
		case 'dying':
			this.data.data.flags.dying = !Boolean(this.data.data.flags.dying);
			this.data.data.flags.injured = this.data.data.flags.dying || this.data.data.flags.injured;
			this.data.data.flags.critical = this.data.data.flags.dying || this.data.data.flags.critical;
			this.data.data.flags.dead = false;
			break;
		case 'dead':
			this.data.data.flags.dead = !Boolean(this.data.data.flags.dead);
			this.data.data.flags.injured = this.data.data.flags.dead || this.data.data.flags.injured;
			this.data.data.flags.critical = this.data.data.flags.dead || this.data.data.flags.critical;
			this.data.data.flags.dying = this.data.data.flags.dead || this.data.data.flags.dying;
			break;
		}
		
		await this.update({
			'data.flags.unconscious': this.data.data.flags.unconscious,
			'data.flags.injured': this.data.data.flags.injured,
			'data.flags.critical': this.data.data.flags.critical,
			'data.flags.dying': this.data.data.flags.dying,
			'data.flags.dead': this.data.data.flags.dead
		})
	}

	/**
	 * Prepare Character type specific data
	 */
	_prepareCharacterData(actorData) {
		const data = actorData.data;
		
		// Organize items by type
		data.skills = [];
		data.talents = [];
		data.weapons = [];
		data.equipment = [];
		for (let [key, item] of Object.entries(actorData.items)) {
			let listname = item.type;
			switch (item.type) {
			case 'skill':
			case 'talent':
			case 'weapon':
				listname += 's';
			case 'equipment':
				data[listname].push(item);
				break;
			}
		}
		
		// Get additional values for weapons
		this._getCombatValues(actorData);
	}
	
	/**
	 * Get combat values
	 */
	_getCombatValues(actorData)	{
		const data = actorData.data;
		
		[data.fightingSkill, data.shootingSkill] = this.combatSkills;
	}
	
	/**
	 * Do an attribute check
	 * 
	 * @param {String}	attribute	Attribute name
	 */
	async attributeCheck(attribute)
	{
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
		
		if (this.data.data.flags.injured && (attribute === 'vigour' || (attribute === 'dextery'))) diceModifier -= 20;
		
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
				value: Math.max(0, attrValue + diceModifier),
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
	 * Do a skill check
	 * 
	 * @param {String}	skillId		Id of the skill item to be checked
	 */
	async skillCheck(skillId) {
		const skill = this.getOwnedItem(skillId);
		
		if (skill) {
			skill.roll();
		}
	}
	
	/**
	 * Do a talent check
	 * 
	 * @param {String}	talentId	Id of the talent item to be checked
	 */
	async talentCheck(talentId) {
		const talent = this.getOwnedItem(talentId);
		
		if (talent) {
			talent.describe();
		}
	}
	
	/**
	 * Do a combat check. If weaponId is *none*, treat it as an unarmed attack
	 * 
	 * @param {String}	weaponId	Id of the weapon item to be checked
	 */
	async combatCheck(weaponId) {
		if (weaponId === 'none') {
			this.startUnarmedAttack();
		}
		else {
			const weapon = this.getOwnedItem(weaponId);
			
			if (weapon) {
				weapon.startAttack();
			}
		}
	}

	/**
	 * Handle combat rolls
	 * @private
	 */
	async startUnarmedAttack() {
		const speaker = ChatMessage.getSpeaker(this);
		const [fightingSkill, shootingSkill] = this.combatSkills;
		const template = 'systems/hardboiled/templates/chat/combat/melee-combat.html';
		const combatSkill = fightingSkill;
		const skillValue = Number(combatSkill.data.value);
		
		console.log(this);
		console.log(fightingSkill);
		console.log(shootingSkill);
		console.log(combatSkill);
		console.log(skillValue);
		
		// Values needed for the chat card
		const context = {
			cssClass: "hardboiled",
			actor: this.data,
			skill: combatSkill,
			weapon: null,
			modifiedValues: {
				skill: skillValue
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

	/**
	 * Special getters for actors
	 */
	get combatSkills() {
		const fightingSkillStr = game.settings.get("hardboiled", "fightingSkill");
		const shootingSkillStr = game.settings.get("hardboiled", "shootingSkill");
		const data = this.data.data;
		
		let fightingSkill = {
				name: game.i18n.localize(data.characteristics.vigour.label),
				data: {
					value: Math.floor(data.characteristics.vigour.value / 10)
				}
		};
		
		let shootingSkill = {
				name: game.i18n.localize(data.characteristics.dextery.label),
				data: {
					value: Math.floor(data.characteristics.dextery.value / 10)
				}
		};
		
		// Get combat skills
		for (let [key, skill] of Object.entries(data.skills)) {
			if (skill.name.toLowerCase() == fightingSkillStr.toLowerCase()) {
				fightingSkill = skill;
			}
			if (skill.name.toLowerCase() == shootingSkillStr.toLowerCase()) {
				shootingSkill = skill;
			}
		}
		
		return [fightingSkill, shootingSkill];
	}
	
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