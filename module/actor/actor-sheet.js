import { HardboiledSheetHelper } from '../helper.js';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class HardboiledActorSheet extends ActorSheet {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["hardboiled", "sheet", "actor"],
			template: "systems/hardboiled/templates/actor/actor-sheet.html",
			width: 672,
			height: 765,
			tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
		});
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		// Retrieve the data structure from the base sheet. You can inspect or log
		// the context variable to see the structure, but some key properties for
		// sheets are the actor object, the data object, whether or not it's
		// editable, the items array, and the effects array.
		const context = super.getData();

		// Use a safe clone of the actor data for further operations.
		const actorData = this.actor.toObject(false);

		// Add the actor's data to context.data for easier access, as well as flags.
		context.data = actorData;
		context.flags = actorData.flags;
		context.notes = TextEditor.enrichHTML(actorData.system.notes, {async: false})

		// Prepare character data and items.
		if (actorData.type == 'character') {
			this._prepareCharacterItems(context);
			//this._prepareCharacterData(context);
		}
		//console.log("context: ", context);
		return context;

	}

	/**
	 * Organize and classify Items for Character sheets.
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareCharacterItems(sheetData) {
		//const actorData = sheetData.actor;

		//console.log ("Items:", sheetData.items)
		const skills = [];
		const talents = [];
		const weapons = [];
		const equipment = []

		for (let item of sheetData.items) {
			//console.log("Item", item);
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
				default:
					console.log("Unknown item type!!")
			}
		}

		sheetData.skills = skills;
		sheetData.talents = talents;
		sheetData.weapons = weapons;
		sheetData.equipment = equipment;
		//console.log("Sheet Data", sheetData);
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		HardboiledSheetHelper.activateListeners(this, this.actor, html);

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		// Add Inventory Item
		html.find('.item-create').click(this._onItemCreate.bind(this));

		// Update Inventory Item
		html.find('.item-edit').click(ev => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			item.sheet.render(true);
		});

		// Delete Inventory Item
		html.find('.item-delete').click(ev => {
			const li = $(ev.currentTarget).parents(".item");
			this.actor.deleteEmbeddedDocuments("Item", [li.data("itemId")]);
			li.slideUp(200, () => this.render(false));
		});

		// Drag events for macros.
		if (this.actor.isOwner) {
			let handler = ev => this._onDragStart(ev);
			html.find('li.item').each((i, li) => {
				if (li.classList.contains("inventory-header")) return;
				li.setAttribute("draggable", true);
				li.addEventListener("dragstart", handler, false);
			});
		}
	}

	/**
	 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onItemCreate(event) {
		event.preventDefault();
		const header = event.currentTarget;
		// Get the type of item to create.
		const type = header.dataset.type;
		// Grab any data associated with this control.
		const data = duplicate(header.dataset);
		// Initialize a default name.
		const name = `New ${type.capitalize()}`;
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			data: data
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.data["type"];

		// Finally, create the item!
		return this.actor.createEmbeddedDocuments("Item", [itemData], {
			renderSheet: true
		});
	}

	/**
	 * Implement the _updateObject method as required by the parent class spec
	 * This defines how to update the subject of the form when the form is submitted
	 * @private
	 */
	async _updateObject(event, formData) {
		if (event.currentTarget) {
			if (event.currentTarget.classList) {
				if (event.currentTarget.classList.contains('item-value')) {
					let skill = this.actor.items.get(event.currentTarget.closest('.item').dataset.itemId);
					if (skill) {
						await skill.updateValue(Number(event.currentTarget.value));
					}
				}
				else if (event.currentTarget.classList.contains('hp-value')) {
					// Check injuries
					const currentHP = formData['system.attributes.hp.value'];
					const maxHP = formData['system.attributes.maxhp.value'];

					if (currentHP > maxHP) {
						formData['system.attributes.hp.value'] = maxHP;
					}

					if (currentHP > maxHP / 2) {
						formData['system.flags.injured'] = false;
						formData['system.flags.critical'] = false;
						formData['system.flags.dying'] = false;
					}
					else if (currentHP > 0) {
						formData['system.flags.injured'] = true;
						formData['system.flags.critical'] = false;
						formData['system.flags.dying'] = false;
					}
					else if (currentHP > -11) {
						formData['system.flags.injured'] = true;
						formData['system.flags.critical'] = true;
						formData['system.flags.dying'] = false;
					}
					else {
						formData['system.flags.injured'] = true;
						formData['system.flags.critical'] = true;
						formData['system.flags.dying'] = true;
					}
				}
			}
		}
		return await this.object.update(formData);
	}
}
