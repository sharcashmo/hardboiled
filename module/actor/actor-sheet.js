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
		const data = super.getData();
		
//		// Prepare items.
//		if (this.actor.data.type == 'character') {
//		this._prepareCharacterItems(data);
//		}
		
		console.log('Actor data');
		console.log(data);

		return data;
	}

	/**
	 * Organize and classify Items for Character sheets.
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareCharacterItems(sheetData) {
		const actorData = sheetData.actor;

		// Initialize containers.
//		const gear = [];
//		const features = [];
//		const spells = {
//		0: [],
//		1: [],
//		2: [],
//		3: [],
//		4: [],
//		5: [],
//		6: [],
//		7: [],
//		8: [],
//		9: []
//		};

//		// Iterate through items, allocating to containers
//		// let totalWeight = 0;
//		for (let i of sheetData.items) {
//		let item = i.data;
//		i.img = i.img || DEFAULT_TOKEN;
//		// Append to gear.
//		if (i.type === 'item') {
//		gear.push(i);
//		}
//		// Append to features.
//		else if (i.type === 'feature') {
//		features.push(i);
//		}
//		// Append to spells.
//		else if (i.type === 'spell') {
//		if (i.data.spellLevel != undefined) {
//		spells[i.data.spellLevel].push(i);
//		}
//		}
//		}

//		// Assign and return
//		actorData.gear = gear;
//		actorData.features = features;
//		actorData.spells = spells;
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
			const item = this.actor.getOwnedItem(li.data("itemId"));
			item.sheet.render(true);
		});

		// Delete Inventory Item
		html.find('.item-delete').click(ev => {
			const li = $(ev.currentTarget).parents(".item");
			this.actor.deleteOwnedItem(li.data("itemId"));
			li.slideUp(200, () => this.render(false));
		});

		// Drag events for macros.
		if (this.actor.owner) {
			let handler = ev => this._onDragItemStart(ev);
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
		return this.actor.createOwnedItem(itemData);
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
					let skill = this.actor.getOwnedItem(event.currentTarget.closest('.item').dataset.itemId);
					if (skill) {
						await skill.updateValue(Number(event.currentTarget.value));
					}
				}
			}
		}
	    return this.object.update(formData);
	}
}
