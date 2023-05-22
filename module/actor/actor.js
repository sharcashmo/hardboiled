import { RollDialog } from '../apps/roll-dialog.js';

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class HardboiledActor extends Actor {

	/** @override */
	prepareData() {
		// Prepare data for the actor. Calling the super version of this executes
		// the following, in order: data reset (to clear active effects),
		// prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
		// prepareDerivedData().
		super.prepareData();
	}

	/**
	   * @override
	   * Augment the basic actor data with additional dynamic data. Typically,
	   * you'll want to handle most of your calculated/derived data in this step.
	   * Data calculated in this step should generally not exist in template.json
	   * (such as ability modifiers rather than ability scores) and should be
	   * available both inside and outside of character sheets (such as if an actor
	   * is queried and has a roll executed directly from it).
	   */
	prepareDerivedData() {

		const actorData = this;
		//const data = actorData.data;
		//const flags = actorData.flags;

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
				this.system.flags.unconscious = !Boolean(this.system.flags.unconscious);
				break;
			case 'injured':
				this.system.flags.injured = !Boolean(this.system.flags.injured);
				this.system.flags.critical = false;
				this.system.flags.dying = false;
				this.system.flags.dead = false;
				break;
			case 'critical':
				this.system.flags.critical = !Boolean(this.system.flags.critical);
				this.system.flags.injured = this.system.flags.critical || this.system.flags.injured;
				this.system.flags.dying = false;
				this.system.flags.dead = false;
				break;
			case 'dying':
				this.system.flags.dying = !Boolean(this.system.flags.dying);
				this.system.flags.injured = this.system.flags.dying || this.system.flags.injured;
				this.system.flags.critical = this.system.flags.dying || this.system.flags.critical;
				this.system.flags.dead = false;
				break;
			case 'dead':
				this.system.flags.dead = !Boolean(this.system.flags.dead);
				this.system.flags.injured = this.system.flags.dead || this.system.flags.injured;
				this.system.flags.critical = this.system.flags.dead || this.system.flags.critical;
				this.system.flags.dying = this.system.flags.dead || this.system.flags.dying;
				break;
		}

		await this.update({
			'system.flags.unconscious': this.system.flags.unconscious,
			'system.flags.injured': this.system.flags.injured,
			'system.flags.critical': this.system.flags.critical,
			'system.flags.dying': this.system.flags.dying,
			'system.flags.dead': this.system.flags.dead
		})
	}

	/**
	 * Prepare Character type specific data
	 */
	_prepareCharacterData(actorData) {
		// Organize items by type
		const skills = [];
		const talents = [];
		const weapons = [];
		const equipment = [];
		const professionItems = [];
		for (let item of actorData.items) {
			switch (item.type) {
				case 'skill':
					skills.push(item);
					break;
				case 'talent':
					talents.push(item);
					break;
				case 'weapon':
					weapons.push(item);
					break;
				case 'equipment':
					equipment.push(item);
					break;
				case 'profession':
					professionItems.push(item);
					break;
				default:
					console.log("Unknown item type!!:", item.type)
			}
		}
		// Get additional values for weapons
		actorData.skills = skills
		actorData.talents = talents
		actorData.weapons = weapons
		actorData.equipment = equipment
		actorData.professionItems = professionItems
		console.log("_prepareCharacterData actorData", actorData)
		this._getCombatValues(actorData);
	}

	/**
	 * Get combat values
	 */
	_getCombatValues(actorData) {
		//const system = actorData;
		console.log("Gettting Combat")
		//[actorData.fightingSkill, actorData.shootingSkill] = this.combatSkills;
		const [fightingSkill, shootingSkill] = this.combatSkills;
		actorData.fightingSkill = fightingSkill;
		actorData.shootingSkill = shootingSkill;
		console.log("combat siklls setup complete:", actorData)
		
	}

	/**
	 * Do an attribute check
	 * 
	 * @param {String}	attribute	Attribute name
	 */
	async attributeCheck(attribute) {
		const template = 'systems/hardboiled/templates/chat/basic-check.html';
		const speaker = ChatMessage.getSpeaker(this);
		const roll = new Roll("1d100");
		await roll.evaluate({ async: true });
		const attrValue = Number(this.system.characteristics[attribute].value);

		// Modifier dialog
		const usage = await RollDialog.create();
		let diceModifier = 0;
		if (usage) {
			diceModifier = usage.get('modifier') * 10;
		}

		if (this.system.flags.injured && (attribute === 'vigour' || (attribute === 'dextery'))) diceModifier -= 20;

		// Values needed for the chat card
		const context = {
			cssClass: "hardboiled",
			actor: this,
			rollCheck: {
				value: roll.result,
				success: (roll.result <= (attrValue + diceModifier) ? true : false)
			},
			checking: {
				name: game.i18n.localize(this.system.characteristics[attribute].label),
				value: Math.max(0, attrValue + diceModifier),
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
	 * Do a skill check
	 * 
	 * @param {String}	skillId		Id of the skill item to be checked
	 */
	async skillCheck(skillId) {
		const skill = this.items.get(skillId);

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
		const talent = this.items.get(talentId);

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
			const weapon = this.items.get(weaponId);

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
		console.log("lalala")
		const speaker = ChatMessage.getSpeaker(this);
		console.log("lalalbbassa")
		const [fightingSkill, shootingSkill] = this.combatSkills;
		const template = 'systems/hardboiled/templates/chat/combat/melee-combat.html';
		const combatSkill = fightingSkill;
		const skillValue = Number(combatSkill.system.value);

		// Values needed for the chat card
		const context = {
			cssClass: "hardboiled",
			actor: this.system,
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
		const system = this.system;
		let fightingSkill = {
			name: game.i18n.localize(system.characteristics.vigour.label),
			system: {
				value: Math.floor(system.characteristics.vigour.value / 10)
			}
		};

		let shootingSkill = {
			name: game.i18n.localize(system.characteristics.dextery.label),
			system: {
				value: Math.floor(system.characteristics.dextery.value / 10)
			}
		};

		//console.log("Shoting Skill before:", shootingSkill)
		// Get combat skills
		for (let skill of this.skills) {
			if (skill.name.toLowerCase() == fightingSkillStr.toLowerCase()) {
				fightingSkill.name = skill.name;
				fightingSkill.system.value = skill.system.value;
			}
			if (skill.name.toLowerCase() == shootingSkillStr.toLowerCase()) {
				shootingSkill.name = skill.name;
				shootingSkill.system.value = skill.system.value;
			}
		}

		return [fightingSkill, shootingSkill];
	}

	get maxHP() {
		if (this.system.attributes.maxhp.auto) {
			if (this.system.characteristics.vigour.value != null) {
				const maxHP = 10;
				return maxHP;
			}
			else return null;
		}
		return parseInt(this.system.attributes.maxhp.value);
	}

	get punch() {
		if (this.system.attributes.punch.auto) {
			if (this.system.characteristics.vigour.value != null) {
				const punch = Math.floor((this.system.characteristics.vigour.value - 1) / 10) + 1;
				return punch;
			}
			else return null;
		}
		return parseInt(this.system.attributes.punch.value);
	}
}