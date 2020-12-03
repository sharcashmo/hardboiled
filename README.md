# Hardboiled implementation for Foundry VTT

An implementation of Hardboiled system for foundry-vtt  

## Disclaimer

This is a minimal system created to play some Hardboiled adventures at Horror Cósmico Discord server.

I’ve just provided some basics skills that you can use.

## Installation/usage

Install in foundry VTT from the Game Systems tab using the following manifest :  
<https://raw.githubusercontent.com/sharcashmo/hardboiled/master/system.json>  

## What is working

Version 0.0.3 :

* Created a Spanish compendium module. See <https://github.com/sharcashmo/hardboiled-es/>
  * Add skill tabs to character sheet.

Version 0.0.2 :  

* No longer apply Decotura font to every text in Foundry. Only sheets, dialogs and cards will use it.
  * Reorganize and clean SCSS files.
  * Add attributes (Hit Points, Punch, etc) to character sheet.
  * Implemented Skill sheet.

Version 0.0.1 :

* The character sheet.  
  * You can enter your image, characteristics and traits.
  * Characteristics are rollable. Clicking on them opens a dialog to select a modifier before roll is done.
  * Dice so Nice! is supported.

## Future plans

* [ ] Complete main attributes in character sheet.
* [ ] Add characteristic selection in roll modifier dialog, to allow use it instead of skill in a check.
* [ ] Move all style and presentation logic from html templates to CSS files. Including "flexrow" and similar classes.
* [ ] Add talents to character sheet.
* [ ] Reorganize status flags and icons.

### Version 0.0.3

* [X] Create Spanish compendium module.
* [X] Add skill tabs to character sheet.

### Version 0.0.2

* [X] Add a new font for regular text.
* [X] Implement skill sheet.