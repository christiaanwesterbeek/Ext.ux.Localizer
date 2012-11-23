/**
 * Allow for language change after language change after language change etc.
 * Go back to original language using initialConfig
 * Localizable grid values through column renderers!
 * When components need tooltips, I usually add them as a tip property to the same component. That tooltip can be translated as well.
 * Prevention against word wraps after translation that I have seen occuring.
 * renamed locale file to js, because IIS for example can't read .json files by default. (just to make it easy to test run this)
 * Most of my comments and changes are described in the commits and code. Code is mostly equal to what ssamayoa has posted.
 * This is work in progress and needs further optimization. Specially in the area of configurability.
 *
 * @author Sergio Samayoa (creator) http://www.sencha.com/forum/showthread.php?182631-Different-languages-Translations&p=797073&viewfull=1#post797073
 * @author Christiaan Westerbeek (contributor)
 * @see	 http://www.sencha.com/forum/showthread.php?182631-Different-languages-Translations&p=797073&viewfull=1#post797073
 */

Ext.define("Ext.ux.Localizer", {
    
    singleton : true,
    baseLocale : "en",
    currLocale : "en",

    /**
     * @private (Object) localizableProps
     * Localizable properties for each xtype.
     */
    localizableProps : {
        // Ext.button
        button : ["text", "tooltip"],
        // Ext.form.field
        checkboxfield : ["fieldLabel", "boxLabel"],
        field : ["fieldLabel"],
        filefield : ["fieldLabel", "buttonText"],
        radiofield : ["fieldLabel", "boxLabel"],
        // Ext.form
        checkboxgroup : ["fieldLabel"],
        fieldcontainer : ["fieldLabel"],
        fieldset : ["title"],
        label : ["text"],
        // Ext.grid
        gridcolumn : ["text"],
        panel : ["title"],
        tooltip: ["html"],
        image: ["src"]
    },
    /**
     * @private (Array) localizableColumns
     * Localizable grid columns through renderers
     */
    localizableColumns: [ //add grid column renderers 
        "status_description", "bounced"
    ],
    /**
     * @private (Array) columnRenderer
     * Reusable column renderer function to be applied to every column listed above on translation
     */
    columnRenderer: function (value, metaData, record, row, col, store, gridView) {
        return Localizer.localeStrings.get(value)||value;
    },

    /**
     * @private (Object) excludeTypes
     * XTypes to be excluded by localize() method.
     * If whole xtype must be exclude, assign a boolean value of "false".
     * If some itemId must be excluded, assign an array of itemId names.
     */
    excludeTypes : {
        pagingtoolbar : {
            itemIds : ["first", "prev", "inputItem", "afterTextItem", "next", "last", "refresh", "displayItem"]
        }
    },

    /**
     * Returns the xtypes if comp as array.
     * @param (AbstractComponent) comp
     * @return (String []) xtypes of the component
     */
    getXTypes : function(comp) {
        if (!comp) {
            return [];
        }
        try {
            return comp.getXTypes().split("/").reverse();
        } catch(e) {
            return [];
        }
    },

    /**
     * @param (String[]) xtypes
     * @return (Boolean) 
     */
    isExcludeByXType: function(xtypes) {
        var me = this, exclude = false;
        Ext.each(xtypes, function(xtype) {
            var e = me.excludeTypes [xtype];
            if (Ext.isBoolean(e) && e === true) {
                exclude = true;
                return false;
            }
        });
        return exclude;
    },

    /**
     * @param (Container) ownertCt
     */
    getItemIdsToExclude: function(ownerCt) {
            if (!ownerCt) {
                return [];
            }
            var me = this, 
                xtypes = me.getXTypes(ownerCt),
                itemIds = [];
            Ext.each(xtypes, function(xtype) {
                var e = me.excludeTypes [xtype];
                if (Ext.isArray(e)) {
                    itemIds = e;
                    return false;
                }
            });
            return itemIds;
    },

    getLocalizableProps : function(xtypes) {
        var me = this,
            localizableProps;
        Ext.each(xtypes, function(xtype) {
            localizableProps = me.localizableProps [xtype];
            if (localizableProps) {
                return false;
            }
        });
        return localizableProps;
    },

    /**
     * @private
     */
    localize2 : function(comp, localizeChildren) {
        var me = this, xtypes = me.getXTypes(comp);
        // Do we have to exclude by xtype?
        if (me.isExcludeByXType(xtypes)) {
            return;
        }
        // If comp has an itemId, do we have to exclude by itemId?
        if (comp.itemId) {
            var itemsToExclude = me.getItemIdsToExclude(comp.ownerCt);
            if (Ext.Array.contains(itemsToExclude, comp.itemId)) {
                return;
            }
        }
        // Do we have to localizeChildren?
        if (localizeChildren) {
            //console.log(comp);
            if (comp.items && comp.items.each) { //actioncolumn items is a real array en doesn't have each. For now, I just skip it.
                comp.items.each(function(c) {
                    me.localize2(c, localizeChildren);
                });
            }
            if (comp.dockedItems) {
                Ext.each(comp.dockedItems.items, function(c) {
                    me.localize2(c, localizeChildren);
                });
            }		
            if (comp.tip) {
                //So, this is me. When components have tips, I add them as a tip property to the same component.
                // that tooltip may need translation as well.
                me.localize2(comp.tip, false);
            }		
        }
        // This component haves localizable propesties?
        var localizableProps = me.getLocalizableProps(xtypes);
        if (!localizableProps) {
            return;
        }
        
        // Lets localize this component
        Ext.each(localizableProps, function(localizableProp) {
            var capitalized = Ext.String.capitalize(localizableProp);
            
            //first, get the original value of the localizable property
            var value = comp.initialConfig [localizableProp]; 
            var replace;
            if (me.currLocale!=me.baseLocale) {
                if (!value) {
                    value = comp [localizableProp];
                }
                if (!value) {
                    var getFunc = comp ["get" + capitalized];
                    if (getFunc) {
                        value = getFunc.call(comp);
                    }
                }
                if (!value) {
                    return;
                }
                replace = me.localeStrings.get(value);
            } else if (me.localeStrings.get(value)!==undefined){
                //We're translating back to the baseLocale
                // and value is the value from the initialConfig
                replace = value;
            }
            if (!replace) {
                return;
            }
            var setFunc = comp ["set" + capitalized];
            replace=replace.replace(/ /g, "&nbsp;"); //This replace prevents against word wraps after translation that I have seen occuring
            if (!setFunc) {
                comp [localizableProp] = replace;
            } else {
                setFunc.call(comp, replace);
            }
            
        });
        
        // Lets localize this grids column renderers
        if (comp instanceof Ext.grid.column.Column && this.localizableColumns && this.localizableColumns.indexOf(comp.dataIndex)>-1) {
            comp.renderer=(me.currLocale!=me.baseLocale?me.columnRenderer:false);
        }
    },

    localize : function(comp, locale, localizeChildren) {
        // Do we recevived an instance?
        var me = this;
        if (!comp || !locale) {
            return;
        }
        if (!Ext.isDefined(localizeChildren)) {
            localizeChildren = true;
        }
        // Do we have locale strings for received locale?
        me.localeStrings = me.getLocaleStrings(locale);
        //Instead of passing the variable 'localStrings' around through several functions, I add 'localStrings' as a property to 'me'.
        
        if (!me.localeStrings) {
            return;
        }
        me.currLocale=locale;
        me.localize2(comp, localizeChildren);
    },

    /**
     * @private
     */
    loadLocaleStrings: function(locale) {
        var me = this, localeStrings;
        Ext.Ajax.request({
            url : "./app/locale/" + locale + ".js",
            async : false,
            success : function(response) {
                var entries = Ext.decode(response.responseText);
                localeStrings = new Ext.util.HashMap();
                Ext.each(entries, function(entry) {
                    localeStrings.add(entry.key, entry.value);
                });
                me.locales.add(locale, localeStrings);
            },
            failure : function() {
                me.locales.add(locale, false);
                localeStrings = false;
            }
        });
        return localeStrings;
    },

    /**
     * @private
     */
    getLocaleStrings: function(locale) {
        var me = this, localeStrings;
        if (!me.locales) {
            me.locales = new Ext.util.HashMap();
        }
        if (!me.locales.get(locale)) {
            localeStrings = me.loadLocaleStrings(locale);
        } else {
            localeStrings = me.locales.get(locale);
        }
        if (Ext.isBoolean(localeStrings) && !localeStrings) {
            // If locale key contains "false" we
            // tried to load the locale file before 
            // but failed.
            return;
        }
        return localeStrings;
    },

    getLocalizedString: function(key, locale) {
        var me = this;
        if (!key || !locale) {
            return key;
        }
        var localeStrings = me.getLocaleStrings(locale);
        if (!localeStrings) {
            return key;
        }
        var localized = localeStrings.get(key);
        if (!localized) {
            return key;
        }
        return localized;
    }
});

Localizer = Ext.ux.Localizer;
_ = function(key, locale) {
	return Localizer.getLocalizedString(key, locale);
}