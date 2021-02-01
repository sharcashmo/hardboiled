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
	}
	
	static template = 'systems/hardboiled/templates/chat/combat/melee-combat.html';
	
	async skillRoll() {
		let toHit = await this._checkSkill(this.element.skillValue);
		
		this.context = {
			...this.context,
			toHit: toHit
		};
		
		this._prepareDamageRoll();
		
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
				const roll = new Roll(this.context.damage.formula);
				this.context.damage.result = roll.evaluate({maximize: true}).total;
				break;
			default:
				console.log('[DEBUG.Hardboiled] This should not happen');
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
			case 'failure':
				break;
			default:
				console.log('[DEBUG.Hardboiled] This should not happen');
			}
		}
		
		if (this.context.damage) {
			if (this.context.flags.knockOut) {
				this.context.damage.formula = '(' + this.context.damage.formula + ')/2';
				if (this.context.damage.result) {
					this.context.damage.result = Math.max(Math.floor(this.context.damage.result / 2), 1);
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
	}
}

export class HardboiledRangeCombat extends HardboiledCombat {

	/**
	 * HardboiledRangeCombat 
	 */
	constructor(message, card, element) {
		super(message, card, element);
		
		this._contextFromDatasets();
	}
	
	static template = 'systems/hardboiled/templates/chat/combat/ranged-combat.html';
	
	static rangeModifiers = {
		'close': +10,
		'basic': 0,
		'medium': -10,
		'long': -20,
		'extreme': -30
	};
	
	static targetModifiers = {
		'inmobilized': +10,
		'normal': 0,
		'running': -10,
		'kneeled': -10,
		'crawling': -20,
		'meleeEngaged': -10
	};
	
	static targetCoverageModifiers = {
		'none': 0,
		'small': -10,
		'medium': -20,
		'total': -30
	};
	
	static targetVehicleModifiers = {
		'no': 0,
		'slow': -10,
		'medium': -20,
		'fast': -30
	};
	
	static multipleTargetsModifiers = {
		'no': 0,
		'two': -10,
		'three': -20,
		'four': -30
	};
	
	static attackerModifiers = {
		'telescopicSight': 10,
		'aimed': 10,
		'twoWeapons': -30,
		'specificTarget': -30
	};
	
	static attackerVehicleModifiers = {
		'no': 0,
		'slow': -10,
		'medium': -20,
		'fast': -30
	}
	
	static attackerBurstModifiers = {
		'no': 0,
		'short': 10,
		'medium': -20,
		'complete': -30
	}
	
	async skillRoll() {
		let toHit = await this._checkSkill(this.element.skillValue);
		
		this.context = {
			...this.context,
			toHit: toHit
		};
		
		this._prepareDamageRoll();
		
		await HardboiledCardHelper.updateCard(this.message.messageId, HardboiledRangeCombat.template, this.context);
		
		return;
	}
	
	async damageRoll() {
		const result = await this.roll(this.context.damage.formula);
		this.context.damage.result = Math.max(1, Math.floor(result.total));
		await HardboiledCardHelper.updateCard(this.message.messageId, HardboiledRangeCombat.template, this.context);
		
		return;
	}
	
	async toggleFlag(flagId, flagGroup=null) {
		if (flagGroup) {
			if (flagId !== 'group') {
				if (flagGroup === 'range')
					this.context.flags[flagGroup][flagId] = true;
				else
					this.context.flags[flagGroup][flagId] = !Boolean(this.context.flags[flagGroup][flagId]);
				
				if (flagGroup !== 'attacker') {
					for (let [key, item] of Object.entries(this.context.flags[flagGroup])) {
						if (key !== flagId && key !== 'group') {
							this.context.flags[flagGroup][key] = false;
						}
					}
					
					if (this.context.flags[flagGroup][flagId])
						this.context.flags[flagGroup].value = flagId;
					else
						this.context.flags[flagGroup].value = null;
					
					this.context.flags[flagGroup].group = false;
				}
			}
			else {
				this.context.flags[flagGroup][flagId] = !Boolean(this.context.flags[flagGroup][flagId]);
				
				for (let [key, item] of Object.entries(this.context.flags)) {
					if (key !== flagGroup && this.context.flags[key].group == true) {
						this.context.flags[key].group = false;
					}
				}
			}
		}
		else {
			this.context.flags[flagId] = !Boolean(this.context.flags[flagId]);
		}
		
		let skillModifiers = 0;
		
		skillModifiers += HardboiledRangeCombat.rangeModifiers[this.context.flags.range.value];
		
		if (this.context.flags.target?.value) skillModifiers += HardboiledRangeCombat.targetModifiers[this.context.flags.target.value];
		
		if (this.context.flags.targetCoverage?.value) skillModifiers += HardboiledRangeCombat.targetCoverageModifiers[this.context.flags.targetCoverage.value];
		
		if (this.context.flags.targetVehicle?.value) skillModifiers += HardboiledRangeCombat.targetVehicleModifiers[this.context.flags.targetVehicle.value];
		
		if (this.context.flags.multipleTargets?.value) skillModifiers += HardboiledRangeCombat.multipleTargetsModifiers[this.context.flags.multipleTargets.value];
		
		if (this.context.flags.attackerVehicle?.value) skillModifiers += HardboiledRangeCombat.attackerVehicleModifiers[this.context.flags.attackerVehicle.value];
		
		if (this.context.flags.attackerBurst?.value) skillModifiers += HardboiledRangeCombat.attackerBurstModifiers[this.context.flags.attackerBurst.value];
		
		for (let [key, item] of Object.entries(this.context.flags.attacker)) {
			if (this.context.flags.attacker[key]) skillModifiers += HardboiledRangeCombat.attackerModifiers[key];
		}
		
		this.context.modifiedValues = {
			skill: Math.max(0, this.context.skill.data.value + skillModifiers)
		};
		
		await HardboiledCardHelper.updateCard(this.message.messageId, HardboiledRangeCombat.template, this.context);
		
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
		
		if (roll.total > 98) {
			return {
				success: 'fumble',
				result: roll.result
			}
		}
		else if (roll.total > skillValue) {
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
		const weapon = this.context.weapon;
		let burstDamage = 0;
		
		if (this.context.flags.attackerBurst.value === 'medium') burstDamage = weapon.data.fireRate.medium * 2;
		else if (this.context.flags.attackerBurst.value === 'complete') burstDamage = weapon.data.fireRate.complete * 3;
		else burstDamage = 0;
		
		switch (successType) {
		case 'success':
			this.context.damage = {
				formula: burstDamage ? burstDamage + '+' + weapon.data.damage : weapon.data.damage 
			};
			break;
		case 'critical':
			this.context.damage = {
				formula: burstDamage ? burstDamage + '+2*(' + weapon.data.damage + ')' : '2*(' + weapon.data.damage + ')'
			};
			const roll = new Roll(this.context.damage.formula);
			this.context.damage.result = roll.evaluate({maximize: true}).total;
			break;
		case 'failure':
		case 'fumble':
			break;
		default:
			console.log('[DEBUG.Hardboiled] This should not happen');
		}
		
		if (this.context.damage) {
			if (this.context.flags.knockOut) {
				this.context.damage.formula = '(' + this.context.damage.formula + ')/2';
				if (this.context.damage.result) {
					this.context.damage.result = Math.max(Math.floor(this.context.damage.result / 2), 1);
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
		const weapon = actor.getOwnedItem(this.card.weaponId);
		
		this.context = {
			cssClass: 'hardboiled',
			actor: actor.data,
			skill: shootingSkill,
			weapon: weapon.data
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
			range: {
				value: this.card.flagsRangeValue ? this.card.flagsRangeValue : 'basic',
				group: (this.card.flagsRangeGroup === 'true'),
				close: (this.card.flagsRangeClose === 'true'),
				basic: (this.card.flagsRangeBasic === 'true'),
				medium: (this.card.flagsRangeMedium === 'true'),
				long: (this.card.flagsRangeLong === 'true'),
				extreme: (this.card.flagsRangeExtreme === 'true')
			},
			target: {
				value: this.card.flagsTargetValue ? this.card.flagsTargetValue : 'normal',
				group: (this.card.flagsTargetGroup === 'true'),
				inmobilized: (this.card.flagsTargetInmobilized === 'true'),
				running: (this.card.flagsTargetRunning === 'true'),
				kneeled: (this.card.flagsTargetKneeled === 'true'),
				crawling: (this.card.flagsTargetCrawling === 'true'),
				meleeEngaged: (this.card.flagsTargetMeleeEngaged === 'true')
			},
			targetCoverage: {
				value: this.card.flagsTargetcoverageValue ? this.card.flagsTargetcoverageValue : 'none',
				group: (this.card.flagsTargetcoverageGroup === 'true'),
				small: (this.card.flagsTargetcoverageSmall === 'true'),
				medium: (this.card.flagsTargetcoverageMedium === 'true'),
				total: (this.card.flagsTargetcoverageTotal === 'true')
			},
			targetVehicle: {
				value: this.card.flagsTargetvehicleValue ? this.card.flagsTargetvehicleValue : 'no',
				group: (this.card.flagsTargetvehicleGroup === 'true'),
				slow: (this.card.flagsTargetvehicleSlow === 'true'),
				medium: (this.card.flagsTargetvehicleMedium === 'true'),
				fast: (this.card.flagsTargetvehicleFast === 'true')
			},
			multipleTargets: {
				value: this.card.flagsMultipletargetsValue ? this.card.flagsMultipletargetsValue : 'no',
				group: (this.card.flagsMultipletargetsGroup === 'true'),
				two: (this.card.flagsMultipletargetsTwo === 'true'),
				three: (this.card.flagsMultipletargetsThree === 'true'),
				four: (this.card.flagsMultipletargetsFour === 'true')
			},
			attacker: {
				telescopicSight: (this.card.flagsAttackerTelescopicsight === 'true'),
				aimed: (this.card.flagsAttackerAimed === 'true'),
				twoWeapons: (this.card.flagsAttackerTwoweapons === 'true'),
				specificTarget: (this.card.flagsAttackerSpecifictarget === 'true')
			},
			attackerVehicle: {
				value: this.card.flagsAttackervehicleValue ? this.card.flagsAttackervehicleValue : 'no',
				group: (this.card.flagsAttackervehicleGroup === 'true'),
				slow: (this.card.flagsAttackervehicleSlow === 'true'),
				medium: (this.card.flagsAttackervehicleMedium === 'true'),
				fast: (this.card.flagsAttackervehicleFast === 'true')
			},
			attackerBurst: {
				value: this.card.flagsAttackerburstValue ? this.card.flagsAttackerburstValue : 'no',
				group: (this.card.flagsAttackerburstGroup === 'true'),
				short: (this.card.flagsAttackerburstShort === 'true'),
				medium: (this.card.flagsAttackerburstMedium === 'true'),
				complete: (this.card.flagsAttackerburstComplete === 'true')
			}
		}
		
		let skillModifiers = 0;
		
		skillModifiers += HardboiledRangeCombat.rangeModifiers[this.context.flags.range.value];
		
		if (this.context.flags.target?.value) skillModifiers += HardboiledRangeCombat.targetModifiers[this.context.flags.target.value];
		
		if (this.context.flags.targetCoverage?.value) skillModifiers += HardboiledRangeCombat.targetCoverageModifiers[this.context.flags.targetCoverage.value];
		
		if (this.context.flags.targetVehicle?.value) skillModifiers += HardboiledRangeCombat.targetVehicleModifiers[this.context.flags.targetVehicle.value];
		
		if (this.context.flags.multipleTargets?.value) skillModifiers += HardboiledRangeCombat.multipleTargetsModifiers[this.context.flags.multipleTargets.value];
		
		if (this.context.flags.attackerVehicle?.value) skillModifiers += HardboiledRangeCombat.attackerVehicleModifiers[this.context.flags.attackerVehicle.value];
		
		if (this.context.flags.attackerBurst?.value) skillModifiers += HardboiledRangeCombat.attackerBurstModifiers[this.context.flags.attackerBurst.value];
		
		for (let [key, item] of Object.entries(this.context.flags.attacker)) {
			if (this.context.flags.attacker[key]) skillModifiers += HardboiledRangeCombat.attackerModifiers[key];
		}
		
		this.context.modifiedValues = {
			skill: Math.max(0, this.context.skill.data.value + skillModifiers)
		};
	}
}