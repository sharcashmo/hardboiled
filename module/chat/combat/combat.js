import { HardboiledCardHelper } from '../../helper.js';

/**
 * Helper classes for Hardboiled combat
 */

export class HardboiledCombat {
	
	/**
	 * HardboiledCombat 
	 * 
	 * @param {DOMStringMap}	message		Dataset of the message element
	 * @param {DOMStringMap}	card		Dataset of the message element
	 * @param {DOMStringMap}	element		Dataset of the message element
	 */
	constructor(message, card, element) {
		this.message = message;
		this.card = card;
		this.element = element;
	}
	
	/**
	 * Makes a roll and shows it if Dice So Nice is active
	 * 
	 * @param {String}  formula		Roll formula
	 */
	async roll(formula) {
		const roll = new Roll(formula).roll();
		if (game.modules.get('dice-so-nice')?.active) {
			await game.dice3d.showForRoll(roll);
		}
		return roll;
	}
}

export class HardboiledMeleeCombat extends HardboiledCombat {

	/**
	 * HardboiledMeleeCombat 
	 */
	constructor(message, card, element) {
		super(message, card, element);
		
		this._contextFromDatasets();
		
		console.log('HardboiledCombat');
		console.log(this);
	}
	
	static template = 'systems/hardboiled/templates/chat/combat/melee-combat.html';
	
	async skillRoll() {
		let toHit = await this._checkSkill(this.element.skillValue);
		console.log('In skillRoll');
		console.log(this);
		
		this.context = {
			...this.context,
			toHit: toHit
		};
		
		this._prepareDamageRoll();
		
		console.log(HardboiledMeleeCombat.template);
		console.log(this.context);
		await HardboiledCardHelper.updateCard(this.message.messageId, HardboiledMeleeCombat.template, this.context);
		
		return;
	}
	
	async damageRoll() {
		const result = await this.roll(this.context.damage.formula);
		this.context.damage.result = Math.max(1, Math.floor(result.total));
		await HardboiledCardHelper.updateCard(this.message.messageId, HardboiledMeleeCombat.template, this.context);
		
		return;
	}
	
	async toggleFlag(flagId) {
		this.context.flags[flagId] = !Boolean(this.context.flags[flagId]);
		
		let skillModifiers = 0 + (this.context.flags.opportunity ? -20 : 0) + (this.context.flags.tired ? -20 : 0);
		this.context.modifiedValues = {
			skill: Math.max(0, this.context.skill.data.value + skillModifiers)
		};
		
		await HardboiledCardHelper.updateCard(this.message.messageId, HardboiledMeleeCombat.template, this.context);
		
		return;
	}
	
	/**
	 * Checks a combat skill
	 * 
	 * @param {Number}	skillValue	Skill value
	 * 
	 * @returns {Object}	result	An object with `success` and `result` fields
	 */
	async _checkSkill(skillValue) {
		const roll = await this.roll('1d100');
		
		if (roll.total > skillValue) {
			return {
				success: 'failure',
				result: roll.result
			}
		}
		else if (skillValue - roll.total > 5) {
			return {
				success: 'success',
				result: roll.result
			}
		}
		else {
			return {
				success: 'critical',
				result: roll.result
			}
		}
	}
	
	/**
	 * Prepare (update context member) damage roll from current data
	 */
	_prepareDamageRoll(skillValue) {
		const successType = this.context.toHit.success;
		const punch = Number(this.context.actor.data.attributes.punch.value);
		const weapon = this.context.weapon;
		console.log('_checkSkill');
		console.log(successType);
		console.log(punch);
		console.log(weapon);
		
		if (weapon) {
			switch (successType) {
			case 'success':
				this.context.damage = {
					formula: punch + '+' + weapon.data.damage
				};
				break;
			case 'critical':
				this.context.damage = {
					formula: punch + '+2*(' + weapon.data.damage + ')'
				};
				break;
			default:
				console.log('This should not happen');
			}
		}
		else {
			switch (successType) {
			case 'success':
				this.context.damage = {
					formula: punch,
					result: punch
				};
				break;
			case 'critical':
				this.context.damage = {
					formula: '3*' + punch,
					result: punch * 3
				};
				break;
			default:
				console.log('This should not happen');
			}
		}
		
		if (this.context.damage) {
			if (this.context.flags.knockOut) {
				this.context.damage.formula = '(' + this.context.damage.formula + ')/2';
				if (this.context.damage.punch) {
					this.context.damage.punch = Math.max(Math.floor(this.context.damage.punch / 2), 1);
				}
			}
		}
	}
	
	/**
	 * Extracts data from datasets and set context value
	 */
	_contextFromDatasets() {
		const actor = game.actors.get(this.card.actorId);
		const [fightingSkill, shootingSkill] = actor.combatSkills;
		const weapon = this.card.weaponId ? actor.getOwnedItem(this.card.weaponId) : null;
		
		this.context = {
			cssClass: 'hardboiled',
			actor: actor.data,
			skill: fightingSkill,
			weapon: weapon?.data
		}
		
		if (this.card.tohitSuccess) {
			this.context = {
				...this.context,
				toHit: {
					success: this.card.tohitSuccess,
					result: this.card.tohitResult
				}
			};
		}
		
		if (this.card.damageFormula) {
			this.context = {
				...this.context,
				damage: {
					formula: this.card.damageFormula,
					result: this.card.damageResult
				}
			}
		}
		
		this.context.flags = {
			opportunity: (this.card.flagsOpportunity === 'true'),
			knockOut: (this.card.flagsKnockout === 'true'),
			tired: (this.card.flagsTired === 'true')
		}
		
		let skillModifiers = 0 + (this.context.flags.opportunity ? -20 : 0) + (this.context.flags.tired ? -20 : 0);
		
		this.context.modifiedValues = {
			skill: Math.max(0, fightingSkill.data.value + skillModifiers)
		};
		
		console.log(this.context);
	}
}

export class HardboiledRangeCombat extends HardboiledCombat {
	
}