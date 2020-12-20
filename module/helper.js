import { RollDialog } from './apps/roll-dialog.js';

/**
 * Helper classes for Hardboiled entities and entity sheets
 */

export class HardboiledHelper {
	
}

/**
 * Helper class for Hardboiled entity sheets
 * 
 * This class encapsulates the following functionalities:
 * 
 * + Event binding for the following CSS classes:
 *   
 *   - 
 */
export class HardboiledSheetHelper {
	
	/**
	 * Bind roll checks
	 * 
	 * @param {Entity} entity	The entity represented by the sheet
	 * @param {String} html		html string of the sheet
	 */
	static activateListeners(entity, html) {
		
		// Owner events
		if (entity.owner) {
			html.find('.rollable').click(HardboiledSheetHelper._onRoll.bind(entity));
		}
	}

	/**
	 * Handle rolls checks
	 * @param {Event} event   The originating click event
	 * @private
	 */
	static async _onRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;
		const entity = this;

		if (dataset.attributecheck) {
			const template = 'systems/hardboiled/templates/chat/basic-check.html';
			const speaker = ChatMessage.getSpeaker(entity);
			const roll = new Roll("1d100").roll();
			const attrValue = Number(entity.data.data.characteristics[dataset.attributecheck].value);
			
			// Modifier dialog
			const usage = await RollDialog.create();
			let diceModifier = 0;
			if (usage) {
				diceModifier = usage.get('modifier') * 10;
			}
			
			// Values needed for the chat card
			const context = {
					cssClass: "hardboiled",
					actor: entity,
					rollCheck: {
						value: roll.results[0],
						success: (roll.results[0] <= (attrValue + diceModifier) ? true : false)
					},
					checking: {
						name: game.i18n.localize(entity.data.data.characteristics[dataset.attributecheck].label),
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
		else if (dataset.skillcheck) {
			const template = 'systems/hardboiled/templates/chat/basic-check.html';
			const speaker = ChatMessage.getSpeaker(entity);
			const skill = entity.getOwnedItem(dataset.skillcheck);
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
					actor: entity,
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
		else if (dataset.talentcheck) {
			const template = 'systems/hardboiled/templates/chat/basic-description.html';
			const speaker = ChatMessage.getSpeaker(entity);
			const talent = entity.getOwnedItem(dataset.talentcheck);
			
			// Values needed for the chat card
			const context = {
					cssClass: "hardboiled",
					actor: entity,
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
	}
}