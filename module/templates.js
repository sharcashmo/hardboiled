/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

	// Define template paths to load
	const templatePaths = [
		'systems/hardboiled/templates/actor/parts/actor-skills.html',
		'systems/hardboiled/templates/actor/parts/actor-talents.html',
		'systems/hardboiled/templates/actor/parts/actor-combat.html',
		'systems/hardboiled/templates/actor/parts/actor-equipment.html',
		'systems/hardboiled/templates/actor/parts/actor-notes.html',
		'systems/hardboiled/templates/item/parts/item-item-section.html',
		'systems/hardboiled/templates/item/parts/item-venom-section.html',
		'systems/hardboiled/templates/item/parts/item-weapon-section.html',
		'systems/hardboiled/templates/item/parts/item-profession-skills-section.html',
		'systems/hardboiled/templates/item/parts/item-profession-main-skills-section.html',
		'systems/hardboiled/templates/item/parts/item-profession-secondary-skills-section.html',
		'systems/hardboiled/templates/item/parts/item-description-section.html'
	];
  
	// Load the template parts
	return loadTemplates(templatePaths);
};