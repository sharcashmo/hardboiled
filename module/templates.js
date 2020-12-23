/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

	// Define template paths to load
	const templatePaths = [
		'systems/hardboiled/templates/actor/parts/actor-skills.html',
		'systems/hardboiled/templates/item/parts/item-item-section.html',
		'systems/hardboiled/templates/item/parts/item-weapon-section.html',
		'systems/hardboiled/templates/item/parts/item-description-section.html'
	];
  
	// Load the template parts
	return loadTemplates(templatePaths);
};