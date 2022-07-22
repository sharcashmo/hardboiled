import { RollDialog } from './apps/roll-dialog.js';
import { ATTRIBUTE_TYPES } from './constants.js';
import { HardboiledMeleeCombat, HardboiledRangeCombat } from './chat/combat/combat.js';

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
export class HardboiledSheetHelper extends HardboiledHelper {

	/**
	 * Bind roll checks
	 * 
	 * @param {DocumentSheet} sheet	The sheet invoking this helper
	 * @param {Entity}          entity	The entity represented by the sheet
	 * @param {String}          html	html string of the sheet
	 */
	static activateListeners(sheet, entity, html) {
		
		// isOwner events
		if (entity.isOwner) {
			html.find('.rollable').click(HardboiledSheetHelper._onRoll.bind(sheet, entity));
		}
		
		// Everything below here is only needed if the sheet is editable
		if (!sheet.options.editable) return;
		
		html.find('.toggle-switch').click(HardboiledSheetHelper._onToggleSwitch.bind(sheet, entity));
		html.find('.toggle-icon').click(HardboiledSheetHelper._onToggleIcon.bind(sheet, entity));
	}

	/**
	 * Handle rolls checks
	 * 
	 * @param {Event}  event	The originating click event
	 * @private
	 */
	static async _onRoll(entity, event) {
		event.preventDefault();
		const element = event.currentTarget.closest('.rollable');
		const dataset = element.dataset;
		const sheet = this;

		if (dataset.attributecheck) {
			entity.attributeCheck(dataset.attributecheck);
		}
		else if (dataset.skillcheck) {
			entity.skillCheck(dataset.skillcheck);
		}
		else if (dataset.talentcheck) {
			entity.talentCheck(dataset.talentcheck);
		}
		else if (dataset.combatcheck) {
			entity.combatCheck(dataset.combatcheck);
		}
	}

	/**
	 * Handle property toggles
	 * 
	 * The this variable is set to the Sheet using this SheetHelper
	 * 
	 * @param {Event}  event	The originating click event
	 * @param {Entity} entity	The entity wich the sheet belongs to
	 * @private
	 */
	static async _onToggleSwitch(entity, event) {
		event.preventDefault();
		const element = event.currentTarget.closest('.toggle-switch');
		const dataset = element.dataset;
		const sheet = this;
		
		if (dataset.propertyId) {
			entity.toggleProperty(dataset.propertyId);
		}
	}

	/**
	 * Handle icon toggles
	 * 
	 * The this variable is set to the Sheet using this SheetHelper
	 * 
	 * @param {Event}  event	The originating click event
	 * @param {Entity} entity	The entity wich the sheet belongs to
	 * @private
	 */
	static async _onToggleIcon(entity, event) {
		event.preventDefault();
		const element = event.currentTarget.closest('.toggle-icon');
		const dataset = element.dataset;
		const sheet = this;
		
		if (dataset.propertyId) {
			entity.toggleProperty(dataset.propertyId);
		}
	}
}

/**
 * Helper class for Hardboiled chat cards
 */
export class HardboiledCardHelper extends HardboiledHelper {

	/**
	 * Bind roll checks
	 * 
	 * @param {ChatLog} 	app		The ChatLog object
	 * @param {Object}		html	A DOM object of section#chat
	 * @param {Object}		data	html string of the sheet
	 */
	static activateListeners(app, html, data) {
		html.on('click', '.card-button', HardboiledCardHelper._onCardButton.bind(this));
		html.on('click', '.toggle-switch.enabled', HardboiledCardHelper._onToggleSwitch.bind(this));
	}
	
	/**
	 * Refresh a chat card
	 * 
	 * @param {String}		messageId	Id of the message in chat ui
	 * @param {String}		template	Template file path
	 * @param {Object}		context		Context to be sent to the template
	 */
	static async updateCard(messageId, template, context) {
		const html = await renderTemplate(template, context);
		const message = game.messages.get(messageId);
		const msg = await message.update({ content: html });
		
		await ui.chat.updateMessage(msg, false);
	}

	/**
	 * Handle toggle buttons
	 * 
	 * The this variable is set to the Card using this CardHelper
	 * 
	 * @param {Event}  event	The originating click event
	 * @param {Entity} entity	The entity wich the sheet belongs to
	 * @private
	 */
	static async _onToggleSwitch(event) {
		event.preventDefault();
		const element = event.currentTarget.closest('.toggle-switch.enabled');
		const card = event.currentTarget.closest('.chat-card');
		const message = event.currentTarget.closest('.message');
		const combat = card.classList.contains('melee-combat') ?
			new HardboiledMeleeCombat(message.dataset, card.dataset, element.dataset) :
			new HardboiledRangeCombat(message.dataset, card.dataset, element.dataset);
		
		if (element.dataset.flagId) {
			if (element.dataset.flagGroup) {
				combat.toggleFlag(element.dataset.flagId, element.dataset.flagGroup);
			}
			else {
				combat.toggleFlag(element.dataset.flagId);
			}
		}
		
		return;
	}

	/**
	 * Handle card button actions
	 * 
	 * The this variable is set to the Card managed by this CardHelper
	 * 
	 * @param {Event}  event	The originating click event
	 * @param {Entity} entity	The entity wich the sheet belongs to
	 * @private
	 */
	static async _onCardButton(event) {
		event.preventDefault();
		const element = event.currentTarget.closest('.card-button');
		const card = event.currentTarget.closest('.chat-card');
		const message = event.currentTarget.closest('.message');
		
		if (element.dataset.action) {
			let combat;
			switch (element.dataset.action) {
			case 'melee-skill-roll':
				combat = new HardboiledMeleeCombat(message.dataset, card.dataset, element.dataset);
				combat.skillRoll();
				break;
			case 'range-skill-roll':
				combat = new HardboiledRangeCombat(message.dataset, card.dataset, element.dataset);
				combat.skillRoll();
				break;
			case 'melee-damage-roll':
				combat = new HardboiledMeleeCombat(message.dataset, card.dataset, element.dataset);
				combat.damageRoll();
				break;
			case 'range-damage-roll':
				combat = new HardboiledRangeCombat(message.dataset, card.dataset, element.dataset);
				combat.damageRoll();
				break;
			default:
				console.log('[DEBUG.Hardboiled] Unknown action');
			}
		}
	}
}