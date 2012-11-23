Ext.ux.Localizer
================

The concept is simple: to localize a component just call Localizer.localize(component, locale):
Localizer.localize(component, "nl");

The class looks for localized strings in "locales" property and if is not loaded tries
to load it synchronously from ./app/locale/<code>.js. Then for each component in the container looks for localizable properties
and for each one looks for the equivalent translated value.

It allows language change after language change after language change etc.
An excellent fit with a cycle button wher you can switch language.

In order for me to work just include Ext.ux.Localizer.js

This git repo includes a Sencha Architect file that demos the Localizer.