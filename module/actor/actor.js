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
		console.log("Aquí");
		if (actorData.type === 'character') this._prepareCharacterData(actorData);
	}

	/**
	 * Prepare Character type specific data
	 */
	_prepareCharacterData(actorData) {
		const data = actorData.data;
		
		console.log("Actor data is ");
		console.log(actorData);

		// List of skills
		data.skills = [];
		for (let [key, skill] of Object.entries(actorData.items)) {
			if (skill.type === 'skill') {
				data.skills.push(skill);
			}
		}

		// Loop through ability scores, and add their modifiers to our sheet output.
//		for (let [key, ability] of Object.entries(data.abilities)) {
//		// Calculate the modifier using d20 rules.
//		ability.mod = Math.floor((ability.value - 10) / 2);
//		}
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