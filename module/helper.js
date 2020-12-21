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
	 * @param {BaseEntitySheet} sheet	The sheet invoking this helper
	 * @param {Entity}          entity	The entity represented by the sheet
	 * @param {String}          html	html string of the sheet
	 */
	static activateListeners(sheet, entity, html) {
		
		// Owner events
		if (entity.owner) {
			html.find('.rollable').click(HardboiledSheetHelper._onRoll.bind(sheet, entity));
		}
		
		// Everything below here is only needed if the sheet is editable
		if (!sheet.options.editable) return;
		html.find('.toggle-switch').click(HardboiledSheetHelper._onToggleSwitch.bind(sheet, entity));
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
	}

	/**
	 * Handle rolls checks
	 * 
	 * The this variable is set to the Sheet using this SheetHelper
	 * 
	 * @param {Event}  event	The originating click event
	 * @param {Entity} entity	The entity wich the sheet belongs to
	 * @private
	 */
	static async _onToggleSwitch(event) {
		event.preventDefault();
		const element = event.currentTarget.closest('.toggle-switch');
		const dataset = element.dataset;
		const sheet = this;
	}
}