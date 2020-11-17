export class RollDialog {

	static async create()
	{
		const html = await renderTemplate('systems/hardboiled/templates/apps/bonus.html',
				{
					cssClass: "hardboiled"
				});
		return new Promise((resolve) => {
			let formData = null;
			const dlg = new Dialog({
				title: game.i18n.localize('Hardboiled.BonusSelectionWindow'),
				content: html,
				buttons: {
					roll: {
						label: game.i18n.localize('Hardboiled.RollDice'),
						callback: html => {
							formData = new FormData(html[0].querySelector('#modifier-roll-form'));
							return resolve(formData);
						}
					}
				},
				default: 'roll',
				close: () => {return;}
			});
			dlg.render(true);
		});
	}
}
