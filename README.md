# Hardboiled implementation for Foundry VTT

An implementation of Hardboiled system for foundry-vtt  

## Disclaimer

This is a minimal system created to play some Hardboiled adventures at Horror Cósmico Discord server.

I’ve just provided some basics skills that you can use.

## License information

This software developed by sharcashmo and released under MIT license. See :
<https://raw.githubusercontent.com/sharcashmo/hardboiled/master/LICENSE>

Hardboiled is a roleplaying game written by Pedro Gil and Jaime Conill Querol, and released
under Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0). See
<https://lamarcadeleste.com/hardboiled>

## Installation/usage

Install in foundry VTT from the Game Systems tab using the following manifest :  
<https://raw.githubusercontent.com/sharcashmo/hardboiled/master/system.json>

## What is working

Version 1.3.3 :
* Report compatibility with Foundry 11
 
Version 1.3.2 :
* Report compatibility with Foundry 11.299

Version 1.3.1 :
* Fixed: download element in manifest.json

Version 1.3.0 :
* Upgraded to work with Foundry 10.291

Version 1.2.0 :
* Upgraded to work with Foundry 9.238

Version 1.1.0 :
* Added euskera language (by Mikel Ocejo <https://github.com/mikel-ocejo>)

Version 1.0.0 :

* Added combat section to character sheet.
* Added melee combat functionality.
* Added range combat functionality.
* Added inventory section to character sheet.
* Created complex (automated) combat chat cards.

Version 0.0.4 :

* Bug solved: Skill check always results to Success.
* Some cleanup: remove dead/commented code, unused fonts and console logs.
* Refactoring: create HardboiledSheetHelper to hold common utility functions for entity sheet classes.
* Checked compatibility with FoundryVTT 0.7.9.
* Created weapon sheet.
* Created equipment sheet.
* Added catalan language.

Version 0.0.3 :

* Created a Spanish compendium module. See <https://github.com/sharcashmo/hardboiled-es/>
* Added skill tabs to character sheet.
* Moved all style and presentation logic from html templates to CSS files. Including "flexrow" and similar classes.
* Added license information to README.md file.
* Added talents to character sheet.

Version 0.0.2 :  

* No longer apply Decotura font to every text in Foundry. Only sheets, dialogs and cards will use it.
* Reorganized and clean SCSS files.
* Added attributes (Hit Points, Punch, etc) to character sheet.
* Implemented Skill sheet.

Version 0.0.1 :

* The character sheet.  
* You can enter your image, characteristics and traits.
* Characteristics are rollable. Clicking on them opens a dialog to select a modifier before roll is done.
* Dice so Nice! is supported.

## Future plans

* [ ] Add characteristic selection in roll modifier dialog, to allow use it instead of skill in a check.
* [ ] Sort character items, and avoid duplicates.
* [ ] Add automatic validation of input fields according to their data types.
* [ ] Add ammunition management.

### Version 1.1.0

* [X] Add euskera language.

### Version 1.0.0

* [X] Add combat section to character sheet.
* [X] Add melee combat functionality.
* [X] Add range combat functionality.
* [X] Add inventory section to character sheet.
* [X] Reorganize status flags and icons.
* [X] Complete status flags in character sheet.
* [X] Create complex (automated) combat chat cards.
* [X] Add automation and checks in character sheet attributes (hit points below max hit points, automatic statuses, etc).

### Version 0.0.4

* [X] Bug: Skill check always results to Success.
* [X] Cleanup: remove dead code, unused fonts and console logs.
* [X] Refactoring: create a new helper class to manage common functionalities.
* [X] Make main traits, characteristics and abilities editable.
* [X] Create weapon sheet.
* [X] Create equipment sheet.
* [X] Add catalan language.

### Version 0.0.3

* [X] Create Spanish compendium module.
* [X] Add skill tabs to character sheet.
* [X] Implement talent sheet.
* [X] Move all style and presentation logic from html templates to CSS files. Including "flexrow" and similar classes.
* [X] Add talents to character sheet.

### Version 0.0.2

* [X] Add a new font for regular text.
* [X] Implement skill sheet.
